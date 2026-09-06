import { apiHandler, mutationHandler } from '@/lib/api-handler';
import { getResource, updateResource } from '@/features/admin/service';

export async function GET(_request: Request, { params }: RouteContext<'/api/admin/customers/[id]'>) {
  return apiHandler(async () => Response.json({ data: await getResource('customers', (await params).id) }));
}
export async function PATCH(request: Request, { params }: RouteContext<'/api/admin/customers/[id]'>) {
  return mutationHandler(async () => Response.json({ data: await updateResource('customers', (await params).id, await request.json()) }));
}
