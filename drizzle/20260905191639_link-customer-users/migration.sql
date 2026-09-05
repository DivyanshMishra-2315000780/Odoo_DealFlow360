ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "user_id" text;--> statement-breakpoint
UPDATE "customers" AS customer
SET "user_id" = app_user."id"
FROM "users" AS app_user
WHERE customer."user_id" IS NULL
  AND app_user."role" = 'CUSTOMER'
  AND lower(customer."contact_email") = lower(app_user."email");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "customers_user_id_key" ON "customers" ("user_id");--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'customers_user_id_users_id_fkey'
      AND conrelid = 'customers'::regclass
  ) THEN
    ALTER TABLE "customers"
      ADD CONSTRAINT "customers_user_id_users_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
  END IF;
END $$;
