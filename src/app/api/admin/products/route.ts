import { apiHandler, mutationHandler } from '@/lib/api-handler';
import { createResource, listResources } from '@/features/admin/service';

export async function GET() {
  return apiHandler(async () => Response.json({ data: await listResources('products') }));
}
export async function POST(request: Request) {
  return mutationHandler(async () => Response.json({ data: await createResource('products', await request.json()) }, { status: 201 }));
}
