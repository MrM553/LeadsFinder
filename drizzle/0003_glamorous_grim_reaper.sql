ALTER TABLE `searches` ADD `results_processed` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `searches` ADD `results_failed` integer DEFAULT 0 NOT NULL;