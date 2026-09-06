import 'dotenv/config';
import { db } from '../db/index';
import {
  users, categories, products, customers, priceLists, priceListItems,
  discountRules, approvalRules, upsellRules, warehouses, inventory,
  subscriptionPlans, authSessions, refreshTokens, authLoginAttempts,
  quoteRequests, quoteRequestItems, quotations, quotationLines,
  quotationVersions, approvalRequests, approvalSteps, approvalDecisions,
  salesOrders, fulfillments, fulfillmentAllocations, backorders,
  subscriptions, invoices, invoiceLines, payments, creditNotes,
  negotiations, negotiationChanges, dealHealth, dealHealthEvents,
  upsellRecommendations, auditLogs, notifications, systemConfigs
} from '../db/schema';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('Starting seed for DealFlow360 (Drizzle)...');

  console.log('Cleaning up existing data...');
  // Delete in reverse dependency order
  await db.delete(dealHealthEvents);
  await db.delete(dealHealth);
  await db.delete(negotiationChanges);
  await db.delete(negotiations);
  await db.delete(creditNotes);
  await db.delete(payments);
  await db.delete(invoiceLines);
  await db.delete(invoices);
  await db.delete(subscriptions);
  await db.delete(backorders);
  await db.delete(fulfillmentAllocations);
  await db.delete(fulfillments);
  await db.delete(salesOrders);
  await db.delete(approvalDecisions);
  await db.delete(approvalSteps);
  await db.delete(approvalRequests);
  await db.delete(quotationVersions);
  await db.delete(quotationLines);
  await db.delete(quotations);
  await db.delete(quoteRequestItems);
  await db.delete(quoteRequests);
  await db.delete(approvalRules);
  await db.delete(upsellRules);
  await db.delete(discountRules);
  await db.delete(priceListItems);
  await db.delete(priceLists);
  await db.delete(inventory);
  await db.delete(warehouses);
  await db.delete(products);
  await db.delete(subscriptionPlans);
  await db.delete(categories);
  await db.delete(customers);
  await db.delete(authLoginAttempts);
  await db.delete(refreshTokens);
  await db.delete(authSessions);
  await db.delete(users);

  console.log('Seeding Users...');
  const adminId = 'usr-admin-001';
  const salesMgrId = 'usr-sales-001';
  const salesExecId = 'usr-exec-001';
  const financeId = 'usr-fin-001';
  const customerUserId = 'usr-cust-001';

  await db.insert(users).values([
    {
      id: adminId,
      email: 'admin@dealflow360.com',
      passwordHash: await bcrypt.hash('admin123', 12),
      firstName: 'Arthur',
      lastName: 'Pendelton',
      role: 'ADMIN',
    },
    {
      id: salesMgrId,
      email: 'marcus@dealflow360.com',
      passwordHash: await bcrypt.hash('sales123', 12),
      firstName: 'Marcus',
      lastName: 'Vance',
      role: 'SALES_MANAGER',
    },
    {
      id: salesExecId,
      email: 'elena@dealflow360.com',
      passwordHash: await bcrypt.hash('exec123', 12),
      firstName: 'Elena',
      lastName: 'Rostova',
      role: 'SALES_EXECUTIVE',
    },
    {
      id: financeId,
      email: 'sarah.sterling@dealflow360.com',
      passwordHash: await bcrypt.hash('finance123', 12),
      firstName: 'Sarah',
      lastName: 'Sterling',
      role: 'FINANCE_OFFICER',
    },
    {
      id: customerUserId,
      email: 's.jenkins@acmecorp.com',
      passwordHash: await bcrypt.hash('acme123', 12),
      firstName: 'Sarah',
      lastName: 'Jenkins',
      role: 'CUSTOMER',
    },
  ]);

  console.log('Seeding Categories...');
  const catHwId = 'cat-hw';
  const catSvcId = 'cat-svc';
  await db.insert(categories).values([
    { id: catHwId, name: 'Hardware', description: 'Physical hardware and equipment' },
    { id: catSvcId, name: 'Services', description: 'Professional services and support plans' },
  ]);

  console.log('Seeding Subscription Plans...');
  const spStarterId = 'sp-starter';
  const spProId = 'sp-pro';
  const spEntId = 'sp-ent';
  await db.insert(subscriptionPlans).values([
    { id: 'sp-extwar', name: 'Extended Warranty Plus', billingCycle: 'MONTHLY', price: '199' },
    { id: 'sp-care', name: 'Care Plan 24/7', billingCycle: 'MONTHLY', price: '399' },
    { id: spStarterId, name: 'Starter', billingCycle: 'MONTHLY', price: '499' },
    { id: spProId, name: 'Professional', billingCycle: 'MONTHLY', price: '1499' },
    { id: spEntId, name: 'Enterprise', billingCycle: 'MONTHLY', price: '3999' },
  ]);

  console.log('Seeding Products...');
  const prdLp14Id = 'prd-lp14';
  const prdDockId = 'prd-dock';
  const prdOnsiteId = 'prd-onsite';
  const prdExtWarId = 'prd-extwar';
  const prdCareId = 'prd-care';
  const prdSecGwId = 'prd-secgw';

  await db.insert(products).values([
    { id: prdLp14Id, sku: 'LP14-001', name: 'Laptop Pro 14', categoryId: catHwId, baseCost: '720', isRecurring: false },
    { id: prdDockId, sku: 'TDS-002', name: 'Thunderbolt Docking Station', categoryId: catHwId, baseCost: '85', isRecurring: false },
    { id: prdOnsiteId, sku: 'OSI-003', name: 'Onsite Setup & Installation', categoryId: catSvcId, baseCost: '150', isRecurring: false },
    { id: prdExtWarId, sku: 'EWP-004', name: 'Extended Warranty Plus', categoryId: catSvcId, baseCost: '50', isRecurring: true, subscriptionPlanId: 'sp-extwar' },
    { id: prdCareId, sku: 'CP7-005', name: 'Care Plan 24/7', categoryId: catSvcId, baseCost: '200', isRecurring: true, subscriptionPlanId: 'sp-care' },
    { id: prdSecGwId, sku: 'ESG-006', name: 'Enterprise Security Gateway', categoryId: catHwId, baseCost: '1200', isRecurring: false },
  ]);

  console.log('Seeding Customers...');
  const custAcmeId = 'cust-acme';
  const custBetaId = 'cust-beta';
  const custNovaId = 'cust-nova';
  const custZenithId = 'cust-zenith';
  const custDeltaId = 'cust-delta';
  const custAbcId = 'cust-abc';

  await db.insert(customers).values([
    { id: custAcmeId, userId: customerUserId, name: 'Acme Corporation', tier: 'GOLD', industry: 'Technology', contactEmail: 'procurement@acmecorp.com', accountManagerId: salesExecId },
    { id: custBetaId, name: 'Beta Technologies', tier: 'SILVER', industry: 'Cloud Infrastructure', contactEmail: 'deals@betatech.io', accountManagerId: salesMgrId },
    { id: custNovaId, name: 'Nova Systems', tier: 'BRONZE', industry: 'IoT & Embedded', contactEmail: 'supply@novasystems.org', accountManagerId: salesExecId },
    { id: custZenithId, name: 'Zenith Industries', tier: 'GOLD', industry: 'Aerospace & Defense', contactEmail: 'operations@zenithind.com', accountManagerId: salesMgrId },
    { id: custDeltaId, name: 'Delta Solutions', tier: 'SILVER', industry: 'Financial Services', contactEmail: 'finance@deltasolutions.net', accountManagerId: salesMgrId },
    { id: custAbcId, name: 'ABC Manufacturing', tier: 'SILVER', industry: 'Manufacturing & Supply Chain', contactEmail: 'procurement@abcmfg.com', accountManagerId: salesMgrId },
  ]);

  console.log('Seeding Price Lists...');
  const priceListId = 'pl-std-2026';
  await db.insert(priceLists).values({
    id: priceListId, name: 'Standard Commercial 2026', currency: 'USD', active: true
  });

  await db.insert(priceListItems).values([
    { id: 'pli-1', priceListId, productId: prdLp14Id, unitPrice: '1299.00' },
    { id: 'pli-2', priceListId, productId: prdDockId, unitPrice: '249.00' },
    { id: 'pli-3', priceListId, productId: prdOnsiteId, unitPrice: '599.00' },
    { id: 'pli-4', priceListId, productId: prdExtWarId, unitPrice: '199.00' },
    { id: 'pli-5', priceListId, productId: prdCareId, unitPrice: '399.00' },
    { id: 'pli-6', priceListId, productId: prdSecGwId, unitPrice: '2899.00' },
  ]);

  console.log('Seeding Discount Rules...');
  await db.insert(discountRules).values([
    { id: 'dr-1', name: 'Bronze Tier Default', maxDiscountPct: '5.00', customerTier: 'BRONZE', active: true },
    { id: 'dr-2', name: 'Silver Tier Default', maxDiscountPct: '10.00', customerTier: 'SILVER', active: true },
    { id: 'dr-3', name: 'Gold Tier Default', maxDiscountPct: '15.00', customerTier: 'GOLD', active: true },
    { id: 'dr-4', name: 'Hardware Category Cap', maxDiscountPct: '15.00', categoryId: catHwId, active: true },
    { id: 'dr-5', name: 'Services Category Cap', maxDiscountPct: '10.00', categoryId: catSvcId, active: true },
  ]);

  console.log('Seeding Approval Rules...');
  await db.insert(approvalRules).values([
    { id: 'ar-1', name: 'Discount Above 10%', condition: 'DISCOUNT_ABOVE', thresholdValue: '10', requiredRole: 'SALES_MANAGER', sequenceNumber: 1, active: true },
    { id: 'ar-2', name: 'Deal Value Above $50k', condition: 'DEAL_VALUE_ABOVE', thresholdValue: '50000', requiredRole: 'FINANCE_OFFICER', sequenceNumber: 2, active: true },
  ]);

  console.log('Seeding Upsell Rules...');
  await db.insert(upsellRules).values([
    { id: 'ur-1', triggerProductId: prdLp14Id, targetProductId: prdDockId, type: 'CROSS_SELL', scoreWeight: 85, reason: 'High attachment rate for new laptop purchases' },
    { id: 'ur-2', triggerProductId: prdLp14Id, targetProductId: prdCareId, type: 'UPSELL', scoreWeight: 70, reason: 'Provides essential 24/7 support for enterprise endpoints' },
    { id: 'ur-3', triggerProductId: prdDockId, targetProductId: prdExtWarId, type: 'UPSELL', scoreWeight: 60, reason: 'Protects critical desktop connectivity infrastructure' },
  ]);

  console.log('Seeding Warehouses & Inventory...');
  const whChiId = 'wh-chi';
  const whEwkId = 'wh-ewk';
  const whRnoId = 'wh-rno';

  await db.insert(warehouses).values([
    { id: whChiId, name: 'Main Warehouse Chicago', location: 'Chicago, IL', shippingCost: '12.00', active: true },
    { id: whEwkId, name: 'East Coast Depot Newark', location: 'Newark, NJ', shippingCost: '8.00', active: true },
    { id: whRnoId, name: 'West Coast Hub Reno', location: 'Reno, NV', shippingCost: '15.00', active: true },
  ]);

  const productIds = [prdLp14Id, prdDockId, prdOnsiteId, prdExtWarId, prdCareId, prdSecGwId];
  const whIds = [whChiId, whEwkId, whRnoId];
  const inventoryRecords: any[] = [];
  let invCounter = 1;

  for (const w of whIds) {
    for (const p of productIds) {
      inventoryRecords.push({
        id: `inv-${invCounter++}`,
        warehouseId: w,
        productId: p,
        quantityAvailable: Math.floor(Math.random() * 151) + 50, // 50 to 200
        quantityReserved: Math.floor(Math.random() * 21), // 0 to 20
      });
    }
  }

  await db.insert(inventory).values(inventoryRecords);

  console.log('Seed completed successfully!');
}

main().then(() => {
  console.log('Done');
  process.exit(0);
}).catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
