import { apiHandler, mutationHandler } from '@/lib/api-handler';
import { createResource, listResources } from '@/features/admin/service';

export async function GET() {
  return apiHandler(async () => Response.json({ data: await listResources('approvalRules') }));
}
export async function POST(request: Request) {
  return mutationHandler(async () => Response.json({ data: await createResource('approvalRules', await request.json()) }, { status: 201 }));
}
