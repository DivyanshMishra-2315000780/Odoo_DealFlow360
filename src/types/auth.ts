import { CustomerTier } from './dealflow';

export type UserRole = 'DEAL_DESK' | 'SALES_EXEC' | 'FINANCE_CONTROLLER' | 'CUSTOMER';

export type SubscriptionPlan = 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE' | 'NONE';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  company: string;
  role: UserRole;
  tier?: CustomerTier;
  subscriptionPlan?: SubscriptionPlan;
}
