const SUPABASE_URL = 'https://zcqhbdzxjsoobjhbuzhi.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_5e7RBmRBZqEiuWE5GOnWLQ_NvRNpRAD'

let sb
try {
  sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
} catch (e) {
  console.error('Supabase init failed:', e)
}

window._supabaseClient = sb
window.sb = sb

export default sb
