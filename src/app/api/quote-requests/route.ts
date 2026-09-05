import { createQuoteRequest, listQuoteRequests } from '@/features/quote-requests/service';
import { apiHandler, mutationHandler } from '@/lib/api-handler';

export async function GET() {
  return apiHandler(async () => Response.json({ data: await listQuoteRequests() }));
}
export async function POST(request: Request) {
  return mutationHandler(async () => Response.json({ data: await createQuoteRequest(await request.json()) }, { status: 201 }));
}
