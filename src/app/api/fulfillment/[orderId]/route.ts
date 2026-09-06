import { advanceFulfillment, getFulfillment } from '@/features/fulfillment/service';
import { apiHandler, mutationHandler } from '@/lib/api-handler';

export async function GET(_request: Request, { params }: RouteContext<'/api/fulfillment/[orderId]'>) {
  return apiHandler(async () => Response.json({ data: await getFulfillment((await params).orderId) }));
}

export async function PATCH(request: Request, { params }: RouteContext<'/api/fulfillment/[orderId]'>) {
  return mutationHandler(async () => Response.json({ data: await advanceFulfillment((await params).orderId, await request.json()) }));
}
