import { createSubscriptionCheckout } from '@/features/payments/service';
import { apiHandler, mutationHandler } from '@/lib/api-handler';

export async function POST(request: Request) {
  return mutationHandler(async () =>
    Response.json(
      { data: await createSubscriptionCheckout(await request.json()) },
      { status: 201 }
    )
  );
}
