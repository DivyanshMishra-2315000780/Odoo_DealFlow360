import { getDashboard } from '@/features/dashboard/service';
import { apiHandler } from '@/lib/api-handler';

export async function GET() {
  return apiHandler(async () => Response.json({ data: await getDashboard() }));
}
