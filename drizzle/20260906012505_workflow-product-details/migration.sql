ALTER TABLE "products" ADD COLUMN "metadata" jsonb DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "quotations" ADD COLUMN "title" text;