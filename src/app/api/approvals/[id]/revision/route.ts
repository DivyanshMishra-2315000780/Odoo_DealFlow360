import { decideApproval } from '@/features/approvals/service';
import { apiHandler, mutationHandler } from '@/lib/api-handler';

export async function POST(request: Request, { params }: RouteContext<'/api/approvals/[id]/revision'>) {
  return mutationHandler(async () => Response.json({ data: await decideApproval((await params).id, 'REVISION_REQUIRED', await request.json()) }));
}
