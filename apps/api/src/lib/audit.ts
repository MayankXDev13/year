import type { AuditAction } from '@year-board/shared'
import type { DrizzleD1Database } from 'drizzle-orm/d1'
import type { Context } from 'hono'
import * as schema from '../db/schema'

export interface AuditInput {
  userId: string
  action: AuditAction
  entityType: 'plan' | 'habit' | 'goal' | 'week' | 'board'
  entityId?: string | null
  summary: string
  metadata?: Record<string, unknown>
}

/**
 * Builds an audit_logs insert query to be executed atomically alongside the
 * primary mutation inside Cloudflare D1 `db.batch([...])`.
 */
export function buildAuditInsert(
  db: DrizzleD1Database<typeof schema>,
  c: Context,
  input: AuditInput,
) {
  const ipAddress =
    c.req.header('cf-connecting-ip') ?? c.req.header('x-forwarded-for') ?? null
  const userAgent = c.req.header('user-agent')?.slice(0, 250) ?? null

  return db.insert(schema.auditLogs).values({
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
}
