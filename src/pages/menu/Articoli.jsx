import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import PizzaCanvas from './PizzaCanvas'
import NuovaPizza from './NuovaPizza'

const ALLERGENI_LIST = [
  { id: 'glutine', label: 'Glutine' }, { id: 'latte', label: 'Latte' },
  { id: 'uova', label: 'Uova' }, { id: 'pesce', label: 'Pesce' },
  { id: 'crostacei', label: 'Crostacei' }, { id: 'arachidi', label: 'Arachidi' },
  { id: 'soia', label: 'Soia' }, { id: 'frutta_a_guscio', label: 'Frutta a guscio' },
  { id: 'sedano', label: 'Sedano' }, { id: 'senape', label: 'Senape' },
  { id: 'sesamo', label: 'Sesamo' }, { id: 'anidride_solforosa', label: 'Anidride solforosa' },
  { id: 'lupini', label: 'Lupini' }, { id: 'molluschi', label: 'Molluschi' },
]

export default function Articoli({ categorieMenu }) {
  const queryClient = useQueryClient()
  const [mostraInattive, setMostraInattive] = useState(false)
  const [editArticolo, setEditArticolo]     = useState(null)
  const [nuovaPizza, setNuovaPizza]         = useState(false)
  const [confermaElimina, setConfermaElimina]     = useState(null)
  const [confermaRipristina, setConfermaRipristina] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['menu-articoli'],
    queryFn:  () => api.get('/pizzeria/menu/articoli', { params: { includi_non_in_uso: '1' } }),
  })

  const elimina = useMutation({
    mutationFn: (id) => api.delete(`/pizzeria/menu/articoli/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-articoli'] })
      setConfermaElimina(null)
    },
  })

  const ripristina = useMutation({
    mutationFn: (id) => api.put(`/pizzeria/menu/articoli/${id}`, { non_in_uso: false }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['menu-articoli'] }),
  })

  const tuttiArticoli = data?.data || []
  const attive  = tuttiArticoli.filter(a => !a.non_in_uso)
  const nascoste = tuttiArticoli.filter(a => a.non_in_uso)
  const articoli = mostraInattive ? nascoste : attive

  // Raggruppa per categoria_nome
  const perCategoria = (() => {
    const map = new Map()
    for (const a of articoli) {
      if (!map.has(a.categoria_nome)) map.set(a.categoria_nome, [])
      map.get(a.categoria_nome).push(a)
    }
    return [...map.entries()].map(([nome, items]) => ({ nome, items }))
  })()

  const apriWizard = () => { setEditArticolo(null); setNuovaPizza(true) }
  const apriModifica = (art) => { setEditArticolo(art); setNuovaPizza(true) }
  const chiudiWizard = () => { setNuovaPizza(false); setEditArticolo(null) }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Toolbar */}
      <div style={{
        padding: '12px 20px', background: 'white', borderBottom: '1px solid #f1f5f9',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { label: 'Attive', count: attive.length, active: !mostraInattive, onClick: () => setMostraInattive(false) },
            { label: 'Nascoste', count: nascoste.length, active: mostraInattive, onClick: () => setMostraInattive(true) },
          ].map(btn => (
            <button key={btn.label} onClick={btn.onClick} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
              border: 'none', cursor: 'pointer',
              background: btn.active ? '#1e40af' : '#f3f4f6',
              color: btn.active ? 'white' : '#374151',
            }}>
              {btn.label}
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                minWidth: 18, height: 18, borderRadius: '50%', fontSize: 10, fontWeight: 700,
                background: btn.active ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.09)',
                color: 'inherit',
              }}>
                {btn.count}
              </span>
            </button>
          ))}
        </div>
        <button onClick={apriWizard}
          style={{
            padding: '8px 18px', background: '#3b82f6', border: 'none',
            borderRadius: 10, fontSize: 13, fontWeight: 600, color: 'white', cursor: 'pointer',
          }}>
          + Nuova pizza
        </button>
      </div>

      {/* Lista */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8', fontSize: 14 }}>Caricamento...</div>
        ) : perCategoria.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🍕</div>
            <p style={{ fontSize: 14, fontWeight: 500, color: '#64748b' }}>Nessuna pizza nel menu</p>
            <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Clicca "+ Nuova pizza" per iniziare</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 900, margin: '0 auto' }}>
            {perCategoria.map(cat => (
              <div key={cat.nome} style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <div style={{ padding: '10px 16px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>{cat.nome}</span>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>{cat.items.length} pizze</span>
                </div>
                <div>
                  {cat.items.map(art => {
                    const impasto = art.ingredienti?.find(i => i.categoria === 'impasto') || null
                    const salsa   = art.ingredienti?.find(i => i.categoria === 'salse') || null
                    const extra   = art.ingredienti?.filter(i => i.categoria !== 'impasto' && i.categoria !== 'salse') || []
                    const allergeni = art.allergeni_calcolati || []

                    return (
                      <div key={art.id} style={{
                        display: 'flex', alignItems: 'center', gap: 14,
                        padding: '12px 16px', borderBottom: '1px solid #f8fafc',
                      }}>
                        {/* Canvas live */}
                        <PizzaCanvas
                          impasto={impasto}
                          salsa={salsa}
                          ingredienti={extra}
                          size={72}
                          style={{ flexShrink: 0, opacity: art.non_in_uso ? 0.45 : 1 }}
                        />

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0, opacity: art.non_in_uso ? 0.5 : 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{art.nome}</span>
                            {art.non_disponibile && (
                              <span style={{ fontSize: 10, background: '#fef3c7', color: '#92400e', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>
                                Non disponibile
                              </span>
                            )}
                            {art.non_in_uso && (
                              <span style={{ fontSize: 10, background: '#f1f5f9', color: '#64748b', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>
                                Nascosta
                              </span>
                            )}
                          </div>
                          <p style={{ fontSize: 11, color: '#64748b', margin: '3px 0 0', lineClamp: 1 }}>
                            {art.ingredienti?.map(i => i.descrizione).join(', ')}
                          </p>
                          {allergeni.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 4 }}>
                              {allergeni.map(aId => {
                                const a = ALLERGENI_LIST.find(x => x.id === aId)
                                return (
                                  <span key={aId} style={{ fontSize: 9, color: '#ea580c', background: '#fff7ed', padding: '1px 5px', borderRadius: 4 }}>
                                    {a?.label || aId}
                                  </span>
                                )
                              })}
                            </div>
                          )}
                        </div>

                        {/* Prezzo */}
                        <span style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', flexShrink: 0 }}>
                          €{parseFloat(art.prezzo).toFixed(2)}
                        </span>

                        {/* Azioni */}
                        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                          {art.non_in_uso ? (
                            <button onClick={() => setConfermaRipristina(art)}
                              style={{ padding: '5px 10px', fontSize: 11, fontWeight: 600, borderRadius: 8, border: '1px solid #22c55e', background: '#f0fdf4', color: '#15803d', cursor: 'pointer' }}>
                              Ripristina
                            </button>
                          ) : (
                            <>
                              <button onClick={() => apriModifica(art)}
                                style={{ padding: '5px 10px', fontSize: 11, fontWeight: 600, borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', color: '#374151', cursor: 'pointer' }}>
                                Modifica
                              </button>
                              <button onClick={() => setConfermaElimina(art)}
                                style={{ padding: '5px 10px', fontSize: 11, fontWeight: 600, borderRadius: 8, border: 'none', background: '#fef2f2', color: '#dc2626', cursor: 'pointer' }}>
                                Elimina
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Wizard nuova/modifica pizza */}
      {nuovaPizza && (
        <NuovaPizza
          categorieMenu={categorieMenu}
          articolo={editArticolo}
          onClose={chiudiWizard}
          onSaved={chiudiWizard}
        />
      )}

      {/* Modal conferma ripristina */}
      {confermaRipristina && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 500, padding: 16,
        }}>
          <div style={{ background: 'white', borderRadius: 16, padding: 24, width: '100%', maxWidth: 360, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize: 32, textAlign: 'center', marginBottom: 12 }}>✅</div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', textAlign: 'center', margin: '0 0 8px' }}>
              Rimetti nel menu
            </h3>
            <p style={{ fontSize: 13, color: '#64748b', textAlign: 'center', margin: '0 0 6px' }}>
              "{confermaRipristina.nome}"
            </p>
            <p style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', margin: '0 0 20px' }}>
              La pizza tornerà visibile ai clienti.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setConfermaRipristina(null)}
                style={{ flex: 1, padding: '10px', background: '#f1f5f9', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer' }}>
                Annulla
              </button>
              <button
                onClick={() => { ripristina.mutate(confermaRipristina.id); setConfermaRipristina(null) }}
                disabled={ripristina.isPending}
                style={{ flex: 1, padding: '10px', background: '#16a34a', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, color: 'white', cursor: 'pointer', opacity: ripristina.isPending ? 0.6 : 1 }}>
                Ripristina
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal conferma elimina */}
      {confermaElimina && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 500, padding: 16,
        }}>
          <div style={{ background: 'white', borderRadius: 16, padding: 24, width: '100%', maxWidth: 360, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize: 32, textAlign: 'center', marginBottom: 12 }}>🗑️</div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', textAlign: 'center', margin: '0 0 8px' }}>
              Rimuovi dal menu
            </h3>
            <p style={{ fontSize: 13, color: '#64748b', textAlign: 'center', margin: '0 0 6px' }}>
              "{confermaElimina.nome}"
            </p>
            <p style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', margin: '0 0 20px' }}>
              La pizza non sarà più visibile ai clienti. Gli ordini già effettuati non vengono modificati.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setConfermaElimina(null)}
                style={{ flex: 1, padding: '10px', background: '#f1f5f9', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer' }}>
                Annulla
              </button>
              <button onClick={() => elimina.mutate(confermaElimina.id)}
                disabled={elimina.isPending}
                style={{ flex: 1, padding: '10px', background: '#dc2626', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, color: 'white', cursor: 'pointer', opacity: elimina.isPending ? 0.6 : 1 }}>
                {elimina.isPending ? 'Rimozione...' : 'Rimuovi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
