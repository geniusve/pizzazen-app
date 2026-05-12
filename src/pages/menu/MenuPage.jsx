import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import Ingredienti from './Ingredienti'
import Articoli from './Articoli'

const TABS = [
  { id: 'articoli',    label: 'Pizze' },
  { id: 'ingredienti', label: 'Ingredienti' },
]

export default function MenuPage() {
  const [tab, setTab] = useState('articoli')

  const { data: catData } = useQuery({
    queryKey: ['categorie-menu'],
    queryFn:  () => api.get('/pizzeria/menu/categorie'),
  })
  const categorieMenu = catData?.data || []

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Tab bar */}
      <div style={{
        background: 'white', borderBottom: '1px solid #e2e8f0',
        padding: '0 20px', display: 'flex', gap: 0, flexShrink: 0,
      }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '12px 16px', border: 'none', background: 'none',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
            color: tab === t.id ? '#3b82f6' : '#64748b',
            borderBottom: `2px solid ${tab === t.id ? '#3b82f6' : 'transparent'}`,
            marginBottom: -1, transition: 'color 0.15s',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {tab === 'ingredienti' && <Ingredienti />}
        {tab === 'articoli'    && <Articoli categorieMenu={categorieMenu} />}
      </div>
    </div>
  )
}
