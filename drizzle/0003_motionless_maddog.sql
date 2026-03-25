ALTER TABLE "users" RENAME COLUMN "cognito_sub" TO "github_id";--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_cognito_sub_unique";--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_github_id_unique" UNIQUE("github_id");