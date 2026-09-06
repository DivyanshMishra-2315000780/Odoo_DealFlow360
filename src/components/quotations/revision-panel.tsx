'use client';
import { useState } from 'react';
import { useQuery,useMutation,useQueryClient } from '@tanstack/react-query';
import { request } from '@/lib/http/client';
import { useAuth } from '@/lib/auth';
import { useProducts } from '@/hooks/use-dealflow';
import { Quotation } from '@/types/dealflow';
import { Button } from '@/components/ui/button';
import { Card,CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
export function QuoteRevisionPanel({quotation:q}:{quotation:Quotation}){
 const {user}=useAuth();const client=useQueryClient();const {data:products=[]}=useProducts();
 const [draft,setDraft]=useState<Array<{productId:string;quantity:number;discountPercentage:number}>|null>(null);
 const editable=user?.role==='SALES_EXECUTIVE'&&['DRAFT','REVISION_REQUIRED','REJECTED'].includes(q.status);
 const {data:recommendations=[]}=useQuery({queryKey:['recommendations',q.id],queryFn:()=>request<Array<{id:string;productId:string;reason:string}>>('/api/quotes/'+q.id+'/recommendations'),enabled:editable});
 const save=useMutation({mutationFn:()=>request('/api/quotes/'+q.id,{method:'PATCH',body:JSON.stringify({lines:draft})}),onSuccess:()=>{setDraft(null);void client.invalidateQueries();}});
 const review=useMutation({mutationFn:(action:'APPROVE'|'REJECT')=>request('/api/quotes/'+q.id+'/negotiate',{method:'PATCH',body:JSON.stringify({action})}),onSuccess:()=>{void client.invalidateQueries();}});
 const current=()=>q.items.map(l=>({productId:l.productId,quantity:l.quantity,discountPercentage:l.discountPercent}));
 if(q.status==='UNDER_NEGOTIATION'&&user?.role==='SALES_EXECUTIVE')return <Card><CardContent className="p-5 space-y-3"><h2 className="font-bold">Customer counter-offer</h2><p>{q.negotiation?.customerNotes}</p>{q.negotiation?.changes.map((c,i)=><p key={i}>{q.items.find(l=>l.id===c.quotationLineId)?.productName}: {c.fieldChanged} {c.originalValue} ? {c.requestedValue}</p>)}<div className="flex gap-3"><Button disabled={review.isPending} onClick={()=>review.mutate('APPROVE')}>Re-evaluate and request reapproval</Button><Button variant="outline" disabled={review.isPending} onClick={()=>review.mutate('REJECT')}>Decline counter-offer</Button></div>{review.error&&<p role="alert" className="text-red-700">{review.error.message}</p>}</CardContent></Card>;
 if(!editable)return null;
 return <Card><CardContent className="p-5 space-y-3"><h2 className="font-bold">Quotation revision and recommendations</h2><Button variant="outline" onClick={()=>setDraft(current())}>Edit quantities and discounts</Button>
 {recommendations.map(r=><div key={r.id} className="flex gap-4 items-center"><p>{products.find(p=>p.id===r.productId)?.name}: {r.reason}</p><Button variant="outline" disabled={q.items.some(l=>l.productId===r.productId)} onClick={()=>setDraft(previous=>{const lines=previous??current();return lines.some(l=>l.productId===r.productId)?lines:[...lines,{productId:r.productId,quantity:1,discountPercentage:0}];})}>Add to revision</Button></div>)}
 {draft&&<div className="space-y-3">{draft.map((line,i)=><div key={line.productId} className="grid grid-cols-3 gap-3"><span>{products.find(p=>p.id===line.productId)?.name}</span><Input aria-label="Quantity" type="number" min={1} value={line.quantity} onChange={e=>setDraft(draft.map((l,n)=>n===i?{...l,quantity:Number(e.target.value)}:l))}/><Input aria-label="Discount percentage" type="number" min={0} max={100} value={line.discountPercentage} onChange={e=>setDraft(draft.map((l,n)=>n===i?{...l,discountPercentage:Number(e.target.value)}:l))}/></div>)}<Button disabled={save.isPending} onClick={()=>save.mutate()}>Save and re-evaluate</Button></div>}{save.error&&<p role="alert" className="text-red-700">{save.error.message}</p>}
 </CardContent></Card>;
}
