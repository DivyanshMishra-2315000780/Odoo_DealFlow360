import { createCheckout } from '@/features/payments/service';
import { apiHandler, mutationHandler } from '@/lib/api-handler';

export async function POST(request: Request) {
  return mutationHandler(async () => Response.json({ data: await createCheckout(await request.json()) }, { status: 201 }));
}
