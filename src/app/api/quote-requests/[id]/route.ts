import { claimQuoteRequest, getQuoteRequest } from '@/features/quote-requests/service';
import { apiHandler, mutationHandler } from '@/lib/api-handler';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return apiHandler(async () => Response.json({ data: await getQuoteRequest((await params).id) }));
}
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return mutationHandler(async () => Response.json({ data: await claimQuoteRequest((await params).id, await request.json()) }));
}
