import { hash } from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { requirePermission } from '@/lib/auth/rbac';
import { BusinessError } from '@/lib/errors';
import { Permission } from '@/lib/types';
import { insertCustomer } from '@/features/auth/repository';
import {
  deleteAdminRecord, findAdminRecord, insertAdminRecord, listAdminRecords, updateAdminRecord,
} from './repository';
import { parseAdminCreate, parseAdminUpdate, type AdminResource } from './types';

const permissions: Record<AdminResource, Permission> = {
  users: Permission.MANAGE_USERS, customers: Permission.MANAGE_CUSTOMERS, products: Permission.MANAGE_PRODUCTS,
  priceLists: Permission.MANAGE_PRICING, discountRules: Permission.MANAGE_PRICING, approvalRules: Permission.MANAGE_APPROVAL_RULES,
  warehouses: Permission.MANAGE_WAREHOUSES, categories: Permission.MANAGE_PRODUCTS, subscriptionPlans: Permission.MANAGE_SUBSCRIPTIONS,
};

function publicRecord(resource: AdminResource, record: Record<string, unknown> | null) {
  if (!record || resource !== 'users') return record;
  const safe = { ...record };
  delete safe.passwordHash;
  return safe;
}

async function authorize(resource: AdminResource) {
  await requirePermission(permissions[resource]);
}

export async function listResources(resource: AdminResource) {
  await authorize(resource);
  const records = await listAdminRecords(resource);
  return records.map((record) => publicRecord(resource, record));
}

export async function getResource(resource: AdminResource, id: string) {
  await authorize(resource);
  const record = await findAdminRecord(resource, id);
  if (!record) throw new BusinessError('Resource not found', 'NOT_FOUND', 404);
  return publicRecord(resource, record as Record<string, unknown>);
}

export async function createResource(resource: AdminResource, input: unknown) {
  await authorize(resource);
  const parsed = parseAdminCreate(resource, input) as Record<string, unknown>;
  const companyName = resource === 'users' ? parsed.companyName : undefined;
  delete parsed.companyName;
  if (resource === 'users') {
    const password = String(parsed.password ?? 'demo12345');
    delete parsed.password;
    parsed.passwordHash = await hash(password, 10);
  }
  const record = await insertAdminRecord(resource, { id: uuid(), ...parsed });
  if (resource === 'users' && record.role === 'CUSTOMER') {
    await insertCustomer({
      id: uuid(), userId: String(record.id), name: String(companyName ?? `${record.firstName} ${record.lastName}`),
      contactEmail: String(record.email), tier: 'BRONZE',
    });
  }
  return publicRecord(resource, record);
}

export async function updateResource(resource: AdminResource, id: string, input: unknown) {
  await authorize(resource);
  const parsed = parseAdminUpdate(resource, input) as Record<string, unknown>;
  delete parsed.companyName;
  if (resource === 'users' && parsed.password) {
    parsed.passwordHash = await hash(String(parsed.password), 10);
    delete parsed.password;
  }
  const record = await updateAdminRecord(resource, id, parsed);
  if (!record) throw new BusinessError('Resource not found', 'NOT_FOUND', 404);
  return publicRecord(resource, record);
}

export async function removeResource(resource: AdminResource, id: string) {
  await authorize(resource);
  if (resource === 'users') return updateResource(resource, id, { active: false });
  const record = await deleteAdminRecord(resource, id);
  if (!record) throw new BusinessError('Resource not found', 'NOT_FOUND', 404);
  return record;
}
