import { insertAuditLog } from './repository';
import type { AuditEntry } from './types';

export async function recordAudit(entry: AuditEntry) {
  return insertAuditLog(entry);
}
