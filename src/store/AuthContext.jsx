import { createContext, useContext, useState, useEffect } from 'react'
import api from '@/lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [utente, setUtente]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('pizzapax_token')
    const saved = localStorage.getItem('pizzapax_utente')
    if (token && saved) setUtente(JSON.parse(saved))
    setLoading(false)
  }, [])

  const login = async (username, password) => {
    console.log('Login chiamato con:', username)
    try {
      const res = await api.post('/auth/login', { username, password })
      console.log('Risposta completa:', res)
      console.log('res.data:', res.data)
      const token  = res.data?.token  || res.token
      const utente = res.data?.utente || res.utente
      console.log('Token:', token)
      console.log('Utente:', utente)
      localStorage.setItem('pizzapax_token', token)
      localStorage.setItem('pizzapax_utente', JSON.stringify(utente))
      setUtente(utente)
      return utente
    } catch (err) {
      console.error('Errore login:', err)
      throw err
    }
  }

  const logout = () => {
    localStorage.removeItem('pizzapax_token')
    localStorage.removeItem('pizzapax_utente')
    setUtente(null)
  }

  return (
    <AuthContext.Provider value={{ utente, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
