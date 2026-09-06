import { getBilling } from '@/features/billing/service';
import { apiHandler } from '@/lib/api-handler';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return apiHandler(async () => {
    const { id } = await params;
    const invoice = await getBilling(id);
    return Response.json({ data: invoice });
  });
}

