'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  RefreshCcw,
  CheckCircle2,
  PauseCircle,
  XCircle,
  TrendingUp,
  Search,
  ArrowRight,
  Calendar,
  DollarSign,
  Users,
  Clock,
  Zap,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TierBadge } from '@/components/ui/tier-badge';
import { TableLoadingSkeleton } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { useMutation } from '@tanstack/react-query';
import { request } from '@/lib/http/client';
import { useAuth } from '@/lib/auth';
import { useSubscriptions } from '@/hooks/use-dealflow';
import { formatCurrency } from '@/lib/utils';
import { SubscriptionStatus, BillingFrequency } from '@/types/dealflow';

function SubscriptionStatusBadge({ status }: { status: SubscriptionStatus }) {
  switch (status) {
    case 'ACTIVE':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Active
        </span>
      );
    case 'PAUSED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-300">
          <PauseCircle className="w-3.5 h-3.5 text-amber-600" />
          Paused
        </span>
      );
    case 'CANCELLED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
          <XCircle className="w-3.5 h-3.5 text-rose-600" />
          Cancelled
        </span>
      );
  }
}

function BillingFrequencyBadge({ freq }: { freq: BillingFrequency }) {
  const colorMap = {
    MONTHLY: 'bg-sky-50 text-sky-800 border-sky-200',
    QUARTERLY: 'bg-violet-50 text-violet-800 border-violet-200',
    ANNUAL: 'bg-teal-50 text-teal-800 border-teal-200',
  };
  const labelMap = { MONTHLY: 'Monthly', QUARTERLY: 'Quarterly', ANNUAL: 'Annual' };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold border ${colorMap[freq]}`}>
      <RefreshCcw className="w-3 h-3" />
      {labelMap[freq]}
    </span>
  );
}

export default function SubscriptionsListPage() {
  const {user}=useAuth();
  const billing=useMutation({mutationFn:()=>request('/api/subscriptions/bill-due',{method:'POST'})});
  const { data: subscriptions = [], isLoading } = useSubscriptions();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | SubscriptionStatus>('ALL');
  const [selectedFreq, setSelectedFreq] = useState<'ALL' | BillingFrequency>('ALL');

  const kpis = useMemo(() => {
    let active = 0, paused = 0, cancelled = 0, mrr = 0;
    subscriptions.forEach((s) => {
      if (s.status === 'ACTIVE') {
        active++;
        // Normalize to monthly
        if (s.billingFrequency === 'MONTHLY') mrr += s.recurringAmount;
        else if (s.billingFrequency === 'QUARTERLY') mrr += s.recurringAmount / 3;
        else if (s.billingFrequency === 'ANNUAL') mrr += s.recurringAmount / 12;
      } else if (s.status === 'PAUSED') paused++;
      else if (s.status === 'CANCELLED') cancelled++;
    });
    return { active, paused, cancelled, mrr };
  }, [subscriptions]);

  const filtered = useMemo(() => {
    return subscriptions.filter((s) => {
      if (selectedStatus !== 'ALL' && s.status !== selectedStatus) return false;
      if (selectedFreq !== 'ALL' && s.billingFrequency !== selectedFreq) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (
          !s.customerName.toLowerCase().includes(q) &&
          !s.planName.toLowerCase().includes(q) &&
          !s.productService.toLowerCase().includes(q) &&
          !s.id.toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });
  }, [subscriptions, selectedStatus, selectedFreq, searchQuery]);

  return (
    <div className="space-y-6 pb-12">
      {['ADMIN','FINANCE_OFFICER'].includes(user?.role??'')&&<Button disabled={billing.isPending} onClick={()=>billing.mutate()}>Issue due renewal invoices</Button>}
      {billing.error&&<p role="alert">{billing.error.message}</p>}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Commercial Subscriptions
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200">
              {subscriptions.length} Agreements
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage enterprise recurring service agreements, SLA retainers, and care plan billing schedules.
          </p>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* MRR */}
        <Card className="col-span-2 lg:col-span-1 cursor-pointer hover:border-teal-400 transition-all"
          onClick={() => setSelectedStatus('ALL')}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Monthly Recurring Revenue</span>
              <div className="p-2 rounded-md bg-teal-50 text-teal-700"><TrendingUp className="w-4 h-4" /></div>
            </div>
            <p className="text-3xl font-bold font-mono text-teal-700 mt-2">{formatCurrency(Math.round(kpis.mrr))}</p>
            <p className="text-[11px] text-slate-500 mt-1">Normalized across all active agreements</p>
          </CardContent>
        </Card>

        {/* Active */}
        <Card className={`cursor-pointer transition-all ${selectedStatus === 'ACTIVE' ? 'ring-2 ring-emerald-500 shadow-md' : 'hover:border-emerald-300'}`}
          onClick={() => setSelectedStatus(selectedStatus === 'ACTIVE' ? 'ALL' : 'ACTIVE')}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Active</span>
              <div className="p-2 rounded-md bg-emerald-50 text-emerald-700"><CheckCircle2 className="w-4 h-4" /></div>
            </div>
            <p className="text-3xl font-bold font-mono text-emerald-700 mt-2">{kpis.active}</p>
            <p className="text-[11px] text-emerald-600 mt-1">Live recurring agreements</p>
          </CardContent>
        </Card>

        {/* Paused */}
        <Card className={`cursor-pointer transition-all ${selectedStatus === 'PAUSED' ? 'ring-2 ring-amber-500 shadow-md' : 'hover:border-amber-300'}`}
          onClick={() => setSelectedStatus(selectedStatus === 'PAUSED' ? 'ALL' : 'PAUSED')}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Paused</span>
              <div className="p-2 rounded-md bg-amber-50 text-amber-700"><PauseCircle className="w-4 h-4" /></div>
            </div>
            <p className="text-3xl font-bold font-mono text-amber-600 mt-2">{kpis.paused}</p>
            <p className="text-[11px] text-amber-700 mt-1">Billing temporarily suspended</p>
          </CardContent>
        </Card>

        {/* Cancelled */}
        <Card className={`cursor-pointer transition-all ${selectedStatus === 'CANCELLED' ? 'ring-2 ring-rose-500 shadow-md' : 'hover:border-rose-300'}`}
          onClick={() => setSelectedStatus(selectedStatus === 'CANCELLED' ? 'ALL' : 'CANCELLED')}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Cancelled</span>
              <div className="p-2 rounded-md bg-rose-50 text-rose-700"><XCircle className="w-4 h-4" /></div>
            </div>
            <p className="text-3xl font-bold font-mono text-rose-600 mt-2">{kpis.cancelled}</p>
            <p className="text-[11px] text-rose-600 mt-1">Terminated agreements</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search customer, plan, product..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {(['ALL', 'ACTIVE', 'PAUSED', 'CANCELLED'] as const).map((s) => (
                <button key={s} onClick={() => setSelectedStatus(s)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${selectedStatus === s ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                  {s === 'ALL' ? 'All' : s[0] + s.slice(1).toLowerCase()}
                </button>
              ))}
              <div className="w-px h-5 bg-slate-200 mx-1" />
              {(['ALL', 'MONTHLY', 'QUARTERLY', 'ANNUAL'] as const).map((f) => (
                <button key={f} onClick={() => setSelectedFreq(f)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${selectedFreq === f ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                  {f === 'ALL' ? 'Any Frequency' : f[0] + f.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <TableLoadingSkeleton rows={5} />
          ) : filtered.length === 0 ? (
            <EmptyState title="No Subscriptions Found" description="No agreements match your filters."
              actionLabel="Reset Filters" onAction={() => { setSelectedStatus('ALL'); setSelectedFreq('ALL'); setSearchQuery(''); }} />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/75 hover:bg-slate-50/75">
                    <TableHead className="font-semibold text-slate-900">Customer</TableHead>
                    <TableHead className="font-semibold text-slate-900">Plan / Product</TableHead>
                    <TableHead className="font-semibold text-slate-900">Billing</TableHead>
                    <TableHead className="font-semibold text-slate-900 text-right">Amount</TableHead>
                    <TableHead className="font-semibold text-slate-900">Next Billing</TableHead>
                    <TableHead className="font-semibold text-slate-900">Renewal</TableHead>
                    <TableHead className="font-semibold text-slate-900">Status</TableHead>
                    <TableHead className="font-semibold text-slate-900 text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((sub) => {
                    // Compute MRR equivalent for display
                    let mrrEquiv = sub.recurringAmount;
                    let mrrLabel = '/mo';
                    if (sub.billingFrequency === 'QUARTERLY') { mrrEquiv = sub.recurringAmount / 3; mrrLabel = '/mo equiv.'; }
                    if (sub.billingFrequency === 'ANNUAL') { mrrEquiv = sub.recurringAmount / 12; mrrLabel = '/mo equiv.'; }

                    return (
                      <TableRow key={sub.id} className="hover:bg-slate-50/60 transition-colors">
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <span className="font-semibold text-slate-900 text-xs">{sub.customerName}</span>
                            <div className="scale-90 origin-left">
                              <TierBadge tier={sub.customerTier} />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <span className="font-semibold text-slate-900 text-xs">{sub.productService}</span>
                            <span className="text-[11px] text-slate-500">{sub.planName}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{sub.contractDuration} Contract</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <BillingFrequencyBadge freq={sub.billingFrequency} />
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          <div className="font-bold text-slate-900">{formatCurrency(sub.recurringAmount)}</div>
                          {sub.billingFrequency !== 'MONTHLY' && (
                            <div className="text-[11px] text-slate-500">{formatCurrency(Math.round(mrrEquiv))}{mrrLabel}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className={`text-xs font-mono font-medium ${sub.status === 'CANCELLED' ? 'text-rose-500 line-through' : 'text-slate-700'}`}>
                            {sub.nextBillingDate}
                          </div>
                          {sub.autoRenew && sub.status === 'ACTIVE' && (
                            <div className="text-[10px] text-teal-600 font-semibold">Auto-renew ON</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-xs font-mono text-slate-600">{sub.renewalDate}</div>
                        </TableCell>
                        <TableCell>
                          <SubscriptionStatusBadge status={sub.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/subscriptions/${sub.id}`}>
                            <Button variant="outline" size="sm" className="text-xs gap-1">
                              Manage
                              <ArrowRight className="w-3 h-3" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
