-- ============================================================
--  Migration 001 : Fix dispatch_requests + handle_new_user
--  À appliquer via Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Ajouter vehicle_id à dispatch_requests
--    (colonne manquante qui faisait crasher chaque dispatch)
ALTER TABLE public.dispatch_requests
  ADD COLUMN IF NOT EXISTS vehicle_id UUID REFERENCES public.vehicles(id);

-- 2. Corriger le trigger handle_new_user pour sauvegarder le téléphone
--    (le phone du client était perdu à l'inscription)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, phone)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
