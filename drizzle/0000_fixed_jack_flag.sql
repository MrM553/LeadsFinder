CREATE TABLE `leads` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`dedup_key` text NOT NULL,
	`company_name` text NOT NULL,
	`website_url` text,
	`industry` text NOT NULL,
	`city` text,
	`region` text,
	`country` text DEFAULT 'Germany' NOT NULL,
	`phone` text,
	`email` text,
	`source_url` text,
	`found_in_search_id` integer,
	`date_found` integer DEFAULT (unixepoch()) NOT NULL,
	`last_checked` integer,
	`website_status` text DEFAULT 'UNKNOWN' NOT NULL,
	`https_status` integer,
	`mobile_indicator` integer,
	`contact_form_detected` integer,
	`phone_detected` integer,
	`email_detected` integer,
	`cta_detected` integer,
	`technical_score` real,
	`performance_score` real,
	`overall_score` real,
	`score_reasons` text,
	`status` text DEFAULT 'NEW' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`found_in_search_id`) REFERENCES `searches`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `leads_dedup_key_unique` ON `leads` (`dedup_key`);--> statement-breakpoint
CREATE TABLE `notes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`lead_id` integer NOT NULL,
	`text` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `scoring_rules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`key` text NOT NULL,
	`label` text NOT NULL,
	`description` text,
	`points` integer NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `scoring_rules_key_unique` ON `scoring_rules` (`key`);--> statement-breakpoint
CREATE TABLE `searches` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`industry` text NOT NULL,
	`location` text NOT NULL,
	`requested_count` integer NOT NULL,
	`status` text DEFAULT 'QUEUED' NOT NULL,
	`results_found` integer DEFAULT 0 NOT NULL,
	`error_message` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
