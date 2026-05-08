import React from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from './context/AuthContext'
import App from './App'
import '../style.css'

function init() {
  if (!window.supabase) {
    setTimeout(init, 50)
    return
  }
  import('./lib/supabase.js').then(() => {
    const root = createRoot(document.getElementById('root'))
    root.render(
      <AuthProvider>
        <App />
      </AuthProvider>
    )
  })
}
init()
