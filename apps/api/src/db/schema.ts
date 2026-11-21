import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

/* ============================================================================
 * Better Auth Core Tables (SQLite / Cloudflare D1)
 * ========================================================================== */

export const user = sqliteTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
  image: text('image'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
})

export const session = sqliteTable(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
    token: text('token').notNull().unique(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
  },
  (table) => [index('session_user_id_idx').on(table.userId)],
)

export const account = sqliteTable(
  'account',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: integer('access_token_expires_at', { mode: 'timestamp_ms' }),
    refreshTokenExpiresAt: integer('refresh_token_expires_at', { mode: 'timestamp_ms' }),
    scope: text('scope'),
    password: text('password'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [index('account_user_id_idx').on(table.userId)],
)

export const verification = sqliteTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }),
})

/* ============================================================================
 * Year Board Application Tables
 * ========================================================================== */

export const plans = sqliteTable(
  'plans',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    startDate: text('start_date').notNull(),
    endDate: text('end_date').notNull(),
    category: text('category').notNull(),
    status: text('status').notNull().default('planned'),
    notes: text('notes'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [index('plans_user_id_idx').on(table.userId)],
)

export const habits = sqliteTable(
  'habits',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    color: text('color').notNull(),
    weeklyTarget: integer('weekly_target').notNull(),
    archived: integer('archived', { mode: 'boolean' }).notNull().default(false),
    isLabs: integer('is_labs', { mode: 'boolean' }).notNull().default(false),
    dailyMinutesTarget: integer('daily_minutes_target'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [index('habits_user_id_idx').on(table.userId)],
)

export const habitCheckins = sqliteTable(
  'habit_checkins',
  {
    id: text('id').primaryKey(),
    habitId: text('habit_id')
      .notNull()
      .references(() => habits.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    dateKey: text('date_key').notNull(),
  },
  (table) => [
    uniqueIndex('habit_checkins_habit_date_uq').on(table.habitId, table.dateKey),
    index('habit_checkins_user_id_idx').on(table.userId),
  ],
)

export const labEntries = sqliteTable(
  'lab_entries',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    dateKey: text('date_key').notNull(),
    topic: text('topic').notNull(),
    minutes: integer('minutes').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [index('lab_entries_user_id_idx').on(table.userId)],
)

export const quarterGoals = sqliteTable(
  'quarter_goals',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    year: integer('year').notNull(),
    quarter: integer('quarter').notNull(),
    title: text('title').notNull(),
    done: integer('done', { mode: 'boolean' }).notNull().default(false),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [index('quarter_goals_user_year_idx').on(table.userId, table.year)],
)

export const weekMeta = sqliteTable(
  'week_meta',
  {
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    weekKey: text('week_key').notNull(),
    focus: text('focus').notNull().default(''),
    notes: text('notes').notNull().default(''),
  },
  (table) => [primaryKey({ columns: [table.userId, table.weekKey] })],
)

export const userPreferences = sqliteTable('user_preferences', {
  userId: text('user_id')
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  ownerName: text('owner_name').notNull().default('My Year'),
  density: text('density').notNull().default('comfortable'),
  view: text('view').notNull().default('weeks'),
  theme: text('theme').notNull().default('dark'),
  hiddenCategories: text('hidden_categories').notNull().default('[]'),
  tourSeen: integer('tour_seen', { mode: 'boolean' }).notNull().default(false),
})

export const auditLogs = sqliteTable(
  'audit_logs',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    action: text('action').notNull(),
    entityType: text('entity_type').notNull(),
    entityId: text('entity_id'),
    summary: text('summary').notNull(),
    metadata: text('metadata'),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [index('audit_logs_user_created_idx').on(table.userId, table.createdAt)],
)
