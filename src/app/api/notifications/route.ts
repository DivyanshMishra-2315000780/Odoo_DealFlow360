import { getMyNotifications, markMyNotifications } from '@/features/notifications/service';
import { apiHandler, mutationHandler } from '@/lib/api-handler';

export async function GET() {
  return apiHandler(async () => Response.json({ data: await getMyNotifications() }));
}
export async function PATCH(request: Request) {
  return mutationHandler(async () => Response.json({ data: await markMyNotifications(await request.json()) }));
}
