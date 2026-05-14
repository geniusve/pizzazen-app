import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'

const CATEGORIE = [
  { id: 'impasto',  label: 'Tipi di Impasto',       emoji: '🌾' },
  { id: 'salse',    label: 'Salse e Creme',          emoji: '🍅' },
  { id: 'formaggi', label: 'Formaggi e Latticini',   emoji: '🧀' },
  { id: 'salumi',   label: 'Salumi e Carni',         emoji: '🥩' },
  { id: 'verdure',  label: 'Verdure e Ortaggi',      emoji: '🥦' },
  { id: 'pesce',    label: 'Pesce e Frutti di Mare', emoji: '🐟' },
  { id: 'extra',    label: 'Erbe, Spezie e Extra',   emoji: '🌿' },
]

const ALLERGENI_LIST = [
  { id: 'glutine',            label: 'Glutine' },
  { id: 'latte',              label: 'Latte' },
  { id: 'uova',               label: 'Uova' },
  { id: 'pesce',              label: 'Pesce' },
  { id: 'crostacei',          label: 'Crostacei' },
  { id: 'arachidi',           label: 'Arachidi' },
  { id: 'soia',               label: 'Soia' },
  { id: 'frutta_a_guscio',    label: 'Frutta a guscio' },
  { id: 'sedano',             label: 'Sedano' },
  { id: 'senape',             label: 'Senape' },
  { id: 'sesamo',             label: 'Sesamo' },
  { id: 'anidride_solforosa', label: 'Anidride solforosa' },
  { id: 'lupini',             label: 'Lupini' },
  { id: 'molluschi',          label: 'Molluschi' },
]

const BASE_URL = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://192.168.1.160'
const PLACEHOLDER = `${BASE_URL}/storage/defaults/placeholder/ingrediente-default.png`

const FORM_VUOTO = { descrizione: '', categoria: 'extra', prezzo: '0', nota: '', allergeni: [] }

function BtnAllergene({ label, selezionato, onClick }) {
  return (
    <button type="button" onClick={onClick}
      style={selezionato
        ? { backgroundColor: '#f97316', color: '#ffffff' }
        : { backgroundColor: '#f1f5f9', color: '#475569' }
      }
      className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all hover:opacity-80 whitespace-nowrap">
      {selezionato ? `✓ ${label}` : label}
    </button>
  )
}

function IconaIngrediente({ url, v }) {
  const [err, setErr] = useState(false)
  const src = err || !url ? PLACEHOLDER : `${url}${v ? `?v=${v}` : ''}`
  return (
    <img
      src={src}
      onError={() => setErr(true)}
      className="w-9 h-9 rounded-lg object-cover bg-gray-100 flex-shrink-0"
      alt=""
    />
  )
}

export default function Ingredienti() {
  const queryClient = useQueryClient()
  const fileInputRef     = useRef(null)
  const fileInputPizzaRef = useRef(null)

  const [showModal, setShowModal]               = useState(false)
  const [editId, setEditId]                     = useState(null)
  const [cerca, setCerca]                       = useState('')
  const [categoriaFiltro, setCategoriaFiltro]   = useState(null)
  const [filtroAttivo, setFiltroAttivo]         = useState('attivi')
  const [form, setForm]                         = useState(FORM_VUOTO)
  const [errore, setErrore]                     = useState('')
  const [confermaDisattiva, setConfermaDisattiva] = useState(null)
  const [imageVersions, setImageVersions]       = useState({})
  // icona
  const [showPickerModal, setShowPickerModal]   = useState(false)
  const [iconaMode, setIconaMode]               = useState(null)
  const [iconaUrl, setIconaUrl]                 = useState(null)
  const [iconaFile, setIconaFile]               = useState(null)
  const [iconaPreview, setIconaPreview]         = useState(null)
  const [cercaIcona, setCercaIcona]             = useState('')
  // immagine pizza
  const [pizzaFile, setPizzaFile]               = useState(null)
  const [pizzaPreview, setPizzaPreview]         = useState(null)
  const [pizzaUrl, setPizzaUrl]                 = useState(null)
  const [showPizzaPickerModal, setShowPizzaPickerModal] = useState(false)
  const [cercaPizzaIcona, setCercaPizzaIcona]   = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['ingredienti-pizzeria'],
    queryFn:  () => api.get('/pizzeria/ingredienti'),
  })

  const bumpVersion = (id) => setImageVersions(v => ({ ...v, [id]: Date.now() }))

  const crea = useMutation({
    mutationFn: async () => {
      const res = await api.post('/pizzeria/ingredienti', {
        ...form,
        prezzo: parseFloat(String(form.prezzo).replace(',', '.')) || 0,
        ...(iconaUrl ? { icona_url: iconaUrl } : {}),
      })
      const id = res.data?.id
      if (id && iconaFile) {
        const fd = new FormData(); fd.append('icona', iconaFile)
        await api.post(`/pizzeria/ingredienti/${id}/icona`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        bumpVersion(id)
      }
      if (id && pizzaFile) {
        const fd = new FormData(); fd.append('immagine', pizzaFile)
        await api.post(`/pizzeria/ingredienti/${id}/immagine-pizza`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        bumpVersion(id)
      } else if (id && pizzaUrl) {
        await api.put(`/pizzeria/ingredienti/${id}`, { immagine_pizza_url: pizzaUrl })
      }
      return res
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['ingredienti-pizzeria'] }); chiudiModal() },
    onError:   (err) => setErrore(err?.response?.data?.messaggio || 'Errore nella creazione'),
  })

  const aggiorna = useMutation({
    mutationFn: async () => {
      await api.put(`/pizzeria/ingredienti/${editId}`, {
        ...form,
        prezzo: parseFloat(String(form.prezzo).replace(',', '.')) || 0,
        ...(iconaUrl ? { icona_url: iconaUrl } : {}),
      })
      if (iconaFile) {
        const fd = new FormData(); fd.append('icona', iconaFile)
        await api.post(`/pizzeria/ingredienti/${editId}/icona`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        bumpVersion(editId)
      }
      if (pizzaFile) {
        const fd = new FormData(); fd.append('immagine', pizzaFile)
        await api.post(`/pizzeria/ingredienti/${editId}/immagine-pizza`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        bumpVersion(editId)
      } else if (pizzaUrl) {
        await api.put(`/pizzeria/ingredienti/${editId}`, { immagine_pizza_url: pizzaUrl })
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['ingredienti-pizzeria'] }); chiudiModal() },
    onError:   (err) => setErrore(err?.response?.data?.messaggio || 'Errore nel salvataggio'),
  })

  const toggleAttivo = useMutation({
    mutationFn: ({ id, attivo }) => api.put(`/pizzeria/ingredienti/${id}`, { attivo }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ingredienti-pizzeria'] }),
  })

  const resetIconaState = () => {
    setShowPickerModal(false)
    setIconaMode(null)
    setIconaUrl(null)
    setIconaFile(null)
    setIconaPreview(null)
    setCercaIcona('')
    setPizzaFile(null)
    setPizzaPreview(null)
    setPizzaUrl(null)
    setShowPizzaPickerModal(false)
    setCercaPizzaIcona('')
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (fileInputPizzaRef.current) fileInputPizzaRef.current.value = ''
  }

  const apriNuovo = () => {
    setForm(FORM_VUOTO)
    setEditId(null)
    setErrore('')
    resetIconaState()
    setShowModal(true)
  }

  const apriModifica = (ing) => {
    setForm({
      descrizione: ing.descrizione,
      categoria:   ing.categoria || 'extra',
      prezzo:      String(ing.prezzo).replace('.', ','),
      nota:        ing.nota || '',
      allergeni:   ing.allergeni || [],
    })
    setEditId(ing.id)
    setErrore('')
    resetIconaState()
    setIconaPreview(ing.icona_url || null)
    setPizzaPreview(ing.immagine_pizza_url || null)
    setPizzaUrl(null)
    setShowModal(true)
  }

  const chiudiModal = () => {
    setShowModal(false)
    setEditId(null)
    setForm(FORM_VUOTO)
    setErrore('')
    resetIconaState()
  }

  const selezionaIconaEsistente = (ing) => {
    const relative = ing.icona_url.replace(`${BASE_URL}/storage/`, '')
    setIconaUrl(relative)
    setIconaPreview(ing.icona_url)
    setIconaFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    setShowPickerModal(false)
  }

  const selezionaPizzaEsistente = (ing) => {
    const relative = ing.immagine_pizza_url.replace(`${BASE_URL}/storage/`, '')
    setPizzaUrl(relative)
    setPizzaPreview(ing.immagine_pizza_url)
    setPizzaFile(null)
    if (fileInputPizzaRef.current) fileInputPizzaRef.current.value = ''
    setShowPizzaPickerModal(false)
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setIconaFile(file)
    setIconaPreview(URL.createObjectURL(file))
    setIconaUrl(null)
    setIconaMode(null)
  }

  const handlePizzaChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setPizzaFile(file)
    setPizzaPreview(URL.createObjectURL(file))
  }

  const toggleAllergene = (id) => {
    setForm(f => ({
      ...f,
      allergeni: f.allergeni.includes(id)
        ? f.allergeni.filter(x => x !== id)
        : [...f.allergeni, id],
    }))
  }

  const tutti = data?.data || []

  const filtrati = tutti.filter(i => {
    const matchCerca  = i.descrizione.toLowerCase().includes(cerca.toLowerCase())
    const matchCat    = !categoriaFiltro || i.categoria === categoriaFiltro
    const matchAttivo = filtroAttivo === 'tutti' ? true
      : filtroAttivo === 'attivi' ? i.attivo : !i.attivo
    return matchCerca && matchCat && matchAttivo
  })

  const perCategoria = CATEGORIE.map(cat => ({
    ...cat,
    ingredienti: filtrati.filter(i => i.categoria === cat.id),
  })).filter(cat => cat.ingredienti.length > 0)

  const totaleAttivi    = tutti.filter(i => i.attivo).length
  const totaleDisattivi = tutti.filter(i => !i.attivo).length

  // Ingredienti con icona per il picker (deduplicati per URL)
  const iconeDisponibili = (() => {
    const seen = new Set()
    return tutti.filter(i => {
      if (!i.icona_url || seen.has(i.icona_url)) return false
      seen.add(i.icona_url)
      return true
    })
  })()

  const iconeFiltered = iconeDisponibili.filter(i =>
    i.descrizione.toLowerCase().includes(cercaIcona.toLowerCase())
  )

  const pizzeDisponibili = (() => {
    const seen = new Set()
    return tutti.filter(i => {
      if (!i.immagine_pizza_url || seen.has(i.immagine_pizza_url)) return false
      seen.add(i.immagine_pizza_url)
      return true
    })
  })()

  const pizzeFiltered = pizzeDisponibili.filter(i =>
    i.descrizione.toLowerCase().includes(cercaPizzaIcona.toLowerCase())
  )

  const inputCls = {
    width: '100%', height: 40, padding: '0 12px',
    border: '1px solid #e2e8f0', borderRadius: 10,
    fontSize: 13, outline: 'none', boxSizing: 'border-box',
    background: 'white', color: '#1e293b',
  }

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
      <div style={{ maxWidth: 820, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1e293b', margin: 0 }}>Ingredienti</h1>
            <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
              {totaleAttivi} attivi · {totaleDisattivi} disattivi
            </p>
          </div>
          <button onClick={apriNuovo} style={{
            padding: '8px 16px', background: '#3b82f6', color: 'white',
            border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>
            + Nuovo
          </button>
        </div>

        {/* Filtro attivi */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
          {[
            { id: 'attivi',    label: 'Attivi',      n: totaleAttivi },
            { id: 'disattivi', label: 'Disattivati', n: totaleDisattivi },
            { id: 'tutti',     label: 'Tutti',       n: tutti.length },
          ].map(f => {
            const sel = filtroAttivo === f.id
            return (
              <button key={f.id} onClick={() => setFiltroAttivo(f.id)} style={{
                display: 'inline-flex', alignItems: 'center',
                background: sel ? '#1e293b' : '#f1f5f9',
                color: sel ? 'white' : '#475569',
                border: 'none', padding: '6px 12px 6px 14px',
                borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}>
                {f.label}
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  minWidth: 18, height: 18, borderRadius: '50%', marginLeft: 6,
                  fontSize: 10, fontWeight: 700,
                  background: sel ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.09)',
                  color: 'inherit',
                }}>{f.n}</span>
              </button>
            )
          })}
        </div>

        {/* Filtri categoria — griglia 3 colonne allineate */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, auto)',
          justifyContent: 'start', gap: 6, marginBottom: 14,
        }}>
          {[{ id: null, emoji: '🍕', label: 'Tutti', count: tutti.length }, ...CATEGORIE.map(cat => ({
            id: cat.id, emoji: cat.emoji, label: cat.label,
            count: tutti.filter(i => i.categoria === cat.id).length,
          }))].map(cat => {
            const sel = categoriaFiltro === cat.id
            return (
              <button key={cat.id ?? '__tutti'}
                onClick={() => setCategoriaFiltro(sel && cat.id !== null ? null : cat.id)}
                style={{
                  display: 'inline-flex', alignItems: 'center',
                  background: sel ? '#3b82f6' : '#f1f5f9',
                  color: sel ? 'white' : '#475569',
                  border: 'none', padding: '5px 12px', borderRadius: 20,
                  fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                }}>
                {cat.emoji && <span style={{ marginRight: 4 }}>{cat.emoji}</span>}
                {cat.label}
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  minWidth: 18, height: 18, borderRadius: '50%', marginLeft: 6,
                  fontSize: 10, fontWeight: 700,
                  background: sel ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.09)',
                  color: 'inherit',
                }}>{cat.count}</span>
              </button>
            )
          })}
        </div>

        {/* Cerca */}
        <div style={{ marginBottom: 20 }}>
          <input type="text" placeholder="Cerca ingrediente..."
            value={cerca} onChange={e => setCerca(e.target.value)}
            style={{ ...inputCls, maxWidth: 280 }}
          />
        </div>

        {/* Lista */}
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8' }}>Caricamento...</div>
        ) : perCategoria.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8' }}>Nessun ingrediente trovato</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {perCategoria.map(cat => (
              <div key={cat.id} style={{ background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <div style={{
                  padding: '10px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <span style={{ fontSize: 16 }}>{cat.emoji}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{cat.label}</span>
                  <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 'auto' }}>{cat.ingredienti.length}</span>
                </div>
                <div>
                  {cat.ingredienti.map((ing, idx) => (
                    <div key={ing.id} style={{
                      padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12,
                      borderTop: idx === 0 ? 'none' : '1px solid #f8fafc',
                      opacity: ing.attivo ? 1 : 0.55,
                    }}>
                      <IconaIngrediente url={ing.icona_url} v={imageVersions[ing.id]} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{ing.descrizione}</span>
                          {!ing.ingrediente_default_id && (
                            <span style={{ fontSize: 10, fontWeight: 600, color: '#7c3aed', background: '#ede9fe', padding: '1px 6px', borderRadius: 6 }}>
                              personalizzato
                            </span>
                          )}
                          {(ing.allergeni || []).map(aId => {
                            const a = ALLERGENI_LIST.find(x => x.id === aId)
                            return (
                              <span key={aId} style={{ fontSize: 10, color: '#ea580c', background: '#fff7ed', padding: '1px 6px', borderRadius: 6 }}>
                                {a?.label || aId}
                              </span>
                            )
                          })}
                        </div>
                        {ing.nota && <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{ing.nota}</p>}
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#475569', flexShrink: 0, minWidth: 52, textAlign: 'right' }}>
                        {parseFloat(ing.prezzo) > 0 ? `+€${parseFloat(ing.prezzo).toFixed(2)}` : 'Incluso'}
                      </span>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <button onClick={() => apriModifica(ing)} style={{
                          padding: '5px 10px', background: '#f1f5f9', border: 'none',
                          borderRadius: 8, fontSize: 12, fontWeight: 500, color: '#374151', cursor: 'pointer',
                        }}>Modifica</button>
                        {ing.attivo ? (
                          <button onClick={() => setConfermaDisattiva(ing)} style={{
                            padding: '5px 10px', background: '#fef2f2', border: 'none',
                            borderRadius: 8, fontSize: 12, fontWeight: 500, color: '#dc2626', cursor: 'pointer',
                          }}>Disattiva</button>
                        ) : (
                          <button onClick={() => toggleAttivo.mutate({ id: ing.id, attivo: true })}
                            disabled={toggleAttivo.isPending}
                            style={{
                              padding: '5px 10px', background: '#f0fdf4', border: 'none',
                              borderRadius: 8, fontSize: 12, fontWeight: 500, color: '#16a34a', cursor: 'pointer',
                            }}>Riattiva</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── MODAL CREA / MODIFICA ── */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16,
        }}>
          <div style={{
            background: 'white', borderRadius: 16, width: '100%', maxWidth: 500,
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            display: 'flex', flexDirection: 'column', maxHeight: '92vh',
          }}>
            {/* Header */}
            <div style={{
              padding: '16px 20px', borderBottom: '1px solid #f1f5f9',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
            }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', margin: 0 }}>
                {editId ? 'Modifica ingrediente' : 'Nuovo ingrediente'}
              </h3>
              <button onClick={chiudiModal} style={{ background: 'none', border: 'none', fontSize: 20, color: '#94a3b8', cursor: 'pointer', lineHeight: 1 }}>✕</button>
            </div>

            {/* Body */}
            <div style={{ overflowY: 'auto', flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* ── Icona + Immagine pizza — riga unica ── */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>

                {/* Icona ingrediente */}
                <div style={{ background: '#f8fafc', borderRadius: 12, padding: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#475569', margin: 0, textAlign: 'center' }}>Icona</p>
                  <div style={{ position: 'relative' }}>
                    <img
                      src={iconaPreview || PLACEHOLDER}
                      style={{ width: 64, height: 64, borderRadius: 10, objectFit: 'cover', background: '#e2e8f0', display: 'block' }}
                      alt="icona"
                    />
                    {(iconaUrl || iconaFile) && (
                      <div style={{
                        position: 'absolute', top: -3, right: -3,
                        width: 14, height: 14, borderRadius: '50%',
                        background: '#22c55e', border: '2px solid white',
                      }} />
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 5, width: '100%' }}>
                    <button type="button"
                      onClick={() => { setCercaIcona(''); setShowPickerModal(true) }}
                      style={{
                        flex: 1, padding: '5px 4px', fontSize: 11, fontWeight: 600,
                        borderRadius: 8, cursor: 'pointer', border: '1px solid #e2e8f0',
                        background: 'white', color: '#374151',
                      }}>
                      🖼️ Scegli
                    </button>
                    <button type="button"
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        flex: 1, padding: '5px 4px', fontSize: 11, fontWeight: 600,
                        borderRadius: 8, cursor: 'pointer', border: '1px solid #e2e8f0',
                        background: 'white', color: iconaFile ? '#16a34a' : '#374151',
                      }}>
                      {iconaFile ? '✓ Ok' : '⬆ Carica'}
                    </button>
                  </div>
                  <input ref={fileInputRef} type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange} style={{ display: 'none' }} />
                </div>

                {/* Immagine pizza */}
                <div style={{ background: '#f8fafc', borderRadius: 12, padding: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#475569', margin: 0, textAlign: 'center' }}>Immagine pizza</p>
                  <div style={{ position: 'relative' }}>
                    <div style={{
                      width: 64, height: 64, borderRadius: 10, overflow: 'hidden',
                      background: 'repeating-conic-gradient(#e2e8f0 0% 25%, #fff 0% 50%) 0 0 / 12px 12px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {pizzaPreview
                        ? <img src={pizzaPreview} style={{ width: 64, height: 64, objectFit: 'contain' }} alt="pizza" />
                        : <span style={{ fontSize: 24 }}>🍕</span>
                      }
                    </div>
                    {pizzaFile && (
                      <div style={{
                        position: 'absolute', top: -3, right: -3,
                        width: 14, height: 14, borderRadius: '50%',
                        background: '#22c55e', border: '2px solid white',
                      }} />
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 5, width: '100%' }}>
                    <button type="button"
                      onClick={() => { setCercaPizzaIcona(''); setShowPizzaPickerModal(true) }}
                      style={{
                        flex: 1, padding: '5px 4px', fontSize: 11, fontWeight: 600,
                        borderRadius: 8, cursor: 'pointer', border: '1px solid #e2e8f0',
                        background: 'white', color: '#374151',
                      }}>
                      🖼️ Scegli
                    </button>
                    <button type="button"
                      onClick={() => fileInputPizzaRef.current?.click()}
                      style={{
                        flex: 1, padding: '5px 4px', fontSize: 11, fontWeight: 600,
                        borderRadius: 8, cursor: 'pointer', border: '1px solid #e2e8f0',
                        background: 'white', color: (pizzaFile || pizzaUrl) ? '#16a34a' : '#374151',
                      }}>
                      {(pizzaFile || pizzaUrl) ? '✓ Ok' : '⬆ Carica'}
                    </button>
                  </div>
                  <input ref={fileInputPizzaRef} type="file"
                    accept="image/png"
                    onChange={handlePizzaChange} style={{ display: 'none' }} />
                </div>

              </div>

              {/* Descrizione */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>Descrizione *</label>
                <input
                  value={form.descrizione}
                  onChange={e => { setForm(f => ({ ...f, descrizione: e.target.value })); if (errore) setErrore('') }}
                  placeholder="es: Mozzarella fior di latte"
                  style={inputCls}
                  autoFocus
                />
              </div>

              {/* Categoria + Prezzo */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>Categoria</label>
                  <select value={form.categoria}
                    onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}
                    style={{ ...inputCls, cursor: 'pointer' }}>
                    {CATEGORIE.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>Prezzo extra (€)</label>
                  <input type="text" inputMode="decimal"
                    value={form.prezzo}
                    onChange={e => setForm(f => ({ ...f, prezzo: e.target.value.replace(/[^0-9,.]/, '') }))}
                    onBlur={e => {
                      const n = parseFloat(String(e.target.value).replace(',', '.'))
                      setForm(f => ({ ...f, prezzo: isNaN(n) ? '0' : String(Math.round(n * 100) / 100).replace('.', ',') }))
                    }}
                    placeholder="0,00" style={inputCls}
                  />
                </div>
              </div>

              {/* Nota */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>Nota (opzionale)</label>
                <input value={form.nota}
                  onChange={e => setForm(f => ({ ...f, nota: e.target.value }))}
                  placeholder="es: biologico, DOP, stagionato..."
                  style={inputCls}
                />
              </div>

              {/* Allergeni */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 8 }}>Allergeni</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {ALLERGENI_LIST.map(a => (
                    <BtnAllergene key={a.id} label={a.label}
                      selezionato={form.allergeni.includes(a.id)}
                      onClick={() => toggleAllergene(a.id)}
                    />
                  ))}
                </div>
              </div>

              {errore && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 12px' }}>
                  <p style={{ fontSize: 12, color: '#dc2626', margin: 0 }}>⚠️ {errore}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '14px 20px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 10, flexShrink: 0 }}>
              <button onClick={chiudiModal} style={{
                flex: 1, height: 40, background: '#f1f5f9', border: 'none',
                borderRadius: 10, fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer',
              }}>Annulla</button>
              <button
                onClick={() => editId ? aggiorna.mutate() : crea.mutate()}
                disabled={!form.descrizione.trim() || crea.isPending || aggiorna.isPending}
                style={{
                  flex: 1, height: 40, background: '#3b82f6', border: 'none',
                  borderRadius: 10, fontSize: 13, fontWeight: 600, color: 'white', cursor: 'pointer',
                  opacity: (!form.descrizione.trim() || crea.isPending || aggiorna.isPending) ? 0.5 : 1,
                }}>
                {(crea.isPending || aggiorna.isPending) ? 'Salvataggio...' : editId ? 'Salva modifiche' : 'Crea ingrediente'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL PICKER ICONE ── */}
      {showPickerModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 300, padding: 16,
        }}>
          <div style={{
            background: 'white', borderRadius: 16, width: '100%', maxWidth: 800,
            boxShadow: '0 24px 80px rgba(0,0,0,0.2)',
            display: 'flex', flexDirection: 'column', maxHeight: '85vh',
          }}>
            {/* Header */}
            <div style={{
              padding: '16px 24px', borderBottom: '1px solid #f1f5f9',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
            }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', margin: 0 }}>
                  Scegli icona
                </h3>
                <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0' }}>
                  {iconeFiltered.length} icone disponibili
                </p>
              </div>
              <button onClick={() => setShowPickerModal(false)}
                style={{ background: 'none', border: 'none', fontSize: 20, color: '#94a3b8', cursor: 'pointer', lineHeight: 1 }}>
                ✕
              </button>
            </div>

            {/* Search */}
            <div style={{ padding: '14px 24px 0', flexShrink: 0 }}>
              <input
                type="text"
                placeholder="Cerca per nome ingrediente..."
                value={cercaIcona}
                onChange={e => setCercaIcona(e.target.value)}
                autoFocus
                style={{
                  width: '100%', height: 40, padding: '0 12px', boxSizing: 'border-box',
                  border: '1px solid #e2e8f0', borderRadius: 10,
                  fontSize: 13, outline: 'none', color: '#1e293b',
                }}
              />
            </div>

            {/* Grid 10 colonne */}
            <div style={{ overflowY: 'auto', flex: 1, padding: '14px 24px 20px' }}>
              {iconeFiltered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: 13 }}>
                  Nessuna icona trovata
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(6, 1fr)',
                  gap: 8,
                }}>
                  {iconeFiltered.map(ing => {
                    const relativo = ing.icona_url.replace(`${BASE_URL}/storage/`, '')
                    const sel = iconaUrl === relativo
                    return (
                      <button key={ing.id} type="button"
                        onClick={() => selezionaIconaEsistente(ing)}
                        title={ing.descrizione}
                        style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center',
                          padding: '10px 6px', borderRadius: 10, cursor: 'pointer',
                          border: sel ? '2px solid #3b82f6' : '2px solid transparent',
                          background: sel ? '#eff6ff' : '#f8fafc',
                          transition: 'border-color 0.1s, background 0.1s',
                        }}>
                        <img
                          src={ing.icona_url}
                          alt=""
                          style={{ width: 52, height: 52, borderRadius: 10, objectFit: 'cover', display: 'block' }}
                        />
                        <span style={{
                          fontSize: 10, color: sel ? '#2563eb' : '#64748b',
                          fontWeight: sel ? 600 : 400,
                          marginTop: 6, lineHeight: 1.3,
                          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                          overflow: 'hidden', width: '100%', textAlign: 'center',
                        }}>
                          {ing.descrizione}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL PICKER IMMAGINI PIZZA ── */}
      {showPizzaPickerModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 300, padding: 16,
        }}>
          <div style={{
            background: 'white', borderRadius: 16, width: '100%', maxWidth: 800,
            boxShadow: '0 24px 80px rgba(0,0,0,0.2)',
            display: 'flex', flexDirection: 'column', maxHeight: '85vh',
          }}>
            <div style={{
              padding: '16px 24px', borderBottom: '1px solid #f1f5f9',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
            }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', margin: 0 }}>Scegli immagine pizza</h3>
                <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0' }}>
                  {pizzeFiltered.length} immagini disponibili
                </p>
              </div>
              <button onClick={() => setShowPizzaPickerModal(false)}
                style={{ background: 'none', border: 'none', fontSize: 20, color: '#94a3b8', cursor: 'pointer', lineHeight: 1 }}>
                ✕
              </button>
            </div>
            <div style={{ padding: '14px 24px 0', flexShrink: 0 }}>
              <input
                type="text" placeholder="Cerca ingrediente..."
                value={cercaPizzaIcona} onChange={e => setCercaPizzaIcona(e.target.value)}
                autoFocus
                style={{
                  width: '100%', height: 40, padding: '0 12px', boxSizing: 'border-box',
                  border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 13, outline: 'none', color: '#1e293b',
                }}
              />
            </div>
            <div style={{ overflowY: 'auto', flex: 1, padding: '14px 24px 20px' }}>
              {pizzeFiltered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: 13 }}>
                  Nessuna immagine pizza disponibile
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
                  {pizzeFiltered.map(ing => {
                    const relativo = ing.immagine_pizza_url.replace(`${BASE_URL}/storage/`, '')
                    const sel = pizzaUrl === relativo
                    return (
                      <button key={ing.id} type="button"
                        onClick={() => selezionaPizzaEsistente(ing)}
                        title={ing.descrizione}
                        style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center',
                          padding: '10px 6px', borderRadius: 10, cursor: 'pointer',
                          border: sel ? '2px solid #3b82f6' : '2px solid transparent',
                          background: sel ? '#eff6ff' : '#f8fafc',
                        }}>
                        <div style={{
                          width: 52, height: 52, borderRadius: 10, overflow: 'hidden',
                          background: 'repeating-conic-gradient(#e2e8f0 0% 25%, #fff 0% 50%) 0 0 / 10px 10px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <img src={`${ing.immagine_pizza_url}${imageVersions[ing.id] ? `?v=${imageVersions[ing.id]}` : ''}`} alt=""
                            style={{ width: 52, height: 52, objectFit: 'contain', display: 'block' }} />
                        </div>
                        <span style={{
                          fontSize: 10, color: sel ? '#2563eb' : '#64748b',
                          fontWeight: sel ? 600 : 400,
                          marginTop: 6, lineHeight: 1.3,
                          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                          overflow: 'hidden', width: '100%', textAlign: 'center',
                        }}>
                          {ing.descrizione}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal conferma disattiva */}
      {confermaDisattiva && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16,
        }}>
          <div style={{ background: 'white', borderRadius: 16, padding: 24, width: '100%', maxWidth: 340, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', marginBottom: 8, textAlign: 'center' }}>Disattiva ingrediente</p>
            <p style={{ fontSize: 13, color: '#64748b', textAlign: 'center', marginBottom: 4 }}>Stai per disattivare:</p>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', textAlign: 'center', marginBottom: 8 }}>"{confermaDisattiva.descrizione}"</p>
            <p style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', marginBottom: 20 }}>
              L'ingrediente non sarà più selezionabile nel menu. Puoi riattivarlo in qualsiasi momento.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setConfermaDisattiva(null)} style={{
                flex: 1, height: 40, background: '#f1f5f9', border: 'none',
                borderRadius: 10, fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer',
              }}>Annulla</button>
              <button
                onClick={() => {
                  const ing = confermaDisattiva
                  setConfermaDisattiva(null)
                  toggleAttivo.mutate({ id: ing.id, attivo: false })
                }}
                style={{
                  flex: 1, height: 40, background: '#dc2626', border: 'none',
                  borderRadius: 10, fontSize: 13, fontWeight: 600, color: 'white', cursor: 'pointer',
                }}>Disattiva</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
