import { simulateQuote } from '@/features/quotes/service';
import { apiHandler, mutationHandler } from '@/lib/api-handler';

export async function POST(_request: Request, { params }: RouteContext<'/api/quotes/[id]/simulate'>) {
  return mutationHandler(async () => Response.json({ data: await simulateQuote((await params).id) }));
}
