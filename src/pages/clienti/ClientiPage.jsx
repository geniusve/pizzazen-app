import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { useAuth } from '@/store/AuthContext'

function formatData(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })
}

function Avatar({ nome, cognome, size = 40 }) {
  const initials = [nome, cognome].filter(Boolean).map(s => s[0].toUpperCase()).join('').slice(0, 2) || '?'
  const colors = ['#3b82f6,#6366f1', '#8b5cf6,#7c3aed', '#10b981,#0d9488', '#f97316,#ef4444']
  const [c1, c2] = colors[(nome?.charCodeAt(0) || 0) % colors.length].split(',')
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: `linear-gradient(135deg, ${c1}, ${c2})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.35, fontWeight: 700, color: 'white',
    }}>
      {initials}
    </div>
  )
}

// ─── Prefissi telefonici ─────────────────────────────────────

const PREFISSI = [
  { code: '+39',  flag: '🇮🇹', paese: 'Italia' },
  { code: '+43',  flag: '🇦🇹', paese: 'Austria' },
  { code: '+32',  flag: '🇧🇪', paese: 'Belgio' },
  { code: '+359', flag: '🇧🇬', paese: 'Bulgaria' },
  { code: '+357', flag: '🇨🇾', paese: 'Cipro' },
  { code: '+385', flag: '🇭🇷', paese: 'Croazia' },
  { code: '+45',  flag: '🇩🇰', paese: 'Danimarca' },
  { code: '+372', flag: '🇪🇪', paese: 'Estonia' },
  { code: '+358', flag: '🇫🇮', paese: 'Finlandia' },
  { code: '+33',  flag: '🇫🇷', paese: 'Francia' },
  { code: '+49',  flag: '🇩🇪', paese: 'Germania' },
  { code: '+30',  flag: '🇬🇷', paese: 'Grecia' },
  { code: '+353', flag: '🇮🇪', paese: 'Irlanda' },
  { code: '+371', flag: '🇱🇻', paese: 'Lettonia' },
  { code: '+370', flag: '🇱🇹', paese: 'Lituania' },
  { code: '+352', flag: '🇱🇺', paese: 'Lussemburgo' },
  { code: '+356', flag: '🇲🇹', paese: 'Malta' },
  { code: '+31',  flag: '🇳🇱', paese: 'Olanda' },
  { code: '+48',  flag: '🇵🇱', paese: 'Polonia' },
  { code: '+351', flag: '🇵🇹', paese: 'Portogallo' },
  { code: '+420', flag: '🇨🇿', paese: 'Repubblica Ceca' },
  { code: '+40',  flag: '🇷🇴', paese: 'Romania' },
  { code: '+421', flag: '🇸🇰', paese: 'Slovacchia' },
  { code: '+386', flag: '🇸🇮', paese: 'Slovenia' },
  { code: '+34',  flag: '🇪🇸', paese: 'Spagna' },
  { code: '+46',  flag: '🇸🇪', paese: 'Svezia' },
  { code: '+36',  flag: '🇭🇺', paese: 'Ungheria' },
]

function parsePhone(value) {
  if (!value) return { prefisso: '+39', numero: '' }
  const clean  = value.replace(/\s/g, '')
  const sorted = [...PREFISSI].sort((a, b) => b.code.length - a.code.length)
  const found  = sorted.find(p => clean.startsWith(p.code))
  if (found) return { prefisso: found.code, numero: clean.slice(found.code.length) }
  return { prefisso: '+39', numero: value.trim() }
}

function CampoEdit({ label, value, onChange, type = 'text', placeholder, required }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}{required && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}
      </label>
      <input type={type} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ height: 36, padding: '0 12px', borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13, color: '#1e293b', outline: 'none', background: 'white', boxSizing: 'border-box' }}
      />
    </div>
  )
}

function CampoTelefono({ label, value, onChange, required }) {
  const { prefisso: initPref, numero: initNum } = parsePhone(value)
  const [prefisso, setPrefisso] = useState(initPref)
  const [numero, setNumero]     = useState(initNum)
  const [aperto, setAperto]     = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setAperto(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const aggiorna = (pref, num) => onChange(num.trim() ? `${pref} ${num.trim()}` : '')
  const prefInfo = PREFISSI.find(p => p.code === prefisso) || PREFISSI[0]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}{required && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}
      </label>
      <div style={{ display: 'flex', gap: 6 }} ref={ref}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button type="button" onClick={() => setAperto(a => !a)}
            style={{ height: 36, padding: '0 10px', border: '1px solid #e2e8f0', borderRadius: 12, background: 'white', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            <span style={{ fontSize: 16, lineHeight: 1 }}>{prefInfo.flag}</span>
            <span style={{ fontWeight: 600, color: '#374151' }}>{prefInfo.code}</span>
            <span style={{ color: '#94a3b8', fontSize: 10 }}>▾</span>
          </button>
          {aperto && (
            <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, boxShadow: '0 10px 40px rgba(0,0,0,0.15)', zIndex: 100, maxHeight: 200, overflowY: 'auto', minWidth: 200 }}>
              {PREFISSI.map(p => (
                <button key={p.code} type="button"
                  onClick={() => { setPrefisso(p.code); aggiorna(p.code, numero); setAperto(false) }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', fontSize: 13, background: prefisso === p.code ? '#eff6ff' : 'transparent', color: prefisso === p.code ? '#1d4ed8' : '#374151', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                  <span style={{ fontSize: 16 }}>{p.flag}</span>
                  <span style={{ fontWeight: 600, width: 40, flexShrink: 0 }}>{p.code}</span>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>{p.paese}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <input type="tel" value={numero}
          onChange={e => { setNumero(e.target.value); aggiorna(prefisso, e.target.value) }}
          placeholder="333 1234567"
          style={{ flex: 1, height: 36, padding: '0 12px', borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13, color: '#1e293b', outline: 'none', background: 'white' }}
        />
      </div>
    </div>
  )
}

// ─── Modal modifica ───────────────────────────────────────────

function ModalModifica({ cliente, onClose, onSaved }) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    nome:          cliente.nome          || '',
    cognome:       cliente.cognome       || '',
    telefono:      cliente.telefono      || '',
    email:         cliente.email         || '',
    via:           cliente.via           || '',
    numero_civico: cliente.numero_civico || '',
    cap:           cliente.cap           || '',
    citta:         cliente.citta         || '',
    provincia:     cliente.provincia     || '',
    note:          cliente.note          || '',
    whatsapp_abilitato: cliente.whatsapp_abilitato ?? true,
  })

  const aggiorna = useMutation({
    mutationFn: (data) => api.put(`/pizzeria/clienti/${cliente.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clienti'] })
      queryClient.invalidateQueries({ queryKey: ['cliente', cliente.id] })
      onSaved()
    },
  })

  const set = (field) => (val) => setForm(f => ({ ...f, [field]: val }))

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500, padding: 16 }}>
      <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', margin: 0 }}>Modifica cliente</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 18, color: '#94a3b8', cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <CampoEdit label="Nome" value={form.nome} onChange={set('nome')} placeholder="Nome" />
            <CampoEdit label="Cognome" value={form.cognome} onChange={set('cognome')} placeholder="Cognome" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cellulare</label>
            <div style={{ height: 36, padding: '0 12px', borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13, color: '#94a3b8', background: '#f8fafc', display: 'flex', alignItems: 'center' }}>
              {cliente.cellulare}
            </div>
          </div>
          <CampoTelefono label="Telefono fisso" value={form.telefono} onChange={set('telefono')} />
          <CampoEdit label="Email" value={form.email} onChange={set('email')} type="email" placeholder="email@esempio.it" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 80px', gap: 8 }}>
            <CampoEdit label="Via / Strada" value={form.via} onChange={set('via')} placeholder="Via Roma" />
            <CampoEdit label="N°" value={form.numero_civico} onChange={set('numero_civico')} placeholder="1" />
            <CampoEdit label="CAP" value={form.cap} onChange={set('cap')} placeholder="00100" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px', gap: 8 }}>
            <CampoEdit label="Città" value={form.citta} onChange={set('citta')} placeholder="Roma" />
            <CampoEdit label="Prov." value={form.provincia} onChange={val => set('provincia')(val.toUpperCase().slice(0, 2))} placeholder="RM" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Note</label>
            <textarea value={form.note} onChange={e => set('note')(e.target.value)} placeholder="Note interne sul cliente..." rows={2}
              style={{ padding: '8px 12px', borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13, color: '#1e293b', outline: 'none', resize: 'none', fontFamily: 'inherit' }} />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <div onClick={() => set('whatsapp_abilitato')(!form.whatsapp_abilitato)}
              style={{ width: 40, height: 24, borderRadius: 12, background: form.whatsapp_abilitato ? '#22c55e' : '#d1d5db', position: 'relative', flexShrink: 0, cursor: 'pointer', transition: 'background 0.2s' }}>
              <div style={{ position: 'absolute', top: 4, left: form.whatsapp_abilitato ? 20 : 4, width: 16, height: 16, background: 'white', borderRadius: '50%', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.2s' }} />
            </div>
            <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>WhatsApp abilitato</span>
          </label>
        </div>

        <div style={{ padding: '16px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px', background: '#f1f5f9', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer' }}>Annulla</button>
          <button onClick={() => aggiorna.mutate(form)} disabled={aggiorna.isPending}
            style={{ flex: 1, padding: '10px', background: '#3b82f6', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 600, color: 'white', cursor: 'pointer', opacity: aggiorna.isPending ? 0.6 : 1 }}>
            {aggiorna.isPending ? 'Salvataggio...' : 'Salva modifiche'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Modal nuovo cliente ──────────────────────────────────────

function ModalNuovoCliente({ onClose, onSaved }) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    nome: '', cognome: '', cellulare: '', telefono: '',
    email: '', via: '', numero_civico: '', cap: '', citta: '', provincia: '',
    note: '', whatsapp_abilitato: true,
  })
  const [errore, setErrore]       = useState('')
  const [duplicato, setDuplicato] = useState(null)

  const set = (field) => (val) => setForm(f => ({ ...f, [field]: val }))

  // Controllo duplicati cellulare debounced 600ms
  useEffect(() => {
    const cel = form.cellulare?.replace(/\s/g, '')
    if (!cel || cel.length < 6) { setDuplicato(null); return }
    const timer = setTimeout(async () => {
      try {
        const res = await api.post('/pizzeria/clienti/lookup', { cellulare: cel })
        setDuplicato(res.data?.trovato ? res.data.cliente : null)
      } catch { setDuplicato(null) }
    }, 600)
    return () => clearTimeout(timer)
  }, [form.cellulare])

  const crea = useMutation({
    mutationFn: (data) => api.post('/pizzeria/clienti', data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['clienti'] })
      onSaved(res.data)
    },
    onError: () => setErrore('Errore durante il salvataggio'),
  })

  const salva = () => {
    setErrore('')
    if (!form.cellulare?.trim()) { setErrore('Il cellulare è obbligatorio'); return }
    if (duplicato)               { setErrore('Numero già registrato, impossibile procedere'); return }
    crea.mutate(form)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500, padding: 16 }}>
      <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', margin: 0 }}>Nuovo cliente</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 18, color: '#94a3b8', cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <CampoEdit label="Nome" value={form.nome} onChange={set('nome')} placeholder="Mario" />
            <CampoEdit label="Cognome" value={form.cognome} onChange={set('cognome')} placeholder="Rossi" />
          </div>
          <CampoTelefono label="Cellulare" value={form.cellulare} onChange={set('cellulare')} required />
          {duplicato && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '10px 12px' }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>⛔</span>
              <div style={{ fontSize: 13 }}>
                <span style={{ fontWeight: 700, color: '#dc2626' }}>Numero già registrato</span>
                <span style={{ color: '#ef4444' }}> — {[duplicato.nome, duplicato.cognome].filter(Boolean).join(' ') || 'cliente esistente'}</span>
              </div>
            </div>
          )}
          <CampoTelefono label="Telefono fisso" value={form.telefono} onChange={set('telefono')} />
          <CampoEdit label="Email" value={form.email} onChange={set('email')} type="email" placeholder="email@esempio.it" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 80px', gap: 8 }}>
            <CampoEdit label="Via / Strada" value={form.via} onChange={set('via')} placeholder="Via Roma" />
            <CampoEdit label="N°" value={form.numero_civico} onChange={set('numero_civico')} placeholder="1" />
            <CampoEdit label="CAP" value={form.cap} onChange={set('cap')} placeholder="00100" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px', gap: 8 }}>
            <CampoEdit label="Città" value={form.citta} onChange={set('citta')} placeholder="Roma" />
            <CampoEdit label="Prov." value={form.provincia} onChange={val => set('provincia')(val.toUpperCase().slice(0, 2))} placeholder="RM" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Note</label>
            <textarea value={form.note} onChange={e => set('note')(e.target.value)} placeholder="Note interne sul cliente..." rows={2}
              style={{ padding: '8px 12px', borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13, color: '#1e293b', outline: 'none', resize: 'none', fontFamily: 'inherit' }} />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <div onClick={() => set('whatsapp_abilitato')(!form.whatsapp_abilitato)}
              style={{ width: 40, height: 24, borderRadius: 12, background: form.whatsapp_abilitato ? '#22c55e' : '#d1d5db', position: 'relative', flexShrink: 0, cursor: 'pointer', transition: 'background 0.2s' }}>
              <div style={{ position: 'absolute', top: 4, left: form.whatsapp_abilitato ? 20 : 4, width: 16, height: 16, background: 'white', borderRadius: '50%', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.2s' }} />
            </div>
            <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>WhatsApp abilitato</span>
          </label>
          {errore && <div style={{ fontSize: 12, color: '#dc2626', background: '#fef2f2', padding: '8px 12px', borderRadius: 12, border: '1px solid #fecaca' }}>{errore}</div>}
        </div>

        <div style={{ padding: '16px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px', background: '#f1f5f9', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer' }}>Annulla</button>
          <button onClick={salva} disabled={crea.isPending || !!duplicato}
            style={{ flex: 1, padding: '10px', background: '#3b82f6', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 600, color: 'white', cursor: crea.isPending || duplicato ? 'not-allowed' : 'pointer', opacity: crea.isPending || duplicato ? 0.5 : 1 }}>
            {crea.isPending ? 'Salvataggio...' : 'Crea cliente'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Info row (stile admin) ───────────────────────────────────

function RigaInfo({ icon, label, value, mono }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
      <span style={{ fontSize: 16, flexShrink: 0, lineHeight: 1.4 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 1 }}>{label}</div>
        <div style={{ fontSize: 13, color: '#1e293b', fontWeight: 500, fontFamily: mono ? 'monospace' : undefined }}>{value}</div>
      </div>
    </div>
  )
}

function StatoBadge({ stato }) {
  const map = {
    completato: { bg: '#f0fdf4', color: '#15803d' },
    in_corso:   { bg: '#eff6ff', color: '#1d4ed8' },
    confermato: { bg: '#fefce8', color: '#a16207' },
    in_attesa:  { bg: '#fef3c7', color: '#92400e' },
  }
  const s = map[stato] || { bg: '#f1f5f9', color: '#64748b' }
  return (
    <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: s.bg, color: s.color }}>
      {stato?.replace(/_/g, ' ')}
    </span>
  )
}

// ─── Pannello dettaglio ───────────────────────────────────────

function PannelloDettaglio({ clienteId, pizzeriaSlug, onModifica }) {
  const { data, isLoading } = useQuery({
    queryKey: ['cliente', clienteId],
    queryFn:  () => api.get(`/pizzeria/clienti/${clienteId}`),
    enabled:  !!clienteId,
  })
  const c = data?.data

  if (isLoading) return <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 13 }}>Caricamento...</div>
  if (!c) return null

  const nomeCompleto = [c.nome, c.cognome].filter(Boolean).join(' ') || 'Senza nome'
  const indirizzo    = [c.via, c.numero_civico].filter(Boolean).join(' ')
  const localita     = [c.cap, c.citta].filter(Boolean).join(' ')
  const linkSelfOrder = pizzeriaSlug && c.codice_cliente
    ? `http://pizzapax.it/ordina/${pizzeriaSlug}/${c.codice_cliente}`
    : null

  const TIPI = { asporto: '🥡 Asporto', delivery: '🛵 Delivery', tavolo: '🍽️ Tavolo' }

  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>

      {/* Header */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #f1f5f9', background: 'white' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <Avatar nome={c.nome} cognome={c.cognome} size={52} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#1e293b' }}>{nomeCompleto}</div>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#1d4ed8', background: '#eff6ff', padding: '2px 10px', borderRadius: 20, flexShrink: 0 }}>
                {c.totale_ordini || 0} ordini
              </span>
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>
              Cliente dal {formatData(c.data_primo_ordine)}
            </div>
          </div>
          <button onClick={onModifica}
            style={{ padding: '6px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 12, fontWeight: 600, color: '#374151', cursor: 'pointer', flexShrink: 0 }}>
            Modifica
          </button>
        </div>
      </div>

      {/* Informazioni */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', background: 'white', marginTop: 8 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Informazioni</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <RigaInfo icon="📱" label="Cellulare" value={c.cellulare} />
          {c.telefono && <RigaInfo icon="☎️"  label="Telefono"  value={c.telefono} />}
          {c.email    && <RigaInfo icon="✉️"  label="Email"     value={c.email} />}
          {(indirizzo || localita) && (
            <RigaInfo icon="📍" label="Indirizzo" value={[indirizzo, localita].filter(Boolean).join(', ')} />
          )}
          {c.note && <RigaInfo icon="📝" label="Note" value={c.note} />}
          {c.codice_cliente && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <span style={{ fontSize: 16, flexShrink: 0, lineHeight: 1.4 }}>#️⃣</span>
              <div>
                <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 1 }}>Codice cliente</div>
                <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, background: '#f1f5f9', padding: '2px 8px', borderRadius: 6, color: '#1e293b', letterSpacing: '0.08em' }}>
                  {c.codice_cliente}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Azioni */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', background: 'white', marginTop: 8 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Azioni</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <a href={`tel:${c.cellulare}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, textDecoration: 'none', fontSize: 12, fontWeight: 600, color: '#15803d' }}>
            📞 Chiama
          </a>
          {c.whatsapp_abilitato && (
            <a href={`https://wa.me/${c.cellulare?.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, textDecoration: 'none', fontSize: 12, fontWeight: 600, color: '#15803d' }}>
              💬 WhatsApp
            </a>
          )}
          {linkSelfOrder && (
            <button onClick={() => navigator.clipboard.writeText(linkSelfOrder)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, fontSize: 12, fontWeight: 600, color: '#1d4ed8', cursor: 'pointer' }}>
              🔗 Copia link
            </button>
          )}
        </div>
      </div>

      {/* Ultimi ordini */}
      {c.ultimi_ordini?.length > 0 && (
        <div style={{ padding: '16px 20px', background: 'white', marginTop: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Ultimi ordini</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {c.ultimi_ordini.map(o => (
              <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: '#f8fafc', borderRadius: 10, border: '1px solid #f1f5f9' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>#{o.numero_ordine}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>{formatData(o.created_at)} · {TIPI[o.tipo_ordine] || o.tipo_ordine || '—'}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>€{parseFloat(o.totale || 0).toFixed(2)}</div>
                  <StatoBadge stato={o.stato} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Pagina principale ────────────────────────────────────────

export default function ClientiPage() {
  const { utente } = useAuth()
  const [cerca, setCerca]               = useState('')
  const [pagina, setPagina]             = useState(1)
  const [clienteSel, setClienteSel]     = useState(null)
  const [showModifica, setShowModifica] = useState(false)
  const [showNuovo, setShowNuovo]       = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['clienti', cerca, pagina],
    queryFn:  () => api.get('/pizzeria/clienti', { params: { cerca: cerca || undefined, pagina, per_pagina: 30 } }),
    keepPreviousData: true,
  })

  const lista    = data?.data?.clienti || []
  const totPagine = data?.data?.pagine  || 1

  const seleziona = (c) => { setClienteSel(c); setShowModifica(false) }
  const handleCerca = (v) => { setCerca(v); setPagina(1); setClienteSel(null) }

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

      {/* ── Sinistra: lista ── */}
      <div style={{ width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column', borderRight: '1px solid #e2e8f0', background: 'white' }}>

        <div style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: 8 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', fontSize: 14 }}>🔍</span>
            <input value={cerca} onChange={e => handleCerca(e.target.value)} placeholder="Cerca cliente..."
              style={{ width: '100%', boxSizing: 'border-box', padding: '7px 10px 7px 30px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none', color: '#1e293b' }} />
          </div>
          <button onClick={() => setShowNuovo(true)}
            style={{ padding: '7px 12px', background: '#3b82f6', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, color: 'white', cursor: 'pointer', flexShrink: 0 }}>
            + Nuovo
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {isLoading ? (
            <div style={{ padding: '32px 0', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Caricamento...</div>
          ) : lista.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>👤</div>
              <p style={{ fontSize: 13, fontWeight: 500, color: '#64748b', margin: 0 }}>{cerca ? 'Nessun cliente trovato' : 'Nessun cliente ancora'}</p>
            </div>
          ) : (
            lista.map(c => {
              const nome = [c.nome, c.cognome].filter(Boolean).join(' ') || 'Senza nome'
              const isSel = clienteSel?.id === c.id
              return (
                <div key={c.id} onClick={() => seleziona(c)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #f8fafc', borderLeft: `2px solid ${isSel ? '#3b82f6' : 'transparent'}`, background: isSel ? '#eff6ff' : 'white', transition: 'background 0.1s' }}>
                  <Avatar nome={c.nome} cognome={c.cognome} size={36} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: isSel ? '#1d4ed8' : '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nome}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{c.cellulare}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#3b82f6' }}>{c.totale_ordini || 0}</div>
                    <div style={{ fontSize: 10, color: '#94a3b8' }}>ordini</div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {totPagine > 1 && (
          <div style={{ padding: '10px 14px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina === 1}
              style={{ padding: '5px 10px', background: '#f1f5f9', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, color: '#374151', cursor: pagina === 1 ? 'default' : 'pointer', opacity: pagina === 1 ? 0.4 : 1 }}>
              ← Prec
            </button>
            <span style={{ fontSize: 12, color: '#64748b' }}>{pagina} / {totPagine}</span>
            <button onClick={() => setPagina(p => Math.min(totPagine, p + 1))} disabled={pagina === totPagine}
              style={{ padding: '5px 10px', background: '#f1f5f9', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, color: '#374151', cursor: pagina === totPagine ? 'default' : 'pointer', opacity: pagina === totPagine ? 0.4 : 1 }}>
              Succ →
            </button>
          </div>
        )}
      </div>

      {/* ── Destra: dettaglio ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#f8fafc' }}>
        {clienteSel ? (
          <PannelloDettaglio
            clienteId={clienteSel.id}
            pizzeriaSlug={utente?.pizzeriaSlug}
            onModifica={() => setShowModifica(true)}
          />
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 40 }}>👤</span>
            <p style={{ fontSize: 14, fontWeight: 500, color: '#64748b', margin: 0 }}>Seleziona un cliente</p>
          </div>
        )}
      </div>

      {showModifica && clienteSel && (
        <ModalModifica cliente={clienteSel} onClose={() => setShowModifica(false)} onSaved={() => setShowModifica(false)} />
      )}
      {showNuovo && (
        <ModalNuovoCliente onClose={() => setShowNuovo(false)} onSaved={(c) => { setShowNuovo(false); setClienteSel(c) }} />
      )}
    </div>
  )
}
