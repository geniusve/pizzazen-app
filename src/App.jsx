import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/store/AuthContext'
import Login from '@/pages/auth/Login'
import Layout from '@/components/layout/Layout'
import MenuPage from '@/pages/menu/MenuPage'
import ClientiPage from '@/pages/clienti/ClientiPage'

function ProtectedRoute({ children }) {
  const { utente, loading } = useAuth()
  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: 'white', fontSize: 16 }}>Caricamento...</div>
    </div>
  )
  if (!utente) return <Navigate to="/login" replace />
  return <Layout>{children}</Layout>
}

// Placeholder pagine
const Placeholder = ({ titolo }) => (
  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ textAlign: 'center', color: '#94a3b8' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>🚧</div>
      <p style={{ fontSize: 16, fontWeight: 500 }}>{titolo}</p>
      <p style={{ fontSize: 13, marginTop: 4 }}>In costruzione...</p>
    </div>
  </div>
)

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/cassa/ordini"      element={<ProtectedRoute><Placeholder titolo="Ordini" /></ProtectedRoute>} />
      <Route path="/cassa/menu"        element={<ProtectedRoute><MenuPage /></ProtectedRoute>} />
      <Route path="/cassa/clienti"     element={<ProtectedRoute><ClientiPage /></ProtectedRoute>} />
      <Route path="/cassa/pizzeria"    element={<ProtectedRoute><Placeholder titolo="Impostazioni Pizzeria" /></ProtectedRoute>} />
      <Route path="/cassa/statistiche" element={<ProtectedRoute><Placeholder titolo="Statistiche" /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/cassa/ordini" replace />} />
    </Routes>
  )
}
