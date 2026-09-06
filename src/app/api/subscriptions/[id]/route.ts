import {getSubscription,changeSubscription} from '@/features/subscriptions/service';
import {apiHandler,mutationHandler} from '@/lib/api-handler';
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){return apiHandler(async()=>Response.json({data:await getSubscription((await params).id)}));}
export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){return mutationHandler(async()=>Response.json({data:await changeSubscription((await params).id,await request.json())}));}
