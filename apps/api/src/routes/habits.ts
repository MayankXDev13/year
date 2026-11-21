import {
  createHabitSchema,
  createLabEntrySchema,
  toggleHabitCheckinSchema,
  updateHabitSchema,
} from '@year-board/shared'
import { and, eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/d1'
import { Hono } from 'hono'
import * as schema from '../db/schema'
import type { AppVariables, Env } from '../env'
import { requireAuth } from '../middleware/auth'

export const habitRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>()

habitRoutes.use('*', requireAuth)

habitRoutes.post('/habits', async (c) => {
  const user = c.get('user')
  const body = createHabitSchema.parse(await c.req.json())
  const db = drizzle(c.env.DB, { schema })

  const id = crypto.randomUUID()
  await db.insert(schema.habits).values({
    id,
    userId: user.id,
    name: body.name,
    color: body.color,
    weeklyTarget: body.weeklyTarget,
    isLabs: body.isLabs ?? false,
    dailyMinutesTarget: body.dailyMinutesTarget ?? null,
    createdAt: new Date(),
  })

  return c.json({ id, ...body }, 201)
})

habitRoutes.patch('/habits/:id', async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')
  const body = updateHabitSchema.parse(await c.req.json())
  const db = drizzle(c.env.DB, { schema })

  const [existing] = await db
    .select()
    .from(schema.habits)
    .where(and(eq(schema.habits.id, id), eq(schema.habits.userId, user.id)))

  if (!existing) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Habit not found' } }, 404)
  }

  await db
    .update(schema.habits)
    .set({
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.color !== undefined ? { color: body.color } : {}),
      ...(body.weeklyTarget !== undefined ? { weeklyTarget: body.weeklyTarget } : {}),
      ...(body.dailyMinutesTarget !== undefined
        ? { dailyMinutesTarget: body.dailyMinutesTarget }
        : {}),
    })
    .where(and(eq(schema.habits.id, id), eq(schema.habits.userId, user.id)))

  return c.json({ ok: true, id })
})

habitRoutes.delete('/habits/:id', async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')
  const db = drizzle(c.env.DB, { schema })

  await db
    .delete(schema.habits)
    .where(and(eq(schema.habits.id, id), eq(schema.habits.userId, user.id)))

  return c.json({ ok: true })
})

habitRoutes.post('/habits/:id/toggle', async (c) => {
  const user = c.get('user')
  const habitId = c.req.param('id')
  const { dateKey } = toggleHabitCheckinSchema.parse(await c.req.json())
  const db = drizzle(c.env.DB, { schema })

  const [habit] = await db
    .select()
    .from(schema.habits)
    .where(and(eq(schema.habits.id, habitId), eq(schema.habits.userId, user.id)))

  if (!habit) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Habit not found' } }, 404)
  }

  const [existing] = await db
    .select()
    .from(schema.habitCheckins)
    .where(
      and(
        eq(schema.habitCheckins.habitId, habitId),
        eq(schema.habitCheckins.userId, user.id),
        eq(schema.habitCheckins.dateKey, dateKey),
      ),
    )

  if (existing) {
    await db.delete(schema.habitCheckins).where(eq(schema.habitCheckins.id, existing.id))
    if (habit.isLabs) {
      await db
        .delete(schema.labEntries)
        .where(
          and(eq(schema.labEntries.userId, user.id), eq(schema.labEntries.dateKey, dateKey)),
        )
    }
    return c.json({ done: false })
  }

  await db.insert(schema.habitCheckins).values({
    id: crypto.randomUUID(),
    habitId,
    userId: user.id,
    dateKey,
  })

  if (habit.isLabs) {
    const target = habit.dailyMinutesTarget ?? 20
    const existingLabs = await db
      .select()
      .from(schema.labEntries)
      .where(and(eq(schema.labEntries.userId, user.id), eq(schema.labEntries.dateKey, dateKey)))
    const currentTotal = existingLabs.reduce((s, e) => s + e.minutes, 0)
    if (currentTotal < target) {
      await db.insert(schema.labEntries).values({
        id: crypto.randomUUID(),
        userId: user.id,
        dateKey,
        topic: 'Labs',
        minutes: target - currentTotal,
        createdAt: new Date(),
      })
    }
  }

  return c.json({ done: true })
})

habitRoutes.post('/labs/entries', async (c) => {
  const user = c.get('user')
  const body = createLabEntrySchema.parse(await c.req.json())
  const db = drizzle(c.env.DB, { schema })

  const id = crypto.randomUUID()
  await db.insert(schema.labEntries).values({
    id,
    userId: user.id,
    dateKey: body.date,
    topic: body.topic,
    minutes: body.minutes,
    createdAt: new Date(),
  })

  return c.json({ id, ...body }, 201)
})
