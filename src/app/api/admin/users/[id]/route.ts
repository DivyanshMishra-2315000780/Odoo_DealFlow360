import { apiHandler, mutationHandler } from '@/lib/api-handler';
import { getResource, removeResource, updateResource } from '@/features/admin/service';

export async function GET(_request: Request, { params }: RouteContext<'/api/admin/users/[id]'>) {
  return apiHandler(async () => Response.json({ data: await getResource('users', (await params).id) }));
}
export async function PATCH(request: Request, { params }: RouteContext<'/api/admin/users/[id]'>) {
  return mutationHandler(async () => Response.json({ data: await updateResource('users', (await params).id, await request.json()) }));
}
export async function DELETE(_request: Request, { params }: RouteContext<'/api/admin/users/[id]'>) {
  return mutationHandler(async () => Response.json({ data: await removeResource('users', (await params).id) }));
}
