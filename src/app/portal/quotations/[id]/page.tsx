'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuotation,useUpdateQuotationStatus } from '@/hooks/use-dealflow';
import { Button } from '@/components/ui/button';
import { Card,CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/components/providers/query-provider';
export default function CustomerQuotationDetailPage(){
 const {id}=useParams<{id:string}>();const query=useQuotation(id);const mutation=useUpdateQuotationStatus();const {toast}=useToast();
 const [changes,setChanges]=useState<Record<string,{quantity?:number;discountPercent?:number}>>({});const [note,setNote]=useState('');
 if(query.isLoading)return <p>Loading quotation...</p>;
 if(query.error||!query.data)return <div><p>{query.error?.message??'Quotation not found'}</p><Button onClick={()=>query.refetch()}>Retry</Button></div>;
 const quote=query.data;const canAct=quote.status==='SENT';
 async function act(status:'CONFIRMED'|'UNDER_NEGOTIATION'){
  if(!quote)return;
  try{await mutation.mutateAsync({id:quote.id,status,note,meta:{items:quote.items.map(line=>({...line,...changes[line.id]}))}});setChanges({});toast({title:status==='CONFIRMED'?'Order confirmed':'Counter-offer submitted',description:status==='CONFIRMED'?'Your order is ready for fulfillment.':'Sales will evaluate the proposal before manager and finance reapproval.',type:'success'});}catch(error){toast({title:'Action failed',description:error instanceof Error?error.message:'Please retry',type:'error'});}
 }
 return <div className="space-y-6"><Link className="text-teal-700" href="/portal/quotations">Back to my quotations</Link>
 <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-bold">{quote.title}</h1><p>{quote.customerName}</p></div><StatusBadge status={quote.status}/></div>
 <Card><CardContent className="p-5 overflow-auto"><table className="w-full text-sm"><thead><tr className="text-left border-b"><th>Product</th><th>Unit price</th><th>Quantity</th><th>Discount %</th><th>Total</th></tr></thead><tbody>{quote.items.map(line=><tr key={line.id} className="border-b"><td className="py-4">{line.productName}</td><td>{formatCurrency(line.unitPrice)}</td><td><Input aria-label={'Quantity for '+line.productName} type="number" min={1} disabled={!canAct} value={changes[line.id]?.quantity??line.quantity} onChange={e=>setChanges({...changes,[line.id]:{...changes[line.id],quantity:Number(e.target.value)}})}/></td><td><Input aria-label={'Discount for '+line.productName} type="number" min={0} max={100} disabled={!canAct} value={changes[line.id]?.discountPercent??line.discountPercent} onChange={e=>setChanges({...changes,[line.id]:{...changes[line.id],discountPercent:Number(e.target.value)}})}/></td><td>{formatCurrency(line.lineTotal)}</td></tr>)}</tbody></table><p className="text-right text-xl font-bold mt-5">Current offer: {formatCurrency(quote.grandTotal)}</p></CardContent></Card>
 {canAct?<Card><CardContent className="p-5 space-y-4"><p>Edit a quantity or discount above to propose new terms. The current offer stays unchanged until your proposal is reviewed and approved.</p><textarea className="w-full border rounded p-3" aria-label="Counter-offer explanation" value={note} onChange={e=>setNote(e.target.value)} placeholder="Explain your requested changes"/><div className="flex gap-3"><Button disabled={mutation.isPending||!note.trim()} variant="outline" onClick={()=>act('UNDER_NEGOTIATION')}>Submit counter-offer</Button><Button disabled={mutation.isPending} onClick={()=>act('CONFIRMED')}>Accept current offer</Button></div></CardContent></Card>:<p className="rounded border bg-slate-50 p-4">{quote.status==='UNDER_NEGOTIATION'?'Your counter-offer is awaiting sales review.':quote.reapprovalRequired?'Revised terms are awaiting manager and finance approval.':'This quotation is '+quote.status.toLowerCase().replaceAll('_',' ')+'.'}</p>}
 </div>;
}
