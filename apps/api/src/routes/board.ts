import {
  updatePreferencesSchema,
  type CategoryId,
  type Habit,
  type HabitColor,
  type LabEntry,
  type Plan,
  type PlanStatus,
  type QuarterGoal,
  type YearBoardData,
} from '@year-board/shared'
import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/d1'
import { Hono } from 'hono'
import * as schema from '../db/schema'
import type { AppVariables, Env } from '../env'
import { requireAuth } from '../middleware/auth'

export const boardRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>()

boardRoutes.use('*', requireAuth)

boardRoutes.get('/board', async (c) => {
  const user = c.get('user')
  const db = drizzle(c.env.DB, { schema })

  // Ensure default preferences exist for first-time OAuth users
  let [prefs] = await db
    .select()
    .from(schema.userPreferences)
    .where(eq(schema.userPreferences.userId, user.id))

  if (!prefs) {
    const firstName = user.name?.split(' ')[0] || 'My Year'
    const newPrefs = {
      userId: user.id,
      ownerName: firstName,
      density: 'comfortable',
      view: 'weeks',
      theme: 'dark',
      hiddenCategories: '[]',
      tourSeen: false,
    }
    await db.insert(schema.userPreferences).values(newPrefs)
    prefs = newPrefs

    // Seed default Labs habit so new users have an immediate focus tracker
    await db.insert(schema.habits).values({
      id: crypto.randomUUID(),
      userId: user.id,
      name: 'Labs',
      color: 'teal',
      weeklyTarget: 7,
      isLabs: true,
      dailyMinutesTarget: 20,
      createdAt: new Date(),
    })
  }

  const [planRows, habitRows, checkinRows, labRows, goalRows, weekMetaRows] = await Promise.all([
    db.select().from(schema.plans).where(eq(schema.plans.userId, user.id)),
    db.select().from(schema.habits).where(eq(schema.habits.userId, user.id)),
    db.select().from(schema.habitCheckins).where(eq(schema.habitCheckins.userId, user.id)),
    db.select().from(schema.labEntries).where(eq(schema.labEntries.userId, user.id)),
    db.select().from(schema.quarterGoals).where(eq(schema.quarterGoals.userId, user.id)),
    db.select().from(schema.weekMeta).where(eq(schema.weekMeta.userId, user.id)),
  ])

  const plans: Plan[] = planRows.map((r) => ({
    id: r.id,
    title: r.title,
    startDate: r.startDate,
    endDate: r.endDate,
    category: r.category as CategoryId,
    status: r.status as PlanStatus,
    notes: r.notes ?? undefined,
  }))

  const habits: Habit[] = habitRows.map((r) => ({
    id: r.id,
    name: r.name,
    color: r.color as HabitColor,
    weeklyTarget: r.weeklyTarget,
    isLabs: r.isLabs || undefined,
    dailyMinutesTarget: r.dailyMinutesTarget ?? undefined,
  }))

  const habitCheckins: Record<string, Record<string, boolean>> = {}
  for (const row of checkinRows) {
    if (!habitCheckins[row.habitId]) habitCheckins[row.habitId] = {}
    habitCheckins[row.habitId][row.dateKey] = true
  }

  const labEntries: LabEntry[] = labRows.map((r) => ({
    id: r.id,
    date: r.dateKey,
    topic: r.topic,
    minutes: r.minutes,
  }))

  const quarterGoals: QuarterGoal[] = goalRows.map((r) => ({
    id: r.id,
    year: r.year,
    quarter: r.quarter as 1 | 2 | 3 | 4,
    title: r.title,
    done: r.done,
  }))

  const weekMeta: YearBoardData['weekMeta'] = {}
  for (const r of weekMetaRows) {
    weekMeta[r.weekKey] = { focus: r.focus, notes: r.notes }
  }

  let hiddenCategories: CategoryId[] = []
  try {
    hiddenCategories = JSON.parse(prefs.hiddenCategories) as CategoryId[]
  } catch {
    hiddenCategories = []
  }

  const payload: YearBoardData = {
    ownerName: prefs.ownerName,
    plans,
    habits,
    habitCheckins,
    labEntries,
    quarterGoals,
    weekMeta,
    hiddenCategories,
    density: prefs.density as YearBoardData['density'],
    view: prefs.view as YearBoardData['view'],
    theme: prefs.theme as YearBoardData['theme'],
    tourSeen: prefs.tourSeen,
  }

  return c.json(payload)
})

boardRoutes.patch('/preferences', async (c) => {
  const user = c.get('user')
  const body = updatePreferencesSchema.parse(await c.req.json())
  const db = drizzle(c.env.DB, { schema })

  const patch: Partial<typeof schema.userPreferences.$inferInsert> = {}
  if (body.ownerName !== undefined) patch.ownerName = body.ownerName
  if (body.density !== undefined) patch.density = body.density
  if (body.view !== undefined) patch.view = body.view
  if (body.theme !== undefined) patch.theme = body.theme
  if (body.hiddenCategories !== undefined) {
    patch.hiddenCategories = JSON.stringify(body.hiddenCategories)
  }
  if (body.tourSeen !== undefined) patch.tourSeen = body.tourSeen

  await db
    .insert(schema.userPreferences)
    .values({
      userId: user.id,
      ownerName: body.ownerName ?? user.name ?? 'My Year',
      density: body.density ?? 'comfortable',
      view: body.view ?? 'weeks',
      theme: body.theme ?? 'dark',
      hiddenCategories: JSON.stringify(body.hiddenCategories ?? []),
      tourSeen: body.tourSeen ?? false,
    })
    .onConflictDoUpdate({
      target: schema.userPreferences.userId,
      set: patch,
    })

  return c.json({ ok: true })
})

boardRoutes.post('/board/reset', async (c) => {
  const user = c.get('user')
  const db = drizzle(c.env.DB, { schema })

  await Promise.all([
    db.delete(schema.plans).where(eq(schema.plans.userId, user.id)),
    db.delete(schema.habitCheckins).where(eq(schema.habitCheckins.userId, user.id)),
    db.delete(schema.labEntries).where(eq(schema.labEntries.userId, user.id)),
    db.delete(schema.quarterGoals).where(eq(schema.quarterGoals.userId, user.id)),
    db.delete(schema.weekMeta).where(eq(schema.weekMeta.userId, user.id)),
  ])

  return c.json({ ok: true })
})
