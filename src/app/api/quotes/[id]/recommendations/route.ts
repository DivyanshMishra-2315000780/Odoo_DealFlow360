import { getRecommendations } from '@/features/quotes/service';
import { apiHandler } from '@/lib/api-handler';

export async function GET(_request: Request, { params }: RouteContext<'/api/quotes/[id]/recommendations'>) {
  return apiHandler(async () => Response.json({ data: await getRecommendations((await params).id) }));
}
