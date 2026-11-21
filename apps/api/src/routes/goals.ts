import { createGoalSchema, updateGoalSchema } from '@year-board/shared'
import { and, eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/d1'
import { Hono } from 'hono'
import * as schema from '../db/schema'
import type { AppVariables, Env } from '../env'
import { buildAuditInsert } from '../lib/audit'
import { requireAuth } from '../middleware/auth'

export const goalRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>()

goalRoutes.use('*', requireAuth)

goalRoutes.post('/', async (c) => {
  const user = c.get('user')
  const body = createGoalSchema.parse(await c.req.json())
  const db = drizzle(c.env.DB, { schema })

  const existing = await db
    .select()
    .from(schema.quarterGoals)
    .where(
      and(
        eq(schema.quarterGoals.userId, user.id),
        eq(schema.quarterGoals.year, body.year),
        eq(schema.quarterGoals.quarter, body.quarter),
      ),
    )

  if (existing.length >= 5) {
    return c.json(
      { error: { code: 'GOAL_LIMIT_REACHED', message: 'You can add up to 5 goals per quarter.' } },
      400,
    )
  }

  const id = crypto.randomUUID()
  await db.batch([
    db.insert(schema.quarterGoals).values({
      id,
      userId: user.id,
      year: body.year,
      quarter: body.quarter,
      title: body.title,
      done: false,
      createdAt: new Date(),
    }),
    buildAuditInsert(db, c, {
      userId: user.id,
      action: 'goal.create',
      entityType: 'goal',
      entityId: id,
      summary: `Added Q${body.quarter} ${body.year} goal "${body.title}"`,
      metadata: { year: body.year, quarter: body.quarter },
    }),
  ])

  return c.json({ id, ...body, done: false }, 201)
})

goalRoutes.patch('/:id', async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')
  const body = updateGoalSchema.parse(await c.req.json())
  const db = drizzle(c.env.DB, { schema })

  const [existing] = await db
    .select()
    .from(schema.quarterGoals)
    .where(and(eq(schema.quarterGoals.id, id), eq(schema.quarterGoals.userId, user.id)))

  if (!existing) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Goal not found' } }, 404)
  }

  await db.batch([
    db
      .update(schema.quarterGoals)
      .set({
        ...(body.title !== undefined ? { title: body.title } : {}),
        ...(body.done !== undefined ? { done: body.done } : {}),
      })
      .where(and(eq(schema.quarterGoals.id, id), eq(schema.quarterGoals.userId, user.id))),
    buildAuditInsert(db, c, {
      userId: user.id,
      action: 'goal.update',
      entityType: 'goal',
      entityId: id,
      summary:
        body.done !== undefined
          ? `${body.done ? 'Completed' : 'Reopened'} goal "${existing.title}"`
          : `Updated goal "${body.title ?? existing.title}"`,
      metadata: body,
    }),
  ])

  return c.json({ ok: true, id })
})

goalRoutes.delete('/:id', async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')
  const db = drizzle(c.env.DB, { schema })

  const [existing] = await db
    .select()
    .from(schema.quarterGoals)
    .where(and(eq(schema.quarterGoals.id, id), eq(schema.quarterGoals.userId, user.id)))

  if (existing) {
    await db.batch([
      db
        .delete(schema.quarterGoals)
        .where(and(eq(schema.quarterGoals.id, id), eq(schema.quarterGoals.userId, user.id))),
      buildAuditInsert(db, c, {
        userId: user.id,
        action: 'goal.delete',
        entityType: 'goal',
        entityId: id,
        summary: `Deleted Q${existing.quarter} ${existing.year} goal "${existing.title}"`,
      }),
    ])
  }

  return c.json({ ok: true })
})
