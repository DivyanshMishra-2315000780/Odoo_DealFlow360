CREATE TYPE "approval_kind" AS ENUM('INITIAL', 'NEGOTIATION');--> statement-breakpoint
CREATE TYPE "approval_status" AS ENUM('NOT_REQUIRED', 'PENDING', 'APPROVED', 'REJECTED', 'REVISION_REQUIRED', 'SKIPPED');--> statement-breakpoint
CREATE TYPE "billing_cycle" AS ENUM('MONTHLY', 'QUARTERLY', 'ANNUAL', 'ONE_TIME');--> statement-breakpoint
CREATE TYPE "customer_tier" AS ENUM('BRONZE', 'SILVER', 'GOLD');--> statement-breakpoint
CREATE TYPE "deal_health_status" AS ENUM('HEALTHY', 'WATCH', 'CRITICAL');--> statement-breakpoint
CREATE TYPE "discount_status" AS ENUM('COMPLIANT', 'EXCEEDED');--> statement-breakpoint
CREATE TYPE "fulfillment_status" AS ENUM('PENDING', 'PARTIAL', 'ALLOCATED', 'SHIPPED', 'DELIVERED', 'BACKORDERED');--> statement-breakpoint
CREATE TYPE "invoice_status" AS ENUM('DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'VOID');--> statement-breakpoint
CREATE TYPE "negotiation_status" AS ENUM('OPEN', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CLOSED');--> statement-breakpoint
CREATE TYPE "negotiation_type" AS ENUM('CHANGE_REQUEST', 'COUNTER_OFFER');--> statement-breakpoint
CREATE TYPE "order_status" AS ENUM('CONFIRMED', 'FULFILLMENT', 'SHIPPED', 'DELIVERED', 'BILLING', 'PAYMENT_PENDING', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "payment_status" AS ENUM('CREATED', 'PENDING', 'SUCCESS', 'FAILED', 'REFUNDED');--> statement-breakpoint
CREATE TYPE "quote_status" AS ENUM('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SENT', 'UNDER_NEGOTIATION', 'RE_APPROVAL_REQUIRED', 'CONFIRMED', 'FULFILLMENT', 'BILLING', 'COMPLETED', 'REJECTED', 'REVISION_REQUIRED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "risk_level" AS ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');--> statement-breakpoint
CREATE TYPE "subscription_status" AS ENUM('ACTIVE', 'CANCELED', 'PAST_DUE', 'TRIAL', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "user_role" AS ENUM('CUSTOMER', 'ADMIN', 'SALES_MANAGER', 'SALES_EXECUTIVE', 'FINANCE_OFFICER');--> statement-breakpoint
CREATE TABLE "approval_decisions" (
	"id" text PRIMARY KEY,
	"step_id" text NOT NULL,
	"user_id" text NOT NULL,
	"action" text NOT NULL,
	"comment" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "approval_requests" (
	"id" text PRIMARY KEY,
	"quotation_id" text NOT NULL,
	"status" "approval_status" DEFAULT 'PENDING'::"approval_status" NOT NULL,
	"kind" "approval_kind" DEFAULT 'INITIAL'::"approval_kind" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "approval_rules" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"condition" text NOT NULL,
	"threshold_value" numeric NOT NULL,
	"required_role" "user_role" NOT NULL,
	"sequence_number" integer DEFAULT 1 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "approval_steps" (
	"id" text PRIMARY KEY,
	"request_id" text NOT NULL,
	"rule_id" text,
	"required_role" "user_role" NOT NULL,
	"sequence" integer NOT NULL,
	"status" "approval_status" DEFAULT 'PENDING'::"approval_status" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" text PRIMARY KEY,
	"actor_id" text,
	"actor_role" text,
	"entity" text NOT NULL,
	"entity_id" text NOT NULL,
	"action" text NOT NULL,
	"previous_value" jsonb,
	"new_value" jsonb,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_login_attempts" (
	"id" text PRIMARY KEY,
	"identifier_hash" text NOT NULL UNIQUE,
	"attempts" integer DEFAULT 0 NOT NULL,
	"window_started_at" timestamp DEFAULT now() NOT NULL,
	"blocked_until" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_sessions" (
	"id" text PRIMARY KEY,
	"user_id" text NOT NULL,
	"user_agent" text,
	"ip_address" text,
	"expires_at" timestamp NOT NULL,
	"revoked_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "backorders" (
	"id" text PRIMARY KEY,
	"fulfillment_id" text NOT NULL,
	"product_id" text NOT NULL,
	"required_qty" integer NOT NULL,
	"backordered_qty" integer NOT NULL,
	"status" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL UNIQUE,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credit_notes" (
	"id" text PRIMARY KEY,
	"customer_id" text NOT NULL,
	"amount" numeric NOT NULL,
	"reason" text NOT NULL,
	"status" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" text PRIMARY KEY,
	"user_id" text UNIQUE,
	"name" text NOT NULL,
	"tier" "customer_tier" DEFAULT 'BRONZE'::"customer_tier" NOT NULL,
	"contact_email" text NOT NULL UNIQUE,
	"industry" text,
	"account_manager_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deal_health" (
	"id" text PRIMARY KEY,
	"quotation_id" text NOT NULL UNIQUE,
	"health_score" integer DEFAULT 100 NOT NULL,
	"status" "deal_health_status" DEFAULT 'HEALTHY'::"deal_health_status" NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deal_health_events" (
	"id" text PRIMARY KEY,
	"deal_health_id" text NOT NULL,
	"type" text NOT NULL,
	"risk_impact" integer NOT NULL,
	"reason" text NOT NULL,
	"resolved" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discount_rules" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"max_discount_pct" numeric NOT NULL,
	"customer_tier" "customer_tier",
	"category_id" text,
	"product_id" text,
	"user_role" "user_role",
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fulfillment_allocations" (
	"id" text PRIMARY KEY,
	"fulfillment_id" text NOT NULL,
	"warehouse_id" text NOT NULL,
	"product_id" text NOT NULL,
	"allocated_qty" integer NOT NULL,
	"shipped_qty" integer DEFAULT 0 NOT NULL,
	"is_manual_override" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fulfillments" (
	"id" text PRIMARY KEY,
	"order_id" text UNIQUE,
	"quotation_id" text NOT NULL,
	"status" "fulfillment_status" DEFAULT 'PENDING'::"fulfillment_status" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory" (
	"id" text PRIMARY KEY,
	"warehouse_id" text NOT NULL,
	"product_id" text NOT NULL,
	"quantity_available" integer DEFAULT 0 NOT NULL,
	"quantity_reserved" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_lines" (
	"id" text PRIMARY KEY,
	"invoice_id" text NOT NULL,
	"description" text NOT NULL,
	"amount" numeric NOT NULL,
	"is_recurring" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" text PRIMARY KEY,
	"invoice_number" text NOT NULL UNIQUE,
	"customer_id" text NOT NULL,
	"quotation_id" text,
	"order_id" text,
	"status" "invoice_status" DEFAULT 'DRAFT'::"invoice_status" NOT NULL,
	"due_date" timestamp NOT NULL,
	"subtotal" numeric NOT NULL,
	"tax" numeric NOT NULL,
	"total" numeric NOT NULL,
	"amount_due" numeric NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "negotiation_changes" (
	"id" text PRIMARY KEY,
	"negotiation_id" text NOT NULL,
	"quotation_line_id" text NOT NULL,
	"field_changed" text NOT NULL,
	"original_value" numeric NOT NULL,
	"requested_value" numeric NOT NULL,
	"status" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "negotiations" (
	"id" text PRIMARY KEY,
	"quotation_id" text NOT NULL,
	"customer_id" text NOT NULL,
	"request_type" "negotiation_type" NOT NULL,
	"submitted_by_id" text NOT NULL,
	"status" "negotiation_status" DEFAULT 'OPEN'::"negotiation_status" NOT NULL,
	"customer_notes" text,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" text PRIMARY KEY,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"message" text NOT NULL,
	"read" boolean DEFAULT false NOT NULL,
	"link_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" text PRIMARY KEY,
	"invoice_id" text NOT NULL,
	"amount" numeric NOT NULL,
	"status" "payment_status" DEFAULT 'CREATED'::"payment_status" NOT NULL,
	"payment_method" text,
	"gateway_reference" text,
	"gateway_order_id" text,
	"gateway_payment_id" text,
	"signature_verified" boolean DEFAULT false NOT NULL,
	"failure_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "price_list_items" (
	"id" text PRIMARY KEY,
	"price_list_id" text NOT NULL,
	"product_id" text NOT NULL,
	"unit_price" numeric NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "price_lists" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" text PRIMARY KEY,
	"sku" text NOT NULL UNIQUE,
	"name" text NOT NULL,
	"description" text,
	"category_id" text NOT NULL,
	"base_cost" numeric NOT NULL,
	"is_recurring" boolean DEFAULT false NOT NULL,
	"subscription_plan_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quotation_lines" (
	"id" text PRIMARY KEY,
	"quotation_id" text NOT NULL,
	"product_id" text NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" numeric NOT NULL,
	"unit_cost" numeric NOT NULL,
	"discount_percentage" numeric DEFAULT '0' NOT NULL,
	"discount_amount" numeric DEFAULT '0' NOT NULL,
	"discount_status" "discount_status" DEFAULT 'COMPLIANT'::"discount_status" NOT NULL,
	"excess_discount_pct" numeric DEFAULT '0' NOT NULL,
	"gross_amount" numeric DEFAULT '0' NOT NULL,
	"net_amount" numeric DEFAULT '0' NOT NULL,
	"line_cost" numeric DEFAULT '0' NOT NULL,
	"line_profit" numeric DEFAULT '0' NOT NULL,
	"line_margin_percentage" numeric DEFAULT '0' NOT NULL,
	"is_recurring" boolean DEFAULT false NOT NULL,
	"subscription_plan_id" text
);
--> statement-breakpoint
CREATE TABLE "quotation_versions" (
	"id" text PRIMARY KEY,
	"quotation_id" text NOT NULL,
	"version" integer NOT NULL,
	"snapshot" jsonb NOT NULL,
	"reason" text NOT NULL,
	"created_by_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quotations" (
	"id" text PRIMARY KEY,
	"quote_number" text NOT NULL UNIQUE,
	"customer_id" text NOT NULL,
	"sales_exec_id" text NOT NULL,
	"price_list_id" text NOT NULL,
	"currency" text NOT NULL,
	"status" "quote_status" DEFAULT 'DRAFT'::"quote_status" NOT NULL,
	"validity_date" timestamp NOT NULL,
	"payment_terms" text,
	"subtotal" numeric DEFAULT '0' NOT NULL,
	"total_discount" numeric DEFAULT '0' NOT NULL,
	"tax_amount" numeric DEFAULT '0' NOT NULL,
	"total_amount" numeric DEFAULT '0' NOT NULL,
	"total_cost" numeric DEFAULT '0' NOT NULL,
	"total_profit" numeric DEFAULT '0' NOT NULL,
	"margin_percentage" numeric DEFAULT '0' NOT NULL,
	"risk_score" integer DEFAULT 0 NOT NULL,
	"risk_level" "risk_level" DEFAULT 'LOW'::"risk_level" NOT NULL,
	"risk_reasons" jsonb,
	"approval_status" "approval_status" DEFAULT 'NOT_REQUIRED'::"approval_status" NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "refresh_tokens" (
	"id" text PRIMARY KEY,
	"session_id" text NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"revoked_at" timestamp,
	"replaced_by_token_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales_orders" (
	"id" text PRIMARY KEY,
	"order_number" text NOT NULL UNIQUE,
	"quotation_id" text NOT NULL UNIQUE,
	"customer_id" text NOT NULL,
	"status" "order_status" DEFAULT 'CONFIRMED'::"order_status" NOT NULL,
	"confirmed_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscription_plans" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"billing_cycle" "billing_cycle" NOT NULL,
	"price" numeric NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" text PRIMARY KEY,
	"customer_id" text NOT NULL,
	"plan_id" text NOT NULL,
	"quantity" integer NOT NULL,
	"recurring_amt" numeric NOT NULL,
	"status" "subscription_status" DEFAULT 'ACTIVE'::"subscription_status" NOT NULL,
	"start_date" timestamp NOT NULL,
	"next_billing_date" timestamp NOT NULL,
	"canceled_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "system_configs" (
	"id" text PRIMARY KEY,
	"key" text NOT NULL UNIQUE,
	"value" jsonb NOT NULL,
	"description" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "upsell_recommendations" (
	"id" text PRIMARY KEY,
	"quotation_id" text NOT NULL,
	"product_id" text NOT NULL,
	"reason" text NOT NULL,
	"score" integer NOT NULL,
	"margin_delta" numeric NOT NULL,
	"revenue_delta" numeric NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "upsell_rules" (
	"id" text PRIMARY KEY,
	"trigger_product_id" text NOT NULL,
	"target_product_id" text NOT NULL,
	"type" text NOT NULL,
	"score_weight" integer DEFAULT 1 NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY,
	"email" text NOT NULL UNIQUE,
	"password_hash" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"role" "user_role" NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "warehouses" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"location" text NOT NULL,
	"shipping_cost" numeric DEFAULT '0' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "auth_sessions_user_id_idx" ON "auth_sessions" ("user_id");--> statement-breakpoint
CREATE INDEX "quotation_versions_quotation_id_idx" ON "quotation_versions" ("quotation_id");--> statement-breakpoint
CREATE INDEX "refresh_tokens_session_id_idx" ON "refresh_tokens" ("session_id");--> statement-breakpoint
CREATE INDEX "sales_orders_customer_id_idx" ON "sales_orders" ("customer_id");--> statement-breakpoint
ALTER TABLE "approval_decisions" ADD CONSTRAINT "approval_decisions_step_id_approval_steps_id_fkey" FOREIGN KEY ("step_id") REFERENCES "approval_steps"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "approval_decisions" ADD CONSTRAINT "approval_decisions_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_quotation_id_quotations_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "quotations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "approval_steps" ADD CONSTRAINT "approval_steps_request_id_approval_requests_id_fkey" FOREIGN KEY ("request_id") REFERENCES "approval_requests"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "approval_steps" ADD CONSTRAINT "approval_steps_rule_id_approval_rules_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "approval_rules"("id");--> statement-breakpoint
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "backorders" ADD CONSTRAINT "backorders_fulfillment_id_fulfillments_id_fkey" FOREIGN KEY ("fulfillment_id") REFERENCES "fulfillments"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "credit_notes" ADD CONSTRAINT "credit_notes_customer_id_customers_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id");--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_account_manager_id_users_id_fkey" FOREIGN KEY ("account_manager_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "deal_health" ADD CONSTRAINT "deal_health_quotation_id_quotations_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "quotations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "deal_health_events" ADD CONSTRAINT "deal_health_events_deal_health_id_deal_health_id_fkey" FOREIGN KEY ("deal_health_id") REFERENCES "deal_health"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "discount_rules" ADD CONSTRAINT "discount_rules_category_id_categories_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id");--> statement-breakpoint
ALTER TABLE "discount_rules" ADD CONSTRAINT "discount_rules_product_id_products_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id");--> statement-breakpoint
ALTER TABLE "fulfillment_allocations" ADD CONSTRAINT "fulfillment_allocations_fulfillment_id_fulfillments_id_fkey" FOREIGN KEY ("fulfillment_id") REFERENCES "fulfillments"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "fulfillment_allocations" ADD CONSTRAINT "fulfillment_allocations_warehouse_id_warehouses_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id");--> statement-breakpoint
ALTER TABLE "fulfillments" ADD CONSTRAINT "fulfillments_order_id_sales_orders_id_fkey" FOREIGN KEY ("order_id") REFERENCES "sales_orders"("id");--> statement-breakpoint
ALTER TABLE "fulfillments" ADD CONSTRAINT "fulfillments_quotation_id_quotations_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "quotations"("id");--> statement-breakpoint
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_warehouse_id_warehouses_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id");--> statement-breakpoint
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_product_id_products_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id");--> statement-breakpoint
ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_invoice_id_invoices_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customer_id_customers_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id");--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_quotation_id_quotations_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "quotations"("id");--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_order_id_sales_orders_id_fkey" FOREIGN KEY ("order_id") REFERENCES "sales_orders"("id");--> statement-breakpoint
ALTER TABLE "negotiation_changes" ADD CONSTRAINT "negotiation_changes_negotiation_id_negotiations_id_fkey" FOREIGN KEY ("negotiation_id") REFERENCES "negotiations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "negotiation_changes" ADD CONSTRAINT "negotiation_changes_quotation_line_id_quotation_lines_id_fkey" FOREIGN KEY ("quotation_line_id") REFERENCES "quotation_lines"("id");--> statement-breakpoint
ALTER TABLE "negotiations" ADD CONSTRAINT "negotiations_quotation_id_quotations_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "quotations"("id");--> statement-breakpoint
ALTER TABLE "negotiations" ADD CONSTRAINT "negotiations_customer_id_customers_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id");--> statement-breakpoint
ALTER TABLE "negotiations" ADD CONSTRAINT "negotiations_submitted_by_id_users_id_fkey" FOREIGN KEY ("submitted_by_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_invoices_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id");--> statement-breakpoint
ALTER TABLE "price_list_items" ADD CONSTRAINT "price_list_items_price_list_id_price_lists_id_fkey" FOREIGN KEY ("price_list_id") REFERENCES "price_lists"("id");--> statement-breakpoint
ALTER TABLE "price_list_items" ADD CONSTRAINT "price_list_items_product_id_products_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id");--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id");--> statement-breakpoint
ALTER TABLE "quotation_lines" ADD CONSTRAINT "quotation_lines_quotation_id_quotations_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "quotations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "quotation_lines" ADD CONSTRAINT "quotation_lines_product_id_products_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id");--> statement-breakpoint
ALTER TABLE "quotation_versions" ADD CONSTRAINT "quotation_versions_quotation_id_quotations_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "quotations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "quotation_versions" ADD CONSTRAINT "quotation_versions_created_by_id_users_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_customer_id_customers_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id");--> statement-breakpoint
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_sales_exec_id_users_id_fkey" FOREIGN KEY ("sales_exec_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_price_list_id_price_lists_id_fkey" FOREIGN KEY ("price_list_id") REFERENCES "price_lists"("id");--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_session_id_auth_sessions_id_fkey" FOREIGN KEY ("session_id") REFERENCES "auth_sessions"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_quotation_id_quotations_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "quotations"("id");--> statement-breakpoint
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_customer_id_customers_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id");--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_customer_id_customers_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id");--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_subscription_plans_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id");--> statement-breakpoint
ALTER TABLE "upsell_recommendations" ADD CONSTRAINT "upsell_recommendations_product_id_products_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id");