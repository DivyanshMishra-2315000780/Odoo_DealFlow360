import {billDueSubscriptions} from '@/features/subscriptions/service';
import {mutationHandler} from '@/lib/api-handler';
export async function POST(){return mutationHandler(async()=>Response.json({data:await billDueSubscriptions()}));}
