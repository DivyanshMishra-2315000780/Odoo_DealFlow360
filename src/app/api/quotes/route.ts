import { createQuote, listQuotes } from '@/features/quotes/service';
import { apiHandler, mutationHandler } from '@/lib/api-handler';

export async function GET() {
  return apiHandler(async () => Response.json({ data: await listQuotes() }));
}
export async function POST(request: Request) {
  return mutationHandler(async () => Response.json({ data: await createQuote(await request.json()) }, { status: 201 }));
}
