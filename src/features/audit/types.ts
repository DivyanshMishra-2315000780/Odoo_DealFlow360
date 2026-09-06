export interface AuditEntry {
  actorId?: string | null;
  actorRole?: string | null;
  entity: string;
  entityId: string;
  action: string;
  previousValue?: unknown;
  newValue?: unknown;
  metadata?: unknown;
}
