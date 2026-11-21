import { createPlanSchema, updatePlanSchema } from '@year-board/shared'
import { and, eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/d1'
import { Hono } from 'hono'
import * as schema from '../db/schema'
import type { AppVariables, Env } from '../env'
import { requireAuth } from '../middleware/auth'

export const planRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>()

planRoutes.use('*', requireAuth)

planRoutes.post('/', async (c) => {
  const user = c.get('user')
  const body = createPlanSchema.parse(await c.req.json())
  const db = drizzle(c.env.DB, { schema })

  const id = crypto.randomUUID()
  await db.insert(schema.plans).values({
    id,
    userId: user.id,
    title: body.title,
    startDate: body.startDate,
    endDate: body.endDate,
    category: body.category,
    status: body.status,
    notes: body.notes ?? null,
    createdAt: new Date(),
  })

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

  await db
    .update(schema.plans)
    .set({
      ...(body.title !== undefined ? { title: body.title } : {}),
      ...(body.startDate !== undefined ? { startDate: body.startDate } : {}),
      ...(body.endDate !== undefined ? { endDate: body.endDate } : {}),
      ...(body.category !== undefined ? { category: body.category } : {}),
      ...(body.status !== undefined ? { status: body.status } : {}),
      ...(body.notes !== undefined ? { notes: body.notes } : {}),
    })
    .where(and(eq(schema.plans.id, id), eq(schema.plans.userId, user.id)))

  return c.json({ ok: true, id })
})

planRoutes.delete('/:id', async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')
  const db = drizzle(c.env.DB, { schema })

  await db
    .delete(schema.plans)
    .where(and(eq(schema.plans.id, id), eq(schema.plans.userId, user.id)))

  return c.json({ ok: true })
})
