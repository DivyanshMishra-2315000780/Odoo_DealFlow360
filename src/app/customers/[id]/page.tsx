'use client';

import React, { useState, useMemo, use } from 'react';
import Link from 'next/link';
import {
  Building,
  ArrowLeft,
  ShieldCheck,
  CreditCard,
  FileText,
  RefreshCcw,
  Activity,
  Users,
  Mail,
  Phone,
  MapPin,
  Globe,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Sliders,
  Send,
  Sparkles,
  ArrowRight,
  Info,
  Calendar,
  Zap,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { TierBadge } from '@/components/ui/tier-badge';
import { StatusBadge, RiskBadge } from '@/components/ui/status-badge';
import { CardLoadingSkeleton } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { useCustomer, useQuotations, useInvoices, useSubscriptions } from '@/hooks/use-dealflow';
import { formatCurrency } from '@/lib/utils';
import { Customer, CustomerTier } from '@/types/dealflow';

interface CustomerDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const resolvedParams = use(params);
  const customerId = resolvedParams.id;

  const { data: customer, isLoading: loadingCust, error } = useCustomer(customerId);
  const { data: allQuotations = [], isLoading: loadingQuotes } = useQuotations();
  const { data: allInvoices = [], isLoading: loadingInvs } = useInvoices();
  const { data: allSubscriptions = [], isLoading: loadingSubs } = useSubscriptions();

  const [activeTab, setActiveTab] = useState<
    'OVERVIEW' | 'TIER' | 'CONTACT' | 'QUOTATIONS' | 'NEGOTIATIONS' | 'INVOICES' | 'SUBSCRIPTIONS' | 'HEALTH' | 'TIMELINE'
  >('OVERVIEW');

  const isLoading = loadingCust || loadingQuotes || loadingInvs || loadingSubs;

  // Filter linked data for this customer
  const customerQuotes = useMemo(() => {
    if (!customer) return [];
    return allQuotations.filter(
      (q) => q.customerId === customer.id || q.customerName.toLowerCase() === customer.name.toLowerCase()
    );
  }, [customer, allQuotations]);

  const customerInvoices = useMemo(() => {
    if (!customer) return [];
    return allInvoices.filter(
      (i) => i.customerId === customer.id || i.customerName.toLowerCase() === customer.name.toLowerCase()
    );
  }, [customer, allInvoices]);

  const customerSubscriptions = useMemo(() => {
    if (!customer) return [];
    return allSubscriptions.filter(
      (s) => s.customerId === customer.id || s.customerName.toLowerCase() === customer.name.toLowerCase()
    );
  }, [customer, allSubscriptions]);

  // Negotiations (quotes in negotiation or with concession notes)
  const negotiationQuotes = useMemo(() => {
    return customerQuotes.filter(
      (q) => q.status === 'IN_NEGOTIATION' || q.status === 'RETURNED' || q.items.some((i) => i.isViolation)
    );
  }, [customerQuotes]);

  // Unified activity timeline for this customer
  const customerTimeline = useMemo(() => {
    if (!customer) return [];
    const events: Array<{
      id: string;
      timestamp: string;
      title: string;
      type: 'QUOTE' | 'INVOICE' | 'SUB' | 'AUDIT';
      actor: string;
      details: string;
    }> = [];

    customerQuotes.forEach((q) => {
      q.auditTrail.forEach((a) => {
        events.push({
          id: `${q.id}-${a.id}`,
          timestamp: a.timestamp,
          title: `${q.id}: ${a.action}`,
          type: 'QUOTE',
          actor: a.actor,
          details: a.details,
        });
      });
    });

    customerInvoices.forEach((inv) => {
      events.push({
        id: `INV-${inv.id}`,
        timestamp: inv.issueDate,
        title: `Invoice ${inv.id} Issued (${formatCurrency(inv.amount)})`,
        type: 'INVOICE',
        actor: 'Billing System',
        details: `Commercial invoice generated for related quotation ${inv.quotationId}. Payment terms: Net 30.`,
      });
      if (inv.paymentStatus === 'PAID' && inv.paidAt) {
        events.push({
          id: `PAID-${inv.id}`,
          timestamp: inv.paidAt,
          title: `Invoice ${inv.id} Settled`,
          type: 'INVOICE',
          actor: 'ACH Settlement Gateway',
          details: `Full payment recorded via ${inv.paymentMethod || 'Wire Transfer'}. Reference: ${inv.paymentReference || 'N/A'}.`,
        });
      }
    });

    return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [customer, customerQuotes, customerInvoices]);

  if (isLoading) {
    return (
      <div className="space-y-6 pb-12">
        <div className="h-8 w-64 bg-slate-200 animate-pulse rounded" />
        <CardLoadingSkeleton />
        <CardLoadingSkeleton />
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="py-12">
        <ErrorState title="Customer Account Not Found" message={`Could not locate account ID ${customerId}.`} />
        <div className="mt-4 text-center">
          <Link href="/customers">
            <Button variant="outline">Return to Customers Directory</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isGold = customer.tier === 'Gold';
  const isSilver = customer.tier === 'Silver';
  const healthScore = customer.dealHealthScore ?? 75;

  return (
    <div className="space-y-6 pb-16">
      {/* Top Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <Link href="/customers">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                {customer.id}
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{customer.name}</h1>
              <TierBadge tier={customer.tier} />
              {isGold && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-600 text-white shadow-xs">
                  Priority Account
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {customer.industry} • Managed by <strong className="text-slate-800">{customer.accountManager}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link href={`/quotes/new`}>
            <Button size="sm" className="text-xs gap-1.5 bg-teal-600 hover:bg-teal-700 text-white">
              <FileText className="w-3.5 h-3.5" />
              Draft Quotation
            </Button>
          </Link>
        </div>
      </div>

      {/* MANDATORY GOVERNANCE CALLOUT: GOLD VISUAL PRIORITY vs APPROVAL CEILINGS */}
      <div className={`p-4 rounded-lg border-2 shadow-sm ${
        isGold
          ? 'bg-teal-50/40 border-teal-300 text-teal-950'
          : isSilver
          ? 'bg-slate-50 border-slate-300 text-slate-900'
          : 'bg-amber-50/50 border-amber-300 text-amber-950'
      }`}>
        <div className="flex items-start gap-3">
          <ShieldCheck className={`w-5 h-5 shrink-0 mt-0.5 ${isGold ? 'text-teal-700' : 'text-slate-700'}`} />
          <div className="text-xs leading-relaxed space-y-1">
            <div className="flex items-center gap-2">
              <strong className="text-sm font-bold uppercase tracking-wider">
                {customer.tier} Tier Commercial Standing
              </strong>
              <span className="font-mono text-[11px] font-bold px-2 py-0.2 rounded bg-white border border-slate-200">
                {customer.tier === 'Gold' ? '15% Hardware Cap / 10% Services Cap' : customer.tier === 'Silver' ? '10% Maximum Cap' : '5% Maximum Cap'}
              </span>
            </div>
            <p>
              {isGold ? (
                <>
                  <strong>Gold priority communicates strategic importance</strong> and unlocks our highest hardware discount ceiling (15%) with dedicated account management. However, <strong>APPROVAL RULES REMAIN STRICTLY INDEPENDENT OF TIER PRIORITY</strong>: Services remain non-negotiably capped at 10%, and any quote exceeding category bounds requires executive sign-off from Finance Controller Sarah Sterling.
                </>
              ) : (
                <>
                  System-assigned commercial tier automatically evaluated based on lifetime volume ($300k+ required for Gold, $100k+ for Silver). All quotations are strictly governed by <span className="font-semibold">min(Tier Limit, Product Category Limit)</span>.
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* 9 Tab Navigation */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { id: 'OVERVIEW', label: '1. Overview', icon: Building },
          { id: 'TIER', label: '2. Customer Tier', icon: ShieldCheck },
          { id: 'CONTACT', label: '3. Contact Info', icon: Mail },
          { id: 'QUOTATIONS', label: `4. Quotations (${customerQuotes.length})`, icon: FileText },
          { id: 'NEGOTIATIONS', label: `5. Negotiations (${negotiationQuotes.length})`, icon: Sliders },
          { id: 'INVOICES', label: `6. Invoices (${customerInvoices.length})`, icon: CreditCard },
          { id: 'SUBSCRIPTIONS', label: `7. Subscriptions (${customerSubscriptions.length})`, icon: RefreshCcw },
          { id: 'HEALTH', label: '8. Deal Health', icon: Activity },
          { id: 'TIMELINE', label: `9. Timeline (${customerTimeline.length})`, icon: Clock },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                isActive ? 'bg-teal-700 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: COMPANY OVERVIEW */}
      {activeTab === 'OVERVIEW' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <Building className="w-4 h-4 text-teal-600" />
                  Account Profile & Master Commercial Data
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
                  <div>
                    <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Company</span>
                    <p className="text-sm font-semibold text-slate-900 mt-0.5">{customer.name}</p>
                  </div>
                  <div>
                    <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Account ID</span>
                    <p className="text-sm font-mono font-semibold text-slate-900 mt-0.5">{customer.id}</p>
                  </div>
                  <div>
                    <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Industry</span>
                    <p className="text-sm font-semibold text-slate-900 mt-0.5">{customer.industry}</p>
                  </div>
                  <div>
                    <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Lifetime Value (LTV)</span>
                    <p className="text-base font-bold font-mono text-teal-700 mt-0.5">
                      {formatCurrency(customer.totalLifetimeValue)}
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Credit Limit</span>
                    <p className="text-sm font-mono font-bold text-slate-900 mt-0.5">
                      {formatCurrency(customer.creditLimit)}
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Credit Rating</span>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">
                      <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-xs border border-slate-200">
                        {customer.creditRating || 'AA'}
                      </span>
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Assigned Owner</span>
                    <p className="text-sm font-semibold text-slate-900 mt-0.5">{customer.accountManager}</p>
                  </div>
                  <div>
                    <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Active Deals</span>
                    <p className="text-sm font-bold text-teal-800 mt-0.5">{customerQuotes.length} Deals</p>
                  </div>
                  <div>
                    <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Health Rating</span>
                    <p className="text-sm font-bold mt-0.5 text-slate-900">{healthScore}/100</p>
                  </div>
                </div>

                {customer.notes && (
                  <div className="mt-5 p-3.5 bg-slate-50 rounded-md border border-slate-200">
                    <span className="text-[11px] uppercase font-bold text-slate-500 tracking-wider">Commercial Notes</span>
                    <p className="text-xs text-slate-700 mt-1 leading-relaxed">{customer.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Metrics Sidebar */}
          <div className="space-y-4">
            <Card className="border-teal-200 bg-teal-50/20">
              <CardContent className="p-5 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-800">Account Pipeline Summary</span>
                <div className="space-y-2 pt-1 font-mono text-xs">
                  <div className="flex justify-between border-b border-teal-200/60 pb-1.5">
                    <span className="text-slate-600">Total Quotations</span>
                    <span className="font-bold text-slate-900">{customerQuotes.length}</span>
                  </div>
                  <div className="flex justify-between border-b border-teal-200/60 pb-1.5">
                    <span className="text-slate-600">Active Pipeline Value</span>
                    <span className="font-bold text-teal-800">
                      {formatCurrency(customerQuotes.reduce((acc, q) => acc + q.grandTotal, 0))}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-teal-200/60 pb-1.5">
                    <span className="text-slate-600">Total Invoices</span>
                    <span className="font-bold text-slate-900">{customerInvoices.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Active Retainers</span>
                    <span className="font-bold text-violet-800">{customerSubscriptions.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: CUSTOMER TIER */}
      {activeTab === 'TIER' && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                System-Assigned Commercial Tier Qualification Matrix
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-slate-50 border border-slate-200">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">Current Standing:</h3>
                    <TierBadge tier={customer.tier} />
                  </div>
                  <p className="text-xs text-slate-600">
                    {isGold
                      ? 'Highest commercial standing. Maximum permitted hardware discount is 15%.'
                      : isSilver
                      ? 'Mid-market growth standing. Maximum permitted discount is 10% across hardware and services.'
                      : 'Introductory commercial tier. Maximum permitted discount is 5%.'}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Evaluation Mode</span>
                  <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    System-Assigned (Automatic)
                  </span>
                </div>
              </div>

              {/* Qualification Threshold Progress */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Objective Advancement Thresholds:
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Spend Metric */}
                  <div className="p-4 rounded-lg border border-slate-200 bg-white space-y-2">
                    <span className="text-[11px] font-bold uppercase text-slate-400 block">1. Lifetime Spend</span>
                    <p className="text-lg font-bold font-mono text-slate-900">{formatCurrency(customer.totalLifetimeValue)}</p>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-teal-600 h-full rounded-full"
                        style={{ width: `${Math.min(100, (customer.totalLifetimeValue / 300000) * 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 block">
                      {customer.totalLifetimeValue >= 300000 ? '✅ Meets Gold ($300k+)' : 'Requires $300k for Gold'}
                    </span>
                  </div>

                  {/* Deals Count */}
                  <div className="p-4 rounded-lg border border-slate-200 bg-white space-y-2">
                    <span className="text-[11px] font-bold uppercase text-slate-400 block">2. Closed Deals</span>
                    <p className="text-lg font-bold font-mono text-slate-900">{customerQuotes.length} Deals</p>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-teal-600 h-full rounded-full"
                        style={{ width: `${Math.min(100, (customerQuotes.length / 3) * 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 block">
                      {customerQuotes.length >= 3 ? '✅ Meets Gold (3+ Deals)' : 'Requires 3+ Deals'}
                    </span>
                  </div>

                  {/* Credit Rating */}
                  <div className="p-4 rounded-lg border border-slate-200 bg-white space-y-2">
                    <span className="text-[11px] font-bold uppercase text-slate-400 block">3. Commercial Credit</span>
                    <p className="text-lg font-bold font-mono text-slate-900">{customer.creditRating || 'AA'}</p>
                    <span className="text-xs text-emerald-700 font-semibold block">Underwritten by Risk Desk</span>
                    <span className="text-[10px] text-slate-500 block">Limit: {formatCurrency(customer.creditLimit)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 3: CONTACT INFORMATION */}
      {activeTab === 'CONTACT' && (
        <Card>
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Mail className="w-4 h-4 text-teal-600" />
              Corporate Contact & Billing Records
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Primary Contact</span>
                  <p className="text-sm font-semibold text-slate-900 mt-0.5">{customer.contactPerson}</p>
                </div>
                <div>
                  <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Email Address</span>
                  <p className="text-sm font-mono text-teal-700 mt-0.5">{customer.contactEmail}</p>
                </div>
                <div>
                  <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Phone</span>
                  <p className="text-sm font-mono text-slate-900 mt-0.5">{customer.phone || '+1 (555) 019-2831'}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Corporate Address</span>
                  <p className="text-sm text-slate-700 mt-0.5">
                    {customer.address || '100 Enterprise Boulevard, Suite 500, Tech District'}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Corporate Website</span>
                  <p className="text-sm font-mono text-teal-700 mt-0.5">{customer.website || `https://${customer.name.toLowerCase().replace(/[^a-z]/g, '')}.com`}</p>
                </div>
                <div>
                  <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Dedicated Account Executive</span>
                  <p className="text-sm font-semibold text-slate-900 mt-0.5">{customer.accountManager}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 4: ACTIVE QUOTATIONS */}
      {activeTab === 'QUOTATIONS' && (
        <Card>
          <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-teal-600" />
              Quotations Ledger ({customerQuotes.length} Deals)
            </CardTitle>
            <Link href="/quotes/new">
              <Button size="sm" className="text-xs gap-1 bg-teal-600 hover:bg-teal-700 text-white">
                Draft New Quote
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {customerQuotes.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">No quotations found for this account.</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/75 hover:bg-slate-50/75">
                      <TableHead className="font-semibold text-slate-900">Quotation</TableHead>
                      <TableHead className="font-semibold text-slate-900">Title</TableHead>
                      <TableHead className="font-semibold text-slate-900 text-right">Net Grand Total</TableHead>
                      <TableHead className="font-semibold text-slate-900">Risk</TableHead>
                      <TableHead className="font-semibold text-slate-900">Status</TableHead>
                      <TableHead className="font-semibold text-slate-900">Created</TableHead>
                      <TableHead className="font-semibold text-slate-900 text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customerQuotes.map((q) => (
                      <TableRow key={q.id} className="hover:bg-slate-50/60 transition-colors">
                        <TableCell className="font-mono font-bold text-xs text-teal-800">{q.id}</TableCell>
                        <TableCell className="text-xs font-semibold text-slate-900 max-w-xs">{q.title}</TableCell>
                        <TableCell className="text-right font-mono font-bold text-xs">{formatCurrency(q.grandTotal)}</TableCell>
                        <TableCell><RiskBadge level={q.riskDiagnosis.level} /></TableCell>
                        <TableCell><StatusBadge status={q.status} /></TableCell>
                        <TableCell className="text-xs font-mono text-slate-500">{q.createdAt.slice(0, 10)}</TableCell>
                        <TableCell className="text-right">
                          <Link href={`/quotes/${q.id}`}>
                            <Button variant="outline" size="sm" className="text-xs gap-1">
                              Inspect <ArrowRight className="w-3 h-3" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB 5: NEGOTIATIONS */}
      {activeTab === 'NEGOTIATIONS' && (
        <Card>
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-teal-600" />
              Active Negotiations & Concession Deliberations
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {negotiationQuotes.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No active counter-offers or concessions currently in negotiation for this account.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {negotiationQuotes.map((q) => (
                  <div key={q.id} className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-teal-800">{q.id}</span>
                        <span className="font-semibold text-xs text-slate-900">{q.title}</span>
                        <StatusBadge status={q.status} />
                      </div>
                      <Link href={`/quotes/${q.id}`}>
                        <Button variant="outline" size="sm" className="text-xs gap-1">
                          Open Negotiation Room <ArrowRight className="w-3 h-3" />
                        </Button>
                      </Link>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-md border border-slate-200 text-xs space-y-1">
                      <div className="flex justify-between font-mono text-[11px] text-slate-500">
                        <span>Total: {formatCurrency(q.grandTotal)}</span>
                        <span>Discount: {formatCurrency(q.totalDiscountAmount)}</span>
                      </div>
                      <p className="text-slate-700 mt-1">
                        <strong>Policy Evaluation:</strong> {q.riskDiagnosis.whatHappened}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB 6: INVOICES */}
      {activeTab === 'INVOICES' && (
        <Card>
          <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-teal-600" />
              Commercial Invoices Ledger ({customerInvoices.length} Invoices)
            </CardTitle>
            <Link href="/invoices">
              <Button variant="outline" size="sm" className="text-xs gap-1">
                View All Invoices
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {customerInvoices.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">No invoices generated yet for this account.</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/75 hover:bg-slate-50/75">
                      <TableHead className="font-semibold text-slate-900">Invoice</TableHead>
                      <TableHead className="font-semibold text-slate-900">Related Quote</TableHead>
                      <TableHead className="font-semibold text-slate-900 text-right">Amount</TableHead>
                      <TableHead className="font-semibold text-slate-900">Due Date</TableHead>
                      <TableHead className="font-semibold text-slate-900">Payment Status</TableHead>
                      <TableHead className="font-semibold text-slate-900">Shipment State</TableHead>
                      <TableHead className="font-semibold text-slate-900 text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customerInvoices.map((inv) => (
                      <TableRow key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                        <TableCell className="font-mono font-bold text-xs text-teal-800">{inv.id}</TableCell>
                        <TableCell className="font-mono text-xs text-slate-600">{inv.quotationId}</TableCell>
                        <TableCell className="text-right font-mono font-bold text-xs">{formatCurrency(inv.amount)}</TableCell>
                        <TableCell className="text-xs font-mono text-slate-600">{inv.dueDate}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            inv.paymentStatus === 'PAID'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-300'
                          }`}>
                            {inv.paymentStatus}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-slate-600">{inv.shipmentStatus}</TableCell>
                        <TableCell className="text-right">
                          <Link href={`/invoices/${inv.id}`}>
                            <Button variant="outline" size="sm" className="text-xs gap-1">
                              View Invoice <ArrowRight className="w-3 h-3" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB 7: SUBSCRIPTIONS */}
      {activeTab === 'SUBSCRIPTIONS' && (
        <Card>
          <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <RefreshCcw className="w-4 h-4 text-violet-600" />
              Active Subscriptions & SLA Retainers
            </CardTitle>
            <Link href="/subscriptions">
              <Button variant="outline" size="sm" className="text-xs gap-1">
                View Subscriptions Hub
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {customerSubscriptions.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No active software or SLA subscriptions currently linked to this customer.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {customerSubscriptions.map((sub) => (
                  <div key={sub.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-violet-800">{sub.id}</span>
                        <h4 className="font-bold text-sm text-slate-900">{sub.productService}</h4>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          sub.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}>
                          {sub.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {sub.planName} • {sub.contractDuration} Contract • Next Billing: {sub.nextBillingDate}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right font-mono">
                        <div className="text-base font-bold text-slate-900">{formatCurrency(sub.recurringAmount)}</div>
                        <div className="text-[10px] text-slate-400">per {sub.billingFrequency.toLowerCase()}</div>
                      </div>
                      <Link href={`/subscriptions/${sub.id}`}>
                        <Button variant="outline" size="sm" className="text-xs gap-1">
                          Manage SLA <ArrowRight className="w-3 h-3" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB 8: DEAL HEALTH */}
      {activeTab === 'HEALTH' && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-teal-600" />
                Account Deal Health & Velocity Diagnostics
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-6">
              <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 border border-slate-200">
                <div className="space-y-1">
                  <span className="text-xs uppercase font-bold text-slate-500">Account Health Index</span>
                  <div className="text-3xl font-bold font-mono text-teal-800">{healthScore}/100</div>
                  <p className="text-xs text-slate-600">
                    {healthScore >= 75
                      ? 'Healthy account velocity and compliant discount history.'
                      : 'Account contains stalled proposals or policy exception escalations requiring intervention.'}
                  </p>
                </div>
                <Link href="/deal-health">
                  <Button size="sm" className="text-xs gap-1 bg-teal-600 hover:bg-teal-700 text-white">
                    Open Deal Health Center
                  </Button>
                </Link>
              </div>

              {/* Vector breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
                <div className="p-3 bg-white rounded border border-slate-200 space-y-1">
                  <span className="text-slate-400 uppercase font-bold text-[10px] block">Pipeline Velocity</span>
                  <p className="font-bold text-slate-900 text-sm">{healthScore > 50 ? 'On Track' : 'Stalled In Negotiation'}</p>
                </div>
                <div className="p-3 bg-white rounded border border-slate-200 space-y-1">
                  <span className="text-slate-400 uppercase font-bold text-[10px] block">Discount Conformance</span>
                  <p className="font-bold text-slate-900 text-sm">
                    {negotiationQuotes.length > 0 ? 'Exceptions Flagged' : '100% Policy Compliant'}
                  </p>
                </div>
                <div className="p-3 bg-white rounded border border-slate-200 space-y-1">
                  <span className="text-slate-400 uppercase font-bold text-[10px] block">Receivables Risk</span>
                  <p className="font-bold text-slate-900 text-sm">
                    {customerInvoices.some((i) => i.paymentStatus !== 'PAID') ? 'Open Balance Due' : 'All Settled'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 9: ACTIVITY TIMELINE */}
      {activeTab === 'TIMELINE' && (
        <Card>
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-600" />
              Chronological Audit & Governance Activity Ledger
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {customerTimeline.length === 0 ? (
              <div className="text-center text-xs text-slate-400 py-6">No historical activity recorded.</div>
            ) : (
              <div className="space-y-6 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200">
                {customerTimeline.map((item) => (
                  <div key={item.id} className="relative flex items-start gap-4 pl-8">
                    <div className="absolute left-2 top-1 w-3.5 h-3.5 rounded-full border-2 border-teal-600 bg-teal-50" />
                    <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-1 text-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <span className="font-bold text-slate-900">{item.title}</span>
                        <span className="font-mono text-[11px] text-slate-400">
                          {item.timestamp.replace('T', ' ').slice(0, 16)}
                        </span>
                      </div>
                      <div className="text-slate-500 text-[11px]">Actor: <strong>{item.actor}</strong></div>
                      <p className="text-slate-700 leading-relaxed pt-0.5">{item.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
