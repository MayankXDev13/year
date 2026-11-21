-- Audit logs table for tracking user activity across plans, habits, goals, and board actions
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL REFERENCES `user`(`id`) ON DELETE CASCADE,
  `action` text NOT NULL,
  `entity_type` text NOT NULL,
  `entity_id` text,
  `summary` text NOT NULL,
  `metadata` text,
  `ip_address` text,
  `user_agent` text,
  `created_at` integer NOT NULL
);
CREATE INDEX IF NOT EXISTS `audit_logs_user_created_idx` ON `audit_logs` (`user_id`, `created_at`);
