import { policies,savePolicies } from '@/features/catalog/service';
import { apiHandler,mutationHandler } from '@/lib/api-handler';
export async function GET(){return apiHandler(async()=>Response.json({data:await policies()}));}
export async function PUT(request:Request){return mutationHandler(async()=>Response.json({data:await savePolicies(await request.json())}));}
