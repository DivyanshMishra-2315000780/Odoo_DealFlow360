CREATE TYPE "quote_request_status" AS ENUM('SUBMITTED', 'ASSIGNED', 'QUOTED', 'REJECTED', 'CLOSED');--> statement-breakpoint
CREATE TABLE "quote_request_items" (
	"id" text PRIMARY KEY,
	"quote_request_id" text NOT NULL,
	"product_id" text,
	"description" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"requirements" jsonb
);
--> statement-breakpoint
CREATE TABLE "quote_requests" (
	"id" text PRIMARY KEY,
	"request_number" text NOT NULL UNIQUE,
	"customer_id" text NOT NULL,
	"assigned_sales_exec_id" text,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"budget" numeric,
	"target_date" timestamp,
	"status" "quote_request_status" DEFAULT 'SUBMITTED'::"quote_request_status" NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "quotations" ADD COLUMN "quote_request_id" text;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "order_id" text;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "quotation_line_id" text;--> statement-breakpoint
ALTER TABLE "upsell_rules" ADD COLUMN "reason" text;--> statement-breakpoint
ALTER TABLE "upsell_rules" ADD COLUMN "estimated_revenue_delta" numeric DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "upsell_rules" ADD COLUMN "estimated_margin_delta" numeric DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "upsell_rules" ADD COLUMN "co_purchase_score" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "upsell_rules" ADD COLUMN "margin_score" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_quote_request_id_key" UNIQUE("quote_request_id");--> statement-breakpoint
CREATE INDEX "quote_request_items_request_id_idx" ON "quote_request_items" ("quote_request_id");--> statement-breakpoint
CREATE INDEX "quote_requests_customer_id_idx" ON "quote_requests" ("customer_id");--> statement-breakpoint
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_quote_request_id_quote_requests_id_fkey" FOREIGN KEY ("quote_request_id") REFERENCES "quote_requests"("id");--> statement-breakpoint
ALTER TABLE "quote_request_items" ADD CONSTRAINT "quote_request_items_quote_request_id_quote_requests_id_fkey" FOREIGN KEY ("quote_request_id") REFERENCES "quote_requests"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "quote_request_items" ADD CONSTRAINT "quote_request_items_product_id_products_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id");--> statement-breakpoint
ALTER TABLE "quote_requests" ADD CONSTRAINT "quote_requests_customer_id_customers_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id");--> statement-breakpoint
ALTER TABLE "quote_requests" ADD CONSTRAINT "quote_requests_assigned_sales_exec_id_users_id_fkey" FOREIGN KEY ("assigned_sales_exec_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_order_id_sales_orders_id_fkey" FOREIGN KEY ("order_id") REFERENCES "sales_orders"("id");--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_quotation_line_id_quotation_lines_id_fkey" FOREIGN KEY ("quotation_line_id") REFERENCES "quotation_lines"("id");--> statement-breakpoint
ALTER TABLE "upsell_recommendations" ADD CONSTRAINT "upsell_recommendations_quotation_id_quotations_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "quotations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "upsell_rules" ADD CONSTRAINT "upsell_rules_trigger_product_id_products_id_fkey" FOREIGN KEY ("trigger_product_id") REFERENCES "products"("id");--> statement-breakpoint
ALTER TABLE "upsell_rules" ADD CONSTRAINT "upsell_rules_target_product_id_products_id_fkey" FOREIGN KEY ("target_product_id") REFERENCES "products"("id");