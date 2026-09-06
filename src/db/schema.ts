import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  numeric,
  jsonb,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";

// Enums
export const userRoleEnum = pgEnum("user_role", [
  "CUSTOMER",
  "ADMIN",
  "SALES_MANAGER",
  "SALES_EXECUTIVE",
  "FINANCE_OFFICER",
]);
export const customerTierEnum = pgEnum("customer_tier", [
  "BRONZE",
  "SILVER",
  "GOLD",
]);
export const quoteStatusEnum = pgEnum("quote_status", [
  "DRAFT",
  "PENDING_APPROVAL",
  "APPROVED",
  "SENT",
  "UNDER_NEGOTIATION",
  "RE_APPROVAL_REQUIRED",
  "CONFIRMED",
  "FULFILLMENT",
  "BILLING",
  "COMPLETED",
  "REJECTED",
  "REVISION_REQUIRED",
  "CANCELLED",
]);
export const approvalStatusEnum = pgEnum("approval_status", [
  "NOT_REQUIRED",
  "PENDING",
  "APPROVED",
  "REJECTED",
  "REVISION_REQUIRED",
  "SKIPPED",
]);
export const approvalKindEnum = pgEnum("approval_kind", ["INITIAL", "NEGOTIATION"]);
export const discountStatusEnum = pgEnum("discount_status", [
  "COMPLIANT",
  "EXCEEDED",
]);
export const riskLevelEnum = pgEnum("risk_level", [
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
]);
export const fulfillmentStatusEnum = pgEnum("fulfillment_status", [
  "PENDING",
  "PARTIAL",
  "ALLOCATED",
  "SHIPPED",
  "DELIVERED",
  "BACKORDERED",
]);
export const billingCycleEnum = pgEnum("billing_cycle", [
  "MONTHLY",
  "QUARTERLY",
  "ANNUAL",
  "ONE_TIME",
]);
export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "ACTIVE",
  "CANCELED",
  "PAST_DUE",
  "TRIAL",
  "EXPIRED",
]);
export const invoiceStatusEnum = pgEnum("invoice_status", [
  "DRAFT",
  "ISSUED",
  "PARTIALLY_PAID",
  "PAID",
  "OVERDUE",
  "VOID",
]);
export const paymentStatusEnum = pgEnum("payment_status", [
  "CREATED",
  "PENDING",
  "SUCCESS",
  "FAILED",
  "REFUNDED",
]);
export const negotiationStatusEnum = pgEnum("negotiation_status", [
  "OPEN",
  "SUBMITTED",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
  "CLOSED",
]);
export const negotiationTypeEnum = pgEnum("negotiation_type", [
  "CHANGE_REQUEST",
  "COUNTER_OFFER",
]);
export const orderStatusEnum = pgEnum("order_status", [
  "CONFIRMED",
  "FULFILLMENT",
  "SHIPPED",
  "DELIVERED",
  "BILLING",
  "PAYMENT_PENDING",
  "COMPLETED",
  "CANCELLED",
]);
export const quoteRequestStatusEnum = pgEnum("quote_request_status", [
  "SUBMITTED",
  "ASSIGNED",
  "QUOTED",
  "REJECTED",
  "CLOSED",
]);
export const dealHealthStatusEnum = pgEnum("deal_health_status", [
  "HEALTHY",
  "WATCH",
  "CRITICAL",
]);

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  role: userRoleEnum("role").notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const authSessions = pgTable("auth_sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  userAgent: text("user_agent"),
  ipAddress: text("ip_address"),
  expiresAt: timestamp("expires_at").notNull(),
  revokedAt: timestamp("revoked_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [index("auth_sessions_user_id_idx").on(table.userId)]);

export const refreshTokens = pgTable("refresh_tokens", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").references(() => authSessions.id, { onDelete: "cascade" }).notNull(),
  tokenHash: text("token_hash").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  revokedAt: timestamp("revoked_at"),
  replacedByTokenId: text("replaced_by_token_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [index("refresh_tokens_session_id_idx").on(table.sessionId)]);

export const authLoginAttempts = pgTable("auth_login_attempts", {
  id: text("id").primaryKey(),
  identifierHash: text("identifier_hash").notNull().unique(),
  attempts: integer("attempts").default(0).notNull(),
  windowStartedAt: timestamp("window_started_at").defaultNow().notNull(),
  blockedUntil: timestamp("blocked_until"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const customers = pgTable("customers", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }).unique(),
  name: text("name").notNull(),
  tier: customerTierEnum("tier").default("BRONZE").notNull(),
  contactEmail: text("contact_email").notNull().unique(),
  industry: text("industry"),
  accountManagerId: text("account_manager_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const categories = pgTable("categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const products = pgTable("products", {
  metadata: jsonb("metadata").$type<{status?: 'ACTIVE'|'DRAFT'|'ARCHIVED';variants?: Array<{id:string;name:string;sku:string;color?:string;ram?:string;manufacturer?:string;priceAdjustment:number;availableStock:number}>}>().default({}).notNull(),
  id: text("id").primaryKey(),
  sku: text("sku").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  categoryId: text("category_id")
    .references(() => categories.id)
    .notNull(),
  baseCost: numeric("base_cost").notNull(),
  isRecurring: boolean("is_recurring").default(false).notNull(),
  subscriptionPlanId: text("subscription_plan_id"), // Will define foreign key later or manually due to circular refs if any
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const priceLists = pgTable("price_lists", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  currency: text("currency").default("USD").notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const priceListItems = pgTable("price_list_items", {
  id: text("id").primaryKey(),
  priceListId: text("price_list_id")
    .references(() => priceLists.id)
    .notNull(),
  productId: text("product_id")
    .references(() => products.id)
    .notNull(),
  unitPrice: numeric("unit_price").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const discountRules = pgTable("discount_rules", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  maxDiscountPct: numeric("max_discount_pct").notNull(),
  customerTier: customerTierEnum("customer_tier"),
  categoryId: text("category_id").references(() => categories.id),
  productId: text("product_id").references(() => products.id),
  userRole: userRoleEnum("user_role"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const approvalRules = pgTable("approval_rules", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  condition: text("condition").notNull(),
  thresholdValue: numeric("threshold_value").notNull(),
  requiredRole: userRoleEnum("required_role").notNull(),
  sequenceNumber: integer("sequence_number").default(1).notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const upsellRules = pgTable("upsell_rules", {
  id: text("id").primaryKey(),
  triggerProductId: text("trigger_product_id").references(() => products.id).notNull(),
  targetProductId: text("target_product_id").references(() => products.id).notNull(),
  type: text("type").notNull(),
  scoreWeight: integer("score_weight").default(1).notNull(),
  reason: text("reason"),
  estimatedRevenueDelta: numeric("estimated_revenue_delta").default("0").notNull(),
  estimatedMarginDelta: numeric("estimated_margin_delta").default("0").notNull(),
  coPurchaseScore: integer("co_purchase_score").default(0).notNull(),
  marginScore: integer("margin_score").default(0).notNull(),
  active: boolean("active").default(true).notNull(),
});

export const quoteRequests = pgTable("quote_requests", {
  id: text("id").primaryKey(),
  requestNumber: text("request_number").notNull().unique(),
  customerId: text("customer_id").references(() => customers.id).notNull(),
  assignedSalesExecId: text("assigned_sales_exec_id").references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  budget: numeric("budget"),
  targetDate: timestamp("target_date"),
  status: quoteRequestStatusEnum("status").default("SUBMITTED").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [index("quote_requests_customer_id_idx").on(table.customerId)]);

export const quoteRequestItems = pgTable("quote_request_items", {
  id: text("id").primaryKey(),
  quoteRequestId: text("quote_request_id").references(() => quoteRequests.id, { onDelete: "cascade" }).notNull(),
  productId: text("product_id").references(() => products.id),
  description: text("description").notNull(),
  quantity: integer("quantity").default(1).notNull(),
  requirements: jsonb("requirements"),
}, (table) => [index("quote_request_items_request_id_idx").on(table.quoteRequestId)]);

export const quotations = pgTable("quotations", {
  title:text("title"),
  id: text("id").primaryKey(),
  quoteRequestId: text("quote_request_id").references(() => quoteRequests.id).unique(),
  quoteNumber: text("quote_number").notNull().unique(),
  customerId: text("customer_id")
    .references(() => customers.id)
    .notNull(),
  salesExecId: text("sales_exec_id")
    .references(() => users.id)
    .notNull(),
  priceListId: text("price_list_id")
    .references(() => priceLists.id)
    .notNull(),
  currency: text("currency").notNull(),
  status: quoteStatusEnum("status").default("DRAFT").notNull(),
  validityDate: timestamp("validity_date").notNull(),
  paymentTerms: text("payment_terms"),
  subtotal: numeric("subtotal").default("0").notNull(),
  totalDiscount: numeric("total_discount").default("0").notNull(),
  taxAmount: numeric("tax_amount").default("0").notNull(),
  totalAmount: numeric("total_amount").default("0").notNull(),
  totalCost: numeric("total_cost").default("0").notNull(),
  totalProfit: numeric("total_profit").default("0").notNull(),
  marginPercentage: numeric("margin_percentage").default("0").notNull(),
  riskScore: integer("risk_score").default(0).notNull(),
  riskLevel: riskLevelEnum("risk_level").default("LOW").notNull(),
  riskReasons: jsonb("risk_reasons"),
  approvalStatus: approvalStatusEnum("approval_status")
    .default("NOT_REQUIRED")
    .notNull(),
  version: integer("version").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const quotationLines = pgTable("quotation_lines", {
  id: text("id").primaryKey(),
  quotationId: text("quotation_id")
    .references(() => quotations.id, { onDelete: "cascade" })
    .notNull(),
  productId: text("product_id")
    .references(() => products.id)
    .notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: numeric("unit_price").notNull(),
  unitCost: numeric("unit_cost").notNull(),
  discountPercentage: numeric("discount_percentage").default("0").notNull(),
  discountAmount: numeric("discount_amount").default("0").notNull(),
  discountStatus: discountStatusEnum("discount_status")
    .default("COMPLIANT")
    .notNull(),
  excessDiscountPct: numeric("excess_discount_pct").default("0").notNull(),
  grossAmount: numeric("gross_amount").default("0").notNull(),
  netAmount: numeric("net_amount").default("0").notNull(),
  lineCost: numeric("line_cost").default("0").notNull(),
  lineProfit: numeric("line_profit").default("0").notNull(),
  lineMarginPercentage: numeric("line_margin_percentage")
    .default("0")
    .notNull(),
  isRecurring: boolean("is_recurring").default(false).notNull(),
  subscriptionPlanId: text("subscription_plan_id"),
});

export const quotationVersions = pgTable("quotation_versions", {
  id: text("id").primaryKey(),
  quotationId: text("quotation_id").references(() => quotations.id, { onDelete: "cascade" }).notNull(),
  version: integer("version").notNull(),
  snapshot: jsonb("snapshot").notNull(),
  reason: text("reason").notNull(),
  createdById: text("created_by_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [index("quotation_versions_quotation_id_idx").on(table.quotationId)]);

export const approvalRequests = pgTable("approval_requests", {
  id: text("id").primaryKey(),
  quotationId: text("quotation_id")
    .references(() => quotations.id, { onDelete: "cascade" })
    .notNull(),
  status: approvalStatusEnum("status").default("PENDING").notNull(),
  kind: approvalKindEnum("kind").default("INITIAL").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const approvalSteps = pgTable("approval_steps", {
  id: text("id").primaryKey(),
  requestId: text("request_id")
    .references(() => approvalRequests.id, { onDelete: "cascade" })
    .notNull(),
  ruleId: text("rule_id")
    .references(() => approvalRules.id),
  requiredRole: userRoleEnum("required_role").notNull(),
  sequence: integer("sequence").notNull(),
  status: approvalStatusEnum("status").default("PENDING").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const approvalDecisions = pgTable("approval_decisions", {
  id: text("id").primaryKey(),
  stepId: text("step_id")
    .references(() => approvalSteps.id, { onDelete: "cascade" })
    .notNull(),
  userId: text("user_id")
    .references(() => users.id)
    .notNull(),
  action: text("action").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const warehouses = pgTable("warehouses", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location").notNull(),
  shippingCost: numeric("shipping_cost").default("0").notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const inventory = pgTable("inventory", {
  id: text("id").primaryKey(),
  warehouseId: text("warehouse_id")
    .references(() => warehouses.id)
    .notNull(),
  productId: text("product_id")
    .references(() => products.id)
    .notNull(),
  quantityAvailable: integer("quantity_available").default(0).notNull(),
  quantityReserved: integer("quantity_reserved").default(0).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const salesOrders = pgTable("sales_orders", {
  id: text("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  quotationId: text("quotation_id").references(() => quotations.id).notNull().unique(),
  customerId: text("customer_id").references(() => customers.id).notNull(),
  status: orderStatusEnum("status").default("CONFIRMED").notNull(),
  confirmedAt: timestamp("confirmed_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [index("sales_orders_customer_id_idx").on(table.customerId)]);

export const fulfillments = pgTable("fulfillments", {
  id: text("id").primaryKey(),
  orderId: text("order_id").references(() => salesOrders.id).unique(),
  quotationId: text("quotation_id")
    .references(() => quotations.id)
    .notNull(),
  status: fulfillmentStatusEnum("status").default("PENDING").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const fulfillmentAllocations = pgTable("fulfillment_allocations", {
  id: text("id").primaryKey(),
  fulfillmentId: text("fulfillment_id")
    .references(() => fulfillments.id, { onDelete: "cascade" })
    .notNull(),
  warehouseId: text("warehouse_id")
    .references(() => warehouses.id)
    .notNull(),
  productId: text("product_id").notNull(),
  allocatedQty: integer("allocated_qty").notNull(),
  shippedQty: integer("shipped_qty").default(0).notNull(),
  isManualOverride: boolean("is_manual_override").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const backorders = pgTable("backorders", {
  id: text("id").primaryKey(),
  fulfillmentId: text("fulfillment_id")
    .references(() => fulfillments.id, { onDelete: "cascade" })
    .notNull(),
  productId: text("product_id").notNull(),
  requiredQty: integer("required_qty").notNull(),
  backorderedQty: integer("backordered_qty").notNull(),
  status: text("status").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const subscriptionPlans = pgTable("subscription_plans", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  billingCycle: billingCycleEnum("billing_cycle").notNull(),
  price: numeric("price").notNull(),
});

export const subscriptions = pgTable("subscriptions", {
  id: text("id").primaryKey(),
  orderId: text("order_id").references(() => salesOrders.id),
  quotationLineId: text("quotation_line_id").references(() => quotationLines.id),
  customerId: text("customer_id")
    .references(() => customers.id)
    .notNull(),
  planId: text("plan_id")
    .references(() => subscriptionPlans.id)
    .notNull(),
  quantity: integer("quantity").notNull(),
  recurringAmt: numeric("recurring_amt").notNull(),
  status: subscriptionStatusEnum("status").default("ACTIVE").notNull(),
  startDate: timestamp("start_date").notNull(),
  nextBillingDate: timestamp("next_billing_date").notNull(),
  canceledAt: timestamp("canceled_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const invoices = pgTable("invoices", {
  id: text("id").primaryKey(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  customerId: text("customer_id")
    .references(() => customers.id)
    .notNull(),
  quotationId: text("quotation_id").references(() => quotations.id),
  orderId: text("order_id").references(() => salesOrders.id),
  status: invoiceStatusEnum("status").default("DRAFT").notNull(),
  dueDate: timestamp("due_date").notNull(),
  subtotal: numeric("subtotal").notNull(),
  tax: numeric("tax").notNull(),
  total: numeric("total").notNull(),
  amountDue: numeric("amount_due").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const invoiceLines = pgTable("invoice_lines", {
  id: text("id").primaryKey(),
  invoiceId: text("invoice_id")
    .references(() => invoices.id, { onDelete: "cascade" })
    .notNull(),
  description: text("description").notNull(),
  amount: numeric("amount").notNull(),
  isRecurring: boolean("is_recurring").default(false).notNull(),
});

export const payments = pgTable("payments", {
  id: text("id").primaryKey(),
  invoiceId: text("invoice_id")
    .references(() => invoices.id)
    .notNull(),
  amount: numeric("amount").notNull(),
  status: paymentStatusEnum("status").default("CREATED").notNull(),
  paymentMethod: text("payment_method"),
  gatewayReference: text("gateway_reference"),
  gatewayOrderId: text("gateway_order_id"),
  gatewayPaymentId: text("gateway_payment_id"),
  signatureVerified: boolean("signature_verified").default(false).notNull(),
  failureReason: text("failure_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const creditNotes = pgTable("credit_notes", {
  id: text("id").primaryKey(),
  customerId: text("customer_id")
    .references(() => customers.id)
    .notNull(),
  amount: numeric("amount").notNull(),
  reason: text("reason").notNull(),
  status: text("status").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const negotiations = pgTable("negotiations", {
  id: text("id").primaryKey(),
  quotationId: text("quotation_id")
    .references(() => quotations.id)
    .notNull(),
  customerId: text("customer_id")
    .references(() => customers.id)
    .notNull(),
  requestType: negotiationTypeEnum("request_type").notNull(),
  submittedById: text("submitted_by_id").references(() => users.id).notNull(),
  status: negotiationStatusEnum("status").default("OPEN").notNull(),
  customerNotes: text("customer_notes"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const negotiationChanges = pgTable("negotiation_changes", {
  id: text("id").primaryKey(),
  negotiationId: text("negotiation_id")
    .references(() => negotiations.id, { onDelete: "cascade" })
    .notNull(),
  quotationLineId: text("quotation_line_id")
    .references(() => quotationLines.id)
    .notNull(),
  fieldChanged: text("field_changed").notNull(),
  originalValue: numeric("original_value").notNull(),
  requestedValue: numeric("requested_value").notNull(),
  status: text("status").notNull(),
});

export const dealHealth = pgTable("deal_health", {
  id: text("id").primaryKey(),
  quotationId: text("quotation_id")
    .references(() => quotations.id, { onDelete: "cascade" })
    .notNull()
    .unique(),
  healthScore: integer("health_score").default(100).notNull(),
  status: dealHealthStatusEnum("status").default("HEALTHY").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const dealHealthEvents = pgTable("deal_health_events", {
  id: text("id").primaryKey(),
  dealHealthId: text("deal_health_id")
    .references(() => dealHealth.id, { onDelete: "cascade" })
    .notNull(),
  type: text("type").notNull(),
  riskImpact: integer("risk_impact").notNull(),
  reason: text("reason").notNull(),
  resolved: boolean("resolved").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const upsellRecommendations = pgTable("upsell_recommendations", {
  id: text("id").primaryKey(),
  quotationId: text("quotation_id").references(() => quotations.id, { onDelete: "cascade" }).notNull(),
  productId: text("product_id")
    .references(() => products.id)
    .notNull(),
  reason: text("reason").notNull(),
  score: integer("score").notNull(),
  marginDelta: numeric("margin_delta").notNull(),
  revenueDelta: numeric("revenue_delta").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const auditLogs = pgTable("audit_logs", {
  id: text("id").primaryKey(),
  actorId: text("actor_id"), // Might be null for system actions
  actorRole: text("actor_role"),
  entity: text("entity").notNull(),
  entityId: text("entity_id").notNull(),
  action: text("action").notNull(),
  previousValue: jsonb("previous_value"),
  newValue: jsonb("new_value"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  type: text("type").notNull(),
  message: text("message").notNull(),
  read: boolean("read").default(false).notNull(),
  linkUrl: text("link_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const systemConfigs = pgTable("system_configs", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: jsonb("value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
