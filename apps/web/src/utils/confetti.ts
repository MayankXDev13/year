interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  rotation: number
  vRot: number
  life: number
  maxLife: number
}

const COLORS = ['#43b583', '#6b95f0', '#a183ee', '#35b4c4', '#d4a94f', '#e56b97', '#ea580c']

export function fireConfetti() {
  if (typeof window === 'undefined') return
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return

  const canvas = document.createElement('canvas')
  canvas.style.position = 'fixed'
  canvas.style.inset = '0'
  canvas.style.width = '100vw'
  canvas.style.height = '100vh'
  canvas.style.pointerEvents = 'none'
  canvas.style.zIndex = '9999'

  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const w = window.innerWidth
  const h = window.innerHeight
  canvas.width = Math.floor(w * dpr)
  canvas.height = Math.floor(h * dpr)
  document.body.appendChild(canvas)

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    canvas.remove()
    return
  }
  ctx.scale(dpr, dpr)

  const particles: Particle[] = []
  const count = 90
  for (let i = 0; i < count; i++) {
    const fromLeft = i % 2 === 0
    const startX = fromLeft ? w * 0.22 : w * 0.78
    const startY = h * 0.62
    const angle = fromLeft
      ? -Math.PI / 2 + (Math.random() * 0.9 - 0.15)
      : -Math.PI / 2 - (Math.random() * 0.9 - 0.15)
    const speed = 7 + Math.random() * 9

    particles.push({
      x: startX + (Math.random() - 0.5) * 40,
      y: startY + (Math.random() - 0.5) * 20,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      size: 6 + Math.random() * 5,
      color: COLORS[i % COLORS.length],
      rotation: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 0.28,
      life: 0,
      maxLife: 85 + Math.random() * 45,
    })
  }

  let frameId = 0
  const tick = () => {
    ctx.clearRect(0, 0, w, h)
    let alive = 0

    for (const p of particles) {
      p.life++
      if (p.life >= p.maxLife) continue
      alive++
      p.vy += 0.28
      p.vx *= 0.985
      p.x += p.vx
      p.y += p.vy
      p.rotation += p.vRot

      const alpha = Math.max(0, 1 - p.life / p.maxLife)
      ctx.save()
      ctx.globalAlpha = alpha
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rotation)
      ctx.fillStyle = p.color
      ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.6)
      ctx.restore()
    }

    if (alive > 0) {
      frameId = requestAnimationFrame(tick)
    } else {
      cancelAnimationFrame(frameId)
      canvas.remove()
    }
  }

  frameId = requestAnimationFrame(tick)
}
