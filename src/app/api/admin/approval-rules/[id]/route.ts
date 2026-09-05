import { apiHandler, mutationHandler } from '@/lib/api-handler';
import { getResource, removeResource, updateResource } from '@/features/admin/service';

export async function GET(_request: Request, { params }: RouteContext<'/api/admin/approval-rules/[id]'>) {
  return apiHandler(async () => Response.json({ data: await getResource('approvalRules', (await params).id) }));
}
export async function PATCH(request: Request, { params }: RouteContext<'/api/admin/approval-rules/[id]'>) {
  return mutationHandler(async () => Response.json({ data: await updateResource('approvalRules', (await params).id, await request.json()) }));
}
export async function DELETE(_request: Request, { params }: RouteContext<'/api/admin/approval-rules/[id]'>) {
  return mutationHandler(async () => Response.json({ data: await removeResource('approvalRules', (await params).id) }));
}
