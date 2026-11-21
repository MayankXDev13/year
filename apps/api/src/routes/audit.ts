import type { AuditAction, AuditLogEntry } from '@year-board/shared'
import { desc, eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/d1'
import { Hono } from 'hono'
import * as schema from '../db/schema'
import type { AppVariables, Env } from '../env'
import { requireAuth } from '../middleware/auth'

export const auditRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>()

auditRoutes.use('*', requireAuth)

auditRoutes.get('/', async (c) => {
  const user = c.get('user')
  const limitParam = Number(c.req.query('limit') ?? '50')
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(1, limitParam), 200) : 50
  const db = drizzle(c.env.DB, { schema })

  const rows = await db
    .select()
    .from(schema.auditLogs)
    .where(eq(schema.auditLogs.userId, user.id))
    .orderBy(desc(schema.auditLogs.createdAt))
    .limit(limit)

  const logs: AuditLogEntry[] = rows.map((r) => {
    let metadata: Record<string, unknown> | null = null
    if (r.metadata) {
      try {
        metadata = JSON.parse(r.metadata) as Record<string, unknown>
      } catch {
        metadata = null
      }
    }
    return {
      id: r.id,
      action: r.action as AuditAction,
      entityType: r.entityType as AuditLogEntry['entityType'],
      entityId: r.entityId,
      summary: r.summary,
      metadata,
      createdAt: r.createdAt.toISOString(),
    }
  })

  return c.json({ logs })
})
