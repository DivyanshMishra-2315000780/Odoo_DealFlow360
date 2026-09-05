import { reviewNegotiation, startNegotiation } from '@/features/quotes/service';
import { apiHandler, mutationHandler } from '@/lib/api-handler';

export async function POST(request: Request, { params }: RouteContext<'/api/quotes/[id]/negotiate'>) {
  return mutationHandler(async () => Response.json({ data: await startNegotiation((await params).id, await request.json()) }, { status: 201 }));
}

export async function PATCH(request: Request, { params }: RouteContext<'/api/quotes/[id]/negotiate'>) {
  return mutationHandler(async () => Response.json({ data: await reviewNegotiation((await params).id, await request.json()) }));
}
