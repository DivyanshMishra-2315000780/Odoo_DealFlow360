import { CustomerTier } from './dealflow';

export type UserRole =
  | 'CUSTOMER'
  | 'ADMIN'
  | 'SALES_MANAGER'
  | 'SALES_EXECUTIVE'
  | 'FINANCE_OFFICER'
  // Backward-compatible aliases
  | 'DEAL_DESK'
  | 'SALES_EXEC'
  | 'FINANCE_CONTROLLER';

export type SubscriptionPlan = 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE' | 'NONE';

export interface AuthUser {
  customerId?: string;
  id: string;
  name: string;
  email: string;
  company: string;
  role: UserRole;
  tier?: CustomerTier;
  subscriptionPlan?: SubscriptionPlan;
  isPendingApproval?: boolean;
}
