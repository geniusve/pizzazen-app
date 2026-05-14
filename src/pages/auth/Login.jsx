import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/store/AuthContext'

export default function Login() {
  const [form, setForm]       = useState({ username: '', password: '' })
  const [errore, setErrore]   = useState('')
  const [loading, setLoading] = useState(false)
  const { login }             = useAuth()
  const navigate              = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrore('')
    setLoading(true)
    try {
      const utente = await login(form.username, form.password)
      if (utente.tipo === 'admin_pizzeria') {
        navigate('/admin')
      } else {
        navigate('/cassa')
      }
    } catch (err) {
      setErrore(err?.messaggio || 'Credenziali non valide')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-950 via-red-900 to-orange-900 flex items-center justify-center p-4">

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-orange-500 rounded-full opacity-10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-red-500 rounded-full opacity-10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-orange-500 rounded-2xl mb-4 shadow-2xl">
            <span className="text-4xl">🍕</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">PizzaPax</h1>
          <p className="text-orange-300 mt-1 text-sm font-medium tracking-widest uppercase">
            Sistema Gestione Ordini
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">

          <h2 className="text-white text-xl font-bold mb-6">Accedi</h2>

          <form onSubmit={handleSubmit} className="space-y-4">

            <div>
              <label className="block text-orange-200 text-sm font-medium mb-1.5">
                Username
              </label>
              <input
                type="text"
                placeholder="mario"
                value={form.username}
                onChange={e => setForm({...form, username: e.target.value})}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition"
                required
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-orange-200 text-sm font-medium mb-1.5">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm({...form, password: e.target.value})}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition"
                required
                autoComplete="current-password"
              />
            </div>

            {errore && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-xl px-4 py-3">
                <p className="text-red-300 text-sm font-medium">⚠️ {errore}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-orange-500 hover:bg-orange-400 disabled:bg-orange-800 text-white font-bold rounded-xl transition-all duration-200 shadow-lg mt-2"
            >
              {loading ? 'Accesso in corso...' : 'Accedi'}
            </button>

          </form>
        </div>

        <p className="text-center text-orange-400/50 text-xs mt-6">
          PizzaPax © 2026
        </p>
      </div>
    </div>
  )
}
