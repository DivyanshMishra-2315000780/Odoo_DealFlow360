'use client';

import { mockSubscriptions } from '@/lib/api/mockDataExtended';
import { CustomerTierBadge } from '@/components/ui/CustomerTierBadge';
import Link from 'next/link';

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  PAUSED: 'bg-amber-50 text-amber-700 border-amber-200',
  CANCELLED: 'bg-red-50 text-red-700 border-red-200',
};

export default function SubscriptionsPage() {
  const subscriptions = mockSubscriptions;

  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Subscriptions</h2>
        <p className="text-muted-foreground mt-1">Manage recurring customer subscriptions and billing.</p>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 text-muted-foreground font-medium border-b">
            <tr>
              <th className="px-6 py-4">Customer</th>
              <th className="px-6 py-4">Plan</th>
              <th className="px-6 py-4">Billing</th>
              <th className="px-6 py-4">Next Bill</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {subscriptions.map((sub) => (
              <tr key={sub.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-foreground">{sub.customer.name}</span>
                    <CustomerTierBadge tier={sub.customer.tier} />
                  </div>
                </td>
                <td className="px-6 py-4 text-foreground">{sub.planName}</td>
                <td className="px-6 py-4 text-muted-foreground capitalize">{sub.billingFrequency.toLowerCase()}</td>
                <td className="px-6 py-4 text-muted-foreground">{new Date(sub.nextBillingDate).toLocaleDateString()}</td>
                <td className="px-6 py-4 font-semibold text-foreground">${sub.amount}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusColors[sub.status] || ''}`}>
                    {sub.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <Link href={`/subscriptions/${sub.id}`} className="text-sm font-medium text-primary hover:underline">
                    Manage →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
