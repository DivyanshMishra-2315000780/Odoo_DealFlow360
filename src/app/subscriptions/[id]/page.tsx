'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useMutation,useQueryClient } from '@tanstack/react-query';
import { useSubscription,useModifySubscription,useUpdateSubscriptionStatus } from '@/hooks/use-dealflow';
import { request } from '@/lib/http/client';
import { useAuth } from '@/lib/auth';
import { Card,CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/utils';
export default function SubscriptionDetailPage(){
 const {id}=useParams<{id:string}>();const query=useSubscription(id);const {user}=useAuth();const save=useModifySubscription();const cancel=useUpdateSubscriptionStatus();const [quantity,setQuantity]=useState<number|null>(null);
 const preview=useMutation({mutationFn:()=>request<{proratedAmount:string;newRecurringAmount:string;remainingDays:number;cycleDays:number}>('/api/subscriptions/'+id+'/simulate-change',{method:'POST',body:JSON.stringify({newQuantity:quantity})})});
 if(query.isLoading)return <p>Loading subscription...</p>;if(query.error||!query.data)return <p role="alert">{query.error?.message??'Subscription not found'}</p>;
 const sub=query.data;const canManage=['ADMIN','FINANCE_OFFICER'].includes(user?.role??'')&&sub.status==='ACTIVE';
 return <div className="space-y-6"><Link href="/subscriptions" className="text-teal-700">Back to subscriptions</Link><h1 className="text-2xl font-bold">{sub.planName}</h1><Card><CardContent className="p-5 space-y-3"><p>{sub.customerName} ? {sub.status}</p><p>{sub.seatsOrLicenses} units ? {formatCurrency(sub.recurringAmount)} ? {sub.billingFrequency}</p><p>Next invoice: {new Date(sub.nextBillingDate).toLocaleDateString()}</p>
 {canManage&&<div className="space-y-3"><label>New quantity<Input type="number" min={1} value={quantity??sub.seatsOrLicenses??1} onChange={e=>{setQuantity(Number(e.target.value));preview.reset();}}/></label><Button variant="outline" disabled={!quantity||preview.isPending} onClick={()=>preview.mutate()}>Preview proration</Button>
 {preview.data&&<div><p>{preview.data.remainingDays} / {preview.data.cycleDays} days remaining. {Number(preview.data.proratedAmount)<0?'Credit note':'Invoice adjustment'}: {formatCurrency(Math.abs(Number(preview.data.proratedAmount)))}. New recurring amount: {formatCurrency(Number(preview.data.newRecurringAmount))}.</p><Button disabled={save.isPending} onClick={()=>save.mutate({...sub,seatsOrLicenses:quantity??sub.seatsOrLicenses},{onSuccess:()=>preview.reset()})}>Apply quantity change</Button></div>}
 <Button variant="outline" disabled={cancel.isPending} onClick={()=>{if(window.confirm('Cancel future renewal invoices for this subscription?'))cancel.mutate({id,status:'CANCELLED'});}}>Cancel future renewals</Button></div>}
 {(preview.error||save.error||cancel.error)&&<p role="alert" className="text-red-700">{preview.error?.message??save.error?.message??cancel.error?.message}</p>}
 </CardContent></Card></div>;
}
