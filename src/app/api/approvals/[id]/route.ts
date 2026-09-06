import { getApproval } from '@/features/approvals/service';
import { apiHandler } from '@/lib/api-handler';

export async function GET(_request: Request, { params }: RouteContext<'/api/approvals/[id]'>) {
  return apiHandler(async () => Response.json({ data: await getApproval((await params).id) }));
}
