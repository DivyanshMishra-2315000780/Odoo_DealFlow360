'use client';

import { mockDealHealthEvents } from '@/lib/api/mockDataExtended';
import { CustomerTierBadge } from '@/components/ui/CustomerTierBadge';
import { RiskBadge } from '@/components/ui/RiskBadge';
import { AlertCircle, Clock, TrendingDown } from 'lucide-react';

export default function DealHealthPage() {
  const events = mockDealHealthEvents;

  const stalled = events.filter(e => e.issue.toLowerCase().includes('idle')).length;
  const anomalies = events.filter(e => e.issue.toLowerCase().includes('anomaly')).length;
  const slippage = events.filter(e => e.issue.toLowerCase().includes('delivery')).length;

  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Deal Health</h2>
        <p className="text-muted-foreground mt-1">Monitor at-risk deals and anomalies across your pipeline.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 flex items-start gap-3">
          <Clock className="h-5 w-5 text-amber-600 mt-0.5" />
          <div>
            <div className="text-2xl font-bold text-amber-700">{stalled}</div>
            <div className="text-sm font-medium text-amber-700">Stalled Deals</div>
          </div>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
          <div>
            <div className="text-2xl font-bold text-red-700">{anomalies}</div>
            <div className="text-sm font-medium text-red-700">Discount Anomalies</div>
          </div>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 flex items-start gap-3">
          <TrendingDown className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <div className="text-2xl font-bold text-blue-700">{slippage}</div>
            <div className="text-sm font-medium text-blue-700">Delivery Slippage</div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 text-muted-foreground font-medium border-b">
            <tr>
              <th className="px-6 py-4">Customer</th>
              <th className="px-6 py-4">Quote</th>
              <th className="px-6 py-4">Issue</th>
              <th className="px-6 py-4">Severity</th>
              <th className="px-6 py-4">Age</th>
              <th className="px-6 py-4">Recommended Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {events.map((event) => (
              <tr key={event.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-foreground">{event.customer.name}</span>
                    <CustomerTierBadge tier={event.customer.tier} />
                  </div>
                </td>
                <td className="px-6 py-4 text-primary font-medium">{event.quoteName}</td>
                <td className="px-6 py-4 text-foreground">{event.issue}</td>
                <td className="px-6 py-4">
                  <RiskBadge level={event.severity as 'LOW' | 'MEDIUM' | 'HIGH'} />
                </td>
                <td className="px-6 py-4 text-muted-foreground">{event.ageDays}d ago</td>
                <td className="px-6 py-4">
                  <span className="text-sm font-medium text-foreground">{event.recommendedAction}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
