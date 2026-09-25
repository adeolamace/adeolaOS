CREATE TABLE `crm_records` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`name` text NOT NULL,
	`client_id` text,
	`status` text DEFAULT 'active' NOT NULL,
	`value` integer DEFAULT 0 NOT NULL,
	`payload` text DEFAULT '{}' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_crm_records_type_status` ON `crm_records` (`type`,`status`);--> statement-breakpoint
CREATE INDEX `idx_crm_records_client_id` ON `crm_records` (`client_id`);--> statement-breakpoint
CREATE INDEX `idx_crm_records_updated_at` ON `crm_records` (`updated_at`);