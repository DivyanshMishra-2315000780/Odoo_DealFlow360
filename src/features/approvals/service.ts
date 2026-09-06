import { findQuote } from "@/features/quotes/repository";
import { recordAudit } from "@/features/audit/service";
import { requirePermission } from "@/lib/auth/rbac";
import { AuthorizationError, BusinessError } from "@/lib/errors";
import {
  findApprovalRequest,
  findApprovalStep,
  finishRequest,
  hasPendingPriorSteps,
  hasUnapprovedSteps,
  listPendingSteps,
  saveDecision,
} from "./repository";
import { approvalDecisionInput, type ApprovalAction } from "./types";

export async function listApprovals() {
  const user = await requirePermission("QUOTE_APPROVE");
  const rows = await listPendingSteps(
    user.role as Parameters<typeof listPendingSteps>[0],
  );
  const eligible = [];
  for (const row of rows)
    if (
      row.request.status === "PENDING" &&
      row.quotation.status === "PENDING_APPROVAL" &&
      !(await hasPendingPriorSteps(row.request.id, row.step.sequence))
    )
      eligible.push(row);
  return eligible;
}

export async function getApproval(id: string) {
  await requirePermission("QUOTE_APPROVE");
  const request = await findApprovalRequest(id);
  if (!request)
    throw new BusinessError("Approval request not found", "NOT_FOUND", 404);
  return request;
}

export async function decideApproval(
  stepId: string,
  action: ApprovalAction,
  input: unknown,
) {
  const permission = action === "APPROVED" ? "QUOTE_APPROVE" : "QUOTE_REJECT";
  const user = await requirePermission(permission);
  const values = approvalDecisionInput.parse(input);
  const result = await findApprovalStep(stepId);
  if (!result)
    throw new BusinessError("Approval step not found", "NOT_FOUND", 404);
  const quote = await findQuote(result.request.quotationId);
  if (
    !quote ||
    quote.status !== "PENDING_APPROVAL" ||
    result.request.status !== "PENDING"
  )
    throw new BusinessError(
      "Approval request is no longer active",
      "INVALID_STATE",
      409,
    );
  if (quote.salesExecId === user.userId)
    throw new AuthorizationError("You cannot approve your own quotation");
  if (result.step.status !== "PENDING")
    throw new BusinessError(
      "Approval step is already decided",
      "INVALID_STATE",
      409,
    );
  if (await hasPendingPriorSteps(result.request.id, result.step.sequence)) {
    throw new BusinessError(
      "Earlier approval steps must be completed first",
      "APPROVAL_OUT_OF_SEQUENCE",
      409,
    );
  }
  if (result.step.requiredRole !== user.role)
    throw new AuthorizationError("This step requires a different role");
  const decision = await saveDecision(
    stepId,
    user.userId,
    action,
    values.comment,
  );
  if (
    action !== "APPROVED" ||
    !(await hasUnapprovedSteps(result.request.id, stepId))
  ) {
    await finishRequest(
      result.request.id,
      result.request.quotationId,
      action,
      result.request.kind,
    );
  }
  await recordAudit({
    actorId: user.userId,
    actorRole: user.role,
    entity: "ApprovalStep",
    entityId: stepId,
    action,
  });
  await recordAudit({
    actorId: user.userId,
    actorRole: user.role,
    entity: "Quotation",
    entityId: quote.id,
    action: "APPROVAL_" + action,
    newValue: { stepId, role: user.role, comment: values.comment },
  });
  return decision;
}
