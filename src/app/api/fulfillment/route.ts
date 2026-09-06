import { listFulfillments } from '@/features/fulfillment/service';
import { apiHandler } from '@/lib/api-handler';

export async function GET() {
  return apiHandler(async () => {
    const fulfillments = await listFulfillments();
    return Response.json({ data: fulfillments });
  });
}
