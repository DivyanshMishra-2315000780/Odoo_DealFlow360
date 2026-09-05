import { apiHandler, mutationHandler } from '@/lib/api-handler';
import { createResource, listResources } from '@/features/admin/service';

export async function GET() {
  return apiHandler(async () => Response.json({ data: await listResources('warehouses') }));
}
export async function POST(request: Request) {
  return mutationHandler(async () => Response.json({ data: await createResource('warehouses', await request.json()) }, { status: 201 }));
}
