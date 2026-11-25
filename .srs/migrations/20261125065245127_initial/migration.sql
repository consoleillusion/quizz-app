DROP TRIGGER IF EXISTS `answer_updated`;
--> statement-breakpoint
DROP TRIGGER IF EXISTS `audit_log_updated`;
--> statement-breakpoint
DROP TRIGGER IF EXISTS `auth_limit_updated`;
--> statement-breakpoint
DROP TRIGGER IF EXISTS `key_updated`;
--> statement-breakpoint
DROP TRIGGER IF EXISTS `question_updated`;
--> statement-breakpoint
DROP TRIGGER IF EXISTS `question_share_updated`;
--> statement-breakpoint
DROP TRIGGER IF EXISTS `question_tag_updated`;
--> statement-breakpoint
DROP TRIGGER IF EXISTS `request_nonce_updated`;
--> statement-breakpoint
DROP TRIGGER IF EXISTS `schema_updated`;
--> statement-breakpoint
DROP TRIGGER IF EXISTS `tag_updated`;
--> statement-breakpoint
DROP TRIGGER IF EXISTS `user_updated`;
--> statement-breakpoint
DROP TRIGGER IF EXISTS `user_group_updated`;
--> statement-breakpoint
DROP TRIGGER IF EXISTS `user_group_membership_updated`;
--> statement-breakpoint
DROP TRIGGER IF EXISTS `user_role_updated`;
--> statement-breakpoint
DROP TRIGGER IF EXISTS `audit_log_no_update`;
--> statement-breakpoint
DROP TRIGGER IF EXISTS `audit_log_no_delete`;
--> statement-breakpoint
DROP VIEW IF EXISTS `answer_view`;
--> statement-breakpoint
DROP VIEW IF EXISTS `audit_log_view`;
--> statement-breakpoint
DROP VIEW IF EXISTS `question_view`;
--> statement-breakpoint
DROP VIEW IF EXISTS `question_share_view`;
--> statement-breakpoint
DROP VIEW IF EXISTS `question_tag_view`;
--> statement-breakpoint
DROP VIEW IF EXISTS `schema_view`;
--> statement-breakpoint
DROP VIEW IF EXISTS `tag_view`;
--> statement-breakpoint
DROP VIEW IF EXISTS `user_view`;
--> statement-breakpoint
DROP VIEW IF EXISTS `user_group_view`;
--> statement-breakpoint
DROP VIEW IF EXISTS `user_group_membership_view`;
--> statement-breakpoint
DROP VIEW IF EXISTS `user_role_view`;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `answer` (
  `id` blob PRIMARY KEY DEFAULT (uuid7()) NOT NULL,
  `updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
  `owner` blob,
  `visibility` text DEFAULT 'private' NOT NULL,
  `answer` text NOT NULL,
  `points` real NOT NULL,
  `correct` integer NOT NULL,
  `answered_at` integer NOT NULL,
  `question_id` blob NOT NULL,
  CONSTRAINT `answer_question_id_fk` FOREIGN KEY (`question_id`) REFERENCES `question`(`id`) ON DELETE CASCADE,
  CONSTRAINT `answer_owner_fk` FOREIGN KEY (`owner`) REFERENCES `user`(`id`) ON DELETE SET NULL,
  CONSTRAINT `answer_owner_question_id_answered_at_unique` UNIQUE(`owner`, `question_id`, `answered_at`),
  CONSTRAINT `answer_visibility_check` CHECK(`visibility` IN ('private'))
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `answer_question_id_index` ON `answer` (`question_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `answer_owner_index` ON `answer` (`owner`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `audit_log` (
  `id` blob PRIMARY KEY DEFAULT (uuid7()) NOT NULL,
  `updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
  `owner` blob,
  `visibility` text DEFAULT 'private' NOT NULL,
  `actor` blob,
  `action` text NOT NULL,
  `resource` text NOT NULL,
  `resource_id` text,
  `signature` text,
  `certificate_id` blob,
  `signed_message` text,
  `body` text,
  CONSTRAINT `audit_log_owner_fk` FOREIGN KEY (`owner`) REFERENCES `user`(`id`) ON DELETE SET NULL,
  CONSTRAINT `audit_log_visibility_check` CHECK(`visibility` IN ('private'))
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `audit_log_owner_index` ON `audit_log` (`owner`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `auth_limit` (
  `id` blob PRIMARY KEY DEFAULT (uuid7()) NOT NULL,
  `updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
  `owner` blob,
  `key` text NOT NULL UNIQUE,
  `count` integer DEFAULT 0,
  `value` text,
  `expires_at` integer NOT NULL,
  CONSTRAINT `auth_limit_owner_fk` FOREIGN KEY (`owner`) REFERENCES `user`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `auth_limit_owner_index` ON `auth_limit` (`owner`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `key` (
  `id` blob PRIMARY KEY DEFAULT (uuid7()) NOT NULL,
  `updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
  `owner` blob,
  `type` text DEFAULT 'jwk',
  `jwk` text,
  `client_jwk` text,
  `material` text,
  `expires_at` integer,
  `revoked_at` integer,
  `retired_at` integer,
  `consumed_at` integer,
  `user_id` blob,
  CONSTRAINT `key_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE RESTRICT,
  CONSTRAINT `key_owner_fk` FOREIGN KEY (`owner`) REFERENCES `user`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `key_user_id_index` ON `key` (`user_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `key_owner_index` ON `key` (`owner`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `question` (
  `id` blob PRIMARY KEY DEFAULT (uuid7()) NOT NULL,
  `updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
  `owner` blob,
  `visibility` text DEFAULT 'private' NOT NULL,
  `type` text NOT NULL,
  `text` text NOT NULL,
  `exhibit` text,
  `explanation` text,
  `author` text,
  `bloom` integer,
  `difficulty` integer,
  `links` text DEFAULT '[]',
  `body` text NOT NULL,
  CONSTRAINT `question_owner_fk` FOREIGN KEY (`owner`) REFERENCES `user`(`id`) ON DELETE SET NULL,
  CONSTRAINT `question_visibility_check` CHECK(`visibility` IN ('private', 'shared', 'authenticated', 'public')),
  CONSTRAINT `question_check_0` CHECK(json_extract(`body`, '$.type') = `type`)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `question_owner_index` ON `question` (`owner`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `question_share` (
  `id` blob PRIMARY KEY DEFAULT (uuid7()) NOT NULL,
  `updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
  `owner` blob,
  `visibility` text DEFAULT 'private' NOT NULL,
  `can_read` integer DEFAULT 1,
  `can_write` integer DEFAULT 0,
  `question_id` blob NOT NULL,
  `user_id` blob,
  `user_group_id` blob,
  CONSTRAINT `question_share_question_id_fk` FOREIGN KEY (`question_id`) REFERENCES `question`(`id`) ON DELETE CASCADE,
  CONSTRAINT `question_share_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE,
  CONSTRAINT `question_share_user_group_id_fk` FOREIGN KEY (`user_group_id`) REFERENCES `user_group`(`id`) ON DELETE CASCADE,
  CONSTRAINT `question_share_owner_fk` FOREIGN KEY (`owner`) REFERENCES `user`(`id`) ON DELETE SET NULL,
  CONSTRAINT `question_share_question_id_user_id_unique` UNIQUE(`question_id`, `user_id`),
  CONSTRAINT `question_share_question_id_user_group_id_unique` UNIQUE(`question_id`, `user_group_id`),
  CONSTRAINT `question_share_visibility_check` CHECK(`visibility` IN ('private')),
  CONSTRAINT `question_share_check_0` CHECK((`user_id` IS NULL) <> (`user_group_id` IS NULL)),
  CONSTRAINT `question_share_check_1` CHECK(`can_read` OR `can_write`)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `question_share_question_id_index` ON `question_share` (`question_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `question_share_user_id_index` ON `question_share` (`user_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `question_share_user_group_id_index` ON `question_share` (`user_group_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `question_share_owner_index` ON `question_share` (`owner`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `question_tag` (
  `id` blob PRIMARY KEY DEFAULT (uuid7()) NOT NULL,
  `updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
  `owner` blob,
  `visibility` text DEFAULT 'private' NOT NULL,
  `question_id` blob NOT NULL,
  `tag_id` blob NOT NULL,
  CONSTRAINT `question_tag_question_id_fk` FOREIGN KEY (`question_id`) REFERENCES `question`(`id`),
  CONSTRAINT `question_tag_tag_id_fk` FOREIGN KEY (`tag_id`) REFERENCES `tag`(`id`),
  CONSTRAINT `question_tag_owner_fk` FOREIGN KEY (`owner`) REFERENCES `user`(`id`) ON DELETE SET NULL,
  CONSTRAINT `question_tag_question_id_tag_id_unique` UNIQUE(`question_id`, `tag_id`),
  CONSTRAINT `question_tag_visibility_check` CHECK(`visibility` IN ('private', 'authenticated', 'public'))
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `question_tag_question_id_index` ON `question_tag` (`question_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `question_tag_tag_id_index` ON `question_tag` (`tag_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `question_tag_owner_index` ON `question_tag` (`owner`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `request_nonce` (
  `id` blob PRIMARY KEY DEFAULT (uuid7()) NOT NULL,
  `updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
  `owner` blob,
  `session_id` blob NOT NULL,
  `nonce` text NOT NULL,
  `expires_at` integer NOT NULL,
  CONSTRAINT `request_nonce_owner_fk` FOREIGN KEY (`owner`) REFERENCES `user`(`id`) ON DELETE SET NULL,
  CONSTRAINT `request_nonce_session_id_nonce_unique` UNIQUE(`session_id`, `nonce`)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `request_nonce_owner_index` ON `request_nonce` (`owner`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `schema` (
  `id` blob PRIMARY KEY DEFAULT (uuid7()) NOT NULL,
  `updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
  `owner` blob,
  `visibility` text DEFAULT 'private' NOT NULL,
  `table_name` text UNIQUE,
  `jsonschema` text,
  CONSTRAINT `schema_owner_fk` FOREIGN KEY (`owner`) REFERENCES `user`(`id`) ON DELETE SET NULL,
  CONSTRAINT `schema_visibility_check` CHECK(`visibility` IN ('private', 'authenticated', 'public'))
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `schema_owner_index` ON `schema` (`owner`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `tag` (
  `id` blob PRIMARY KEY DEFAULT (uuid7()) NOT NULL,
  `updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
  `owner` blob,
  `visibility` text DEFAULT 'public' NOT NULL,
  `type` text NOT NULL,
  `name` text NOT NULL,
  `description` text,
  CONSTRAINT `tag_owner_fk` FOREIGN KEY (`owner`) REFERENCES `user`(`id`) ON DELETE SET NULL,
  CONSTRAINT `tag_type_name_unique` UNIQUE(`type`, `name`),
  CONSTRAINT `tag_visibility_check` CHECK(`visibility` IN ('private', 'public'))
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `tag_owner_index` ON `tag` (`owner`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `user` (
  `id` blob PRIMARY KEY DEFAULT (uuid7()) NOT NULL,
  `updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
  `owner` blob,
  `visibility` text DEFAULT 'private' NOT NULL,
  `username` text UNIQUE,
  `email` text,
  `display_name` text,
  `disabled_at` integer,
  CONSTRAINT `user_owner_fk` FOREIGN KEY (`owner`) REFERENCES `user`(`id`) ON DELETE SET NULL,
  CONSTRAINT `user_visibility_check` CHECK(`visibility` IN ('private', 'authenticated', 'public'))
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `user_owner_index` ON `user` (`owner`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `user_group` (
  `id` blob PRIMARY KEY DEFAULT (uuid7()) NOT NULL,
  `updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
  `owner` blob,
  `visibility` text DEFAULT 'private' NOT NULL,
  `name` text UNIQUE,
  `description` text,
  CONSTRAINT `user_group_owner_fk` FOREIGN KEY (`owner`) REFERENCES `user`(`id`) ON DELETE SET NULL,
  CONSTRAINT `user_group_visibility_check` CHECK(`visibility` IN ('private', 'authenticated', 'public'))
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `user_group_owner_index` ON `user_group` (`owner`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `user_group_membership` (
  `id` blob PRIMARY KEY DEFAULT (uuid7()) NOT NULL,
  `updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
  `owner` blob,
  `visibility` text DEFAULT 'private' NOT NULL,
  `user_id` blob NOT NULL,
  `user_group_id` blob NOT NULL,
  CONSTRAINT `user_group_membership_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`),
  CONSTRAINT `user_group_membership_user_group_id_fk` FOREIGN KEY (`user_group_id`) REFERENCES `user_group`(`id`),
  CONSTRAINT `user_group_membership_owner_fk` FOREIGN KEY (`owner`) REFERENCES `user`(`id`) ON DELETE SET NULL,
  CONSTRAINT `user_group_membership_user_id_user_group_id_unique` UNIQUE(`user_id`, `user_group_id`),
  CONSTRAINT `user_group_membership_visibility_check` CHECK(`visibility` IN ('private', 'authenticated', 'public'))
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `user_group_membership_user_id_index` ON `user_group_membership` (`user_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `user_group_membership_user_group_id_index` ON `user_group_membership` (`user_group_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `user_group_membership_owner_index` ON `user_group_membership` (`owner`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `user_role` (
  `id` blob PRIMARY KEY DEFAULT (uuid7()) NOT NULL,
  `updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
  `owner` blob,
  `visibility` text DEFAULT 'private' NOT NULL,
  `role` text NOT NULL,
  `user_id` blob NOT NULL,
  CONSTRAINT `user_role_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE,
  CONSTRAINT `user_role_owner_fk` FOREIGN KEY (`owner`) REFERENCES `user`(`id`) ON DELETE SET NULL,
  CONSTRAINT `user_role_user_id_role_unique` UNIQUE(`user_id`, `role`),
  CONSTRAINT `user_role_visibility_check` CHECK(`visibility` IN ('private'))
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `user_role_user_id_index` ON `user_role` (`user_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `user_role_owner_index` ON `user_role` (`owner`);
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS `answer_updated`
AFTER UPDATE ON `answer`
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
    UPDATE `answer`
    SET updated_at = CAST(
      (julianday('now') - 2440587.5) * 86400000 AS INTEGER
    )
    WHERE id = OLD.id;
END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS `audit_log_updated`
AFTER UPDATE ON `audit_log`
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
    UPDATE `audit_log`
    SET updated_at = CAST(
      (julianday('now') - 2440587.5) * 86400000 AS INTEGER
    )
    WHERE id = OLD.id;
END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS `auth_limit_updated`
AFTER UPDATE ON `auth_limit`
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
    UPDATE `auth_limit`
    SET updated_at = CAST(
      (julianday('now') - 2440587.5) * 86400000 AS INTEGER
    )
    WHERE id = OLD.id;
END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS `key_updated`
AFTER UPDATE ON `key`
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
    UPDATE `key`
    SET updated_at = CAST(
      (julianday('now') - 2440587.5) * 86400000 AS INTEGER
    )
    WHERE id = OLD.id;
END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS `question_updated`
AFTER UPDATE ON `question`
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
    UPDATE `question`
    SET updated_at = CAST(
      (julianday('now') - 2440587.5) * 86400000 AS INTEGER
    )
    WHERE id = OLD.id;
END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS `question_share_updated`
AFTER UPDATE ON `question_share`
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
    UPDATE `question_share`
    SET updated_at = CAST(
      (julianday('now') - 2440587.5) * 86400000 AS INTEGER
    )
    WHERE id = OLD.id;
END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS `question_tag_updated`
AFTER UPDATE ON `question_tag`
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
    UPDATE `question_tag`
    SET updated_at = CAST(
      (julianday('now') - 2440587.5) * 86400000 AS INTEGER
    )
    WHERE id = OLD.id;
END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS `request_nonce_updated`
AFTER UPDATE ON `request_nonce`
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
    UPDATE `request_nonce`
    SET updated_at = CAST(
      (julianday('now') - 2440587.5) * 86400000 AS INTEGER
    )
    WHERE id = OLD.id;
END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS `schema_updated`
AFTER UPDATE ON `schema`
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
    UPDATE `schema`
    SET updated_at = CAST(
      (julianday('now') - 2440587.5) * 86400000 AS INTEGER
    )
    WHERE id = OLD.id;
END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS `tag_updated`
AFTER UPDATE ON `tag`
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
    UPDATE `tag`
    SET updated_at = CAST(
      (julianday('now') - 2440587.5) * 86400000 AS INTEGER
    )
    WHERE id = OLD.id;
END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS `user_updated`
AFTER UPDATE ON `user`
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
    UPDATE `user`
    SET updated_at = CAST(
      (julianday('now') - 2440587.5) * 86400000 AS INTEGER
    )
    WHERE id = OLD.id;
END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS `user_group_updated`
AFTER UPDATE ON `user_group`
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
    UPDATE `user_group`
    SET updated_at = CAST(
      (julianday('now') - 2440587.5) * 86400000 AS INTEGER
    )
    WHERE id = OLD.id;
END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS `user_group_membership_updated`
AFTER UPDATE ON `user_group_membership`
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
    UPDATE `user_group_membership`
    SET updated_at = CAST(
      (julianday('now') - 2440587.5) * 86400000 AS INTEGER
    )
    WHERE id = OLD.id;
END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS `user_role_updated`
AFTER UPDATE ON `user_role`
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
    UPDATE `user_role`
    SET updated_at = CAST(
      (julianday('now') - 2440587.5) * 86400000 AS INTEGER
    )
    WHERE id = OLD.id;
END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS `audit_log_no_update`
BEFORE UPDATE ON `audit_log`
FOR EACH ROW
BEGIN SELECT RAISE(ABORT, 'audit_log is append-only'); END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS `audit_log_no_delete`
BEFORE DELETE ON `audit_log`
FOR EACH ROW
BEGIN SELECT RAISE(ABORT, 'audit_log is append-only'); END;
--> statement-breakpoint
CREATE VIEW `answer_view` AS
SELECT
  `t`.`id` AS `_key`,
  (CASE WHEN `t`.`id` IS NULL THEN NULL ELSE (lower(hex(substr(`t`.`id`, 1, 4))) || '-' || lower(hex(substr(`t`.`id`, 5, 2))) || '-' || lower(hex(substr(`t`.`id`, 7, 2))) || '-' || lower(hex(substr(`t`.`id`, 9, 2))) || '-' || lower(hex(substr(`t`.`id`, 11, 6)))) END) AS `id`,
  `t`.`updated_at` AS `updated_at`,
  (CASE WHEN `t`.`owner` IS NULL THEN NULL ELSE (lower(hex(substr(`t`.`owner`, 1, 4))) || '-' || lower(hex(substr(`t`.`owner`, 5, 2))) || '-' || lower(hex(substr(`t`.`owner`, 7, 2))) || '-' || lower(hex(substr(`t`.`owner`, 9, 2))) || '-' || lower(hex(substr(`t`.`owner`, 11, 6)))) END) AS `owner`,
  `t`.`visibility` AS `visibility`,
  `t`.`answer` AS `answer`,
  `t`.`points` AS `points`,
  `t`.`correct` AS `correct`,
  `t`.`answered_at` AS `answered_at`,
  (CASE WHEN `t`.`question_id` IS NULL THEN NULL ELSE (lower(hex(substr(`t`.`question_id`, 1, 4))) || '-' || lower(hex(substr(`t`.`question_id`, 5, 2))) || '-' || lower(hex(substr(`t`.`question_id`, 7, 2))) || '-' || lower(hex(substr(`t`.`question_id`, 9, 2))) || '-' || lower(hex(substr(`t`.`question_id`, 11, 6)))) END) AS `question_id`,
  (SELECT json_object('id', (CASE WHEN `r`.`id` IS NULL THEN NULL ELSE (lower(hex(substr(`r`.`id`, 1, 4))) || '-' || lower(hex(substr(`r`.`id`, 5, 2))) || '-' || lower(hex(substr(`r`.`id`, 7, 2))) || '-' || lower(hex(substr(`r`.`id`, 9, 2))) || '-' || lower(hex(substr(`r`.`id`, 11, 6)))) END), 'updated_at', `r`.`updated_at`, 'owner', (CASE WHEN `r`.`owner` IS NULL THEN NULL ELSE (lower(hex(substr(`r`.`owner`, 1, 4))) || '-' || lower(hex(substr(`r`.`owner`, 5, 2))) || '-' || lower(hex(substr(`r`.`owner`, 7, 2))) || '-' || lower(hex(substr(`r`.`owner`, 9, 2))) || '-' || lower(hex(substr(`r`.`owner`, 11, 6)))) END), 'visibility', `r`.`visibility`, 'type', `r`.`type`, 'text', `r`.`text`, 'exhibit', `r`.`exhibit`, 'explanation', `r`.`explanation`, 'author', `r`.`author`, 'bloom', `r`.`bloom`, 'difficulty', `r`.`difficulty`, 'links', json(`r`.`links`), 'body', json(`r`.`body`)) FROM `question` AS `r` WHERE `r`.`id` = `t`.`question_id` LIMIT 1) AS `question`
FROM `answer` AS `t`;
--> statement-breakpoint
CREATE VIEW `audit_log_view` AS
SELECT
  `t`.`id` AS `_key`,
  (CASE WHEN `t`.`id` IS NULL THEN NULL ELSE (lower(hex(substr(`t`.`id`, 1, 4))) || '-' || lower(hex(substr(`t`.`id`, 5, 2))) || '-' || lower(hex(substr(`t`.`id`, 7, 2))) || '-' || lower(hex(substr(`t`.`id`, 9, 2))) || '-' || lower(hex(substr(`t`.`id`, 11, 6)))) END) AS `id`,
  `t`.`updated_at` AS `updated_at`,
  (CASE WHEN `t`.`owner` IS NULL THEN NULL ELSE (lower(hex(substr(`t`.`owner`, 1, 4))) || '-' || lower(hex(substr(`t`.`owner`, 5, 2))) || '-' || lower(hex(substr(`t`.`owner`, 7, 2))) || '-' || lower(hex(substr(`t`.`owner`, 9, 2))) || '-' || lower(hex(substr(`t`.`owner`, 11, 6)))) END) AS `owner`,
  `t`.`visibility` AS `visibility`,
  (CASE WHEN `t`.`actor` IS NULL THEN NULL ELSE (lower(hex(substr(`t`.`actor`, 1, 4))) || '-' || lower(hex(substr(`t`.`actor`, 5, 2))) || '-' || lower(hex(substr(`t`.`actor`, 7, 2))) || '-' || lower(hex(substr(`t`.`actor`, 9, 2))) || '-' || lower(hex(substr(`t`.`actor`, 11, 6)))) END) AS `actor`,
  `t`.`action` AS `action`,
  `t`.`resource` AS `resource`,
  `t`.`resource_id` AS `resource_id`,
  `t`.`signature` AS `signature`,
  (CASE WHEN `t`.`certificate_id` IS NULL THEN NULL ELSE (lower(hex(substr(`t`.`certificate_id`, 1, 4))) || '-' || lower(hex(substr(`t`.`certificate_id`, 5, 2))) || '-' || lower(hex(substr(`t`.`certificate_id`, 7, 2))) || '-' || lower(hex(substr(`t`.`certificate_id`, 9, 2))) || '-' || lower(hex(substr(`t`.`certificate_id`, 11, 6)))) END) AS `certificate_id`,
  `t`.`signed_message` AS `signed_message`,
  `t`.`body` AS `body`
FROM `audit_log` AS `t`;
--> statement-breakpoint
CREATE VIEW `question_view` AS
SELECT
  `t`.`id` AS `_key`,
  (CASE WHEN `t`.`id` IS NULL THEN NULL ELSE (lower(hex(substr(`t`.`id`, 1, 4))) || '-' || lower(hex(substr(`t`.`id`, 5, 2))) || '-' || lower(hex(substr(`t`.`id`, 7, 2))) || '-' || lower(hex(substr(`t`.`id`, 9, 2))) || '-' || lower(hex(substr(`t`.`id`, 11, 6)))) END) AS `id`,
  `t`.`updated_at` AS `updated_at`,
  (CASE WHEN `t`.`owner` IS NULL THEN NULL ELSE (lower(hex(substr(`t`.`owner`, 1, 4))) || '-' || lower(hex(substr(`t`.`owner`, 5, 2))) || '-' || lower(hex(substr(`t`.`owner`, 7, 2))) || '-' || lower(hex(substr(`t`.`owner`, 9, 2))) || '-' || lower(hex(substr(`t`.`owner`, 11, 6)))) END) AS `owner`,
  `t`.`visibility` AS `visibility`,
  `t`.`type` AS `type`,
  `t`.`text` AS `text`,
  `t`.`exhibit` AS `exhibit`,
  `t`.`explanation` AS `explanation`,
  `t`.`author` AS `author`,
  `t`.`bloom` AS `bloom`,
  `t`.`difficulty` AS `difficulty`,
  `t`.`links` AS `links`,
  `t`.`body` AS `body`,
  (SELECT coalesce(json_group_array(json_object('id', (CASE WHEN `r`.`id` IS NULL THEN NULL ELSE (lower(hex(substr(`r`.`id`, 1, 4))) || '-' || lower(hex(substr(`r`.`id`, 5, 2))) || '-' || lower(hex(substr(`r`.`id`, 7, 2))) || '-' || lower(hex(substr(`r`.`id`, 9, 2))) || '-' || lower(hex(substr(`r`.`id`, 11, 6)))) END), 'updated_at', `r`.`updated_at`, 'owner', (CASE WHEN `r`.`owner` IS NULL THEN NULL ELSE (lower(hex(substr(`r`.`owner`, 1, 4))) || '-' || lower(hex(substr(`r`.`owner`, 5, 2))) || '-' || lower(hex(substr(`r`.`owner`, 7, 2))) || '-' || lower(hex(substr(`r`.`owner`, 9, 2))) || '-' || lower(hex(substr(`r`.`owner`, 11, 6)))) END), 'visibility', `r`.`visibility`, 'type', `r`.`type`, 'name', `r`.`name`, 'description', `r`.`description`)), json('[]')) FROM `tag` AS `r` JOIN `question_tag` AS `j` ON `j`.`tag_id` = `r`.`id` WHERE `j`.`question_id` = `t`.`id` ORDER BY `r`.`id`) AS `tags`
FROM `question` AS `t`;
--> statement-breakpoint
CREATE VIEW `question_share_view` AS
SELECT
  `t`.`id` AS `_key`,
  (CASE WHEN `t`.`id` IS NULL THEN NULL ELSE (lower(hex(substr(`t`.`id`, 1, 4))) || '-' || lower(hex(substr(`t`.`id`, 5, 2))) || '-' || lower(hex(substr(`t`.`id`, 7, 2))) || '-' || lower(hex(substr(`t`.`id`, 9, 2))) || '-' || lower(hex(substr(`t`.`id`, 11, 6)))) END) AS `id`,
  `t`.`updated_at` AS `updated_at`,
  (CASE WHEN `t`.`owner` IS NULL THEN NULL ELSE (lower(hex(substr(`t`.`owner`, 1, 4))) || '-' || lower(hex(substr(`t`.`owner`, 5, 2))) || '-' || lower(hex(substr(`t`.`owner`, 7, 2))) || '-' || lower(hex(substr(`t`.`owner`, 9, 2))) || '-' || lower(hex(substr(`t`.`owner`, 11, 6)))) END) AS `owner`,
  `t`.`visibility` AS `visibility`,
  `t`.`can_read` AS `can_read`,
  `t`.`can_write` AS `can_write`,
  (CASE WHEN `t`.`question_id` IS NULL THEN NULL ELSE (lower(hex(substr(`t`.`question_id`, 1, 4))) || '-' || lower(hex(substr(`t`.`question_id`, 5, 2))) || '-' || lower(hex(substr(`t`.`question_id`, 7, 2))) || '-' || lower(hex(substr(`t`.`question_id`, 9, 2))) || '-' || lower(hex(substr(`t`.`question_id`, 11, 6)))) END) AS `question_id`,
  (CASE WHEN `t`.`user_id` IS NULL THEN NULL ELSE (lower(hex(substr(`t`.`user_id`, 1, 4))) || '-' || lower(hex(substr(`t`.`user_id`, 5, 2))) || '-' || lower(hex(substr(`t`.`user_id`, 7, 2))) || '-' || lower(hex(substr(`t`.`user_id`, 9, 2))) || '-' || lower(hex(substr(`t`.`user_id`, 11, 6)))) END) AS `user_id`,
  (CASE WHEN `t`.`user_group_id` IS NULL THEN NULL ELSE (lower(hex(substr(`t`.`user_group_id`, 1, 4))) || '-' || lower(hex(substr(`t`.`user_group_id`, 5, 2))) || '-' || lower(hex(substr(`t`.`user_group_id`, 7, 2))) || '-' || lower(hex(substr(`t`.`user_group_id`, 9, 2))) || '-' || lower(hex(substr(`t`.`user_group_id`, 11, 6)))) END) AS `user_group_id`,
  (SELECT json_object('id', (CASE WHEN `r`.`id` IS NULL THEN NULL ELSE (lower(hex(substr(`r`.`id`, 1, 4))) || '-' || lower(hex(substr(`r`.`id`, 5, 2))) || '-' || lower(hex(substr(`r`.`id`, 7, 2))) || '-' || lower(hex(substr(`r`.`id`, 9, 2))) || '-' || lower(hex(substr(`r`.`id`, 11, 6)))) END), 'updated_at', `r`.`updated_at`, 'owner', (CASE WHEN `r`.`owner` IS NULL THEN NULL ELSE (lower(hex(substr(`r`.`owner`, 1, 4))) || '-' || lower(hex(substr(`r`.`owner`, 5, 2))) || '-' || lower(hex(substr(`r`.`owner`, 7, 2))) || '-' || lower(hex(substr(`r`.`owner`, 9, 2))) || '-' || lower(hex(substr(`r`.`owner`, 11, 6)))) END), 'visibility', `r`.`visibility`, 'type', `r`.`type`, 'text', `r`.`text`, 'exhibit', `r`.`exhibit`, 'explanation', `r`.`explanation`, 'author', `r`.`author`, 'bloom', `r`.`bloom`, 'difficulty', `r`.`difficulty`, 'links', json(`r`.`links`), 'body', json(`r`.`body`)) FROM `question` AS `r` WHERE `r`.`id` = `t`.`question_id` LIMIT 1) AS `question`,
  (SELECT json_object('id', (CASE WHEN `r`.`id` IS NULL THEN NULL ELSE (lower(hex(substr(`r`.`id`, 1, 4))) || '-' || lower(hex(substr(`r`.`id`, 5, 2))) || '-' || lower(hex(substr(`r`.`id`, 7, 2))) || '-' || lower(hex(substr(`r`.`id`, 9, 2))) || '-' || lower(hex(substr(`r`.`id`, 11, 6)))) END), 'updated_at', `r`.`updated_at`, 'owner', (CASE WHEN `r`.`owner` IS NULL THEN NULL ELSE (lower(hex(substr(`r`.`owner`, 1, 4))) || '-' || lower(hex(substr(`r`.`owner`, 5, 2))) || '-' || lower(hex(substr(`r`.`owner`, 7, 2))) || '-' || lower(hex(substr(`r`.`owner`, 9, 2))) || '-' || lower(hex(substr(`r`.`owner`, 11, 6)))) END), 'visibility', `r`.`visibility`, 'username', `r`.`username`, 'email', `r`.`email`, 'display_name', `r`.`display_name`) FROM `user` AS `r` WHERE `r`.`id` = `t`.`user_id` LIMIT 1) AS `user`,
  (SELECT json_object('id', (CASE WHEN `r`.`id` IS NULL THEN NULL ELSE (lower(hex(substr(`r`.`id`, 1, 4))) || '-' || lower(hex(substr(`r`.`id`, 5, 2))) || '-' || lower(hex(substr(`r`.`id`, 7, 2))) || '-' || lower(hex(substr(`r`.`id`, 9, 2))) || '-' || lower(hex(substr(`r`.`id`, 11, 6)))) END), 'updated_at', `r`.`updated_at`, 'owner', (CASE WHEN `r`.`owner` IS NULL THEN NULL ELSE (lower(hex(substr(`r`.`owner`, 1, 4))) || '-' || lower(hex(substr(`r`.`owner`, 5, 2))) || '-' || lower(hex(substr(`r`.`owner`, 7, 2))) || '-' || lower(hex(substr(`r`.`owner`, 9, 2))) || '-' || lower(hex(substr(`r`.`owner`, 11, 6)))) END), 'visibility', `r`.`visibility`, 'name', `r`.`name`, 'description', `r`.`description`) FROM `user_group` AS `r` WHERE `r`.`id` = `t`.`user_group_id` LIMIT 1) AS `user_group`
FROM `question_share` AS `t`;
--> statement-breakpoint
CREATE VIEW `question_tag_view` AS
SELECT
  `t`.`id` AS `_key`,
  (CASE WHEN `t`.`id` IS NULL THEN NULL ELSE (lower(hex(substr(`t`.`id`, 1, 4))) || '-' || lower(hex(substr(`t`.`id`, 5, 2))) || '-' || lower(hex(substr(`t`.`id`, 7, 2))) || '-' || lower(hex(substr(`t`.`id`, 9, 2))) || '-' || lower(hex(substr(`t`.`id`, 11, 6)))) END) AS `id`,
  `t`.`updated_at` AS `updated_at`,
  (CASE WHEN `t`.`owner` IS NULL THEN NULL ELSE (lower(hex(substr(`t`.`owner`, 1, 4))) || '-' || lower(hex(substr(`t`.`owner`, 5, 2))) || '-' || lower(hex(substr(`t`.`owner`, 7, 2))) || '-' || lower(hex(substr(`t`.`owner`, 9, 2))) || '-' || lower(hex(substr(`t`.`owner`, 11, 6)))) END) AS `owner`,
  `t`.`visibility` AS `visibility`,
  (CASE WHEN `t`.`question_id` IS NULL THEN NULL ELSE (lower(hex(substr(`t`.`question_id`, 1, 4))) || '-' || lower(hex(substr(`t`.`question_id`, 5, 2))) || '-' || lower(hex(substr(`t`.`question_id`, 7, 2))) || '-' || lower(hex(substr(`t`.`question_id`, 9, 2))) || '-' || lower(hex(substr(`t`.`question_id`, 11, 6)))) END) AS `question_id`,
  (CASE WHEN `t`.`tag_id` IS NULL THEN NULL ELSE (lower(hex(substr(`t`.`tag_id`, 1, 4))) || '-' || lower(hex(substr(`t`.`tag_id`, 5, 2))) || '-' || lower(hex(substr(`t`.`tag_id`, 7, 2))) || '-' || lower(hex(substr(`t`.`tag_id`, 9, 2))) || '-' || lower(hex(substr(`t`.`tag_id`, 11, 6)))) END) AS `tag_id`,
  (SELECT json_object('id', (CASE WHEN `r`.`id` IS NULL THEN NULL ELSE (lower(hex(substr(`r`.`id`, 1, 4))) || '-' || lower(hex(substr(`r`.`id`, 5, 2))) || '-' || lower(hex(substr(`r`.`id`, 7, 2))) || '-' || lower(hex(substr(`r`.`id`, 9, 2))) || '-' || lower(hex(substr(`r`.`id`, 11, 6)))) END), 'updated_at', `r`.`updated_at`, 'owner', (CASE WHEN `r`.`owner` IS NULL THEN NULL ELSE (lower(hex(substr(`r`.`owner`, 1, 4))) || '-' || lower(hex(substr(`r`.`owner`, 5, 2))) || '-' || lower(hex(substr(`r`.`owner`, 7, 2))) || '-' || lower(hex(substr(`r`.`owner`, 9, 2))) || '-' || lower(hex(substr(`r`.`owner`, 11, 6)))) END), 'visibility', `r`.`visibility`, 'type', `r`.`type`, 'text', `r`.`text`, 'exhibit', `r`.`exhibit`, 'explanation', `r`.`explanation`, 'author', `r`.`author`, 'bloom', `r`.`bloom`, 'difficulty', `r`.`difficulty`, 'links', json(`r`.`links`), 'body', json(`r`.`body`)) FROM `question` AS `r` WHERE `r`.`id` = `t`.`question_id` LIMIT 1) AS `question`,
  (SELECT json_object('id', (CASE WHEN `r`.`id` IS NULL THEN NULL ELSE (lower(hex(substr(`r`.`id`, 1, 4))) || '-' || lower(hex(substr(`r`.`id`, 5, 2))) || '-' || lower(hex(substr(`r`.`id`, 7, 2))) || '-' || lower(hex(substr(`r`.`id`, 9, 2))) || '-' || lower(hex(substr(`r`.`id`, 11, 6)))) END), 'updated_at', `r`.`updated_at`, 'owner', (CASE WHEN `r`.`owner` IS NULL THEN NULL ELSE (lower(hex(substr(`r`.`owner`, 1, 4))) || '-' || lower(hex(substr(`r`.`owner`, 5, 2))) || '-' || lower(hex(substr(`r`.`owner`, 7, 2))) || '-' || lower(hex(substr(`r`.`owner`, 9, 2))) || '-' || lower(hex(substr(`r`.`owner`, 11, 6)))) END), 'visibility', `r`.`visibility`, 'type', `r`.`type`, 'name', `r`.`name`, 'description', `r`.`description`) FROM `tag` AS `r` WHERE `r`.`id` = `t`.`tag_id` LIMIT 1) AS `tag`
FROM `question_tag` AS `t`;
--> statement-breakpoint
CREATE VIEW `schema_view` AS
SELECT
  `t`.`id` AS `_key`,
  (CASE WHEN `t`.`id` IS NULL THEN NULL ELSE (lower(hex(substr(`t`.`id`, 1, 4))) || '-' || lower(hex(substr(`t`.`id`, 5, 2))) || '-' || lower(hex(substr(`t`.`id`, 7, 2))) || '-' || lower(hex(substr(`t`.`id`, 9, 2))) || '-' || lower(hex(substr(`t`.`id`, 11, 6)))) END) AS `id`,
  `t`.`updated_at` AS `updated_at`,
  (CASE WHEN `t`.`owner` IS NULL THEN NULL ELSE (lower(hex(substr(`t`.`owner`, 1, 4))) || '-' || lower(hex(substr(`t`.`owner`, 5, 2))) || '-' || lower(hex(substr(`t`.`owner`, 7, 2))) || '-' || lower(hex(substr(`t`.`owner`, 9, 2))) || '-' || lower(hex(substr(`t`.`owner`, 11, 6)))) END) AS `owner`,
  `t`.`visibility` AS `visibility`,
  `t`.`table_name` AS `table_name`,
  `t`.`jsonschema` AS `jsonschema`
FROM `schema` AS `t`;
--> statement-breakpoint
CREATE VIEW `tag_view` AS
SELECT
  `t`.`id` AS `_key`,
  (CASE WHEN `t`.`id` IS NULL THEN NULL ELSE (lower(hex(substr(`t`.`id`, 1, 4))) || '-' || lower(hex(substr(`t`.`id`, 5, 2))) || '-' || lower(hex(substr(`t`.`id`, 7, 2))) || '-' || lower(hex(substr(`t`.`id`, 9, 2))) || '-' || lower(hex(substr(`t`.`id`, 11, 6)))) END) AS `id`,
  `t`.`updated_at` AS `updated_at`,
  (CASE WHEN `t`.`owner` IS NULL THEN NULL ELSE (lower(hex(substr(`t`.`owner`, 1, 4))) || '-' || lower(hex(substr(`t`.`owner`, 5, 2))) || '-' || lower(hex(substr(`t`.`owner`, 7, 2))) || '-' || lower(hex(substr(`t`.`owner`, 9, 2))) || '-' || lower(hex(substr(`t`.`owner`, 11, 6)))) END) AS `owner`,
  `t`.`visibility` AS `visibility`,
  `t`.`type` AS `type`,
  `t`.`name` AS `name`,
  `t`.`description` AS `description`,
  (SELECT coalesce(json_group_array(json_object('id', (CASE WHEN `r`.`id` IS NULL THEN NULL ELSE (lower(hex(substr(`r`.`id`, 1, 4))) || '-' || lower(hex(substr(`r`.`id`, 5, 2))) || '-' || lower(hex(substr(`r`.`id`, 7, 2))) || '-' || lower(hex(substr(`r`.`id`, 9, 2))) || '-' || lower(hex(substr(`r`.`id`, 11, 6)))) END), 'updated_at', `r`.`updated_at`, 'owner', (CASE WHEN `r`.`owner` IS NULL THEN NULL ELSE (lower(hex(substr(`r`.`owner`, 1, 4))) || '-' || lower(hex(substr(`r`.`owner`, 5, 2))) || '-' || lower(hex(substr(`r`.`owner`, 7, 2))) || '-' || lower(hex(substr(`r`.`owner`, 9, 2))) || '-' || lower(hex(substr(`r`.`owner`, 11, 6)))) END), 'visibility', `r`.`visibility`, 'type', `r`.`type`, 'text', `r`.`text`, 'exhibit', `r`.`exhibit`, 'explanation', `r`.`explanation`, 'author', `r`.`author`, 'bloom', `r`.`bloom`, 'difficulty', `r`.`difficulty`, 'links', json(`r`.`links`), 'body', json(`r`.`body`))), json('[]')) FROM `question` AS `r` JOIN `question_tag` AS `j` ON `j`.`question_id` = `r`.`id` WHERE `j`.`tag_id` = `t`.`id` ORDER BY `r`.`id`) AS `questions`
FROM `tag` AS `t`;
--> statement-breakpoint
CREATE VIEW `user_view` AS
SELECT
  `t`.`id` AS `_key`,
  (CASE WHEN `t`.`id` IS NULL THEN NULL ELSE (lower(hex(substr(`t`.`id`, 1, 4))) || '-' || lower(hex(substr(`t`.`id`, 5, 2))) || '-' || lower(hex(substr(`t`.`id`, 7, 2))) || '-' || lower(hex(substr(`t`.`id`, 9, 2))) || '-' || lower(hex(substr(`t`.`id`, 11, 6)))) END) AS `id`,
  `t`.`updated_at` AS `updated_at`,
  (CASE WHEN `t`.`owner` IS NULL THEN NULL ELSE (lower(hex(substr(`t`.`owner`, 1, 4))) || '-' || lower(hex(substr(`t`.`owner`, 5, 2))) || '-' || lower(hex(substr(`t`.`owner`, 7, 2))) || '-' || lower(hex(substr(`t`.`owner`, 9, 2))) || '-' || lower(hex(substr(`t`.`owner`, 11, 6)))) END) AS `owner`,
  `t`.`visibility` AS `visibility`,
  `t`.`username` AS `username`,
  `t`.`email` AS `email`,
  `t`.`display_name` AS `display_name`,
  (SELECT coalesce(json_group_array(json_object('id', (CASE WHEN `r`.`id` IS NULL THEN NULL ELSE (lower(hex(substr(`r`.`id`, 1, 4))) || '-' || lower(hex(substr(`r`.`id`, 5, 2))) || '-' || lower(hex(substr(`r`.`id`, 7, 2))) || '-' || lower(hex(substr(`r`.`id`, 9, 2))) || '-' || lower(hex(substr(`r`.`id`, 11, 6)))) END), 'updated_at', `r`.`updated_at`, 'owner', (CASE WHEN `r`.`owner` IS NULL THEN NULL ELSE (lower(hex(substr(`r`.`owner`, 1, 4))) || '-' || lower(hex(substr(`r`.`owner`, 5, 2))) || '-' || lower(hex(substr(`r`.`owner`, 7, 2))) || '-' || lower(hex(substr(`r`.`owner`, 9, 2))) || '-' || lower(hex(substr(`r`.`owner`, 11, 6)))) END), 'visibility', `r`.`visibility`, 'name', `r`.`name`, 'description', `r`.`description`)), json('[]')) FROM `user_group` AS `r` JOIN `user_group_membership` AS `j` ON `j`.`user_group_id` = `r`.`id` WHERE `j`.`user_id` = `t`.`id` ORDER BY `r`.`id`) AS `groups`
FROM `user` AS `t`;
--> statement-breakpoint
CREATE VIEW `user_group_view` AS
SELECT
  `t`.`id` AS `_key`,
  (CASE WHEN `t`.`id` IS NULL THEN NULL ELSE (lower(hex(substr(`t`.`id`, 1, 4))) || '-' || lower(hex(substr(`t`.`id`, 5, 2))) || '-' || lower(hex(substr(`t`.`id`, 7, 2))) || '-' || lower(hex(substr(`t`.`id`, 9, 2))) || '-' || lower(hex(substr(`t`.`id`, 11, 6)))) END) AS `id`,
  `t`.`updated_at` AS `updated_at`,
  (CASE WHEN `t`.`owner` IS NULL THEN NULL ELSE (lower(hex(substr(`t`.`owner`, 1, 4))) || '-' || lower(hex(substr(`t`.`owner`, 5, 2))) || '-' || lower(hex(substr(`t`.`owner`, 7, 2))) || '-' || lower(hex(substr(`t`.`owner`, 9, 2))) || '-' || lower(hex(substr(`t`.`owner`, 11, 6)))) END) AS `owner`,
  `t`.`visibility` AS `visibility`,
  `t`.`name` AS `name`,
  `t`.`description` AS `description`,
  (SELECT coalesce(json_group_array(json_object('id', (CASE WHEN `r`.`id` IS NULL THEN NULL ELSE (lower(hex(substr(`r`.`id`, 1, 4))) || '-' || lower(hex(substr(`r`.`id`, 5, 2))) || '-' || lower(hex(substr(`r`.`id`, 7, 2))) || '-' || lower(hex(substr(`r`.`id`, 9, 2))) || '-' || lower(hex(substr(`r`.`id`, 11, 6)))) END), 'updated_at', `r`.`updated_at`, 'owner', (CASE WHEN `r`.`owner` IS NULL THEN NULL ELSE (lower(hex(substr(`r`.`owner`, 1, 4))) || '-' || lower(hex(substr(`r`.`owner`, 5, 2))) || '-' || lower(hex(substr(`r`.`owner`, 7, 2))) || '-' || lower(hex(substr(`r`.`owner`, 9, 2))) || '-' || lower(hex(substr(`r`.`owner`, 11, 6)))) END), 'visibility', `r`.`visibility`, 'username', `r`.`username`, 'email', `r`.`email`, 'display_name', `r`.`display_name`)), json('[]')) FROM `user` AS `r` JOIN `user_group_membership` AS `j` ON `j`.`user_id` = `r`.`id` WHERE `j`.`user_group_id` = `t`.`id` ORDER BY `r`.`id`) AS `users`
FROM `user_group` AS `t`;
--> statement-breakpoint
CREATE VIEW `user_group_membership_view` AS
SELECT
  `t`.`id` AS `_key`,
  (CASE WHEN `t`.`id` IS NULL THEN NULL ELSE (lower(hex(substr(`t`.`id`, 1, 4))) || '-' || lower(hex(substr(`t`.`id`, 5, 2))) || '-' || lower(hex(substr(`t`.`id`, 7, 2))) || '-' || lower(hex(substr(`t`.`id`, 9, 2))) || '-' || lower(hex(substr(`t`.`id`, 11, 6)))) END) AS `id`,
  `t`.`updated_at` AS `updated_at`,
  (CASE WHEN `t`.`owner` IS NULL THEN NULL ELSE (lower(hex(substr(`t`.`owner`, 1, 4))) || '-' || lower(hex(substr(`t`.`owner`, 5, 2))) || '-' || lower(hex(substr(`t`.`owner`, 7, 2))) || '-' || lower(hex(substr(`t`.`owner`, 9, 2))) || '-' || lower(hex(substr(`t`.`owner`, 11, 6)))) END) AS `owner`,
  `t`.`visibility` AS `visibility`,
  (CASE WHEN `t`.`user_id` IS NULL THEN NULL ELSE (lower(hex(substr(`t`.`user_id`, 1, 4))) || '-' || lower(hex(substr(`t`.`user_id`, 5, 2))) || '-' || lower(hex(substr(`t`.`user_id`, 7, 2))) || '-' || lower(hex(substr(`t`.`user_id`, 9, 2))) || '-' || lower(hex(substr(`t`.`user_id`, 11, 6)))) END) AS `user_id`,
  (CASE WHEN `t`.`user_group_id` IS NULL THEN NULL ELSE (lower(hex(substr(`t`.`user_group_id`, 1, 4))) || '-' || lower(hex(substr(`t`.`user_group_id`, 5, 2))) || '-' || lower(hex(substr(`t`.`user_group_id`, 7, 2))) || '-' || lower(hex(substr(`t`.`user_group_id`, 9, 2))) || '-' || lower(hex(substr(`t`.`user_group_id`, 11, 6)))) END) AS `user_group_id`,
  (SELECT json_object('id', (CASE WHEN `r`.`id` IS NULL THEN NULL ELSE (lower(hex(substr(`r`.`id`, 1, 4))) || '-' || lower(hex(substr(`r`.`id`, 5, 2))) || '-' || lower(hex(substr(`r`.`id`, 7, 2))) || '-' || lower(hex(substr(`r`.`id`, 9, 2))) || '-' || lower(hex(substr(`r`.`id`, 11, 6)))) END), 'updated_at', `r`.`updated_at`, 'owner', (CASE WHEN `r`.`owner` IS NULL THEN NULL ELSE (lower(hex(substr(`r`.`owner`, 1, 4))) || '-' || lower(hex(substr(`r`.`owner`, 5, 2))) || '-' || lower(hex(substr(`r`.`owner`, 7, 2))) || '-' || lower(hex(substr(`r`.`owner`, 9, 2))) || '-' || lower(hex(substr(`r`.`owner`, 11, 6)))) END), 'visibility', `r`.`visibility`, 'username', `r`.`username`, 'email', `r`.`email`, 'display_name', `r`.`display_name`) FROM `user` AS `r` WHERE `r`.`id` = `t`.`user_id` LIMIT 1) AS `user`,
  (SELECT json_object('id', (CASE WHEN `r`.`id` IS NULL THEN NULL ELSE (lower(hex(substr(`r`.`id`, 1, 4))) || '-' || lower(hex(substr(`r`.`id`, 5, 2))) || '-' || lower(hex(substr(`r`.`id`, 7, 2))) || '-' || lower(hex(substr(`r`.`id`, 9, 2))) || '-' || lower(hex(substr(`r`.`id`, 11, 6)))) END), 'updated_at', `r`.`updated_at`, 'owner', (CASE WHEN `r`.`owner` IS NULL THEN NULL ELSE (lower(hex(substr(`r`.`owner`, 1, 4))) || '-' || lower(hex(substr(`r`.`owner`, 5, 2))) || '-' || lower(hex(substr(`r`.`owner`, 7, 2))) || '-' || lower(hex(substr(`r`.`owner`, 9, 2))) || '-' || lower(hex(substr(`r`.`owner`, 11, 6)))) END), 'visibility', `r`.`visibility`, 'name', `r`.`name`, 'description', `r`.`description`) FROM `user_group` AS `r` WHERE `r`.`id` = `t`.`user_group_id` LIMIT 1) AS `user_group`
FROM `user_group_membership` AS `t`;
--> statement-breakpoint
CREATE VIEW `user_role_view` AS
SELECT
  `t`.`id` AS `_key`,
  (CASE WHEN `t`.`id` IS NULL THEN NULL ELSE (lower(hex(substr(`t`.`id`, 1, 4))) || '-' || lower(hex(substr(`t`.`id`, 5, 2))) || '-' || lower(hex(substr(`t`.`id`, 7, 2))) || '-' || lower(hex(substr(`t`.`id`, 9, 2))) || '-' || lower(hex(substr(`t`.`id`, 11, 6)))) END) AS `id`,
  `t`.`updated_at` AS `updated_at`,
  (CASE WHEN `t`.`owner` IS NULL THEN NULL ELSE (lower(hex(substr(`t`.`owner`, 1, 4))) || '-' || lower(hex(substr(`t`.`owner`, 5, 2))) || '-' || lower(hex(substr(`t`.`owner`, 7, 2))) || '-' || lower(hex(substr(`t`.`owner`, 9, 2))) || '-' || lower(hex(substr(`t`.`owner`, 11, 6)))) END) AS `owner`,
  `t`.`visibility` AS `visibility`,
  `t`.`role` AS `role`,
  (CASE WHEN `t`.`user_id` IS NULL THEN NULL ELSE (lower(hex(substr(`t`.`user_id`, 1, 4))) || '-' || lower(hex(substr(`t`.`user_id`, 5, 2))) || '-' || lower(hex(substr(`t`.`user_id`, 7, 2))) || '-' || lower(hex(substr(`t`.`user_id`, 9, 2))) || '-' || lower(hex(substr(`t`.`user_id`, 11, 6)))) END) AS `user_id`,
  (SELECT json_object('id', (CASE WHEN `r`.`id` IS NULL THEN NULL ELSE (lower(hex(substr(`r`.`id`, 1, 4))) || '-' || lower(hex(substr(`r`.`id`, 5, 2))) || '-' || lower(hex(substr(`r`.`id`, 7, 2))) || '-' || lower(hex(substr(`r`.`id`, 9, 2))) || '-' || lower(hex(substr(`r`.`id`, 11, 6)))) END), 'updated_at', `r`.`updated_at`, 'owner', (CASE WHEN `r`.`owner` IS NULL THEN NULL ELSE (lower(hex(substr(`r`.`owner`, 1, 4))) || '-' || lower(hex(substr(`r`.`owner`, 5, 2))) || '-' || lower(hex(substr(`r`.`owner`, 7, 2))) || '-' || lower(hex(substr(`r`.`owner`, 9, 2))) || '-' || lower(hex(substr(`r`.`owner`, 11, 6)))) END), 'visibility', `r`.`visibility`, 'username', `r`.`username`, 'email', `r`.`email`, 'display_name', `r`.`display_name`) FROM `user` AS `r` WHERE `r`.`id` = `t`.`user_id` LIMIT 1) AS `user`
FROM `user_role` AS `t`;
