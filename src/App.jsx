import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/store/AuthContext'
import Login from '@/pages/auth/Login'

// Protezione route — reindirizza al login se non autenticato
function ProtectedRoute({ children }) {
  const { utente, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-white text-xl">Caricamento...</div>
    </div>
  )
  if (!utente) return <Navigate to="/login" replace />
  return children
}

// Placeholder pagine (le costruiremo dopo)
function Cassa() {
  const { utente, logout } = useAuth()
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl p-6 shadow flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">🍕 Cassa</h1>
            <p className="text-gray-500">Benvenuto, {utente?.nome}</p>
            <p className="text-sm text-gray-400">{utente?.pizzeriaNome}</p>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-100 text-red-700 rounded-xl font-medium hover:bg-red-200 transition"
          >
            Esci
          </button>
        </div>
        <div className="mt-6 bg-white rounded-2xl p-6 shadow">
          <p className="text-gray-500 text-center py-8">
            🚧 Interfaccia cassa in costruzione...
          </p>
        </div>
      </div>
    </div>
  )
}

function Admin() {
  const { utente, logout } = useAuth()
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl p-6 shadow flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">⚙️ Admin Pizzeria</h1>
            <p className="text-gray-500">Benvenuto, {utente?.nome}</p>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-100 text-red-700 rounded-xl font-medium hover:bg-red-200 transition"
          >
            Esci
          </button>
        </div>
        <div className="mt-6 bg-white rounded-2xl p-6 shadow">
          <p className="text-gray-500 text-center py-8">
            🚧 Pannello admin in costruzione...
          </p>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/cassa" element={
        <ProtectedRoute><Cassa /></ProtectedRoute>
      } />
      <Route path="/admin" element={
        <ProtectedRoute><Admin /></ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
