import { signup } from '@/features/auth/service';
import { apiHandler } from '@/lib/api-handler';

export async function POST(request: Request) {
  return apiHandler(async () => Response.json(await signup(await request.json()), { status: 201 }));
}
