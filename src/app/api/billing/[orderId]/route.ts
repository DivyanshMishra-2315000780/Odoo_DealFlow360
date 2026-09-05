import { getBilling } from '@/features/billing/service';
import { apiHandler } from '@/lib/api-handler';

export async function GET(_request: Request, { params }: RouteContext<'/api/billing/[orderId]'>) {
  return apiHandler(async () => Response.json({ data: await getBilling((await params).orderId) }));
}
