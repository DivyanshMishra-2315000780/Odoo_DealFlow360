import { v4 as uuid } from 'uuid';
import { db } from '@/db';
import { auditLogs } from '@/db/schema';
import type { AuditEntry } from './types';

export async function insertAuditLog(entry: AuditEntry) {
  const [log] = await db.insert(auditLogs).values({ id: uuid(), ...entry }).returning();
  return log;
}
