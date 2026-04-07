// ============================================================
//  Edge Function : find-transporters
//  Géocode une adresse et trouve les transporteurs proches
//
//  POST /functions/v1/find-transporters
//  Body : {
//    course_id      : string   (UUID de la course)
//    pickup_address : string   (adresse de départ en clair)
//    vehicle_type   : string   (type de véhicule requis, optionnel)
//    radius_km      : number   (rayon de recherche, défaut 50)
//  }
// ============================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org'

// ── Géocodage via Nominatim (OpenStreetMap, gratuit) ─────────
async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  const url = `${NOMINATIM_URL}/search?q=${encodeURIComponent(address)}&format=json&limit=1`

  const res = await fetch(url, {
    headers: { 'User-Agent': 'FretNow/1.0 (contact@fretnow.com)' },
  })

  if (!res.ok) return null

  const data = await res.json()
  if (!data.length) return null

  return {
    lat: parseFloat(data[0].lat),
    lng: parseFloat(data[0].lon),
  }
}

// ── Handler principal ─────────────────────────────────────────
serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    const { course_id, pickup_address, vehicle_type, radius_km = 50 } = await req.json()

    if (!course_id || !pickup_address) {
      return Response.json({ error: 'course_id et pickup_address requis' }, { status: 400 })
    }

    // Client Supabase avec les credentials serveur
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')! // Service role pour bypasser RLS
    )

    // 1. Géocoder l'adresse de départ
    const coords = await geocodeAddress(pickup_address)
    if (!coords) {
      return Response.json({ error: `Impossible de géocoder : "${pickup_address}"` }, { status: 422 })
    }

    // 2. Mettre à jour la course avec les coordonnées géocodées
    await supabase
      .from('courses')
      .update({
        pickup_lat: coords.lat,
        pickup_lng: coords.lng,
        // PostGIS : on utilise une fonction SQL pour créer le GEOGRAPHY
        pickup_coordinates: `SRID=4326;POINT(${coords.lng} ${coords.lat})`,
      })
      .eq('id', course_id)

    // 3. Appeler la fonction SQL de matching
    const { data: transporters, error } = await supabase.rpc('find_nearby_transporters', {
      p_lat: coords.lat,
      p_lng: coords.lng,
      p_radius_km: radius_km,
      p_vehicle_type: vehicle_type || null,
      p_limit: 5,
    })

    if (error) throw error

    return Response.json({
      success: true,
      pickup_coords: coords,
      transporters: transporters || [],
      count: (transporters || []).length,
    })
  } catch (err) {
    console.error('[find-transporters]', err)
    return Response.json({ error: String(err) }, { status: 500 })
  }
})
