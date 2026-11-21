import { z } from 'zod'

export const dateKeySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD')
export const weekKeySchema = z.string().regex(/^\d{4}-W\d{1,2}$/, 'Expected YYYY-WNN')

export const categoryIdSchema = z.enum(['work', 'learning', 'health', 'travel', 'personal'])
export const habitColorSchema = z.enum(['green', 'purple', 'blue', 'teal', 'amber', 'pink'])
export const planStatusSchema = z.enum(['planned', 'done', 'missed'])
export const boardViewSchema = z.enum(['weeks', 'days'])
export const boardDensitySchema = z.enum(['comfortable', 'compact'])
export const themeSchema = z.enum(['dark', 'light'])

export const createPlanSchema = z.object({
  title: z.string().trim().min(1).max(160),
  startDate: dateKeySchema,
  endDate: dateKeySchema,
  category: categoryIdSchema,
  status: planStatusSchema.default('planned'),
  notes: z.string().max(2000).optional(),
})

export const updatePlanSchema = createPlanSchema.partial()

export const createHabitSchema = z.object({
  name: z.string().trim().min(1).max(80),
  color: habitColorSchema,
  weeklyTarget: z.number().int().min(1).max(7),
  archived: z.boolean().optional(),
  isLabs: z.boolean().optional(),
  dailyMinutesTarget: z.number().int().min(5).max(480).optional(),
})

export const updateHabitSchema = createHabitSchema.partial()

export const toggleHabitCheckinSchema = z.object({
  dateKey: dateKeySchema,
  todayKey: dateKeySchema.optional(),
})

export const createLabEntrySchema = z.object({
  date: dateKeySchema,
  topic: z.string().trim().min(1).max(120),
  minutes: z.number().int().min(1).max(1440),
})

export const createGoalSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  quarter: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  title: z.string().trim().min(1).max(160),
})

export const updateGoalSchema = z.object({
  title: z.string().trim().min(1).max(160).optional(),
  done: z.boolean().optional(),
})

export const upsertWeekMetaSchema = z.object({
  focus: z.string().max(160).default(''),
  notes: z.string().max(4000).default(''),
})

export const updatePreferencesSchema = z.object({
  ownerName: z.string().trim().min(1).max(80).optional(),
  density: boardDensitySchema.optional(),
  view: boardViewSchema.optional(),
  theme: themeSchema.optional(),
  hiddenCategories: z.array(categoryIdSchema).optional(),
  tourSeen: z.boolean().optional(),
})
