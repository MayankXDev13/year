import { upsertWeekMetaSchema, weekKeySchema } from '@year-board/shared'
import { drizzle } from 'drizzle-orm/d1'
import { Hono } from 'hono'
import * as schema from '../db/schema'
import type { AppVariables, Env } from '../env'
import { logAudit } from '../lib/audit'
import { requireAuth } from '../middleware/auth'

export const weekRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>()

weekRoutes.use('*', requireAuth)

weekRoutes.put('/:weekKey', async (c) => {
  const user = c.get('user')
  const weekKey = weekKeySchema.parse(c.req.param('weekKey'))
  const body = upsertWeekMetaSchema.parse(await c.req.json())
  const db = drizzle(c.env.DB, { schema })

  await db
    .insert(schema.weekMeta)
    .values({
      userId: user.id,
      weekKey,
      focus: body.focus,
      notes: body.notes,
    })
    .onConflictDoUpdate({
      target: [schema.weekMeta.userId, schema.weekMeta.weekKey],
      set: {
        focus: body.focus,
        notes: body.notes,
      },
    })

  await logAudit(db, c, {
    userId: user.id,
    action: 'week.update',
    entityType: 'week',
    entityId: weekKey,
    summary: body.focus.trim()
      ? `Updated ${weekKey} focus: "${body.focus.trim()}"`
      : `Updated notes for ${weekKey}`,
  })

  return c.json({ ok: true, weekKey })
})
