CREATE INDEX `leads_status_idx` ON `leads` (`status`);--> statement-breakpoint
CREATE INDEX `leads_overall_score_idx` ON `leads` (`overall_score`);--> statement-breakpoint
CREATE INDEX `leads_industry_idx` ON `leads` (`industry`);--> statement-breakpoint
CREATE INDEX `notes_lead_id_idx` ON `notes` (`lead_id`);