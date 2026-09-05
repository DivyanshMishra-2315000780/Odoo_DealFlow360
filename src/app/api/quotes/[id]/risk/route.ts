import { getQuoteRisk } from '@/features/quotes/service';
import { apiHandler } from '@/lib/api-handler';

export async function GET(_request: Request, { params }: RouteContext<'/api/quotes/[id]/risk'>) {
  return apiHandler(async () => Response.json({ data: await getQuoteRisk((await params).id) }));
}
