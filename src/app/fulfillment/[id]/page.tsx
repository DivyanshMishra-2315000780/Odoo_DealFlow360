'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery,useMutation,useQueryClient } from '@tanstack/react-query';
import { request } from '@/lib/http/client';
import { Button } from '@/components/ui/button';
import { Card,CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth';
type Allocation={productId:string;warehouseId:string;allocatedQty:number;warehouseName?:string};
type RecordData={fulfillment:{id:string;status:string};quotation:{id:string};customer?:{name:string};items:Array<{productId:string;productName:string;quantity:number}>;allocations:Allocation[];backorders:Array<{productId:string;backorderedQty:number}>};
export default function FulfillmentDetailPage(){
 const {id}=useParams<{id:string}>();const client=useQueryClient();const {user}=useAuth();const [allocations,setAllocations]=useState<Allocation[]|null>(null);
 const query=useQuery({queryKey:['fulfillment-detail',id],queryFn:()=>request<RecordData>('/api/fulfillment/'+id)});
 const recommend=useMutation({mutationFn:()=>request<{allocations:Allocation[]}>('/api/fulfillment/'+id+'/recommend'),onSuccess:data=>setAllocations(data.allocations)});
 const action=useMutation({mutationFn:async(status:string)=>{
  if(status==='ALLOCATE')return request('/api/fulfillment/'+id+'/confirm',{method:'POST',body:JSON.stringify({allocations:allocations?.filter(a=>a.allocatedQty>0).map(({productId,warehouseId,allocatedQty})=>({productId,warehouseId,allocatedQty}))})});
  return request('/api/fulfillment/'+id,{method:'PATCH',body:JSON.stringify({status})});
 },onSuccess:()=>{setAllocations(null);void client.invalidateQueries();}});
 if(query.isLoading)return <p>Loading fulfillment...</p>;
 if(query.error||!query.data)return <p role="alert">{query.error?.message??'Fulfillment not found'}</p>;
 const record=query.data;const mutable=['ADMIN','SALES_EXECUTIVE','SALES_MANAGER'].includes(user?.role??'');
 return <div className="space-y-6"><Link href="/fulfillment" className="text-teal-700">Back to fulfillment</Link><div><h1 className="text-2xl font-bold">Order fulfillment</h1><p>{record.customer?.name} ? {record.fulfillment.status}</p><Link href={'/quotes/'+record.quotation.id} className="text-teal-700">View quotation</Link></div>
 <Card><CardContent className="p-5 space-y-3"><h2 className="font-bold">Ordered products and services</h2>{record.items.map((item,i)=><p key={i}>{item.productName} ? {item.quantity}</p>)}<p className="text-sm text-slate-500">Physical products require stock allocation. Service and recurring lines are fulfilled with the order.</p></CardContent></Card>
 <Card><CardContent className="p-5 space-y-3"><h2 className="font-bold">Warehouse allocation</h2>{record.allocations.map((a,i)=><p key={i}>{record.items.find(p=>p.productId===a.productId)?.productName} ? {a.warehouseName??a.warehouseId} ? {a.allocatedQty} units</p>)}{record.backorders.map((b,i)=><p key={i} className="text-amber-700">Backorder: {record.items.find(p=>p.productId===b.productId)?.productName} ? {b.backorderedQty} units</p>)}
 {mutable&&['PENDING','PARTIAL','BACKORDERED'].includes(record.fulfillment.status)&&<Button disabled={recommend.isPending} onClick={()=>recommend.mutate()}>Calculate warehouse allocation</Button>}
 {allocations&&<div className="space-y-3">{allocations.map((a,i)=><label key={i} className="flex items-center gap-3"><span>{record.items.find(p=>p.productId===a.productId)?.productName} ? {a.warehouseName??a.warehouseId}</span><Input type="number" min={0} value={a.allocatedQty} onChange={e=>setAllocations(allocations.map((row,n)=>n===i?{...row,allocatedQty:Number(e.target.value)}:row))}/></label>)}<Button disabled={action.isPending} onClick={()=>action.mutate('ALLOCATE')}>Confirm allocation</Button></div>}
 {mutable&&record.fulfillment.status==='ALLOCATED'&&<Button disabled={action.isPending} onClick={()=>action.mutate('SHIPPED')}>Confirm dispatch</Button>}
 {mutable&&record.fulfillment.status==='SHIPPED'&&<Button disabled={action.isPending} onClick={()=>action.mutate('DELIVERED')}>Confirm delivery and issue invoice</Button>}
 {record.fulfillment.status==='DELIVERED'&&<Link className="text-teal-700" href="/invoices">View billing</Link>}
 {(action.error||recommend.error)&&<p role="alert" className="text-red-700">{action.error?.message??recommend.error?.message}</p>}
 </CardContent></Card></div>;
}
