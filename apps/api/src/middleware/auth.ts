import { createMiddleware } from 'hono/factory'
import { createAuth } from '../auth'
import type { AppVariables, Env } from '../env'

export const requireAuth = createMiddleware<{
  Bindings: Env
  Variables: AppVariables
}>(async (c, next) => {
  const auth = createAuth(c.env)
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  })

  if (!session?.user) {
    return c.json(
      {
        error: {
          code: 'UNAUTHORIZED',
          message: 'Please sign in with GitHub or Google to continue.',
        },
      },
      401,
    )
  }

  c.set('user', {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    image: session.user.image,
  })
  c.set('sessionId', session.session.id)
  await next()
})
