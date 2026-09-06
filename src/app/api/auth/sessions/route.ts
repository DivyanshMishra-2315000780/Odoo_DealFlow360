import { getMySessions, revokeMySession } from '@/features/auth/service';
import { apiHandler } from '@/lib/api-handler';

export async function GET() {
  return apiHandler(async () => Response.json({ data: await getMySessions() }));
}
export async function DELETE(request: Request) {
  return apiHandler(async () => Response.json({ data: await revokeMySession(await request.json()) }));
}
