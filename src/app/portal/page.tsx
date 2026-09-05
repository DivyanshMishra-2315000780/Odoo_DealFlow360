'use client';

import { CustomerTierBadge } from '@/components/ui/CustomerTierBadge';
import { FileText, CreditCard, RefreshCw, Star } from 'lucide-react';
import Link from 'next/link';

export default function PortalPage() {
  return (
    <div className="p-8 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Welcome back, Acme Corp</h2>
          <p className="text-muted-foreground mt-1">Here's a summary of your account activity.</p>
        </div>
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-5 py-3">
          <div>
            <div className="text-xs text-amber-700 uppercase tracking-wider font-medium">Customer Tier</div>
            <CustomerTierBadge tier="GOLD" showPriorityText />
          </div>
          <div className="h-8 w-px bg-amber-200" />
          <div>
            <div className="text-xs text-amber-700 uppercase tracking-wider font-medium">Priority</div>
            <div className="text-sm font-bold text-amber-800 mt-0.5">HIGH</div>
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Quotations', value: '3', icon: FileText, href: '/portal/quotations', color: 'text-primary' },
          { label: 'Pending Requests', value: '1', icon: RefreshCw, href: '/portal/quotations', color: 'text-amber-600' },
          { label: 'Open Invoices', value: '2', icon: CreditCard, href: '/portal/invoices', color: 'text-blue-600' },
          { label: 'Active Subscriptions', value: '1', icon: Star, href: '/portal/quotations', color: 'text-purple-600' },
        ].map(({ label, value, icon: Icon, href, color }) => (
          <Link key={label} href={href} className="rounded-xl border bg-card p-5 shadow-sm hover:border-primary/40 transition-colors group">
            <div className="flex items-start justify-between">
              <h3 className="text-sm text-muted-foreground">{label}</h3>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <div className="text-3xl font-bold text-foreground mt-3">{value}</div>
          </Link>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-muted/20">
          <h3 className="font-semibold text-foreground">Recent Activity</h3>
        </div>
        <div className="divide-y">
          {[
            { text: 'Quotation Q-1042 submitted for review.', date: 'Aug 21', status: 'Pending' },
            { text: 'Invoice INV-1042 issued for $2,730.', date: 'Aug 25', status: 'Unpaid' },
            { text: 'Care Plan 2yr subscription renewed.', date: 'Aug 15', status: 'Active' },
          ].map((item, i) => (
            <div key={i} className="flex justify-between items-center p-4 text-sm">
              <span className="text-foreground">{item.text}</span>
              <div className="flex items-center gap-3 ml-4 shrink-0">
                <span className="text-muted-foreground">{item.date}</span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{item.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
