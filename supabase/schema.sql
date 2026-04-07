-- ============================================================
--  FretNow — Supabase PostgreSQL Schema
--  Modèle de données pour le dispatch de transport de fret
-- ============================================================

-- Extensions nécessaires
CREATE EXTENSION IF NOT EXISTS postgis;        -- Géospatial (lat/lng, distances)
CREATE EXTENSION IF NOT EXISTS pg_cron;        -- Cron jobs pour le dispatch automatique
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";    -- UUID generation

-- ============================================================
--  TABLE : users
--  Profils clients (étend auth.users de Supabase)
-- ============================================================
CREATE TABLE public.users (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT        NOT NULL,
  full_name   TEXT,
  phone       TEXT,
  role        TEXT        NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'admin')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger : crée automatiquement un profil user à l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
--  TABLE : transporteurs
--  Profils des transporteurs/chauffeurs
-- ============================================================
CREATE TABLE public.transporteurs (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Informations société
  company_name      TEXT        NOT NULL,
  siret             TEXT,
  contact_name      TEXT,
  email             TEXT        NOT NULL,
  phone             TEXT,

  -- Statut et disponibilité
  status            TEXT        NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'active', 'inactive', 'suspended')),
  is_available      BOOLEAN     DEFAULT FALSE,

  -- Localisation courante (PostGIS point WGS84)
  current_location  GEOGRAPHY(POINT, 4326),
  current_lat       DECIMAL(10, 7),
  current_lng       DECIMAL(10, 7),
  last_seen_at      TIMESTAMPTZ,

  -- Réputation
  rating            DECIMAL(3, 2) DEFAULT 5.0,
  total_courses     INTEGER       DEFAULT 0,

  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Index géospatial pour les recherches de proximité
CREATE INDEX idx_transporteurs_location ON public.transporteurs USING GIST (current_location);
CREATE INDEX idx_transporteurs_available ON public.transporteurs (is_available, status);

-- ============================================================
--  TABLE : vehicles
--  Véhicules appartenant à un transporteur
-- ============================================================
CREATE TABLE public.vehicles (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  transporteur_id   UUID        NOT NULL REFERENCES public.transporteurs(id) ON DELETE CASCADE,

  type              TEXT        NOT NULL CHECK (type IN (
                    'fourgon', 'tautliner', 'plateau', 'benne',
                    'frigo', 'malaxeur', 'porte-engins', 'citerne', 'grue'
                    )),
  max_weight_kg     DECIMAL(10, 2),
  volume_m3         DECIMAL(8,  2),
  license_plate     TEXT,
  is_active         BOOLEAN     DEFAULT TRUE,

  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vehicles_transporteur ON public.vehicles (transporteur_id, is_active);

-- ============================================================
--  TABLE : locations
--  Historique GPS des positions transporteurs
--  Utilisé pour le tracking temps réel + audit
-- ============================================================
CREATE TABLE public.locations (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  transporteur_id   UUID        NOT NULL REFERENCES public.transporteurs(id) ON DELETE CASCADE,
  course_id         UUID,       -- Rempli quand le transporteur est en mission

  -- Coordonnées
  coordinates       GEOGRAPHY(POINT, 4326) NOT NULL,
  lat               DECIMAL(10, 7) NOT NULL,
  lng               DECIMAL(10, 7) NOT NULL,

  -- Métadonnées mouvement
  speed_kmh         DECIMAL(6, 2),
  heading           INTEGER,    -- Direction en degrés (0 = Nord)

  recorded_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Partition par date pour performance sur gros volumes
CREATE INDEX idx_locations_transporter_time
  ON public.locations (transporteur_id, recorded_at DESC);
CREATE INDEX idx_locations_course
  ON public.locations (course_id, recorded_at DESC);

-- ============================================================
--  TABLE : courses
--  Demandes de transport (l'entité centrale)
-- ============================================================
CREATE TABLE public.courses (
  id                        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id                 UUID        NOT NULL REFERENCES auth.users(id),
  transporteur_id           UUID        REFERENCES public.transporteurs(id),
  vehicle_id                UUID        REFERENCES public.vehicles(id),

  -- Adresse de départ
  pickup_address            TEXT        NOT NULL,
  pickup_lat                DECIMAL(10, 7),
  pickup_lng                DECIMAL(10, 7),
  pickup_coordinates        GEOGRAPHY(POINT, 4326),

  -- Adresse d'arrivée
  delivery_address          TEXT        NOT NULL,
  delivery_lat              DECIMAL(10, 7),
  delivery_lng              DECIMAL(10, 7),
  delivery_coordinates      GEOGRAPHY(POINT, 4326),

  -- Marchandise
  package_type              TEXT,
  weight_kg                 DECIMAL(10, 2),
  volume_m3                 DECIMAL(8,  2),
  declared_value            DECIMAL(12, 2),
  vehicle_type_required     TEXT,
  notes                     TEXT,

  -- Planification
  delay_required            TEXT,     -- '24H', '48H', '1week', etc.
  pickup_at                 TIMESTAMPTZ,

  -- Statut de la course
  -- pending      → en attente de dispatch
  -- dispatching  → dispatch en cours (notifications envoyées)
  -- assigned     → transporteur accepté
  -- en_route     → transporteur en chemin vers le chargement
  -- picked_up    → marchandise chargée
  -- delivered    → livraison confirmée
  -- cancelled    → annulé
  -- failed       → aucun transporteur disponible
  status                    TEXT        NOT NULL DEFAULT 'pending' CHECK (
                            status IN ('pending','dispatching','assigned',
                                       'en_route','picked_up','delivered',
                                       'cancelled','failed')
                            ),

  -- Métriques
  distance_km               DECIMAL(8, 2),
  estimated_duration_min    INTEGER,
  price_estimate            DECIMAL(10, 2),

  -- Horodatages
  created_at                TIMESTAMPTZ DEFAULT NOW(),
  assigned_at               TIMESTAMPTZ,
  picked_up_at              TIMESTAMPTZ,
  delivered_at              TIMESTAMPTZ
);

CREATE INDEX idx_courses_client   ON public.courses (client_id, status);
CREATE INDEX idx_courses_transport ON public.courses (transporteur_id, status);
CREATE INDEX idx_courses_status   ON public.courses (status, created_at DESC);

-- ============================================================
--  TABLE : dispatch_requests
--  Suivi du processus de dispatch (qui a été notifié, quand)
-- ============================================================
CREATE TABLE public.dispatch_requests (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id         UUID        NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  transporteur_id   UUID        NOT NULL REFERENCES public.transporteurs(id),

  priority          INTEGER     NOT NULL,     -- 1 = premier notifié
  status            TEXT        NOT NULL DEFAULT 'pending' CHECK (
                    status IN ('pending','notified','accepted','refused','expired','skipped')
                    ),

  -- Fenêtre de temps de réponse (15 secondes par défaut)
  notified_at       TIMESTAMPTZ,
  expires_at        TIMESTAMPTZ,             -- notified_at + 15s
  responded_at      TIMESTAMPTZ,

  -- Score de matching calculé lors de la sélection
  distance_km       DECIMAL(8, 2),           -- Distance transporteur → pickup
  match_score       DECIMAL(8, 4),           -- Score composite (distance + dispo + rating)

  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_dispatch_course    ON public.dispatch_requests (course_id, priority);
CREATE INDEX idx_dispatch_transport ON public.dispatch_requests (transporteur_id, status);
-- Index pour le cron job qui vérifie les expirations
CREATE INDEX idx_dispatch_expires   ON public.dispatch_requests (expires_at)
  WHERE status = 'notified';

-- ============================================================
--  FUNCTION : geocode_to_point
--  Convertit lat/lng en GEOGRAPHY pour PostGIS
-- ============================================================
CREATE OR REPLACE FUNCTION public.geocode_to_point(lat DECIMAL, lng DECIMAL)
RETURNS GEOGRAPHY AS $$
BEGIN
  RETURN ST_SetSRID(ST_MakePoint(lng, lat), 4326)::GEOGRAPHY;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================
--  FUNCTION : find_nearby_transporters
--  Trouve les transporteurs disponibles dans un rayon donné
--  avec véhicule compatible, triés par score (distance + rating)
--
--  Paramètres :
--    p_lat           latitude du point de départ
--    p_lng           longitude du point de départ
--    p_radius_km     rayon de recherche en km (défaut 50 km)
--    p_vehicle_type  type de véhicule requis (NULL = tous)
--    p_limit         nombre max de résultats (défaut 5)
-- ============================================================
CREATE OR REPLACE FUNCTION public.find_nearby_transporters(
  p_lat          DECIMAL,
  p_lng          DECIMAL,
  p_radius_km    DECIMAL  DEFAULT 50,
  p_vehicle_type TEXT     DEFAULT NULL,
  p_limit        INTEGER  DEFAULT 5
)
RETURNS TABLE (
  transporteur_id   UUID,
  company_name      TEXT,
  email             TEXT,
  phone             TEXT,
  distance_km       DECIMAL,
  match_score       DECIMAL,
  rating            DECIMAL,
  vehicle_id        UUID,
  vehicle_type      TEXT
) AS $$
DECLARE
  v_origin GEOGRAPHY;
BEGIN
  -- Créer le point d'origine
  v_origin := public.geocode_to_point(p_lat, p_lng);

  RETURN QUERY
  SELECT
    t.id                                                        AS transporteur_id,
    t.company_name,
    t.email,
    t.phone,
    -- Distance en km (haversine via PostGIS)
    ROUND((ST_Distance(t.current_location, v_origin) / 1000)::DECIMAL, 2) AS distance_km,
    -- Score composite :
    --   70% distance inversée (plus proche = meilleur score)
    --   30% rating normalisé sur 5
    ROUND((
      (1 - LEAST(ST_Distance(t.current_location, v_origin) / 1000, p_radius_km) / p_radius_km) * 0.7
      + (t.rating / 5.0) * 0.3
    )::DECIMAL, 4)                                              AS match_score,
    t.rating,
    v.id                                                        AS vehicle_id,
    v.type                                                      AS vehicle_type
  FROM public.transporteurs t
  -- Jointure avec les véhicules compatibles
  JOIN public.vehicles v ON v.transporteur_id = t.id AND v.is_active = TRUE
  WHERE
    t.status        = 'active'
    AND t.is_available  = TRUE
    AND t.current_location IS NOT NULL
    -- Filtre géospatial (rayon en mètres)
    AND ST_DWithin(t.current_location, v_origin, p_radius_km * 1000)
    -- Filtre type de véhicule (optionnel)
    AND (p_vehicle_type IS NULL OR v.type = p_vehicle_type)
  ORDER BY match_score DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================
--  FUNCTION : advance_dispatch
--  Passe au transporteur suivant dans la file de dispatch
--  Appelé quand un transporteur refuse ou expire
-- ============================================================
CREATE OR REPLACE FUNCTION public.advance_dispatch(p_course_id UUID)
RETURNS VOID AS $$
DECLARE
  v_next_req  dispatch_requests%ROWTYPE;
BEGIN
  -- Cherche le prochain dispatch_request en attente (priority suivante)
  SELECT * INTO v_next_req
  FROM public.dispatch_requests
  WHERE course_id = p_course_id
    AND status    = 'pending'
  ORDER BY priority ASC
  LIMIT 1;

  IF v_next_req.id IS NULL THEN
    -- Aucun transporteur de plus → course échouée
    UPDATE public.courses
    SET status = 'failed'
    WHERE id = p_course_id;
    RETURN;
  END IF;

  -- Notifier le prochain transporteur
  UPDATE public.dispatch_requests
  SET
    status       = 'notified',
    notified_at  = NOW(),
    expires_at   = NOW() + INTERVAL '15 seconds'
  WHERE id = v_next_req.id;

  -- Mettre à jour la course en mode dispatching
  UPDATE public.courses
  SET status = 'dispatching'
  WHERE id = p_course_id AND status != 'dispatching';
END;
$$ LANGUAGE plpgsql;

-- ============================================================
--  FUNCTION : check_dispatch_timeouts
--  Vérifie les dispatch_requests expirés et avance la file
--  → Appelé par pg_cron toutes les 5 secondes
-- ============================================================
CREATE OR REPLACE FUNCTION public.check_dispatch_timeouts()
RETURNS INTEGER AS $$
DECLARE
  v_req     dispatch_requests%ROWTYPE;
  v_count   INTEGER := 0;
BEGIN
  -- Récupère tous les dispatch expirés non encore traités
  FOR v_req IN
    SELECT * FROM public.dispatch_requests
    WHERE status    = 'notified'
      AND expires_at < NOW()
  LOOP
    -- Marquer comme expiré
    UPDATE public.dispatch_requests
    SET status = 'expired'
    WHERE id = v_req.id;

    -- Passer au suivant
    PERFORM public.advance_dispatch(v_req.course_id);

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
--  CRON JOB : check_dispatch_timeouts toutes les 5 secondes
--  Nécessite l'extension pg_cron activée dans Supabase Dashboard
-- ============================================================
-- SELECT cron.schedule(
--   'check-dispatch-timeouts',
--   '5 seconds',
--   'SELECT public.check_dispatch_timeouts()'
-- );
-- NOTE : Décommenter après activation de pg_cron dans Supabase

-- ============================================================
--  ROW LEVEL SECURITY (RLS)
--  Politique de sécurité par ligne
-- ============================================================

-- Activer RLS sur toutes les tables
ALTER TABLE public.users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transporteurs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispatch_requests  ENABLE ROW LEVEL SECURITY;

-- Users : chaque utilisateur voit uniquement son propre profil
CREATE POLICY "users_own_profile" ON public.users
  FOR ALL USING (auth.uid() = id);

-- Transporteurs : lecture publique (pour le matching), écriture propre
CREATE POLICY "transporteurs_read"  ON public.transporteurs FOR SELECT USING (TRUE);
CREATE POLICY "transporteurs_write" ON public.transporteurs
  FOR ALL USING (auth.uid() = user_id);

-- Vehicles : lecture publique, écriture par le transporteur propriétaire
CREATE POLICY "vehicles_read"  ON public.vehicles FOR SELECT USING (TRUE);
CREATE POLICY "vehicles_write" ON public.vehicles
  FOR ALL USING (
    auth.uid() = (SELECT user_id FROM public.transporteurs WHERE id = transporteur_id)
  );

-- Locations : lecture par client concerné ou transporteur, écriture par transporteur
CREATE POLICY "locations_write" ON public.locations
  FOR INSERT WITH CHECK (
    auth.uid() = (SELECT user_id FROM public.transporteurs WHERE id = transporteur_id)
  );
CREATE POLICY "locations_read" ON public.locations
  FOR SELECT USING (
    auth.uid() = (SELECT user_id FROM public.transporteurs WHERE id = transporteur_id)
    OR
    auth.uid() = (SELECT client_id FROM public.courses WHERE id = course_id)
  );

-- Courses : client voit ses propres courses, transporteur voit ses missions
CREATE POLICY "courses_client"  ON public.courses
  FOR ALL USING (auth.uid() = client_id);
CREATE POLICY "courses_transporter" ON public.courses
  FOR SELECT USING (
    auth.uid() = (SELECT user_id FROM public.transporteurs WHERE id = transporteur_id)
  );

-- Dispatch requests : transporteur concerné voit ses notifications
CREATE POLICY "dispatch_transporter" ON public.dispatch_requests
  FOR SELECT USING (
    auth.uid() = (SELECT user_id FROM public.transporteurs WHERE id = transporteur_id)
  );

-- ============================================================
--  REALTIME : activer les canaux temps réel
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.locations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.dispatch_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.courses;
