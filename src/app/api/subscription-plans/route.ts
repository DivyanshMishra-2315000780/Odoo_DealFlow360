import { listPlans } from '@/features/subscriptions/service';
import { apiHandler } from '@/lib/api-handler';

export async function GET() {
  return apiHandler(async () => Response.json({ data: await listPlans() }));
}