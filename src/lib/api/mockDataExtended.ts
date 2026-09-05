import { mockCustomers } from './mockData';

export const mockFulfillmentOrders = [
  {
    id: 'f-1042',
    quotationId: 'q-1042',
    status: 'PENDING',
    customer: mockCustomers[0],
    items: 24,
    warehouseAllocations: [
      { warehouseId: 'wh-1', warehouseName: 'Main Warehouse', productId: 'p-1', quantityAllocated: 18, quantityAvailable: 22, estimatedShipmentDays: 1, cost: 42 },
      { warehouseId: 'wh-2', warehouseName: 'East Depot', productId: 'p-1', quantityAllocated: 6, quantityAvailable: 6, estimatedShipmentDays: 1, cost: 29 },
    ],
    backorderUnits: 0,
    expectedShipment: '2023-09-05T00:00:00Z',
  }
];

export const mockInvoices = [
  {
    id: 'inv-1042',
    invoiceNumber: 'INV-1042',
    quotationId: 'q-1042',
    customerId: 'c-1',
    customer: mockCustomers[0],
    amount: 2730,
    status: 'UNPAID',
    dueDate: '2023-09-10T00:00:00Z',
    createdAt: '2023-08-25T00:00:00Z',
    lines: [
      { id: 'il-1', description: 'Laptop Pro 14 x2', amount: 2112 },
      { id: 'il-2', description: 'Onsite Setup x1', amount: 369 },
      { id: 'il-3', description: 'Care Plan 2yr x1', amount: 249 },
    ],
    paymentHistory: [],
  }
];

export const mockSubscriptions = [
  {
    id: 'sub-1',
    customerId: 'c-1',
    customer: mockCustomers[0],
    planName: 'Care Plan 2yr',
    billingFrequency: 'MONTHLY',
    nextBillingDate: '2023-09-15T00:00:00Z',
    amount: 46,
    status: 'ACTIVE',
  },
  {
    id: 'sub-2',
    customerId: 'c-2',
    customer: mockCustomers[1],
    planName: 'Basic Support',
    billingFrequency: 'YEARLY',
    nextBillingDate: '2024-01-01T00:00:00Z',
    amount: 299,
    status: 'PAUSED',
  }
];

export const mockDealHealthEvents = [
  {
    id: 'dh-1',
    quotationId: 'q-2001',
    customer: mockCustomers[1],
    quoteName: 'Q-2001',
    issue: 'Idle 9 days',
    severity: 'MEDIUM',
    ageDays: 9,
    recommendedAction: 'Nudge Rep',
  },
  {
    id: 'dh-2',
    quotationId: 'q-2002',
    customer: mockCustomers[2],
    quoteName: 'Q-2002',
    issue: 'Discount anomaly detected',
    severity: 'HIGH',
    ageDays: 3,
    recommendedAction: 'Escalated to Manager',
  }
];

export const mockProducts = [
  { id: 'p-1', sku: 'HW-LAP-14', name: 'Laptop Pro 14', category: 'Hardware', basePrice: 1200, unit: 'Item', isSubscription: false, status: 'ACTIVE', variantCount: 3 },
  { id: 'p-2', sku: 'SV-ONSITE', name: 'Onsite Setup', category: 'Services', basePrice: 450, unit: 'Hour', isSubscription: false, status: 'ACTIVE', variantCount: 0 },
  { id: 'p-3', sku: 'SUB-CARE-2Y', name: 'Care Plan 2yr', category: 'Subscription', basePrice: 46, unit: 'Month', isSubscription: true, status: 'ACTIVE', variantCount: 0 },
  { id: 'p-4', sku: 'HW-MON-27', name: 'UltraView 27"', category: 'Hardware', basePrice: 680, unit: 'Item', isSubscription: false, status: 'ACTIVE', variantCount: 2 },
];

export const mockDiscountRules = [
  { id: 'dr-1', tier: 'BRONZE', category: 'Hardware', maxDiscountPercentage: 5, requiresManagerApproval: false, requiresFinanceApproval: false },
  { id: 'dr-2', tier: 'SILVER', category: 'Hardware', maxDiscountPercentage: 10, requiresManagerApproval: false, requiresFinanceApproval: false },
  { id: 'dr-3', tier: 'GOLD', category: 'Hardware', maxDiscountPercentage: 15, requiresManagerApproval: false, requiresFinanceApproval: false },
  { id: 'dr-4', tier: 'BRONZE', category: 'Services', maxDiscountPercentage: 5, requiresManagerApproval: true, requiresFinanceApproval: false },
  { id: 'dr-5', tier: 'SILVER', category: 'Services', maxDiscountPercentage: 8, requiresManagerApproval: true, requiresFinanceApproval: false },
  { id: 'dr-6', tier: 'GOLD', category: 'Services', maxDiscountPercentage: 10, requiresManagerApproval: true, requiresFinanceApproval: true },
];
