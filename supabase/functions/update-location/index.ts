// ============================================================
//  Edge Function : update-location
//  Met à jour la position GPS d'un transporteur en temps réel
//
//  Utilisé par l'app mobile/web du transporteur pendant une mission.
//  Stocke dans la table `locations` (historique) et met à jour
//  `transporteurs.current_location` (position courante).
//  Supabase Realtime diffuse automatiquement les changements.
//
//  POST /functions/v1/update-location
//  Headers : Authorization: Bearer <JWT du transporteur>
//  Body : {
//    lat       : number
//    lng       : number
//    course_id : string | null   (si en mission active)
//    speed_kmh : number | null
//    heading   : number | null   (0-359, degrés)
//  }
// ============================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    const { lat, lng, course_id = null, speed_kmh = null, heading = null } = await req.json()

    if (lat == null || lng == null) {
      return Response.json({ error: 'lat et lng requis' }, { status: 400 })
    }

    // Validation des coordonnées
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return Response.json({ error: 'Coordonnées invalides' }, { status: 400 })
    }

    // Client authentifié
    const authHeader = req.headers.get('Authorization')
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader! } } }
    )

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // 1. Identifier le transporteur connecté
    const { data: { user } } = await supabaseUser.auth.getUser()
    if (!user) {
      return Response.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { data: transporter, error: tErr } = await supabaseAdmin
      .from('transporteurs')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (tErr || !transporter) {
      return Response.json({ error: 'Profil transporteur introuvable' }, { status: 404 })
    }

    const wkb = `SRID=4326;POINT(${lng} ${lat})`

    // 2. Insérer dans l'historique des positions (table `locations`)
    //    → déclenche Supabase Realtime pour le client qui suit la course
    const { error: locErr } = await supabaseAdmin
      .from('locations')
      .insert({
        transporteur_id: transporter.id,
        course_id:       course_id,
        coordinates:     wkb,
        lat,
        lng,
        speed_kmh,
        heading,
      })

    if (locErr) throw locErr

    // 3. Mettre à jour la position courante du transporteur
    //    → utilisé par find_nearby_transporters pour le matching
    const { error: updateErr } = await supabaseAdmin
      .from('transporteurs')
      .update({
        current_location: wkb,
        current_lat:      lat,
        current_lng:      lng,
        last_seen_at:     new Date().toISOString(),
      })
      .eq('id', transporter.id)

    if (updateErr) throw updateErr

    return Response.json({ success: true, transporteur_id: transporter.id, lat, lng })
  } catch (err) {
    console.error('[update-location]', err)
    return Response.json({ error: String(err) }, { status: 500 })
  }
})
