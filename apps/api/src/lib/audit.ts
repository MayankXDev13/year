import type { AuditAction } from '@year-board/shared'
import type { DrizzleD1Database } from 'drizzle-orm/d1'
import type { Context } from 'hono'
import * as schema from '../db/schema'

interface AuditInput {
  userId: string
  action: AuditAction
  entityType: 'plan' | 'habit' | 'goal' | 'week' | 'board'
  entityId?: string | null
  summary: string
  metadata?: Record<string, unknown>
}

export async function logAudit(
  db: DrizzleD1Database<typeof schema>,
  c: Context,
  input: AuditInput,
): Promise<void> {
  try {
    const ipAddress =
      c.req.header('cf-connecting-ip') ?? c.req.header('x-forwarded-for') ?? null
    const userAgent = c.req.header('user-agent')?.slice(0, 250) ?? null

    await db.insert(schema.auditLogs).values({
      id: crypto.randomUUID(),
      userId: input.userId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      summary: input.summary,
      metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      ipAddress,
      userAgent,
      createdAt: new Date(),
    })
  } catch (err) {
    // Audit logging must never break primary user actions
    console.error('[AuditLog Error]', err)
  }
}
