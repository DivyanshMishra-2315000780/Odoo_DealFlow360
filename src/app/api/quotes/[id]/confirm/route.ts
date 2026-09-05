import { confirmQuote } from '@/features/quotes/service';
import { apiHandler, mutationHandler } from '@/lib/api-handler';

export async function POST(_request: Request, { params }: RouteContext<'/api/quotes/[id]/confirm'>) {
  return mutationHandler(async () => Response.json({ data: await confirmQuote((await params).id) }));
}
