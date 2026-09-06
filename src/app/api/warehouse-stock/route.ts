import { warehouseStock, adjustStock } from '@/features/catalog/service';
import { apiHandler, mutationHandler } from '@/lib/api-handler';
export async function GET(){return apiHandler(async()=>Response.json({data:await warehouseStock()}));}

export async function PATCH(request:Request){return mutationHandler(async()=>Response.json({data:await adjustStock(await request.json())}));}
