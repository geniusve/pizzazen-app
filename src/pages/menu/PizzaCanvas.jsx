import { useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from 'react'

// Cache condivisa tra tutte le istanze — le immagini vengono caricate una volta sola
const imageCache = new Map()

export const caricaImmagine = (src) => {
  if (!src) return Promise.resolve(null)
  if (imageCache.has(src)) return Promise.resolve(imageCache.get(src))
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload  = () => { imageCache.set(src, img); resolve(img) }
    img.onerror = () => { imageCache.set(src, null); resolve(null) }
    img.src = src
  })
}

const S = 500 // dimensione interna canvas

const PizzaCanvas = forwardRef(function PizzaCanvas(
  { impasto, salsa, ingredienti, size = 300, style = {} },
  ref
) {
  const canvasRef = useRef(null)

  const disegna = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width  = S
    canvas.height = S
    ctx.clearRect(0, 0, S, S)

    // Sfondo pizza (cerchio beige)
    ctx.beginPath()
    ctx.arc(S / 2, S / 2, S / 2 - 4, 0, Math.PI * 2)
    ctx.fillStyle = '#f5e6c8'
    ctx.fill()

    // Layer 0 — impasto
    if (impasto?.immagine_pizza_url) {
      const img = await caricaImmagine(impasto.immagine_pizza_url)
      if (img) ctx.drawImage(img, 0, 0, S, S)
    }

    // Layer 1 — salsa
    if (salsa?.immagine_pizza_url) {
      const img = await caricaImmagine(salsa.immagine_pizza_url)
      if (img) ctx.drawImage(img, 0, 0, S, S)
    }

    // Layer 2+ — ingredienti ruotati, offset = 120/N * i gradi
    const extra = (ingredienti || []).filter(i => i?.immagine_pizza_url)
    const n = extra.length
    for (let i = 0; i < n; i++) {
      const ang = ((120 / n) * i) * Math.PI / 180
      const img = await caricaImmagine(extra[i].immagine_pizza_url)
      if (!img) continue
      ctx.save()
      ctx.translate(S / 2, S / 2)
      ctx.rotate(ang)
      ctx.drawImage(img, -S / 2, -S / 2, S, S)
      ctx.restore()
    }
  }, [impasto, salsa, ingredienti])

  useEffect(() => { disegna() }, [disegna])

  useImperativeHandle(ref, () => ({
    esportaPng: () => new Promise(resolve => canvasRef.current?.toBlob(resolve, 'image/png')),
  }))

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: size, height: size,
        borderRadius: '50%', display: 'block',
        boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
        background: 'repeating-conic-gradient(#f1f5f9 0% 25%, #fff 0% 50%) 0 0 / 20px 20px',
        flexShrink: 0,
        ...style,
      }}
    />
  )
})

export default PizzaCanvas
