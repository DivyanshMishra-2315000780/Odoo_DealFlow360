import { sendQuote } from '@/features/quotes/service';
import { apiHandler, mutationHandler } from '@/lib/api-handler';

export async function POST(_request: Request, { params }: RouteContext<'/api/quotes/[id]/send'>) {
  return mutationHandler(async () => Response.json({ data: await sendQuote((await params).id) }));
}
