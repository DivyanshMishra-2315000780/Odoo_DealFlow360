import { and, eq, desc } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';
import { z } from 'zod';
import { db } from '@/db';
import { products, categories, priceListItems, priceLists, customers, inventory, warehouses, discountRules, auditLogs, subscriptionPlans } from '@/db/schema';
import { requireAuth, requirePermission } from '@/lib/auth/rbac';
import { AuthorizationError } from '@/lib/errors';
import { recordAudit } from '@/features/audit/service';
export async function catalog() {
  await requireAuth();
  const rows = await db.select({product:products, category:categories, price:priceListItems, list:priceLists, plan:subscriptionPlans}).from(products)
    .innerJoin(categories,eq(products.categoryId,categories.id)).innerJoin(priceListItems,eq(products.id,priceListItems.productId))
    .innerJoin(priceLists,eq(priceListItems.priceListId,priceLists.id)).leftJoin(subscriptionPlans,eq(products.subscriptionPlanId,subscriptionPlans.id))
    .where(eq(priceLists.active,true));
  const stock = await db.select().from(inventory);
  const seen = new Set<string>();
  return rows.filter(row=>{if(seen.has(row.product.id))return false;seen.add(row.product.id);return true;}).map(({product,category,price,list,plan})=>({
    id:product.id,name:product.name,sku:product.sku,description:product.description,categoryId:category.id,categoryName:category.name,
    unitPrice:price.unitPrice,currency:list.currency,priceListId:list.id,isRecurring:product.isRecurring,billingFrequency:plan?.billingCycle,
    recurringPrice:product.isRecurring?price.unitPrice:undefined,availableStock:stock.filter(i=>i.productId===product.id).reduce((n,i)=>n+i.quantityAvailable-i.quantityReserved,0),
  }));
}
export async function customerDirectory() {
  const user=await requireAuth();
  return db.select().from(customers).where(user.role==='CUSTOMER'?eq(customers.id,user.customerId??''):undefined);
}
export async function warehouseStock() {
  const user=await requireAuth();
  if(user.role==='CUSTOMER')throw new AuthorizationError();
  const rows=await db.select({stock:inventory,warehouse:warehouses,product:products}).from(inventory)
    .innerJoin(warehouses,eq(inventory.warehouseId,warehouses.id)).innerJoin(products,eq(inventory.productId,products.id)).where(eq(warehouses.active,true));
  return rows.map(({stock,warehouse,product})=>({...stock,warehouseName:warehouse.name,location:warehouse.location,productName:product.name}));
}
export async function policies() { await requireAuth(); return db.select().from(discountRules).where(eq(discountRules.active,true)); }
export async function policyAudit() { await requirePermission('MANAGE_PRICING');return db.select().from(auditLogs).where(eq(auditLogs.entity,'DiscountPolicy')).orderBy(desc(auditLogs.createdAt)); }
export async function savePolicies(input:unknown) {
  const user=await requirePermission('MANAGE_PRICING');
  const percent=z.number().min(0).max(100);
  const values=z.object({tierLimits:z.object({Bronze:percent,Silver:percent,Gold:percent}),categoryLimits:z.object({Hardware:percent,Services:percent}),reason:z.string().optional()}).strict().parse(input);
  const previous=await policies();
  const categoryRows=await db.select().from(categories);
  const changes=[...Object.entries(values.tierLimits).map(([tier,value])=>({name:tier+' tier',customerTier:tier.toUpperCase() as 'BRONZE'|'SILVER'|'GOLD',maxDiscountPct:String(value),categoryId:null as string|null})),
    ...categoryRows.map(category=>({name:category.name+' category',categoryId:category.id,customerTier:null,maxDiscountPct:String(category.name.toLowerCase().includes('hardware')?values.categoryLimits.Hardware:values.categoryLimits.Services)}))];
  for(const change of changes){
    const existing=previous.find(rule=>rule.customerTier===change.customerTier&&rule.categoryId===change.categoryId&&!rule.productId&&!rule.userRole);
    if(existing)await db.update(discountRules).set(change).where(eq(discountRules.id,existing.id));
    else await db.insert(discountRules).values({id:uuid(),...change});
  }
  await recordAudit({actorId:user.userId,actorRole:user.role,entity:'DiscountPolicy',entityId:'policy',action:'UPDATE_POLICY',previousValue:previous,newValue:values});
  return policies();
}
