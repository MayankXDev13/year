-- Better Auth core tables
CREATE TABLE IF NOT EXISTS `user` (
  `id` text PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `email` text NOT NULL UNIQUE,
  `email_verified` integer NOT NULL DEFAULT 0,
  `image` text,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL
);

CREATE TABLE IF NOT EXISTS `session` (
  `id` text PRIMARY KEY NOT NULL,
  `expires_at` integer NOT NULL,
  `token` text NOT NULL UNIQUE,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL,
  `ip_address` text,
  `user_agent` text,
  `user_id` text NOT NULL REFERENCES `user`(`id`) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS `session_user_id_idx` ON `session` (`user_id`);

CREATE TABLE IF NOT EXISTS `account` (
  `id` text PRIMARY KEY NOT NULL,
  `account_id` text NOT NULL,
  `provider_id` text NOT NULL,
  `user_id` text NOT NULL REFERENCES `user`(`id`) ON DELETE CASCADE,
  `access_token` text,
  `refresh_token` text,
  `id_token` text,
  `access_token_expires_at` integer,
  `refresh_token_expires_at` integer,
  `scope` text,
  `password` text,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL
);
CREATE INDEX IF NOT EXISTS `account_user_id_idx` ON `account` (`user_id`);

CREATE TABLE IF NOT EXISTS `verification` (
  `id` text PRIMARY KEY NOT NULL,
  `identifier` text NOT NULL,
  `value` text NOT NULL,
  `expires_at` integer NOT NULL,
  `created_at` integer,
  `updated_at` integer
);

-- Year Board application tables
CREATE TABLE IF NOT EXISTS `plans` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL REFERENCES `user`(`id`) ON DELETE CASCADE,
  `title` text NOT NULL,
  `start_date` text NOT NULL,
  `end_date` text NOT NULL,
  `category` text NOT NULL,
  `status` text NOT NULL DEFAULT 'planned',
  `notes` text,
  `created_at` integer NOT NULL
);
CREATE INDEX IF NOT EXISTS `plans_user_id_idx` ON `plans` (`user_id`);

CREATE TABLE IF NOT EXISTS `habits` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL REFERENCES `user`(`id`) ON DELETE CASCADE,
  `name` text NOT NULL,
  `color` text NOT NULL,
  `weekly_target` integer NOT NULL,
  `is_labs` integer NOT NULL DEFAULT 0,
  `daily_minutes_target` integer,
  `created_at` integer NOT NULL
);
CREATE INDEX IF NOT EXISTS `habits_user_id_idx` ON `habits` (`user_id`);

CREATE TABLE IF NOT EXISTS `habit_checkins` (
  `id` text PRIMARY KEY NOT NULL,
  `habit_id` text NOT NULL REFERENCES `habits`(`id`) ON DELETE CASCADE,
  `user_id` text NOT NULL REFERENCES `user`(`id`) ON DELETE CASCADE,
  `date_key` text NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS `habit_checkins_habit_date_uq` ON `habit_checkins` (`habit_id`, `date_key`);
CREATE INDEX IF NOT EXISTS `habit_checkins_user_id_idx` ON `habit_checkins` (`user_id`);

CREATE TABLE IF NOT EXISTS `lab_entries` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL REFERENCES `user`(`id`) ON DELETE CASCADE,
  `date_key` text NOT NULL,
  `topic` text NOT NULL,
  `minutes` integer NOT NULL,
  `created_at` integer NOT NULL
);
CREATE INDEX IF NOT EXISTS `lab_entries_user_id_idx` ON `lab_entries` (`user_id`);

CREATE TABLE IF NOT EXISTS `quarter_goals` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL REFERENCES `user`(`id`) ON DELETE CASCADE,
  `year` integer NOT NULL,
  `quarter` integer NOT NULL,
  `title` text NOT NULL,
  `done` integer NOT NULL DEFAULT 0,
  `created_at` integer NOT NULL
);
CREATE INDEX IF NOT EXISTS `quarter_goals_user_year_idx` ON `quarter_goals` (`user_id`, `year`);

CREATE TABLE IF NOT EXISTS `week_meta` (
  `user_id` text NOT NULL REFERENCES `user`(`id`) ON DELETE CASCADE,
  `week_key` text NOT NULL,
  `focus` text NOT NULL DEFAULT '',
  `notes` text NOT NULL DEFAULT '',
  PRIMARY KEY (`user_id`, `week_key`)
);

CREATE TABLE IF NOT EXISTS `user_preferences` (
  `user_id` text PRIMARY KEY NOT NULL REFERENCES `user`(`id`) ON DELETE CASCADE,
  `owner_name` text NOT NULL DEFAULT 'My Year',
  `density` text NOT NULL DEFAULT 'comfortable',
  `view` text NOT NULL DEFAULT 'weeks',
  `theme` text NOT NULL DEFAULT 'dark',
  `hidden_categories` text NOT NULL DEFAULT '[]',
  `tour_seen` integer NOT NULL DEFAULT 0
);
