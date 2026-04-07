// ============================================================
//  Edge Function : dispatch-order
//  Lance la cascade de dispatch pour une course donnée
//
//  Processus :
//    1. Trouve les 5 meilleurs transporteurs via find_nearby_transporters
//    2. Crée les dispatch_requests en base (priorités 1→5)
//    3. Active le dispatch_request #1 (notifié, expires_at = +15s)
//    4. Le pg_cron gère la cascade automatiquement
//    5. Envoie une notification au transporteur #1
//
//  POST /functions/v1/dispatch-order
//  Body : { course_id: string }
// ============================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ── Notification mock (à remplacer par Twilio/SendGrid en prod) ─
async function sendNotification(payload: {
  to_email:   string
  to_phone:   string
  subject:    string
  message:    string
  channel:    'email' | 'sms' | 'push'
}) {
  // MVP : log uniquement
  // PROD : intégrer Twilio (SMS), Resend/SendGrid (email), Firebase (push)
  console.log(`[NOTIFY ${payload.channel.toUpperCase()}] → ${payload.to_email}`)
  console.log(`  Subject : ${payload.subject}`)
  console.log(`  Message : ${payload.message}`)

  /*
  // Exemple Twilio SMS (décommenter en prod) :
  const twilioRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${SID}/Messages.json`, {
    method: 'POST',
    headers: { Authorization: `Basic ${btoa(`${SID}:${TOKEN}`)}` },
    body: new URLSearchParams({ To: payload.to_phone, From: TWILIO_FROM, Body: payload.message })
  })

  // Exemple Resend email (décommenter en prod) :
  const emailRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'dispatch@fretnow.com', to: payload.to_email,
                           subject: payload.subject, text: payload.message })
  })
  */

  return { success: true, mock: true }
}

// ── Handler principal ─────────────────────────────────────────
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
    const { course_id } = await req.json()
    if (!course_id) {
      return Response.json({ error: 'course_id requis' }, { status: 400 })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // 1. Charger la course
    const { data: course, error: courseErr } = await supabase
      .from('courses')
      .select('*')
      .eq('id', course_id)
      .single()

    if (courseErr || !course) {
      return Response.json({ error: 'Course introuvable' }, { status: 404 })
    }

    if (!course.pickup_lat || !course.pickup_lng) {
      return Response.json({ error: 'Coordonnées pickup manquantes. Appeler find-transporters d\'abord.' }, { status: 422 })
    }

    // 2. Trouver les transporteurs disponibles (top 5)
    const { data: candidates, error: matchErr } = await supabase.rpc('find_nearby_transporters', {
      p_lat: course.pickup_lat,
      p_lng: course.pickup_lng,
      p_radius_km: 50,
      p_vehicle_type: course.vehicle_type_required || null,
      p_limit: 5,
    })

    if (matchErr) throw matchErr

    if (!candidates || candidates.length === 0) {
      // Aucun transporteur disponible
      await supabase
        .from('courses')
        .update({ status: 'failed' })
        .eq('id', course_id)

      return Response.json({ error: 'Aucun transporteur disponible dans le rayon de 50 km', candidates: [] }, { status: 200 })
    }

    // 3. Créer les dispatch_requests pour chaque candidat (priority 1→5)
    const dispatchRows = candidates.map((c: any, index: number) => ({
      course_id,
      transporteur_id: c.transporteur_id,
      vehicle_id:      c.vehicle_id,
      priority:        index + 1,
      status:          'pending',
      distance_km:     c.distance_km,
      match_score:     c.match_score,
    }))

    const { error: insertErr } = await supabase
      .from('dispatch_requests')
      .insert(dispatchRows)

    if (insertErr) throw insertErr

    // 4. Activer le premier dispatch_request (#1)
    const first = dispatchRows[0]
    const { error: notifyErr } = await supabase
      .from('dispatch_requests')
      .update({
        status:      'notified',
        notified_at: new Date().toISOString(),
        expires_at:  new Date(Date.now() + 15_000).toISOString(), // +15 secondes
      })
      .eq('course_id', course_id)
      .eq('priority', 1)

    if (notifyErr) throw notifyErr

    // 5. Passer la course en mode dispatching
    await supabase
      .from('courses')
      .update({ status: 'dispatching' })
      .eq('id', course_id)

    // 6. Envoyer une notification au transporteur #1
    const topTransporter = candidates[0]
    await sendNotification({
      to_email: topTransporter.email,
      to_phone: topTransporter.phone || '',
      channel:  'email',
      subject:  '🚛 Nouvelle course disponible - FretNow',
      message:  `Bonjour ${topTransporter.company_name},\n\n` +
                `Une course vous est proposée :\n` +
                `• Départ : ${course.pickup_address}\n` +
                `• Arrivée : ${course.delivery_address}\n` +
                `• Distance estimée : ${topTransporter.distance_km} km\n\n` +
                `Vous avez 15 secondes pour accepter ou refuser.\n` +
                `Connectez-vous sur FretNow pour répondre.`,
    })

    return Response.json({
      success:    true,
      dispatched: candidates.length,
      first_notified: {
        transporteur_id: topTransporter.transporteur_id,
        company_name:    topTransporter.company_name,
        distance_km:     topTransporter.distance_km,
        expires_at:      new Date(Date.now() + 15_000).toISOString(),
      },
    })
  } catch (err) {
    console.error('[dispatch-order]', err)
    return Response.json({ error: String(err) }, { status: 500 })
  }
})
