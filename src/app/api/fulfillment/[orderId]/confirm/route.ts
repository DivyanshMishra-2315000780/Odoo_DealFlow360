import { confirmFulfillment } from '@/features/fulfillment/service';
import { apiHandler, mutationHandler } from '@/lib/api-handler';

export async function POST(request: Request, { params }: RouteContext<'/api/fulfillment/[orderId]/confirm'>) {
  return mutationHandler(async () => Response.json({ data: await confirmFulfillment((await params).orderId, await request.json()) }));
}
