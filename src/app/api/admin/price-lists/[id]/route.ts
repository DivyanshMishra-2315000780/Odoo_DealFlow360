import { apiHandler, mutationHandler } from '@/lib/api-handler';
import { getResource, updateResource } from '@/features/admin/service';

export async function GET(_request: Request, { params }: RouteContext<'/api/admin/price-lists/[id]'>) {
  return apiHandler(async () => Response.json({ data: await getResource('priceLists', (await params).id) }));
}
export async function PATCH(request: Request, { params }: RouteContext<'/api/admin/price-lists/[id]'>) {
  return mutationHandler(async () => Response.json({ data: await updateResource('priceLists', (await params).id, await request.json()) }));
}
