ALTER TABLE "subscription" RENAME COLUMN "polar_customer_id" TO "ls_customer_id";--> statement-breakpoint
ALTER TABLE "subscription" RENAME COLUMN "polar_subscription_id" TO "ls_subscription_id";--> statement-breakpoint
ALTER TABLE "subscription" DROP CONSTRAINT "subscription_polar_subscription_id_unique";--> statement-breakpoint
ALTER TABLE "subscription" ADD COLUMN "variant_id" text;--> statement-breakpoint
ALTER TABLE "subscription" ADD COLUMN "customer_portal_url" text;--> statement-breakpoint
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_ls_subscription_id_unique" UNIQUE("ls_subscription_id");