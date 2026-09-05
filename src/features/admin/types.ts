import { z } from 'zod';

const decimal = z.union([z.string(), z.number()]).transform(String);
const role = z.enum(['CUSTOMER', 'ADMIN', 'SALES_MANAGER', 'SALES_EXECUTIVE', 'FINANCE_OFFICER']);
const tier = z.enum(['BRONZE', 'SILVER', 'GOLD']);
const billingCycle = z.enum(['MONTHLY', 'QUARTERLY', 'ANNUAL', 'ONE_TIME']);

export const adminCreateSchemas = {
  approvalRules: z.object({
    name: z.string().min(1), condition: z.string().min(1), thresholdValue: decimal,
    requiredRole: role, sequenceNumber: z.number().int().positive().optional(), active: z.boolean().optional(),
  }).strict(),
  categories: z.object({ name: z.string().min(1), description: z.string().nullable().optional() }).strict(),
  customers: z.object({
    name: z.string().min(1), tier: tier.optional(), contactEmail: z.email(),
    industry: z.string().nullable().optional(), accountManagerId: z.string().nullable().optional(),
    userId: z.string().nullable().optional(),
  }).strict(),
  discountRules: z.object({
    name: z.string().min(1), maxDiscountPct: decimal, customerTier: tier.nullable().optional(),
    categoryId: z.string().nullable().optional(), productId: z.string().nullable().optional(),
    userRole: role.nullable().optional(), active: z.boolean().optional(),
  }).strict(),
  priceLists: z.object({ name: z.string().min(1), currency: z.string().length(3).optional(), active: z.boolean().optional() }).strict(),
  products: z.object({
    sku: z.string().min(1), name: z.string().min(1), description: z.string().nullable().optional(),
    categoryId: z.string().min(1), baseCost: decimal, isRecurring: z.boolean().optional(),
    subscriptionPlanId: z.string().nullable().optional(),
  }).strict(),
  subscriptionPlans: z.object({ name: z.string().min(1), billingCycle, price: decimal }).strict(),
  users: z.object({
    email: z.email(), password: z.string().min(8).optional(), firstName: z.string().min(1),
    lastName: z.string().min(1), role, active: z.boolean().optional(), companyName: z.string().min(1).optional(),
  }).strict(),
  warehouses: z.object({
    name: z.string().min(1), location: z.string().min(1), shippingCost: decimal.optional(), active: z.boolean().optional(),
  }).strict(),
};

export type AdminResource = keyof typeof adminCreateSchemas;
export type AdminCreateInput<R extends AdminResource> = z.infer<(typeof adminCreateSchemas)[R]>;

export function parseAdminCreate<R extends AdminResource>(resource: R, input: unknown): AdminCreateInput<R> {
  return adminCreateSchemas[resource].parse(input) as AdminCreateInput<R>;
}

export function parseAdminUpdate<R extends AdminResource>(resource: R, input: unknown): Partial<AdminCreateInput<R>> {
  return adminCreateSchemas[resource].partial().parse(input) as Partial<AdminCreateInput<R>>;
}
