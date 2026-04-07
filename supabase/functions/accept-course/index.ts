// ============================================================
//  Edge Function : accept-course
//  Un transporteur accepte ou refuse une course
//
//  POST /functions/v1/accept-course
//  Headers : Authorization: Bearer <JWT du transporteur>
//  Body : {
//    dispatch_request_id : string    (UUID)
//    action              : 'accept' | 'refuse'
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
    const { dispatch_request_id, action } = await req.json()

    if (!dispatch_request_id || !['accept', 'refuse'].includes(action)) {
      return Response.json({ error: 'dispatch_request_id et action (accept|refuse) requis' }, { status: 400 })
    }

    // Client authentifié (JWT du transporteur depuis l'header Authorization)
    const authHeader = req.headers.get('Authorization')
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader! } } }
    )

    // Client service role pour les opérations en écriture privilégiées
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // 1. Vérifier l'identité de l'utilisateur connecté
    const { data: { user } } = await supabaseUser.auth.getUser()
    if (!user) {
      return Response.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // 2. Charger le dispatch_request et vérifier qu'il appartient à ce transporteur
    const { data: dispReq, error: reqErr } = await supabaseAdmin
      .from('dispatch_requests')
      .select('*, transporteurs!inner(user_id, company_name, email, phone)')
      .eq('id', dispatch_request_id)
      .single()

    if (reqErr || !dispReq) {
      return Response.json({ error: 'Dispatch request introuvable' }, { status: 404 })
    }

    if (dispReq.transporteurs.user_id !== user.id) {
      return Response.json({ error: 'Accès refusé : ce dispatch ne vous appartient pas' }, { status: 403 })
    }

    if (dispReq.status !== 'notified') {
      return Response.json({
        error: `Ce dispatch est déjà en statut "${dispReq.status}", impossible de répondre.`,
      }, { status: 409 })
    }

    // 3. Vérifier que la fenêtre de 15s n'est pas expirée
    if (new Date(dispReq.expires_at) < new Date()) {
      return Response.json({ error: 'La fenêtre de réponse a expiré (15s)' }, { status: 410 })
    }

    // ── CAS 1 : ACCEPTATION ────────────────────────────────────
    if (action === 'accept') {
      // Marquer ce dispatch comme accepté
      await supabaseAdmin
        .from('dispatch_requests')
        .update({ status: 'accepted', responded_at: new Date().toISOString() })
        .eq('id', dispatch_request_id)

      // Annuler tous les autres dispatch_requests de cette course
      await supabaseAdmin
        .from('dispatch_requests')
        .update({ status: 'skipped' })
        .eq('course_id', dispReq.course_id)
        .eq('status', 'pending')

      // Assigner la course au transporteur
      await supabaseAdmin
        .from('courses')
        .update({
          status:           'assigned',
          transporteur_id:  dispReq.transporteur_id,
          vehicle_id:       dispReq.vehicle_id,
          assigned_at:      new Date().toISOString(),
        })
        .eq('id', dispReq.course_id)

      // Marquer le transporteur comme indisponible
      await supabaseAdmin
        .from('transporteurs')
        .update({ is_available: false })
        .eq('id', dispReq.transporteur_id)

      // Charger la course pour notifier le client
      const { data: course } = await supabaseAdmin
        .from('courses')
        .select('*, users!courses_client_id_fkey(email, full_name)')
        .eq('id', dispReq.course_id)
        .single()

      // Notification client (mock)
      console.log(`[NOTIFY EMAIL] → ${course?.users?.email}`)
      console.log(`  Votre course a été acceptée par ${dispReq.transporteurs.company_name}`)
      console.log(`  Suivi en temps réel disponible sur FretNow.`)

      return Response.json({
        success:     true,
        action:      'accepted',
        course_id:   dispReq.course_id,
        transporter: dispReq.transporteurs.company_name,
      })
    }

    // ── CAS 2 : REFUS ──────────────────────────────────────────
    if (action === 'refuse') {
      // Marquer ce dispatch comme refusé
      await supabaseAdmin
        .from('dispatch_requests')
        .update({ status: 'refused', responded_at: new Date().toISOString() })
        .eq('id', dispatch_request_id)

      // Avancer vers le prochain transporteur via la fonction SQL
      await supabaseAdmin.rpc('advance_dispatch', { p_course_id: dispReq.course_id })

      return Response.json({
        success:   true,
        action:    'refused',
        course_id: dispReq.course_id,
        message:   'Dispatch passé au transporteur suivant.',
      })
    }
  } catch (err) {
    console.error('[accept-course]', err)
    return Response.json({ error: String(err) }, { status: 500 })
  }
})
