import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { ZodError } from 'zod'
import { createAuth } from './auth'
import type { AppVariables, Env } from './env'
import { boardRoutes } from './routes/board'
import { goalRoutes } from './routes/goals'
import { habitRoutes } from './routes/habits'
import { planRoutes } from './routes/plans'
import { weekRoutes } from './routes/weeks'

const app = new Hono<{ Bindings: Env; Variables: AppVariables }>()

// CORS for Cloudflare Pages frontend ↔ Cloudflare Worker API
app.use('*', async (c, next) => {
  const webUrl = (c.env.WEB_URL || 'http://localhost:5173').replace(/\/$/, '')
  const handler = cors({
    origin: webUrl,
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    maxAge: 600,
  })
  return handler(c, next)
})

// Health check for CI/CD smoke tests
app.get('/api/health', (c) => {
  return c.json({
    ok: true,
    service: 'year-board-api',
    timestamp: new Date().toISOString(),
  })
})

// Better Auth routes (GitHub & Google OAuth only) with safe error redirect
app.on(['GET', 'POST'], '/api/auth/*', async (c) => {
  const webUrl = (c.env.WEB_URL || 'http://localhost:5173').replace(/\/$/, '')
  try {
    const auth = createAuth(c.env)
    return await auth.handler(c.req.raw)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Authentication error'
    const accept = c.req.header('accept') ?? ''
    if (c.req.method === 'GET' && accept.includes('text/html')) {
      const params = new URLSearchParams({
        error: 'AUTH_HANDLER_ERROR',
        message,
      })
      return c.redirect(`${webUrl}/auth/error?${params.toString()}`, 302)
    }
    return c.json(
      {
        error: {
          code: 'AUTH_HANDLER_ERROR',
          message,
        },
      },
      500,
    )
  }
})

// Authenticated Year Board REST routes
app.route('/api', boardRoutes)
app.route('/api/plans', planRoutes)
app.route('/api', habitRoutes)
app.route('/api/goals', goalRoutes)
app.route('/api/weeks', weekRoutes)

// 404 handler for unknown API routes
app.notFound((c) => {
  return c.json(
    {
      error: {
        code: 'NOT_FOUND',
        message: `Endpoint not found: ${c.req.method} ${c.req.path}`,
      },
    },
    404,
  )
})

// Global API error handler
app.onError((err, c) => {
  if (err instanceof ZodError) {
    return c.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request payload',
          details: err.flatten(),
        },
      },
      400,
    )
  }
  console.error('[API Error]', err)
  return c.json(
    {
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Something went wrong on the server. Please try again.',
      },
    },
    500,
  )
})

export default app
