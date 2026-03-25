ALTER TABLE "pr_reviews" ADD COLUMN "pr_body" text;--> statement-breakpoint
ALTER TABLE "pr_reviews" ADD COLUMN "risk_level" text DEFAULT 'Low' NOT NULL;--> statement-breakpoint
ALTER TABLE "pr_reviews" ADD COLUMN "review_data" jsonb;--> statement-breakpoint
ALTER TABLE "pr_reviews" ADD COLUMN "retrieved_context" jsonb;