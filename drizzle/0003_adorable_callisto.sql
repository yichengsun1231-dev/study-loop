PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_portfolio` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`goal_id` text NOT NULL,
	`evaluation_id` text,
	`attempt_id` text NOT NULL,
	`title` text NOT NULL,
	`visibility` text DEFAULT 'private' NOT NULL,
	`share_token` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`goal_id`) REFERENCES `goals`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`evaluation_id`) REFERENCES `evaluations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`attempt_id`) REFERENCES `attempts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_portfolio`("id", "user_id", "goal_id", "evaluation_id", "attempt_id", "title", "visibility", "share_token", "created_at") SELECT "id", "user_id", "goal_id", "evaluation_id", "attempt_id", "title", "visibility", "share_token", "created_at" FROM `portfolio`;--> statement-breakpoint
DROP TABLE `portfolio`;--> statement-breakpoint
ALTER TABLE `__new_portfolio` RENAME TO `portfolio`;--> statement-breakpoint
PRAGMA foreign_keys=ON;