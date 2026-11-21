-- Add archived flag to habits table so users can archive/unarchive habits while preserving history
ALTER TABLE `habits` ADD COLUMN `archived` integer NOT NULL DEFAULT 0;
