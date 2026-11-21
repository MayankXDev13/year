import {
  importBoardSchema,
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
import { logAudit } from '../lib/audit'
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
    archived: r.archived || undefined,
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

boardRoutes.post('/board/import', async (c) => {
  const user = c.get('user')
  const body = importBoardSchema.parse(await c.req.json())
  const db = drizzle(c.env.DB, { schema })
  const maxAllowedDate =
    body.todayKey ?? new Date(Date.now() + 14 * 3_600_000).toISOString().slice(0, 10)

  const [existingHabits, existingPlans, existingGoals, existingWeekMeta] = await Promise.all([
    db.select().from(schema.habits).where(eq(schema.habits.userId, user.id)),
    db.select().from(schema.plans).where(eq(schema.plans.userId, user.id)),
    db.select().from(schema.quarterGoals).where(eq(schema.quarterGoals.userId, user.id)),
    db.select().from(schema.weekMeta).where(eq(schema.weekMeta.userId, user.id)),
  ])

  // 1. Merge habits (dedupe by lowercase name) and build localId -> dbId map
  const habitByName = new Map(existingHabits.map((h) => [h.name.trim().toLowerCase(), h.id]))
  const localToDbHabitId = new Map<string, string>()

  for (const h of body.habits) {
    if (h.isLabs) continue
    const key = h.name.trim().toLowerCase()
    const existingId = habitByName.get(key)
    if (existingId) {
      localToDbHabitId.set(h.id, existingId)
    } else {
      const newId = crypto.randomUUID()
      await db.insert(schema.habits).values({
        id: newId,
        userId: user.id,
        name: h.name,
        color: h.color,
        weeklyTarget: h.weeklyTarget,
        archived: h.archived ?? false,
        isLabs: false,
        dailyMinutesTarget: null,
        createdAt: new Date(),
      })
      habitByName.set(key, newId)
      localToDbHabitId.set(h.id, newId)
    }
  }

  // 2. Merge habit check-ins (past & today only, idempotent)
  for (const [localHabitId, dateMap] of Object.entries(body.habitCheckins)) {
    const dbHabitId = localToDbHabitId.get(localHabitId)
    if (!dbHabitId) continue
    const rows = Object.entries(dateMap)
      .filter(([dateKey, done]) => done && dateKey <= maxAllowedDate)
      .map(([dateKey]) => ({
        id: crypto.randomUUID(),
        habitId: dbHabitId,
        userId: user.id,
        dateKey,
      }))

    for (let i = 0; i < rows.length; i += 25) {
      const chunk = rows.slice(i, i + 25)
      if (chunk.length > 0) {
        await db.insert(schema.habitCheckins).values(chunk).onConflictDoNothing()
      }
    }
  }

  // 3. Merge plans (dedupe by title + startDate + endDate)
  const planSig = new Set(
    existingPlans.map((p) => `${p.title.trim().toLowerCase()}|${p.startDate}|${p.endDate}`),
  )
  for (const p of body.plans) {
    const sig = `${p.title.trim().toLowerCase()}|${p.startDate}|${p.endDate}`
    if (planSig.has(sig)) continue
    await db.insert(schema.plans).values({
      id: crypto.randomUUID(),
      userId: user.id,
      title: p.title,
      startDate: p.startDate,
      endDate: p.endDate,
      category: p.category,
      status: p.status,
      notes: p.notes ?? null,
      createdAt: new Date(),
    })
    planSig.add(sig)
  }

  // 4. Merge quarter goals (dedupe & enforce max 5 per quarter)
  const goalCountByQuarter = new Map<string, number>()
  const goalSig = new Set<string>()
  for (const g of existingGoals) {
    const qk = `${g.year}-Q${g.quarter}`
    goalCountByQuarter.set(qk, (goalCountByQuarter.get(qk) ?? 0) + 1)
    goalSig.add(`${qk}|${g.title.trim().toLowerCase()}`)
  }
  for (const g of body.quarterGoals) {
    const qk = `${g.year}-Q${g.quarter}`
    const sig = `${qk}|${g.title.trim().toLowerCase()}`
    if (goalSig.has(sig)) continue
    const count = goalCountByQuarter.get(qk) ?? 0
    if (count >= 5) continue
    await db.insert(schema.quarterGoals).values({
      id: crypto.randomUUID(),
      userId: user.id,
      year: g.year,
      quarter: g.quarter,
      title: g.title,
      done: g.done,
      createdAt: new Date(),
    })
    goalCountByQuarter.set(qk, count + 1)
    goalSig.add(sig)
  }

  // 5. Merge weekMeta (only fill empty cloud fields)
  const weekMetaByKey = new Map(existingWeekMeta.map((w) => [w.weekKey, w]))
  for (const [weekKey, meta] of Object.entries(body.weekMeta)) {
    if (!meta.focus.trim() && !meta.notes.trim()) continue
    const existing = weekMetaByKey.get(weekKey)
    if (!existing) {
      await db.insert(schema.weekMeta).values({
        userId: user.id,
        weekKey,
        focus: meta.focus,
        notes: meta.notes,
      })
    } else if (!existing.focus.trim() || !existing.notes.trim()) {
      await db
        .insert(schema.weekMeta)
        .values({
          userId: user.id,
          weekKey,
          focus: existing.focus.trim() ? existing.focus : meta.focus,
          notes: existing.notes.trim() ? existing.notes : meta.notes,
        })
        .onConflictDoUpdate({
          target: [schema.weekMeta.userId, schema.weekMeta.weekKey],
          set: {
            focus: existing.focus.trim() ? existing.focus : meta.focus,
            notes: existing.notes.trim() ? existing.notes : meta.notes,
          },
        })
    }
  }

  await logAudit(db, c, {
    userId: user.id,
    action: 'board.import',
    entityType: 'board',
    summary: `Imported local board (${body.habits.length} habits, ${body.plans.length} plans, ${body.quarterGoals.length} goals)`,
    metadata: {
      habits: body.habits.length,
      plans: body.plans.length,
      goals: body.quarterGoals.length,
    },
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

  await logAudit(db, c, {
    userId: user.id,
    action: 'board.reset',
    entityType: 'board',
    summary: 'Cleared board data',
  })

  return c.json({ ok: true })
})
