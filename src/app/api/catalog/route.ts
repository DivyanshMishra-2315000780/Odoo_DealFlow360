import { catalog } from '@/features/catalog/service';
import { apiHandler } from '@/lib/api-handler';
export async function GET(){return apiHandler(async()=>Response.json({data:await catalog()}));}
