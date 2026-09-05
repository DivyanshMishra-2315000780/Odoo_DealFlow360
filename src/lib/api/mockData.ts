import { Customer, Product, Quotation, User } from '@/types';

export const mockUsers: User[] = [
  { id: 'u-1', name: 'J. Rao', email: 'jrao@dealflow360.com', role: 'SALES_REP' },
  { id: 'u-2', name: 'S. Manager', email: 'manager@dealflow360.com', role: 'SALES_MANAGER' },
  { id: 'u-3', name: 'Acme Contact', email: 'contact@acme.com', role: 'CUSTOMER', customerId: 'c-1' }
];

export const mockCustomers: Customer[] = [
  { id: 'c-1', name: 'Acme Corp', tier: 'GOLD', contactEmail: 'contact@acme.com', contactName: 'Alice' },
  { id: 'c-2', name: 'Beta Industries', tier: 'SILVER', contactEmail: 'contact@beta.com', contactName: 'Bob' },
  { id: 'c-3', name: 'Delta LLC', tier: 'BRONZE', contactEmail: 'contact@delta.com', contactName: 'Charlie' },
];

export const mockProducts: Product[] = [
  { id: 'p-1', sku: 'HW-LAP-14', name: 'Laptop Pro 14', category: 'Hardware', basePrice: 1200, unit: 'Item', isSubscription: false, status: 'ACTIVE' },
  { id: 'p-2', sku: 'SV-ONSITE', name: 'Onsite Setup', category: 'Services', basePrice: 450, unit: 'Hour', isSubscription: false, status: 'ACTIVE' },
  { id: 'p-3', sku: 'SUB-CARE-2Y', name: 'Care Plan 2yr', category: 'Subscription', basePrice: 46, unit: 'Month', isSubscription: true, status: 'ACTIVE' },
];

export const mockQuotes: Quotation[] = [
  {
    id: 'q-1042',
    quoteNumber: 'Q-1042',
    customerId: 'c-1',
    customer: mockCustomers[0],
    salesRepId: 'u-1',
    salesRep: mockUsers[0],
    status: 'PENDING_APPROVAL',
    amount: 2730,
    riskLevel: 'HIGH',
    createdAt: '2023-08-20T10:00:00Z',
    updatedAt: '2023-08-21T10:00:00Z',
    expiresAt: '2023-09-20T10:00:00Z',
    lines: [
      {
        id: 'ql-1',
        productId: 'p-1',
        product: mockProducts[0],
        quantity: 2,
        unitPrice: 1200,
        discountPercentage: 12,
        allowedDiscountPercentage: 15,
        lineTotal: 2112,
        riskLevel: 'LOW'
      },
      {
        id: 'ql-2',
        productId: 'p-2',
        product: mockProducts[1],
        quantity: 1,
        unitPrice: 450,
        discountPercentage: 18,
        allowedDiscountPercentage: 10,
        lineTotal: 369,
        riskLevel: 'HIGH'
      }
    ]
  }
];

export const mockApprovals = [
  {
    id: 'a-1',
    quotationId: 'q-1042',
    quotation: mockQuotes[0],
    status: 'PENDING',
    requestedBy: 'u-1',
    createdAt: '2023-08-21T10:30:00Z',
    updatedAt: '2023-08-21T10:30:00Z',
    currentStage: 'FINANCE'
  }
];

export const mockDashboardData = {
  kpis: {
    pendingApprovals: 4,
    openQuotations: 12,
    atRiskDeals: 3,
    revenue: 48240,
    unpaidInvoices: 4
  },
  priorityCustomers: [
    { ...mockCustomers[0], activeDeals: 3, pipeline: 12400 },
    { ...mockCustomers[1], activeDeals: 2, pipeline: 8200 },
  ]
};
