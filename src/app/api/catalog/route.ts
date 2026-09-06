import { catalog,saveCatalogProduct } from '@/features/catalog/service';
import { apiHandler,mutationHandler } from '@/lib/api-handler';
export async function GET(){return apiHandler(async()=>Response.json({data:await catalog()}));}

export async function POST(request:Request){return mutationHandler(async()=>Response.json({data:await saveCatalogProduct(await request.json())}));}
