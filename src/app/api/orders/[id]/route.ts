import { getOrder } from '@/features/orders/service';
import { apiHandler } from '@/lib/api-handler';

export async function GET(_request: Request, { params }: RouteContext<'/api/orders/[id]'>) {
  return apiHandler(async () => Response.json({ data: await getOrder((await params).id) }));
}
