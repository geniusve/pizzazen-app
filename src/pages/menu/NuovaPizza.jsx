import { useState, useRef, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import PizzaCanvas from './PizzaCanvas'

const STEP_IMPASTO     = 0
const STEP_SALSA       = 1
const STEP_INGREDIENTI = 2

const STEP_LABELS = ['Impasto', 'Salsa', 'Ingredienti']

const ALLERGENI_LIST = [
  { id: 'glutine', label: 'Glutine' }, { id: 'latte', label: 'Latte' },
  { id: 'uova', label: 'Uova' }, { id: 'pesce', label: 'Pesce' },
  { id: 'crostacei', label: 'Crostacei' }, { id: 'arachidi', label: 'Arachidi' },
  { id: 'soia', label: 'Soia' }, { id: 'frutta_a_guscio', label: 'Frutta a guscio' },
  { id: 'sedano', label: 'Sedano' }, { id: 'senape', label: 'Senape' },
  { id: 'sesamo', label: 'Sesamo' }, { id: 'anidride_solforosa', label: 'Anidride solforosa' },
  { id: 'lupini', label: 'Lupini' }, { id: 'molluschi', label: 'Molluschi' },
]

const CATEGORIE_EXTRA = [
  { id: 'formaggi', label: 'Formaggi',  emoji: '🧀' },
  { id: 'salumi',   label: 'Salumi',    emoji: '🥩' },
  { id: 'verdure',  label: 'Verdure',   emoji: '🥦' },
  { id: 'pesce',    label: 'Pesce',     emoji: '🐟' },
  { id: 'extra',    label: 'Extra',     emoji: '🌿' },
]

const BASE_URL = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://192.168.1.160'
const PLACEHOLDER = `${BASE_URL}/storage/defaults/placeholder/ingrediente-default.png`

// ── Card ingrediente selezionabile ────────────────────────────────────────────
function CardIngrediente({ ing, selezionato, onClick }) {
  const [imgErr, setImgErr] = useState(false)
  return (
    <button type="button" onClick={onClick} style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '10px 8px', borderRadius: 12, cursor: 'pointer',
      border: selezionato ? '2px solid #3b82f6' : '2px solid transparent',
      background: selezionato ? '#eff6ff' : '#f8fafc',
      transition: 'border-color 0.12s, background 0.12s',
      position: 'relative',
    }}>
      {selezionato && (
        <div style={{
          position: 'absolute', top: 4, right: 4,
          width: 16, height: 16, borderRadius: '50%',
          background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ color: 'white', fontSize: 10, lineHeight: 1 }}>✓</span>
        </div>
      )}
      <img
        src={imgErr || !ing.icona_url ? PLACEHOLDER : ing.icona_url}
        onError={() => setImgErr(true)}
        style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'cover', display: 'block' }}
        alt=""
      />
      <span style={{
        fontSize: 10, color: selezionato ? '#1d4ed8' : '#475569',
        fontWeight: selezionato ? 600 : 400,
        marginTop: 6, lineHeight: 1.3, textAlign: 'center',
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        overflow: 'hidden', width: '100%',
      }}>
        {ing.descrizione}
      </span>
      {parseFloat(ing.prezzo) > 0 && (
        <span style={{ fontSize: 9, color: '#94a3b8', marginTop: 2 }}>
          +€{parseFloat(ing.prezzo).toFixed(2)}
        </span>
      )}
    </button>
  )
}

// ── Componente principale ─────────────────────────────────────────────────────
// articolo: se passato, apre in modalità modifica
export default function NuovaPizza({ categorieMenu, onClose, onSaved, articolo }) {
  const queryClient  = useQueryClient()
  const isEdit       = !!articolo
  const inizializzato = useRef(false)

  const [step, setStep]                     = useState(STEP_IMPASTO)
  const [impastoSel, setImpastoSel]         = useState(null)
  const [salsaSel, setSalsaSel]             = useState(null)
  const [ingredientiSel, setIngredientiSel] = useState([])
  const [cercaStep, setCercaStep]           = useState('')
  const [nome, setNome]                     = useState(articolo?.nome || '')
  const [prezzo, setPrezzo]                 = useState(articolo ? String(articolo.prezzo).replace('.', ',') : '')
  const [categoriaId, setCategoriaId]       = useState(articolo?.categoria_id || categorieMenu?.[0]?.id || '')
  const [salvando, setSalvando]             = useState(false)
  const [errore, setErrore]                 = useState('')
  const [dragIdx, setDragIdx]               = useState(null)

  const { data } = useQuery({
    queryKey: ['ingredienti-pizzeria'],
    queryFn:  () => api.get('/pizzeria/ingredienti'),
  })

  const tutti    = (data?.data || []).filter(i => i.attivo)
  const impasti  = tutti.filter(i => i.categoria === 'impasto')
  const salse    = tutti.filter(i => i.categoria === 'salse')
  const altriTutti = tutti.filter(i => i.categoria !== 'impasto' && i.categoria !== 'salse')

  const altriCercati = altriTutti.filter(i =>
    i.descrizione.toLowerCase().includes(cercaStep.toLowerCase())
  )

  const altriPerCategoria = CATEGORIE_EXTRA.map(cat => ({
    ...cat,
    ingredienti: altriCercati.filter(i => i.categoria === cat.id),
  })).filter(cat => cat.ingredienti.length > 0)

  // Inizializza stato da articolo esistente (una sola volta, quando tutti è caricato)
  useEffect(() => {
    if (!articolo || tutti.length === 0 || inizializzato.current) return
    inizializzato.current = true

    const ingMap = new Map(tutti.map(i => [i.id, i]))
    const ings   = articolo.ingredienti || []

    const impasto = ings.find(i => i.categoria === 'impasto')
    const salsa   = ings.find(i => i.categoria === 'salse')
    const extra   = ings.filter(i => i.categoria !== 'impasto' && i.categoria !== 'salse')

    setImpastoSel(impasto ? (ingMap.get(impasto.id) || impasto) : null)
    setSalsaSel(salsa   ? (ingMap.get(salsa.id)   || salsa)   : null)
    setIngredientiSel(extra.map(i => ingMap.get(i.id) || i))
    setStep(STEP_INGREDIENTI)
  }, [articolo, tutti])

  // Allergeni calcolati
  const allergeniCalcolati = (() => {
    const set = new Set()
    for (const ing of [impastoSel, salsaSel, ...ingredientiSel].filter(Boolean)) {
      for (const a of (ing.allergeni || [])) set.add(a)
    }
    return [...set]
  })()

  const prezzoIngredienti = [impastoSel, salsaSel, ...ingredientiSel]
    .filter(Boolean)
    .reduce((s, i) => s + (parseFloat(i.prezzo) || 0), 0)

  const toggleIngrediente = (ing) => {
    setIngredientiSel(prev =>
      prev.find(i => i.id === ing.id)
        ? prev.filter(i => i.id !== ing.id)
        : [...prev, ing]
    )
  }

  // Drag & drop (lista visualizzata al contrario)
  const handleDragStart = (visualIdx) => {
    setDragIdx(ingredientiSel.length - 1 - visualIdx)
  }
  const handleDragOver = (e, visualIdx) => {
    e.preventDefault()
    if (dragIdx === null) return
    const actualIdx = ingredientiSel.length - 1 - visualIdx
    if (dragIdx === actualIdx) return
    setIngredientiSel(prev => {
      const arr = [...prev]
      const [moved] = arr.splice(dragIdx, 1)
      arr.splice(actualIdx, 0, moved)
      return arr
    })
    setDragIdx(actualIdx)
  }
  const handleDragEnd = () => setDragIdx(null)

  const salva = async () => {
    if (!nome.trim()) { setErrore('Inserisci il nome della pizza'); return }
    if (!impastoSel)  { setErrore('Seleziona un impasto'); return }
    if (!categoriaId) { setErrore('Seleziona una categoria del menu'); return }

    const prezzoNum = parseFloat(String(prezzo).replace(',', '.')) || prezzoIngredienti
    if (prezzoNum <= 0) { setErrore('Inserisci un prezzo valido'); return }

    setSalvando(true)
    setErrore('')

    try {
      const ingredienti_ids = [
        impastoSel?.id,
        salsaSel?.id,
        ...ingredientiSel.map(i => i.id),
      ].filter(Boolean)

      const payload = {
        nome: nome.trim(),
        categoria_id: parseInt(categoriaId),
        prezzo: prezzoNum,
        ingredienti_ids,
      }

      if (isEdit) {
        await api.put(`/pizzeria/menu/articoli/${articolo.id}`, payload)
      } else {
        await api.post('/pizzeria/menu/articoli', payload)
      }

      queryClient.invalidateQueries({ queryKey: ['menu-articoli'] })
      onSaved?.()
    } catch (err) {
      setErrore(err?.response?.data?.messaggio || 'Errore nel salvataggio')
    } finally {
      setSalvando(false)
    }
  }

  const canGoNext = step === STEP_IMPASTO ? !!impastoSel : step === STEP_SALSA ? !!salsaSel : true
  const isStep3   = step === STEP_INGREDIENTI

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 400, padding: 16,
    }}>
      <div style={{
        background: 'white', borderRadius: 20,
        width: '100%', maxWidth: isStep3 ? 1160 : 880,
        maxHeight: '95vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 80px rgba(0,0,0,0.25)',
        transition: 'max-width 0.2s',
      }}>

        {/* Header */}
        <div style={{
          padding: '16px 24px', borderBottom: '1px solid #f1f5f9',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', margin: 0 }}>
            🍕 {isEdit ? `Modifica: ${articolo.nome}` : 'Nuova pizza'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, color: '#94a3b8', cursor: 'pointer' }}>✕</button>
        </div>

        {/* Step bar */}
        <div style={{
          padding: '12px 24px', borderBottom: '1px solid #f1f5f9',
          display: 'flex', gap: 8, flexShrink: 0,
        }}>
          {STEP_LABELS.map((label, i) => {
            const done = i < step; const current = i === step
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {i > 0 && <div style={{ width: 24, height: 1, background: '#e2e8f0' }} />}
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: done ? 'pointer' : 'default' }}
                  onClick={() => { if (done) setStep(i) }}
                >
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700,
                    background: done ? '#22c55e' : current ? '#3b82f6' : '#e2e8f0',
                    color: (done || current) ? 'white' : '#94a3b8',
                  }}>
                    {done ? '✓' : i + 1}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: current ? '#1e293b' : done ? '#22c55e' : '#94a3b8' }}>
                    {label}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>

          {/* ── COLONNA 1: selezione ingredienti ── */}
          <div style={{ flex: 1, overflow: 'auto', padding: '20px 20px', borderRight: '1px solid #f1f5f9' }}>

            {step === STEP_IMPASTO && (
              <>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 16 }}>Scegli il tipo di impasto:</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 8 }}>
                  {impasti.map(ing => (
                    <CardIngrediente key={ing.id} ing={ing}
                      selezionato={impastoSel?.id === ing.id}
                      onClick={() => setImpastoSel(ing)} />
                  ))}
                </div>
              </>
            )}

            {step === STEP_SALSA && (
              <>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 16 }}>Scegli la salsa base:</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 8 }}>
                  {salse.map(ing => (
                    <CardIngrediente key={ing.id} ing={ing}
                      selezionato={salsaSel?.id === ing.id}
                      onClick={() => setSalsaSel(ing)} />
                  ))}
                </div>
              </>
            )}

            {step === STEP_INGREDIENTI && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', margin: 0 }}>
                    Ingredienti <span style={{ color: '#3b82f6' }}>({ingredientiSel.length})</span>
                  </p>
                </div>
                <input
                  type="text" placeholder="Cerca..."
                  value={cercaStep} onChange={e => setCercaStep(e.target.value)}
                  style={{
                    width: '100%', height: 34, padding: '0 10px', boxSizing: 'border-box',
                    border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12,
                    outline: 'none', marginBottom: 14, color: '#1e293b',
                  }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {altriPerCategoria.map(cat => (
                    <div key={cat.id}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                        <span style={{ fontSize: 14 }}>{cat.emoji}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          {cat.label}
                        </span>
                        <div style={{ flex: 1, height: 1, background: '#f1f5f9' }} />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(82px, 1fr))', gap: 6 }}>
                        {cat.ingredienti.map(ing => (
                          <CardIngrediente key={ing.id} ing={ing}
                            selezionato={!!ingredientiSel.find(i => i.id === ing.id)}
                            onClick={() => toggleIngrediente(ing)} />
                        ))}
                      </div>
                    </div>
                  ))}
                  {altriPerCategoria.length === 0 && (
                    <p style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', padding: '20px 0' }}>Nessun ingrediente trovato</p>
                  )}
                </div>
              </>
            )}
          </div>

          {/* ── COLONNA 2: dati pizza + lista ordinabile (solo step 3) ── */}
          {isStep3 && (
            <div style={{
              width: 260, flexShrink: 0, overflow: 'auto',
              padding: '20px 16px', borderRight: '1px solid #f1f5f9',
              display: 'flex', flexDirection: 'column', gap: 14,
            }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Nome pizza *</label>
                <input value={nome} onChange={e => { setNome(e.target.value); setErrore('') }}
                  placeholder="es: Margherita"
                  style={{ width: '100%', height: 36, padding: '0 10px', boxSizing: 'border-box', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', color: '#1e293b' }} />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Categoria menu *</label>
                <select value={categoriaId} onChange={e => setCategoriaId(e.target.value)}
                  style={{ width: '100%', height: 36, padding: '0 10px', boxSizing: 'border-box', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', background: 'white', cursor: 'pointer', color: '#1e293b' }}>
                  {(categorieMenu || []).map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Prezzo (€) *</label>
                <input type="text" inputMode="decimal" value={prezzo}
                  onChange={e => setPrezzo(e.target.value.replace(/[^0-9,.]/, ''))}
                  onBlur={e => {
                    const n = parseFloat(String(e.target.value).replace(',', '.'))
                    if (!isNaN(n)) setPrezzo(String(Math.round(n * 100) / 100).replace('.', ','))
                  }}
                  placeholder={`es: ${(prezzoIngredienti + 5).toFixed(2).replace('.', ',')}`}
                  style={{ width: '100%', height: 36, padding: '0 10px', boxSizing: 'border-box', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', color: '#1e293b' }} />
              </div>

              {/* Lista composizione (ordine invertito) */}
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Composizione</p>

                {[...ingredientiSel].reverse().map((ing, visualIdx) => {
                  const actualIdx = ingredientiSel.length - 1 - visualIdx
                  const isDragging = dragIdx === actualIdx
                  return (
                    <div key={ing.id} draggable
                      onDragStart={() => handleDragStart(visualIdx)}
                      onDragOver={e => handleDragOver(e, visualIdx)}
                      onDragEnd={handleDragEnd}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '6px 8px', borderRadius: 8, marginBottom: 3,
                        background: isDragging ? '#eff6ff' : '#f8fafc',
                        border: `1px solid ${isDragging ? '#93c5fd' : '#f1f5f9'}`,
                        cursor: 'grab', userSelect: 'none',
                      }}>
                      <span style={{ fontSize: 11, color: '#cbd5e1', flexShrink: 0 }}>⠿</span>
                      <span style={{ fontSize: 11, color: '#374151', flex: 1 }}>{ing.descrizione}</span>
                      {parseFloat(ing.prezzo) > 0 && (
                        <span style={{ fontSize: 9, color: '#94a3b8', flexShrink: 0 }}>+€{parseFloat(ing.prezzo).toFixed(2)}</span>
                      )}
                      <button type="button" onClick={() => toggleIngrediente(ing)}
                        style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', fontSize: 12, lineHeight: 1, padding: 0, flexShrink: 0 }}>✕</button>
                    </div>
                  )
                })}

                {ingredientiSel.length > 0 && (
                  <div style={{ height: 1, background: '#f1f5f9', margin: '4px 0' }} />
                )}

                {salsaSel && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 8, background: '#fef9c3', marginBottom: 3, border: '1px solid #fde68a' }}>
                    <span style={{ fontSize: 10, color: '#fbbf24' }}>🔒</span>
                    <span style={{ fontSize: 11, color: '#92400e', fontWeight: 600, flex: 1 }}>{salsaSel.descrizione}</span>
                    <span style={{ fontSize: 9, color: '#fbbf24' }}>salsa</span>
                  </div>
                )}

                {impastoSel && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 8, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                    <span style={{ fontSize: 10, color: '#86efac' }}>🔒</span>
                    <span style={{ fontSize: 11, color: '#15803d', fontWeight: 600, flex: 1 }}>{impastoSel.descrizione}</span>
                    <span style={{ fontSize: 9, color: '#86efac' }}>impasto</span>
                  </div>
                )}

                {!impastoSel && !salsaSel && ingredientiSel.length === 0 && (
                  <p style={{ fontSize: 11, color: '#cbd5e1', textAlign: 'center', padding: '12px 0' }}>Nessun ingrediente</p>
                )}
              </div>

              {errore && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 10px' }}>
                  <p style={{ fontSize: 11, color: '#dc2626', margin: 0 }}>⚠️ {errore}</p>
                </div>
              )}
            </div>
          )}

          {/* ── COLONNA 3 (o 2 negli step 0-1): anteprima pizza ── */}
          <div style={{
            width: isStep3 ? 280 : 300, flexShrink: 0, overflow: 'auto',
            padding: '20px 20px', display: 'flex', flexDirection: 'column', gap: 16,
          }}>
            <PizzaCanvas
              impasto={impastoSel}
              salsa={salsaSel}
              ingredienti={ingredientiSel}
              size={240}
            />

            {allergeniCalcolati.length > 0 && (
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>Allergeni:</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {allergeniCalcolati.map(aId => {
                    const a = ALLERGENI_LIST.find(x => x.id === aId)
                    return (
                      <span key={aId} style={{ fontSize: 10, color: '#ea580c', background: '#fff7ed', padding: '2px 6px', borderRadius: 6, border: '1px solid #fed7aa' }}>
                        {a?.label || aId}
                      </span>
                    )
                  })}
                </div>
              </div>
            )}

            {!isStep3 && step === STEP_SALSA && impastoSel && (
              <div style={{ background: '#f8fafc', borderRadius: 10, padding: 10 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>Composizione:</p>
                <div style={{ fontSize: 11, color: '#374151', marginBottom: 2 }}>🌾 {impastoSel.descrizione}</div>
                {salsaSel && <div style={{ fontSize: 11, color: '#374151' }}>🍅 {salsaSel.descrizione}</div>}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 24px', borderTop: '1px solid #f1f5f9',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0,
        }}>
          <button onClick={() => step > 0 ? setStep(s => s - 1) : onClose()}
            style={{ padding: '8px 20px', background: '#f1f5f9', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer' }}>
            {step === 0 ? 'Annulla' : '← Indietro'}
          </button>

          {step < STEP_INGREDIENTI ? (
            <button onClick={() => setStep(s => s + 1)} disabled={!canGoNext}
              style={{ padding: '8px 24px', background: '#3b82f6', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, color: 'white', cursor: 'pointer', opacity: canGoNext ? 1 : 0.4 }}>
              Avanti →
            </button>
          ) : (
            <button onClick={salva} disabled={salvando}
              style={{ padding: '8px 24px', background: '#16a34a', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, color: 'white', cursor: 'pointer', opacity: salvando ? 0.6 : 1 }}>
              {salvando ? 'Salvataggio...' : isEdit ? '✓ Salva modifiche' : '✓ Crea pizza'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
