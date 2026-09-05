import { mockAuthHandlers } from './handlers/authHandlers';
import { mockQuoteHandlers } from './handlers/quoteHandlers';
import { mockApprovalHandlers } from './handlers/approvalHandlers';
import { mockFulfillmentHandlers } from './handlers/fulfillmentHandlers';
import { mockInvoiceHandlers } from './handlers/invoiceHandlers';
import { mockProductHandlers } from './handlers/productHandlers';
import { mockCustomerHandlers } from './handlers/customerHandlers';
import { mockSubscriptionHandlers } from './handlers/subscriptionHandlers';
import { mockDealHealthHandlers } from './handlers/dealHealthHandlers';
import { mockDashboardHandlers } from './handlers/dashboardHandlers';
import { mockSettingsHandlers } from './handlers/settingsHandlers';
import { mockUserHandlers } from './handlers/userHandlers';
import { mockNegotiationHandlers } from './handlers/negotiationHandlers';

export const mockApi = {
    auth: mockAuthHandlers,
    quotes: mockQuoteHandlers,
    approvals: mockApprovalHandlers,
    fulfillment: mockFulfillmentHandlers,
    invoices: mockInvoiceHandlers,
    products: mockProductHandlers,
    customers: mockCustomerHandlers,
    subscriptions: mockSubscriptionHandlers,
    dealHealth: mockDealHealthHandlers,
    dashboard: mockDashboardHandlers,
    settings: mockSettingsHandlers,
    users: mockUserHandlers,
    negotiations: mockNegotiationHandlers
};
