import { Hono } from 'hono'

const app = new Hono()

app.get('/api/health', (c) => {
  return c.json({ ok: true, service: 'year-board-api' })
})

export default app
