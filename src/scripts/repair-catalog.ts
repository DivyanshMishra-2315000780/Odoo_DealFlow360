import 'dotenv/config';
import { and,eq,isNull } from 'drizzle-orm';
import { db,withTransaction } from '../db';
import { products,subscriptionPlans,priceListItems } from '../db/schema';
// Restore only missing links on the two known seeded recurring products.
async function main(){await withTransaction(async()=>{
 for(const [productId,planId] of [['prd-extwar','sp-extwar'],['prd-care','sp-care']]){
  const [product]=await db.select().from(products).where(and(eq(products.id,productId),eq(products.isRecurring,true),isNull(products.subscriptionPlanId))).limit(1);
  if(!product)continue;
  const [price]=await db.select().from(priceListItems).where(eq(priceListItems.productId,productId)).limit(1);
  if(!price)throw new Error('Configure a selling price before repairing '+productId);
  await db.insert(subscriptionPlans).values({id:planId,name:product.name,billingCycle:'MONTHLY',price:price.unitPrice}).onConflictDoNothing();
  await db.update(products).set({subscriptionPlanId:planId}).where(and(eq(products.id,productId),isNull(products.subscriptionPlanId)));
  console.log('Linked missing subscription plan for '+productId);
 }
});
}
main().then(()=>process.exit(0)).catch(error=>{console.error(error.message);process.exit(1);});
