import { and, eq, desc } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { z } from "zod";
import { db } from "@/db";
import {
  products,
  categories,
  priceListItems,
  priceLists,
  customers,
  inventory,
  warehouses,
  discountRules,
  auditLogs,
  subscriptionPlans,
} from "@/db/schema";
import { requireAuth, requirePermission } from "@/lib/auth/rbac";
import { AuthorizationError, BusinessError } from "@/lib/errors";
import { recordAudit } from "@/features/audit/service";
export async function catalog() {
  const user = await requireAuth();
  const rows = await db
    .select({
      product: products,
      category: categories,
      price: priceListItems,
      list: priceLists,
      plan: subscriptionPlans,
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .innerJoin(priceListItems, eq(products.id, priceListItems.productId))
    .innerJoin(priceLists, eq(priceListItems.priceListId, priceLists.id))
    .leftJoin(
      subscriptionPlans,
      eq(products.subscriptionPlanId, subscriptionPlans.id),
    )
    .where(eq(priceLists.active, true));
  const stock = (
    await db
      .select({ stock: inventory })
      .from(inventory)
      .innerJoin(warehouses, eq(inventory.warehouseId, warehouses.id))
      .where(eq(warehouses.active, true))
  ).map((row) => row.stock);
  const seen = new Set<string>();
  return rows
    .filter((row) => {
      if (
        user.role !== "ADMIN" &&
        (row.product.metadata.status ?? "ACTIVE") !== "ACTIVE"
      )
        return false;
      if (seen.has(row.product.id)) return false;
      seen.add(row.product.id);
      return true;
    })
    .map(({ product, category, price, list, plan }) => ({
      status: product.metadata.status ?? "ACTIVE",
      variants: product.metadata.variants ?? [],
      id: product.id,
      name: product.name,
      sku: product.sku,
      baseCost: user.role === "CUSTOMER" ? undefined : product.baseCost,
      description: product.description,
      categoryId: category.id,
      categoryName: category.name,
      unitPrice: price.unitPrice,
      currency: list.currency,
      priceListId: list.id,
      isRecurring: product.isRecurring,
      billingFrequency: plan?.billingCycle,
      recurringPrice: product.isRecurring ? price.unitPrice : undefined,
      availableStock: stock
        .filter((i) => i.productId === product.id)
        .reduce((n, i) => n + i.quantityAvailable - i.quantityReserved, 0),
    }));
}
export async function customerDirectory() {
  const user = await requireAuth();
  return db
    .select()
    .from(customers)
    .where(
      user.role === "CUSTOMER"
        ? eq(customers.id, user.customerId ?? "")
        : undefined,
    );
}
export async function warehouseStock() {
  const user = await requireAuth();
  if (user.role === "CUSTOMER") throw new AuthorizationError();
  const rows = await db
    .select({ stock: inventory, warehouse: warehouses, product: products })
    .from(inventory)
    .innerJoin(warehouses, eq(inventory.warehouseId, warehouses.id))
    .innerJoin(products, eq(inventory.productId, products.id))
    .where(eq(warehouses.active, true));
  return rows.map(({ stock, warehouse, product }) => ({
    ...stock,
    warehouseName: warehouse.name,
    location: warehouse.location,
    productName: product.name,
  }));
}
export async function policies() {
  await requireAuth();
  return db.select().from(discountRules).where(eq(discountRules.active, true));
}
export async function policyAudit() {
  await requirePermission("MANAGE_PRICING");
  return db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.entity, "DiscountPolicy"))
    .orderBy(desc(auditLogs.createdAt));
}
export async function savePolicies(input: unknown) {
  const user = await requirePermission("MANAGE_PRICING");
  const percent = z.number().min(0).max(100);
  const values = z
    .object({
      tierLimits: z.object({ Bronze: percent, Silver: percent, Gold: percent }),
      categoryLimits: z.object({ Hardware: percent, Services: percent }),
      reason: z.string().optional(),
    })
    .strict()
    .parse(input);
  const previous = await policies();
  const categoryRows = await db.select().from(categories);
  const changes = [
    ...Object.entries(values.tierLimits).map(([tier, value]) => ({
      name: tier + " tier",
      customerTier: tier.toUpperCase() as "BRONZE" | "SILVER" | "GOLD",
      maxDiscountPct: String(value),
      categoryId: null as string | null,
    })),
    ...categoryRows.map((category) => ({
      name: category.name + " category",
      categoryId: category.id,
      customerTier: null,
      maxDiscountPct: String(
        category.name.toLowerCase().includes("hardware")
          ? values.categoryLimits.Hardware
          : values.categoryLimits.Services,
      ),
    })),
  ];
  for (const change of changes) {
    const existing = previous.find(
      (rule) =>
        rule.customerTier === change.customerTier &&
        rule.categoryId === change.categoryId &&
        !rule.productId &&
        !rule.userRole,
    );
    if (existing)
      await db
        .update(discountRules)
        .set(change)
        .where(eq(discountRules.id, existing.id));
    else await db.insert(discountRules).values({ id: uuid(), ...change });
  }
  await recordAudit({
    actorId: user.userId,
    actorRole: user.role,
    entity: "DiscountPolicy",
    entityId: "policy",
    action: "UPDATE_POLICY",
    previousValue: previous,
    newValue: values,
  });
  return policies();
}

export async function saveCatalogProduct(input: unknown) {
  const user = await requirePermission("MANAGE_PRODUCTS");
  const values = z
    .object({
      status: z.enum(["ACTIVE", "DRAFT", "ARCHIVED"]).optional(),
      variants: z
        .array(
          z
            .object({
              id: z.string(),
              name: z.string().trim().min(1),
              sku: z.string().trim().min(1),
              color: z.string().optional(),
              ram: z.string().optional(),
              manufacturer: z.string().optional(),
              priceAdjustment: z.number().finite(),
              availableStock: z.number().int().nonnegative(),
            })
            .strict(),
        )
        .optional(),
      id: z.string().optional(),
      name: z.string().trim().min(2),
      sku: z.string().trim().min(1),
      description: z.string().optional(),
      category: z.enum(["Hardware", "Services"]),
      basePrice: z.number().positive(),
      baseCost: z.number().nonnegative().optional(),
      currency: z.enum(["USD", "EUR"]),
      isSubscription: z.boolean().optional(),
      billingFrequency: z
        .enum(["NONE", "MONTHLY", "QUARTERLY", "ANNUAL"])
        .optional(),
      availableStock: z.number().int().nonnegative().optional(),
    })
    .strict()
    .parse(input);
  const [existing] = values.id
    ? await db
        .select()
        .from(products)
        .where(eq(products.id, values.id))
        .limit(1)
    : [];
  if (!existing && values.baseCost === undefined)
    throw new BusinessError(
      "Enter the purchase cost used for margin analysis",
      "COST_REQUIRED",
      400,
    );
  const [category] = await db
    .select()
    .from(categories)
    .where(eq(categories.name, values.category))
    .limit(1);
  if (!category)
    throw new BusinessError(
      "Configure the product category first",
      "CATEGORY_REQUIRED",
      400,
    );
  const [list] = await db
    .select()
    .from(priceLists)
    .where(
      and(
        eq(priceLists.currency, values.currency),
        eq(priceLists.active, true),
      ),
    )
    .limit(1);
  if (!list)
    throw new BusinessError(
      "No active price list exists for this currency",
      "PRICE_LIST_REQUIRED",
      400,
    );
  const id = existing?.id ?? uuid();
  let planId = existing?.subscriptionPlanId ?? null;
  if (values.isSubscription) {
    if (!values.billingFrequency || values.billingFrequency === "NONE")
      throw new BusinessError(
        "Choose a recurring billing frequency",
        "BILLING_CYCLE_REQUIRED",
        400,
      );
    const [previousPlan] = planId
      ? await db
          .select()
          .from(subscriptionPlans)
          .where(eq(subscriptionPlans.id, planId))
          .limit(1)
      : [];
    if (
      !previousPlan ||
      previousPlan.billingCycle !== values.billingFrequency
    ) {
      planId = uuid();
      await db.insert(subscriptionPlans).values({
        id: planId,
        name: values.name,
        billingCycle: values.billingFrequency,
        price: String(values.basePrice),
      });
    }
  }
  const product = {
    metadata: {
      ...existing?.metadata,
      status: values.status ?? existing?.metadata.status ?? "ACTIVE",
      variants: values.variants ?? existing?.metadata.variants ?? [],
    },
    name: values.name,
    sku: values.sku,
    description: values.description,
    categoryId: category.id,
    baseCost: String(values.baseCost ?? existing!.baseCost),
    isRecurring: values.isSubscription ?? false,
    subscriptionPlanId: values.isSubscription ? planId : null,
    updatedAt: new Date(),
  };
  if (existing)
    await db.update(products).set(product).where(eq(products.id, id));
  else await db.insert(products).values({ id, ...product });
  const [price] = await db
    .select()
    .from(priceListItems)
    .where(
      and(
        eq(priceListItems.productId, id),
        eq(priceListItems.priceListId, list.id),
      ),
    )
    .limit(1);
  if (price)
    await db
      .update(priceListItems)
      .set({ unitPrice: String(values.basePrice), updatedAt: new Date() })
      .where(eq(priceListItems.id, price.id));
  else
    await db.insert(priceListItems).values({
      id: uuid(),
      priceListId: list.id,
      productId: id,
      unitPrice: String(values.basePrice),
    });
  if (
    !existing &&
    !values.isSubscription &&
    values.category === "Hardware" &&
    (values.availableStock ?? 0) > 0
  ) {
    const [warehouse] = await db
      .select()
      .from(warehouses)
      .where(eq(warehouses.active, true))
      .limit(1);
    if (!warehouse)
      throw new BusinessError(
        "Configure a warehouse before adding opening stock",
        "WAREHOUSE_REQUIRED",
        400,
      );
    await db.insert(inventory).values({
      id: uuid(),
      warehouseId: warehouse.id,
      productId: id,
      quantityAvailable: values.availableStock!,
      quantityReserved: 0,
    });
  }
  await recordAudit({
    actorId: user.userId,
    actorRole: user.role,
    entity: "Product",
    entityId: id,
    action: existing ? "UPDATE_PRODUCT" : "CREATE_PRODUCT",
  });
  return (await catalog()).find((p) => p.id === id);
}
export async function pricingLists() {
  await requireAuth();
  const lists = await db.select().from(priceLists);
  const rows = await db
    .select({ price: priceListItems, product: products })
    .from(priceListItems)
    .innerJoin(products, eq(priceListItems.productId, products.id));
  return lists.map((list) => ({
    ...list,
    items: rows
      .filter((row) => row.price.priceListId === list.id)
      .map(({ price, product }) => ({
        ...price,
        productName: product.name,
        sku: product.sku,
      })),
  }));
}
export async function changePrice(input: unknown) {
  const user = await requirePermission("MANAGE_PRICING");
  const values = z
    .object({ id: z.string(), unitPrice: z.number().positive() })
    .strict()
    .parse(input);
  const [old] = await db
    .select()
    .from(priceListItems)
    .where(eq(priceListItems.id, values.id))
    .limit(1);
  if (!old) throw new BusinessError("Price item not found", "NOT_FOUND", 404);
  const [saved] = await db
    .update(priceListItems)
    .set({ unitPrice: String(values.unitPrice), updatedAt: new Date() })
    .where(eq(priceListItems.id, values.id))
    .returning();
  await recordAudit({
    actorId: user.userId,
    actorRole: user.role,
    entity: "PriceListItem",
    entityId: values.id,
    action: "UPDATE_PRICE",
    previousValue: old,
    newValue: saved,
  });
  return saved;
}

export async function adjustStock(input: unknown) {
  const user = await requirePermission("MANAGE_PRODUCTS");
  const value = z
    .object({
      productId: z.string(),
      availableStock: z.number().int().nonnegative(),
      expectedAvailableStock: z.number().int().nonnegative(),
    })
    .strict()
    .parse(input);
  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, value.productId))
    .limit(1);
  if (!product || product.isRecurring)
    throw new BusinessError(
      "Select a physical product",
      "INVALID_PRODUCT",
      400,
    );
  const rows = await db
    .select({ stock: inventory })
    .from(inventory)
    .innerJoin(warehouses, eq(inventory.warehouseId, warehouses.id))
    .where(
      and(
        eq(inventory.productId, value.productId),
        eq(warehouses.active, true),
      ),
    );
  const current = rows.reduce(
    (n, { stock }) => n + stock.quantityAvailable - stock.quantityReserved,
    0,
  );
  if (current !== value.expectedAvailableStock)
    throw new BusinessError(
      "Stock changed. Refresh the product before adjusting it.",
      "STALE_STOCK",
      409,
    );
  let delta = value.availableStock - current;
  if (delta > 0) {
    if (rows.length)
      await db
        .update(inventory)
        .set({ quantityAvailable: rows[0].stock.quantityAvailable + delta })
        .where(eq(inventory.id, rows[0].stock.id));
    else {
      const [warehouse] = await db
        .select()
        .from(warehouses)
        .where(eq(warehouses.active, true))
        .limit(1);
      if (!warehouse)
        throw new BusinessError(
          "Configure an active warehouse first",
          "WAREHOUSE_REQUIRED",
          400,
        );
      await db.insert(inventory).values({
        id: uuid(),
        productId: value.productId,
        warehouseId: warehouse.id,
        quantityAvailable: delta,
        quantityReserved: 0,
      });
    }
  } else
    for (const { stock } of rows) {
      const take = Math.min(
        -delta,
        stock.quantityAvailable - stock.quantityReserved,
      );
      if (take > 0) {
        await db
          .update(inventory)
          .set({ quantityAvailable: stock.quantityAvailable - take })
          .where(eq(inventory.id, stock.id));
        delta += take;
      }
    }
  await recordAudit({
    actorId: user.userId,
    actorRole: user.role,
    entity: "Product",
    entityId: value.productId,
    action: "ADJUST_STOCK",
    previousValue: { availableStock: current },
    newValue: { availableStock: value.availableStock },
  });
  return { availableStock: value.availableStock };
}
