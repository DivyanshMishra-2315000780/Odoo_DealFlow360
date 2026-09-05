import { simulateSubscriptionChange } from '@/features/subscriptions/service';
import { apiHandler, mutationHandler } from '@/lib/api-handler';

export async function POST(request: Request, { params }: RouteContext<'/api/subscriptions/[id]/simulate-change'>) {
  return mutationHandler(async () => Response.json({ data: await simulateSubscriptionChange((await params).id, await request.json()) }));
}
