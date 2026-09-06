import { recordAudit } from '@/features/audit/service';

export async function createAuditLog(
  actorId: string,
  actorRole: string,
  entity: string,
  entityId: string,
  action: string,
  previousValue?: unknown,
  newValue?: unknown,
  metadata?: unknown
) {
  try {
    const log = await recordAudit({
      actorId,
      actorRole,
      entity,
      entityId,
      action,
      previousValue: previousValue ?? null,
      newValue: newValue ?? null,
      metadata: metadata ?? null,
    });
    return log;
  } catch (error) {
    console.error('Failed to create audit log', error);
    throw new Error('Audit log creation failed');
  }
}
