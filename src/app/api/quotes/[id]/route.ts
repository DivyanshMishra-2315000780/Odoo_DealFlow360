import { editQuote, getQuote } from '@/features/quotes/service';
import { apiHandler, mutationHandler } from '@/lib/api-handler';

export async function GET(_request: Request, { params }: RouteContext<'/api/quotes/[id]'>) {
  return apiHandler(async () => Response.json({ data: await getQuote((await params).id) }));
}
export async function PATCH(request: Request, { params }: RouteContext<'/api/quotes/[id]'>) {
  return mutationHandler(async () => Response.json({ data: await editQuote((await params).id, await request.json()) }));
}
