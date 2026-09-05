'use client';

import { useParams } from 'next/navigation';
import { mockSubscriptions } from '@/lib/api/mockDataExtended';
import { CustomerTierBadge } from '@/components/ui/CustomerTierBadge';
import Link from 'next/link';
import { ArrowLeft, Pause, XCircle, Settings } from 'lucide-react';
import { useState } from 'react';

export default function SubscriptionDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const sub = mockSubscriptions.find(s => s.id === id);
  const [status, setStatus] = useState(sub?.status || 'ACTIVE');

  if (!sub) return <div className="p-8 text-red-600">Subscription not found</div>;

  const billingHistory = [
    { id: '1', date: '2023-08-15', amount: sub.amount, status: 'Paid' },
    { id: '2', date: '2023-07-15', amount: sub.amount, status: 'Paid' },
    { id: '3', date: '2023-06-15', amount: sub.amount, status: 'Paid' },
  ];

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <Link href="/subscriptions" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Subscriptions
      </Link>

      <div className="rounded-xl border bg-card shadow-sm p-6">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{sub.planName}</h1>
              <span className={`rounded-full border px-3 py-0.5 text-xs font-medium ${
                status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                status === 'PAUSED' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                'bg-red-50 text-red-700 border-red-200'
              }`}>
                {status}
              </span>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <span className="text-lg font-semibold">{sub.customer.name}</span>
              <CustomerTierBadge tier={sub.customer.tier} showPriorityText />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div>Billing: <span className="text-foreground font-medium capitalize">{sub.billingFrequency.toLowerCase()}</span></div>
              <div>Next Bill: <span className="text-foreground font-medium">{new Date(sub.nextBillingDate).toLocaleDateString()}</span></div>
              <div>Amount: <span className="text-primary font-bold">${sub.amount}/mo</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Billing History */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-muted/20 font-semibold text-foreground">Billing History</div>
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/10 text-muted-foreground border-b">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {billingHistory.map(entry => (
              <tr key={entry.id} className="hover:bg-muted/10">
                <td className="px-4 py-3 text-muted-foreground">{entry.date}</td>
                <td className="px-4 py-3 text-right font-medium">${entry.amount}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-xs font-medium">{entry.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button className="flex items-center gap-2 rounded-md border px-5 py-2.5 text-sm font-medium hover:bg-muted">
          <Settings className="h-4 w-4" /> Modify Subscription
        </button>
        {status === 'ACTIVE' && (
          <button onClick={() => setStatus('PAUSED')} className="flex items-center gap-2 rounded-md bg-amber-100 text-amber-700 border border-amber-200 px-5 py-2.5 text-sm font-medium hover:bg-amber-200">
            <Pause className="h-4 w-4" /> Pause
          </button>
        )}
        {status !== 'CANCELLED' && (
          <button onClick={() => setStatus('CANCELLED')} className="flex items-center gap-2 rounded-md bg-red-50 text-red-700 border border-red-200 px-5 py-2.5 text-sm font-medium hover:bg-red-100">
            <XCircle className="h-4 w-4" /> Cancel
          </button>
        )}
      </div>
    </div>
  );
}
