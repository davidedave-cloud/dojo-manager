import { useState, useEffect } from 'react'
import { supabase } from './supabase.js'
import AthletePortal from './AthletePortal.jsx'
import AdminPanel from './AdminPanel.jsx'

export default function App() {
  const [session, setSession] = useState(null)
  const [role, setRole] = useState(null) // 'admin' | 'athlete' | null
  const [loading, setLoading] = useState(true)

  const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || ''

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) {
        setRole(session.user.email === ADMIN_EMAIL ? 'admin' : 'athlete')
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        setRole(session.user.email === ADMIN_EMAIL ? 'admin' : 'athlete')
      } else {
        setRole(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) return (
    <div style={{ background: '#0a0905', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#daa520', fontSize: 32 }}>🥋</div>
    </div>
  )

  // Mostra pannello admin o portale atleta in base al ruolo
  if (role === 'admin') return <AdminPanel session={session} supabase={supabase} />
  return <AthletePortal session={session} supabase={supabase} />
}
