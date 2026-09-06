import { recommendFulfillment } from '@/features/fulfillment/service';
import { apiHandler, mutationHandler } from '@/lib/api-handler';

export async function POST(_request: Request, { params }: RouteContext<'/api/fulfillment/[orderId]/recommend'>) {
  return mutationHandler(async () => Response.json({ data: await recommendFulfillment((await params).orderId) }));
}
