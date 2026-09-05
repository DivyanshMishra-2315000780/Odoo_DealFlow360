import { refreshSession } from '@/features/auth/service';
import { apiHandler } from '@/lib/api-handler';

export async function POST() {
  return apiHandler(async () => Response.json(await refreshSession()));
}
