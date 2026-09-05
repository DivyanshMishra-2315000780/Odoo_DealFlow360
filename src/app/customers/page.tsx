'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Users,
  Building,
  ShieldCheck,
  CreditCard,
  FileText,
  RefreshCcw,
  Activity,
  Search,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Briefcase,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TierBadge } from '@/components/ui/tier-badge';
import { TableLoadingSkeleton } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { useCustomers, useQuotations, useInvoices, useSubscriptions } from '@/hooks/use-dealflow';
import { formatCurrency } from '@/lib/utils';
import { Customer, CustomerTier } from '@/types/dealflow';

function DealHealthMeter({ score }: { score: number }) {
  const isHealthy = score >= 75;
  const isAtRisk = score < 60;

  return (
    <div className="flex items-center gap-2">
      <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
        <div
          className={`h-full rounded-full ${
            isHealthy ? 'bg-emerald-500' : isAtRisk ? 'bg-rose-500' : 'bg-amber-500'
          }`}
          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
        />
      </div>
      <span
        className={`font-mono text-xs font-bold ${
          isHealthy ? 'text-emerald-700' : isAtRisk ? 'text-rose-700' : 'text-amber-700'
        }`}
      >
        {score}/100
      </span>
    </div>
  );
}

export default function CustomersListPage() {
  const { data: customers = [], isLoading: loadingCust } = useCustomers();
  const { data: quotations = [], isLoading: loadingQuotes } = useQuotations();
  const { data: invoices = [], isLoading: loadingInvs } = useInvoices();
  const { data: subscriptions = [], isLoading: loadingSubs } = useSubscriptions();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState<'ALL' | CustomerTier>('ALL');
  const [healthFilter, setHealthFilter] = useState<'ALL' | 'HEALTHY' | 'AT_RISK'>('ALL');
  const [subFilter, setSubFilter] = useState<'ALL' | 'ACTIVE' | 'NONE'>('ALL');

  const isLoading = loadingCust || loadingQuotes || loadingInvs || loadingSubs;

  // Joined Customer Data with live module stats
  const customerRows = useMemo(() => {
    return customers.map((c) => {
      // Filter quotations for this customer
      const customerQuotes = quotations.filter((q) => q.customerId === c.id || q.customerName.toLowerCase() === c.name.toLowerCase());
      const activeQuotes = customerQuotes.filter((q) => !['REJECTED', 'FULFILLMENT'].includes(q.status));
      const activeQuotesValue = activeQuotes.reduce((acc, q) => acc + q.grandTotal, 0);

      // Filter open invoices
      const customerInvs = invoices.filter((i) => i.customerId === c.id || i.customerName.toLowerCase() === c.name.toLowerCase());
      const openInvoices = customerInvs.filter((i) => i.paymentStatus !== 'PAID');
      const openInvoicesBalance = openInvoices.reduce((acc, i) => acc + (i.remainingAmount ?? i.amount), 0);

      // Filter subscription
      const customerSub = subscriptions.find((s) => s.customerId === c.id || s.customerName.toLowerCase() === c.name.toLowerCase());

      // Health score
      const healthScore = c.dealHealthScore ?? 75;

      return {
        ...c,
        activeQuotesCount: activeQuotes.length,
        activeQuotesValue,
        openInvoicesCount: openInvoices.length,
        openInvoicesBalance,
        subscription: customerSub,
        healthScore,
      };
    });
  }, [customers, quotations, invoices, subscriptions]);

  // Overall KPIs
  const kpis = useMemo(() => {
    let goldCount = 0;
    let totalReceivables = 0;
    let healthSum = 0;

    customerRows.forEach((c) => {
      if (c.tier === 'Gold') goldCount++;
      totalReceivables += c.openInvoicesBalance;
      healthSum += c.healthScore;
    });

    const avgHealth = customerRows.length > 0 ? Math.round(healthSum / customerRows.length) : 0;
    return { total: customerRows.length, goldCount, totalReceivables, avgHealth };
  }, [customerRows]);

  // Filtered rows
  const filtered = useMemo(() => {
    return customerRows.filter((c) => {
      if (selectedTier !== 'ALL' && c.tier !== selectedTier) return false;
      if (healthFilter === 'HEALTHY' && c.healthScore < 75) return false;
      if (healthFilter === 'AT_RISK' && c.healthScore >= 75) return false;
      if (subFilter === 'ACTIVE' && (!c.subscription || c.subscription.status !== 'ACTIVE')) return false;
      if (subFilter === 'NONE' && c.subscription && c.subscription.status === 'ACTIVE') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (
          !c.name.toLowerCase().includes(q) &&
          !c.accountManager.toLowerCase().includes(q) &&
          !c.industry.toLowerCase().includes(q) &&
          !c.contactPerson.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [customerRows, selectedTier, healthFilter, subFilter, searchQuery]);

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Enterprise Customers
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200">
              {customers.length} Accounts
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Commercial account directory, system-assigned tiers, live quotation pipelines, receivables, and governance health.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/portal">
            <Button variant="outline" size="sm" className="text-xs gap-1.5 border-teal-200 text-teal-800 hover:bg-teal-50">
              <Sparkles className="w-3.5 h-3.5" />
              Launch Client Portal
            </Button>
          </Link>
          <Link href="/quotes/new">
            <Button size="sm" className="text-xs gap-1.5 bg-teal-600 hover:bg-teal-700 text-white">
              <FileText className="w-3.5 h-3.5" />
              + New Quotation
            </Button>
          </Link>
        </div>
      </div>

      {/* Mandatory Governance Warning Callout */}
      <div className="p-3.5 bg-amber-50 rounded-lg border-2 border-amber-300 flex items-start gap-3 shadow-sm">
        <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-950 leading-relaxed">
          <strong className="font-bold">MANDATORY GOVERNANCE RULE: GOLD VISUAL PRIORITY vs APPROVAL RULES INDEPENDENCE</strong>
          <p className="mt-0.5 text-amber-900">
            Gold tier visually communicates high account priority, dedicated solutions support, and automated hardware ceilings up to 15%. However, <strong>Customer Tier NEVER bypasses commercial approval rules</strong>. Services remain strictly capped at 10%, and any line exception automatically escalates to Finance Controller review.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Accounts */}
        <Card className="hover:border-slate-300 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Accounts</span>
              <div className="p-1.5 rounded-md bg-slate-100 text-slate-700">
                <Building className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold font-mono text-slate-900 mt-1">{kpis.total}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Enterprise Clients</p>
          </CardContent>
        </Card>

        {/* Gold Priority Accounts */}
        <Card className="hover:border-teal-300 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Gold Priority Accounts</span>
              <div className="p-1.5 rounded-md bg-teal-50 text-teal-700">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold font-mono text-teal-700 mt-1">{kpis.goldCount}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Tier 1 Strategic Anchor Clients</p>
          </CardContent>
        </Card>

        {/* Outstanding Receivables */}
        <Card className="hover:border-amber-300 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Open Invoices Due</span>
              <div className="p-1.5 rounded-md bg-amber-50 text-amber-700">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold font-mono text-amber-700 mt-1">{formatCurrency(kpis.totalReceivables)}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Unsettled commercial balance</p>
          </CardContent>
        </Card>

        {/* Average Deal Health */}
        <Card className="hover:border-emerald-300 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Avg Account Health</span>
              <div className="p-1.5 rounded-md bg-emerald-50 text-emerald-700">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold font-mono text-emerald-700 mt-1">{kpis.avgHealth}/100</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Weighted across all deal pipelines</p>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-3 items-center justify-between">
            <div className="relative w-full lg:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search company, account manager, industry..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-1.5 flex-wrap w-full lg:w-auto">
              {/* Tier Filter */}
              {(['ALL', 'Gold', 'Silver', 'Bronze'] as const).map((tier) => (
                <button
                  key={tier}
                  onClick={() => setSelectedTier(tier as any)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                    selectedTier === tier
                      ? tier === 'Gold'
                        ? 'bg-teal-700 text-white shadow-sm'
                        : tier === 'Silver'
                        ? 'bg-slate-700 text-white shadow-sm'
                        : tier === 'Bronze'
                        ? 'bg-amber-700 text-white shadow-sm'
                        : 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tier === 'ALL' ? 'All Tiers' : `${tier} Tier`}
                </button>
              ))}

              <div className="w-px h-5 bg-slate-200 mx-1 hidden sm:block" />

              {/* Health Filter */}
              {[
                { label: 'All Health', value: 'ALL' },
                { label: 'Healthy (>=75)', value: 'HEALTHY' },
                { label: 'At-Risk (<75)', value: 'AT_RISK' },
              ].map((h) => (
                <button
                  key={h.value}
                  onClick={() => setHealthFilter(h.value as any)}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    healthFilter === h.value
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {h.label}
                </button>
              ))}

              <div className="w-px h-5 bg-slate-200 mx-1 hidden sm:block" />

              {/* Subscription Filter */}
              {[
                { label: 'All Plans', value: 'ALL' },
                { label: 'Active Sub', value: 'ACTIVE' },
                { label: 'No Sub', value: 'NONE' },
              ].map((s) => (
                <button
                  key={s.value}
                  onClick={() => setSubFilter(s.value as any)}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    subFilter === s.value
                      ? 'bg-violet-700 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <TableLoadingSkeleton rows={5} />
          ) : filtered.length === 0 ? (
            <EmptyState
              title="No Customers Found"
              description="No enterprise accounts matched your search criteria."
              actionLabel="Reset Filters"
              onAction={() => {
                setSearchQuery('');
                setSelectedTier('ALL');
                setHealthFilter('ALL');
                setSubFilter('ALL');
              }}
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/75 hover:bg-slate-50/75">
                    <TableHead className="font-semibold text-slate-900">Company</TableHead>
                    <TableHead className="font-semibold text-slate-900">Customer Tier</TableHead>
                    <TableHead className="font-semibold text-slate-900 text-right">Active Quotations</TableHead>
                    <TableHead className="font-semibold text-slate-900 text-right">Open Invoices</TableHead>
                    <TableHead className="font-semibold text-slate-900">Subscription</TableHead>
                    <TableHead className="font-semibold text-slate-900">Deal Health</TableHead>
                    <TableHead className="font-semibold text-slate-900">Owner</TableHead>
                    <TableHead className="font-semibold text-slate-900 text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c) => {
                    const isGold = c.tier === 'Gold';

                    return (
                      <TableRow
                        key={c.id}
                        className={`hover:bg-slate-50/70 transition-colors ${
                          isGold ? 'bg-teal-50/15' : ''
                        }`}
                      >
                        {/* Company */}
                        <TableCell>
                          <div className="flex items-start gap-2.5">
                            <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                              isGold ? 'bg-teal-100 text-teal-800' : 'bg-slate-100 text-slate-700'
                            }`}>
                              <Building className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 text-xs">{c.name}</span>
                                {isGold && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-teal-600 text-white">
                                    Priority
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-500">{c.industry}</span>
                              <span className="text-[10px] text-slate-400 font-mono">LTV: {formatCurrency(c.totalLifetimeValue)}</span>
                            </div>
                          </div>
                        </TableCell>

                        {/* Customer Tier */}
                        <TableCell>
                          <TierBadge tier={c.tier} />
                        </TableCell>

                        {/* Active Quotations */}
                        <TableCell className="text-right font-mono text-xs">
                          {c.activeQuotesCount > 0 ? (
                            <div>
                              <span className="font-bold text-slate-900">{formatCurrency(c.activeQuotesValue)}</span>
                              <div className="text-[10px] text-teal-700">{c.activeQuotesCount} active deals</div>
                            </div>
                          ) : (
                            <span className="text-slate-400 font-sans text-xs">None</span>
                          )}
                        </TableCell>

                        {/* Open Invoices */}
                        <TableCell className="text-right font-mono text-xs">
                          {c.openInvoicesCount > 0 ? (
                            <div>
                              <span className="font-bold text-amber-800">{formatCurrency(c.openInvoicesBalance)}</span>
                              <div className="text-[10px] text-amber-700">{c.openInvoicesCount} unpaid invoices</div>
                            </div>
                          ) : (
                            <span className="text-emerald-700 font-semibold font-sans text-xs flex items-center justify-end gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Settled
                            </span>
                          )}
                        </TableCell>

                        {/* Subscription */}
                        <TableCell>
                          {c.subscription && c.subscription.status === 'ACTIVE' ? (
                            <div className="flex flex-col">
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-violet-800">
                                <RefreshCcw className="w-3 h-3 text-violet-600" />
                                {c.subscription.productService}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono">
                                {formatCurrency(c.subscription.recurringAmount)} / {c.subscription.billingFrequency?.toLowerCase()}
                              </span>
                            </div>
                          ) : c.subscription && c.subscription.status === 'PAUSED' ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              Paused SLA
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 italic">No Subscription</span>
                          )}
                        </TableCell>

                        {/* Deal Health */}
                        <TableCell>
                          <DealHealthMeter score={c.healthScore} />
                        </TableCell>

                        {/* Owner / AE */}
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold text-slate-800">{c.accountManager}</span>
                            <span className="text-[10px] text-slate-400">{c.contactPerson.split(' ')[0]}</span>
                          </div>
                        </TableCell>

                        {/* Action */}
                        <TableCell className="text-right">
                          <Link href={`/customers/${c.id}`}>
                            <Button variant="outline" size="sm" className="text-xs gap-1">
                              Inspect
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
