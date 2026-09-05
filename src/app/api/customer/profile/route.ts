import { getMyProfile, updateMyProfile } from '@/features/customers/service';
import { apiHandler, mutationHandler } from '@/lib/api-handler';

export async function GET() {
  return apiHandler(async () => Response.json({ data: await getMyProfile() }));
}
export async function PATCH(request: Request) {
  return mutationHandler(async () => Response.json({ data: await updateMyProfile(await request.json()) }));
}
