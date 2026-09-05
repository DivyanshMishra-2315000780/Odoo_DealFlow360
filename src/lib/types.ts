export enum Permission {
  QUOTE_VIEW = 'QUOTE_VIEW',
  QUOTE_CREATE = 'QUOTE_CREATE',
  QUOTE_EDIT = 'QUOTE_EDIT',
  QUOTE_SEND = 'QUOTE_SEND',
  QUOTE_CONFIRM = 'QUOTE_CONFIRM',
  QUOTE_APPROVE = 'QUOTE_APPROVE',
  QUOTE_REJECT = 'QUOTE_REJECT',
  NEGOTIATION_CREATE = 'NEGOTIATION_CREATE',
  NEGOTIATION_REVIEW = 'NEGOTIATION_REVIEW',
  VIEW_MARGIN = 'VIEW_MARGIN',
  VIEW_COST = 'VIEW_COST',
  VIEW_RISK = 'VIEW_RISK',
  MANAGE_BILLING = 'MANAGE_BILLING',
  MANAGE_PAYMENTS = 'MANAGE_PAYMENTS',
  MANAGE_SUBSCRIPTIONS = 'MANAGE_SUBSCRIPTIONS',
  MANAGE_USERS = 'MANAGE_USERS',
  MANAGE_PRODUCTS = 'MANAGE_PRODUCTS',
  MANAGE_PRICING = 'MANAGE_PRICING',
  MANAGE_APPROVAL_RULES = 'MANAGE_APPROVAL_RULES',
  MANAGE_WAREHOUSES = 'MANAGE_WAREHOUSES',
  MANAGE_CUSTOMERS = 'MANAGE_CUSTOMERS',
  MANAGE_SYSTEM = 'MANAGE_SYSTEM'
}

export type Role = 'CUSTOMER' | 'SALES_EXECUTIVE' | 'SALES_MANAGER' | 'FINANCE_OFFICER' | 'ADMIN';

export interface QuoteResponse {
  id: string;
  status: string;
  totalValue: string;
}

export interface RiskResponse {
  riskScore: number;
  factors: string[];
}

export interface ApprovalResponse {
  status: string;
  reason?: string;
}

export interface FulfillmentResponse {
  status: string;
  estimatedDelivery?: Date;
}

export interface BillingResponse {
  status: string;
  amountDue: string;
}

export interface NegotiationResponse {
  id: string;
  status: string;
}

export interface DealHealthResponse {
  healthScore: number;
  metrics: Record<string, unknown>;
}
