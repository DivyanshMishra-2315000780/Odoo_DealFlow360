import { eq, getTableColumns } from 'drizzle-orm';
import type { AnyPgTable } from 'drizzle-orm/pg-core';
import { db } from '@/db';
import {
  approvalRules, categories, customers, discountRules, priceLists,
  products, subscriptionPlans, users, warehouses,
} from '@/db/schema';
import type { AdminResource } from './types';

const tables = {
  approvalRules, categories, customers, discountRules, priceLists,
  products, subscriptionPlans, users, warehouses,
} satisfies Record<AdminResource, AnyPgTable>;

function tableFor(resource: AdminResource): AnyPgTable {
  return tables[resource];
}

export async function listAdminRecords(resource: AdminResource) {
  return db.select().from(tableFor(resource));
}

export async function findAdminRecord(resource: AdminResource, id: string) {
  const table = tableFor(resource);
  const idColumn = getTableColumns(table).id;
  const [record] = await db.select().from(table).where(eq(idColumn, id)).limit(1);
  return record ?? null;
}

export async function insertAdminRecord(resource: AdminResource, values: Record<string, unknown>) {
  const records = await db.insert(tableFor(resource)).values(values).returning() as unknown as Record<string, unknown>[];
  const [record] = records;
  return record;
}

export async function updateAdminRecord(resource: AdminResource, id: string, values: Record<string, unknown>) {
  const table = tableFor(resource);
  const idColumn = getTableColumns(table).id;
  const records = await db.update(table).set({ ...values, updatedAt: new Date() }).where(eq(idColumn, id)).returning() as unknown as Record<string, unknown>[];
  const [record] = records;
  return record ?? null;
}

export async function deleteAdminRecord(resource: AdminResource, id: string) {
  const table = tableFor(resource);
  const idColumn = getTableColumns(table).id;
  const records = await db.delete(table).where(eq(idColumn, id)).returning() as unknown as Record<string, unknown>[];
  const [record] = records;
  return record ?? null;
}
