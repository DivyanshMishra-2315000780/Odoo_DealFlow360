import { listApprovals } from '@/features/approvals/service';
import { apiHandler } from '@/lib/api-handler';

export async function GET() {
  return apiHandler(async () => Response.json({ data: await listApprovals() }));
}
