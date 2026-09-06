import {pricingLists,changePrice} from '@/features/catalog/service';
import {apiHandler,mutationHandler} from '@/lib/api-handler';
export async function GET(){return apiHandler(async()=>Response.json({data:await pricingLists()}));}
export async function PATCH(request:Request){return mutationHandler(async()=>Response.json({data:await changePrice(await request.json())}));}
