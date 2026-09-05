import { getDealHealth } from '@/features/deal-health/service';
import { apiHandler } from '@/lib/api-handler';

export async function GET(_request: Request, { params }: RouteContext<'/api/deal-health/[quoteId]'>) {
  return apiHandler(async () => Response.json({ data: await getDealHealth((await params).quoteId) }));
}
