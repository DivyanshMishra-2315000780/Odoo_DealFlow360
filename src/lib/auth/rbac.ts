import { Permission } from '../types';
import { getCurrentUser } from '@/features/auth/service';
import type { AuthenticatedUser } from '@/features/auth/types';
import { AuthorizationError } from '../errors';

const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  CUSTOMER: [
    Permission.QUOTE_VIEW,
    Permission.NEGOTIATION_CREATE,
    Permission.QUOTE_CONFIRM
  ],
  SALES_EXECUTIVE: [
    Permission.MANAGE_WAREHOUSES,
    Permission.VIEW_RISK,
    Permission.QUOTE_CREATE,
    Permission.QUOTE_EDIT,
    Permission.QUOTE_VIEW,
    Permission.QUOTE_SEND,
    Permission.NEGOTIATION_REVIEW,
    Permission.VIEW_MARGIN
  ],
  SALES_MANAGER: [
    Permission.MANAGE_WAREHOUSES,
    Permission.QUOTE_VIEW,
    Permission.QUOTE_APPROVE,
    Permission.QUOTE_REJECT,
    Permission.VIEW_MARGIN,
    Permission.VIEW_COST,
    Permission.VIEW_RISK
  ],
  FINANCE_OFFICER: [
    Permission.VIEW_COST,
    Permission.VIEW_MARGIN,
    Permission.VIEW_RISK,
    Permission.MANAGE_BILLING,
    Permission.MANAGE_PAYMENTS,
    Permission.MANAGE_SUBSCRIPTIONS,
    Permission.QUOTE_APPROVE,
    Permission.QUOTE_REJECT
  ],
  ADMIN: [
    Permission.MANAGE_USERS,
    Permission.MANAGE_PRODUCTS,
    Permission.MANAGE_PRICING,
    Permission.MANAGE_APPROVAL_RULES,
    Permission.MANAGE_WAREHOUSES,
    Permission.QUOTE_VIEW,
    Permission.QUOTE_CREATE,
    Permission.QUOTE_EDIT,
    Permission.QUOTE_SEND,
    Permission.QUOTE_CONFIRM,
    Permission.QUOTE_APPROVE,
    Permission.QUOTE_REJECT,
    Permission.NEGOTIATION_CREATE,
    Permission.NEGOTIATION_REVIEW,
    Permission.VIEW_MARGIN,
    Permission.VIEW_COST,
    Permission.VIEW_RISK,
    Permission.MANAGE_BILLING,
    Permission.MANAGE_PAYMENTS,
    Permission.MANAGE_SUBSCRIPTIONS,
    Permission.MANAGE_CUSTOMERS,
    Permission.MANAGE_SYSTEM
  ]
};

export function hasPermission(userRole: string, permission: Permission | string): boolean {
  const permissions = ROLE_PERMISSIONS[userRole] || [];
  return permissions.includes(permission as Permission);
}

export async function requireAuth(): Promise<AuthenticatedUser> {
  const session = await getCurrentUser();
  if (!session) {
    throw new AuthorizationError('Not authenticated', 401);
  }
  return session;
}

export async function requirePermission(permission: Permission | string): Promise<AuthenticatedUser> {
  const session = await requireAuth();
  if (!hasPermission(session.role, permission)) {
    throw new AuthorizationError(`Missing required permission: ${permission}`);
  }
  return session;
}
