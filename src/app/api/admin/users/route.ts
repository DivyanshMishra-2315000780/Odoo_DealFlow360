import { apiHandler, mutationHandler } from '@/lib/api-handler';
import { createResource, listResources } from '@/features/admin/service';

export async function GET() {
  return apiHandler(async () => Response.json({ data: await listResources('users') }));
}
export async function POST(request: Request) {
  return mutationHandler(async () => Response.json({ data: await createResource('users', await request.json()) }, { status: 201 }));
}
