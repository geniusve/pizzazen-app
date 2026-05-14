import { useState, useEffect, useRef } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/store/AuthContext'
import api from '@/lib/api'

const NAV_ITEMS = [
  { path: '/cassa/ordini',      icon: 'ti-receipt-2',       label: 'Ordini' },
  { path: '/cassa/menu',        icon: 'ti-tools-kitchen-2', label: 'Menu' },
  { path: '/cassa/clienti',     icon: 'ti-users',           label: 'Clienti' },
  { path: '/cassa/pizzeria',    icon: 'ti-building-store',  label: 'Pizzeria' },
  { path: '/cassa/statistiche', icon: 'ti-chart-bar',       label: 'Statistiche' },
]

const TIPI = {
  admin_pizzeria: 'Admin',
  cassiere:       'Cassiere',
  visualizzatore: 'Visualizzatore',
}

function StatusDot({ ok, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <div style={{
        width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
        backgroundColor: ok === null ? '#f59e0b' : ok ? '#22c55e' : '#ef4444',
        transition: 'background-color 0.3s'
      }} />
      <span style={{ fontSize: 11, color: '#64748b' }}>{label}</span>
    </div>
  )
}

export default function Layout({ children, notifiche = 0 }) {
  const { utente, logout } = useAuth()
  const navigate = useNavigate()
  const [online, setOnline]           = useState(navigator.onLine)
  const [serverOk, setServerOk]       = useState(null)
  const [waStatus, setWaStatus]       = useState(null)
  const [ora, setOra]                 = useState(new Date())
  const [showMenu, setShowMenu]       = useState(false)
  const [showPwModal, setShowPwModal] = useState(false)
  const [nuovaPassword, setNuovaPassword]     = useState('')
  const [confermaPassword, setConfermaPassword] = useState('')
  const [pwErrore, setPwErrore]       = useState('')
  const [pwSuccesso, setPwSuccesso]   = useState(false)
  const menuRef = useRef(null)

  // Orologio — aggiorna ogni minuto
  useEffect(() => {
    const tick = () => setOra(new Date())
    const ms = (60 - new Date().getSeconds()) * 1000
    const timeout = setTimeout(() => { tick(); const id = setInterval(tick, 60000); return () => clearInterval(id) }, ms)
    return () => clearTimeout(timeout)
  }, [])

  const dataFormattata = ora.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const oraFormattata  = ora.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
  const dataCapitalized = dataFormattata.charAt(0).toUpperCase() + dataFormattata.slice(1)

  // Online/Offline
  useEffect(() => {
    const onOnline  = () => setOnline(true)
    const offOnline = () => setOnline(false)
    window.addEventListener('online',  onOnline)
    window.addEventListener('offline', offOnline)
    return () => {
      window.removeEventListener('online',  onOnline)
      window.removeEventListener('offline', offOnline)
    }
  }, [])

  // Server ping ogni 30 secondi
  useEffect(() => {
    const check = async () => {
      try {
        await api.get('/ping', { timeout: 5000 })
        setServerOk(true)
      } catch {
        setServerOk(false)
      }
    }
    check()
    const interval = setInterval(check, 120000)
    return () => clearInterval(interval)
  }, [])

  // WhatsApp ogni 60 secondi
  useEffect(() => {
    const check = async () => {
      try {
        const res = await api.get('/pizzeria/whatsapp/stato')
        setWaStatus(res.data?.wa_attivo === true)
      } catch { setWaStatus(false) }
    }
    check()
    const interval = setInterval(check, 60000)
    return () => clearInterval(interval)
  }, [])

  // Chiudi menu cliccando fuori
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = () => { setShowMenu(false); logout(); navigate('/login') }

  const handleCambioPassword = async () => {
    setPwErrore('')
    if (nuovaPassword.length < 6) { setPwErrore('Password minimo 6 caratteri'); return }
    if (nuovaPassword !== confermaPassword) { setPwErrore('Le password non coincidono'); return }
    try {
      await api.post('/auth/cambia-password', { nuova_password: nuovaPassword })
      setPwSuccesso(true)
      setTimeout(() => {
        setShowPwModal(false)
        setPwSuccesso(false)
        setNuovaPassword('')
        setConfermaPassword('')
      }, 2000)
    } catch (err) {
      setPwErrore(err?.response?.data?.messaggio || 'Errore nel cambio password')
    }
  }

  const iniziale = (utente?.nome || utente?.username || 'U')[0].toUpperCase()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: '#f1f5f9' }}>

      {/* TOP BAR */}
      <div style={{
        height: 44, background: 'white', borderBottom: '1px solid #e2e8f0',
        display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12,
        flexShrink: 0, position: 'relative', zIndex: 50
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 18 }}>🍕</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>PizzaPax</span>
        </div>
        <div style={{ width: 1, height: 16, background: '#e2e8f0' }} />
        <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>
          {utente?.pizzeriaNome}
        </span>

        <div style={{ flex: 1 }} />

        {/* Data e ora */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: 1.2 }}>
          <span style={{ fontSize: 15, color: '#1e293b', fontWeight: 700 }}>{oraFormattata}</span>
          <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 400 }}>{dataCapitalized}</span>
        </div>
        <div style={{ width: 1, height: 16, background: '#e2e8f0' }} />

        {/* Status indicators */}
        <StatusDot ok={online}    label={online ? 'Online' : 'Offline'} />
        <div style={{ width: 1, height: 16, background: '#e2e8f0' }} />
        <StatusDot ok={serverOk}  label="Server" />
        <div style={{ width: 1, height: 16, background: '#e2e8f0' }} />
        <StatusDot ok={waStatus}  label="WhatsApp" />
        <div style={{ width: 1, height: 16, background: '#e2e8f0' }} />

        {/* User chip */}
        <div ref={menuRef} style={{ position: 'relative' }}>
          <div onClick={() => setShowMenu(v => !v)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: showMenu ? '#f1f5f9' : '#f8fafc',
            borderRadius: 20, padding: '3px 10px 3px 6px',
            border: `1px solid ${showMenu ? '#94a3b8' : '#e2e8f0'}`,
            cursor: 'pointer', userSelect: 'none', transition: 'all 0.15s'
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: '50%', background: '#3b82f6',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 600, color: 'white'
            }}>{iniziale}</div>
            <span style={{ fontSize: 12, color: '#1e293b', fontWeight: 500 }}>
              {utente?.nome || utente?.username}
            </span>
            <i className={`ti ti-chevron-${showMenu ? 'up' : 'down'}`}
              style={{ fontSize: 12, color: '#94a3b8' }} aria-hidden="true" />
          </div>

          {/* Dropdown */}
          {showMenu && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0,
              background: 'white', borderRadius: 12, border: '1px solid #e2e8f0',
              boxShadow: '0 4px 24px rgba(0,0,0,0.08)', minWidth: 200,
              overflow: 'hidden', zIndex: 100
            }}>
              <div style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', background: '#3b82f6',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 15, fontWeight: 600, color: 'white', flexShrink: 0
                  }}>{iniziale}</div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', margin: 0 }}>
                      {utente?.nome || utente?.username}
                    </p>
                    <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>
                      {TIPI[utente?.tipo] || utente?.tipo}
                    </p>
                  </div>
                </div>
              </div>
              <div style={{ padding: '4px 0' }}>
                <button onClick={() => { setShowMenu(false); setShowPwModal(true) }}
                  style={{
                    width: '100%', padding: '9px 14px', display: 'flex', alignItems: 'center',
                    gap: 10, background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 13, color: '#374151', textAlign: 'left'
                  }} className="menu-item">
                  <i className="ti ti-lock" style={{ fontSize: 16, color: '#6b7280' }} aria-hidden="true" />
                  Cambia password
                </button>
                <div style={{ height: 1, background: '#f1f5f9', margin: '4px 0' }} />
                <button onClick={handleLogout}
                  style={{
                    width: '100%', padding: '9px 14px', display: 'flex', alignItems: 'center',
                    gap: 10, background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 13, color: '#dc2626', textAlign: 'left'
                  }} className="menu-item-danger">
                  <i className="ti ti-logout" style={{ fontSize: 16, color: '#dc2626' }} aria-hidden="true" />
                  Esci
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* BODY */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* SIDEBAR */}
        <div style={{
          width: 54, background: '#1e293b', display: 'flex', flexDirection: 'column',
          alignItems: 'center', padding: '8px 0', gap: 4, flexShrink: 0
        }}>
          {NAV_ITEMS.map(item => (
            <NavLink key={item.path} to={item.path}
              style={{ position: 'relative', textDecoration: 'none' }}
              title={item.label}>
              {({ isActive }) => (
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isActive ? '#3b82f6' : 'transparent',
                  transition: 'background 0.15s', position: 'relative'
                }} className="nav-item">
                  <i className={`ti ${item.icon}`}
                    style={{ fontSize: 20, color: isActive ? 'white' : 'rgba(255,255,255,0.45)' }}
                    aria-hidden="true" />
                  {item.path.includes('ordini') && notifiche > 0 && (
                    <div style={{
                      position: 'absolute', top: 3, right: 3, width: 16, height: 16,
                      background: '#ef4444', borderRadius: '50%', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      fontSize: 9, color: 'white', fontWeight: 700
                    }}>
                      {notifiche > 9 ? '9+' : notifiche}
                    </div>
                  )}
                </div>
              )}
            </NavLink>
          ))}
          <div style={{ flex: 1 }} />
        </div>

        {/* CONTENT */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {children}
        </div>
      </div>

      {/* MODAL CAMBIO PASSWORD */}
      {showPwModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 200, padding: 16
        }}>
          <div style={{
            background: 'white', borderRadius: 16, padding: 24,
            width: '100%', maxWidth: 360, boxShadow: '0 20px 60px rgba(0,0,0,0.15)'
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1e293b', marginBottom: 4 }}>
              Cambia password
            </h3>
            <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 20 }}>
              Inserisci la nuova password per il tuo account
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>
                  Nuova password *
                </label>
                <input type="password" value={nuovaPassword}
                  onChange={e => setNuovaPassword(e.target.value)}
                  placeholder="min 6 caratteri"
                  style={{
                    width: '100%', height: 40, padding: '0 12px',
                    border: '1px solid #e2e8f0', borderRadius: 10,
                    fontSize: 13, outline: 'none', boxSizing: 'border-box'
                  }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>
                  Conferma password *
                </label>
                <input type="password" value={confermaPassword}
                  onChange={e => setConfermaPassword(e.target.value)}
                  placeholder="ripeti la password"
                  style={{
                    width: '100%', height: 40, padding: '0 12px',
                    border: '1px solid #e2e8f0', borderRadius: 10,
                    fontSize: 13, outline: 'none', boxSizing: 'border-box'
                  }} />
              </div>
              {pwErrore && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 12px' }}>
                  <p style={{ fontSize: 12, color: '#dc2626', margin: 0 }}>⚠️ {pwErrore}</p>
                </div>
              )}
              {pwSuccesso && (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '8px 12px' }}>
                  <p style={{ fontSize: 12, color: '#16a34a', margin: 0 }}>✅ Password aggiornata!</p>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => { setShowPwModal(false); setPwErrore(''); setNuovaPassword(''); setConfermaPassword('') }}
                style={{
                  flex: 1, height: 40, background: '#f1f5f9', border: 'none',
                  borderRadius: 10, fontSize: 13, fontWeight: 500, color: '#374151', cursor: 'pointer'
                }}>
                Annulla
              </button>
              <button onClick={handleCambioPassword}
                disabled={!nuovaPassword || !confermaPassword}
                style={{
                  flex: 1, height: 40, background: '#3b82f6', border: 'none',
                  borderRadius: 10, fontSize: 13, fontWeight: 500, color: 'white', cursor: 'pointer',
                  opacity: (!nuovaPassword || !confermaPassword) ? 0.5 : 1
                }}>
                Salva
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .nav-item:hover { background: rgba(255,255,255,0.08) !important; }
        .menu-item:hover { background: #f8fafc; }
        .menu-item-danger:hover { background: #fef2f2; }
      `}</style>
    </div>
  )
}
