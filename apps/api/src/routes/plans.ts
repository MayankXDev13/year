import { createPlanSchema, updatePlanSchema } from '@year-board/shared'
import { and, eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/d1'
import { Hono } from 'hono'
import * as schema from '../db/schema'
import type { AppVariables, Env } from '../env'
import { buildAuditInsert } from '../lib/audit'
import { requireAuth } from '../middleware/auth'

export const planRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>()

planRoutes.use('*', requireAuth)

planRoutes.post('/', async (c) => {
  const user = c.get('user')
  const body = createPlanSchema.parse(await c.req.json())
  const db = drizzle(c.env.DB, { schema })

  const id = crypto.randomUUID()
  await db.batch([
    db.insert(schema.plans).values({
      id,
      userId: user.id,
      title: body.title,
      startDate: body.startDate,
      endDate: body.endDate,
      category: body.category,
      status: body.status,
      notes: body.notes ?? null,
      createdAt: new Date(),
    }),
    buildAuditInsert(db, c, {
      userId: user.id,
      action: 'plan.create',
      entityType: 'plan',
      entityId: id,
      summary: `Created plan "${body.title}" (${body.startDate} to ${body.endDate})`,
      metadata: { category: body.category, status: body.status },
    }),
  ])

  return c.json({ id, ...body }, 201)
})

planRoutes.patch('/:id', async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')
  const body = updatePlanSchema.parse(await c.req.json())
  const db = drizzle(c.env.DB, { schema })

  const [existing] = await db
    .select()
    .from(schema.plans)
    .where(and(eq(schema.plans.id, id), eq(schema.plans.userId, user.id)))

  if (!existing) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Plan not found' } }, 404)
  }

  await db.batch([
    db
      .update(schema.plans)
      .set({
        ...(body.title !== undefined ? { title: body.title } : {}),
        ...(body.startDate !== undefined ? { startDate: body.startDate } : {}),
        ...(body.endDate !== undefined ? { endDate: body.endDate } : {}),
        ...(body.category !== undefined ? { category: body.category } : {}),
        ...(body.status !== undefined ? { status: body.status } : {}),
        ...(body.notes !== undefined ? { notes: body.notes } : {}),
      })
      .where(and(eq(schema.plans.id, id), eq(schema.plans.userId, user.id))),
    buildAuditInsert(db, c, {
      userId: user.id,
      action: 'plan.update',
      entityType: 'plan',
      entityId: id,
      summary: `Updated plan "${body.title ?? existing.title}"${body.status ? ` → ${body.status}` : ''}`,
      metadata: body,
    }),
  ])

  return c.json({ ok: true, id })
})

planRoutes.delete('/:id', async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')
  const db = drizzle(c.env.DB, { schema })

  const [existing] = await db
    .select()
    .from(schema.plans)
    .where(and(eq(schema.plans.id, id), eq(schema.plans.userId, user.id)))

  if (existing) {
    await db.batch([
      db
        .delete(schema.plans)
        .where(and(eq(schema.plans.id, id), eq(schema.plans.userId, user.id))),
      buildAuditInsert(db, c, {
        userId: user.id,
        action: 'plan.delete',
        entityType: 'plan',
        entityId: id,
        summary: `Deleted plan "${existing.title}"`,
      }),
    ])
  }

  return c.json({ ok: true })
})
