import { submitQuote } from '@/features/quotes/service';
import { apiHandler, mutationHandler } from '@/lib/api-handler';

export async function POST(_request: Request, { params }: RouteContext<'/api/quotes/[id]/submit'>) {
  return mutationHandler(async () => Response.json({ data: await submitQuote((await params).id) }));
}
