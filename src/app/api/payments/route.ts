import { recordManualPayment } from '@/features/payments/manual';
import { listPayments } from '@/features/payments/service';
import { apiHandler, mutationHandler } from '@/lib/api-handler';

export async function GET() {
  return apiHandler(async () => Response.json({ data: await listPayments() }));
}

export async function POST(request:Request){return mutationHandler(async()=>Response.json({data:await recordManualPayment(await request.json())}));}
