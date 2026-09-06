'use client';

import React, { useState, useMemo } from 'react';
import {
  useQuotations,
  useCustomers,
  useProducts,
  useInvoices,
  useFulfillmentOrders,
  useUpdateQuotationStatus,
  useUpdateInvoiceStatus,
} from '@/hooks/use-dealflow';
import { TierBadge } from '@/components/ui/tier-badge';
import { StatusBadge, RiskBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Select } from '@/components/ui/select';
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { CardLoadingSkeleton } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { NewQuotationDialog } from '@/components/quotations/new-quotation-dialog';
import { useToast } from '@/components/providers/query-provider';
import { formatCurrency, formatPercent } from '@/lib/utils';
import {
  CustomerTier,
  Quotation,
  QuotationStatus,
} from '@/types/dealflow';
import {
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  Building,
  Package,
  Layers,
  Sparkles,
  ArrowRight,
  Eye,
  Plus,
  Filter,
  Calendar,
  AlertCircle,
  FileText,
  Truck,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

export default function SalesDashboardPage() {
  const { data: quotations = [], isLoading: loadingQuotations } = useQuotations();
  const { data: customers = [] } = useCustomers();
  const { data: products = [] } = useProducts();
  const { data: invoices = [] } = useInvoices();
  const { data: fulfillment = [] } = useFulfillmentOrders();
  const { toast } = useToast();

  const quotationByReference = (reference: string) => quotations.find((quote) => quote.id === reference);
  const q1042Title = quotationByReference('Q-1042')?.title ?? 'Acme Corporation quotation';
  const q1045Title = quotationByReference('Q-1045')?.title ?? 'Zenith Industries quotation';

  const updateQuotationStatus = useUpdateQuotationStatus();
  const updateInvoiceStatus = useUpdateInvoiceStatus();

  // Dialog states
  const [isNewQuotationOpen, setIsNewQuotationOpen] = useState(false);
  const [inspectQuotation, setInspectQuotation] = useState<Quotation | null>(null);

  // Filter controls
  const [selectedPeriod, setSelectedPeriod] = useState('Q3-2026');
  const [selectedTierFilter, setSelectedTierFilter] = useState<string>('ALL');

  // Filtered quotations based on customer tier
  const filteredQuotations = useMemo(() => {
    if (selectedTierFilter === 'ALL') return quotations;
    return quotations.filter((q) => q.customerTier === selectedTierFilter);
  }, [quotations, selectedTierFilter]);

  // KPI Calculations
  const pendingApprovals = filteredQuotations.filter(
    (q) => q.status === 'PENDING_APPROVAL'
  );
  const openQuotations = filteredQuotations.filter((q) => q.status !== 'REJECTED');
  const atRiskDeals = filteredQuotations.filter(
    (q) => q.riskDiagnosis.level === 'HIGH' || q.riskDiagnosis.level === 'CRITICAL'
  );
  const totalPipelineRevenue = openQuotations.reduce((acc, q) => acc + q.grandTotal, 0);
  const avgDealHealth = filteredQuotations.length
    ? Math.round(
        filteredQuotations.reduce((acc, q) => acc + q.dealHealthScore, 0) /
          filteredQuotations.length
      )
    : 95;

  // Pipeline Stages Grouping
  const pipelineStages: {
    key: QuotationStatus | 'NEGOTIATION';
    label: string;
    description: string;
    items: Quotation[];
  }[] = [
    {
      key: 'DRAFT',
      label: 'Draft',
      description: 'Initial scope & pricing',
      items: filteredQuotations.filter((q) => q.status === 'DRAFT'),
    },
    {
      key: 'PENDING_APPROVAL',
      label: 'Pending Approval',
      description: 'Discount review required',
      items: filteredQuotations.filter(
        (q) => q.status === 'PENDING_APPROVAL'
      ),
    },
    {
      key: 'APPROVED',
      label: 'Approved',
      description: 'Terms verified & compliant',
      items: filteredQuotations.filter((q) => q.status === 'APPROVED'),
    },
    {
      key: 'NEGOTIATION',
      label: 'Negotiation',
      description: 'Active client counter-offers',
      items: filteredQuotations.filter((q) => q.status === 'UNDER_NEGOTIATION'),
    },
    {
      key: 'CONFIRMED',
      label: 'Confirmed',
      description: 'Binding agreement secured',
      items: filteredQuotations.filter((q) => q.status === 'CONFIRMED' || q.status === 'FULFILLMENT'),
    },
  ];

  // Deal Health Groupings
  const stalledDeals = filteredQuotations.filter(
    (q) => q.status === 'UNDER_NEGOTIATION' || q.status === 'DRAFT'
  );
  const discountAnomalies = filteredQuotations.filter((q) =>
    q.items.some((item) => item.isViolation)
  );

  // Quick Action Handlers
  const handleApprove = async (q: Quotation) => {
    try {
      await updateQuotationStatus.mutateAsync({
        id: q.id,
        status: 'APPROVED',
        note: 'Approved by Commercial Controller Marcus Vance via Executive Dashboard.',
        actor: 'Marcus Vance (Commercial Controller)',
      });
      toast({
        title: `Quotation ${q.id} Approved`,
        description: `${q.customerName} deal authorized for customer execution.`,
        type: 'success',
      });
      if (inspectQuotation?.id === q.id) {
        setInspectQuotation((prev) => (prev ? { ...prev, status: 'APPROVED' } : null));
      }
    } catch {
      toast({
        title: 'Action Failed',
        type: 'error',
      });
    }
  };

  const handleReject = async (q: Quotation) => {
    try {
      await updateQuotationStatus.mutateAsync({
        id: q.id,
        status: 'REJECTED',
        note: 'Returned for rework: discount ceiling exceeds permissible margin boundaries.',
        actor: 'Marcus Vance (Commercial Controller)',
      });
      toast({
        title: `Quotation ${q.id} Returned`,
        description: `Deal desk notified to renegotiate within permitted tier caps.`,
        type: 'warning',
      });
      if (inspectQuotation?.id === q.id) {
        setInspectQuotation((prev) => (prev ? { ...prev, status: 'REJECTED' } : null));
      }
    } catch {
      toast({
        title: 'Action Failed',
        type: 'error',
      });
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* ======================================================== */}
      {/* 1. HEADER                                                */}
      {/* ======================================================== */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Sales Executive Dashboard & Pipeline Health
            </h1>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded-md shadow-2xs">
              <Sparkles className="w-3 h-3" /> Live Deal Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time B2B deal governance, discount violation telemetry, and execution velocity.
          </p>
        </div>

        {/* Date / Filter Controls & New Quotation CTA */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Period Filter */}
          <div className="w-36">
            <Select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="h-8 text-xs font-medium"
            >
              <option value="Q3-2026">Q3 2026 (Current)</option>
              <option value="THIS-MONTH">September 2026</option>
              <option value="YTD">Year to Date</option>
            </Select>
          </div>

          {/* Customer Tier Filter */}
          <div className="w-32">
            <Select
              value={selectedTierFilter}
              onChange={(e) => setSelectedTierFilter(e.target.value)}
              className="h-8 text-xs font-medium"
            >
              <option value="ALL">All Tiers</option>
              <option value="Gold">Gold Tier (15%)</option>
              <option value="Silver">Silver Tier (10%)</option>
              <option value="Bronze">Bronze Tier (5%)</option>
            </Select>
          </div>

          {/* New Quotation CTA */}
          <Button
            variant="default"
            size="sm"
            onClick={() => setIsNewQuotationOpen(true)}
            className="shadow-enterprise gap-1.5"
          >
            <Plus className="w-4 h-4" />
            New Quotation
          </Button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. KPI CARDS                                             */}
      {/* ======================================================== */}
      {loadingQuotations ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <CardLoadingSkeleton />
          <CardLoadingSkeleton />
          <CardLoadingSkeleton />
          <CardLoadingSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* KPI 1: Pending Approvals */}
          <Card className="hover:border-slate-300">
            <CardContent className="p-5">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Pending Approvals
                </span>
                <div className="p-2 rounded-md bg-amber-50 text-amber-700 shadow-2xs">
                  <AlertCircle className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold font-mono text-slate-900 tracking-tight">
                  {pendingApprovals.length}
                </span>
                <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                  Needs Sign-off
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {pendingApprovals.length > 0
                  ? `${formatCurrency(pendingApprovals.reduce((a, b) => a + b.grandTotal, 0))} in exception deals`
                  : 'Zero outstanding discount escalations'}
              </p>
              <div className="flex items-center gap-1 text-[11px] text-amber-700 mt-2 font-medium">
                <span>⚡ Action required today</span>
              </div>
            </CardContent>
          </Card>

          {/* KPI 2: Open Quotations */}
          <Card className="hover:border-slate-300">
            <CardContent className="p-5">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Open Quotations
                </span>
                <div className="p-2 rounded-md bg-teal-50 text-teal-700 shadow-2xs">
                  <FileText className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold font-mono text-slate-900 tracking-tight">
                  {openQuotations.length}
                </span>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  Active
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Across {new Set(openQuotations.map((q) => q.customerId)).size} enterprise accounts
              </p>
              <div className="flex items-center gap-1 text-[11px] text-emerald-600 mt-2 font-medium">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+14% volume vs last month</span>
              </div>
            </CardContent>
          </Card>

          {/* KPI 3: At-Risk Deals */}
          <Card className="hover:border-slate-300">
            <CardContent className="p-5">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  At-Risk Deals
                </span>
                <div className="p-2 rounded-md bg-rose-50 text-rose-700 shadow-2xs">
                  <ShieldAlert className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold font-mono text-slate-900 tracking-tight">
                  {atRiskDeals.length}
                </span>
                <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                  Policy Breached
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {atRiskDeals.length > 0
                  ? `${atRiskDeals[0].customerName} exceeds discount cap`
                  : 'All deals within tier margin rules'}
              </p>
              <div className="flex items-center gap-1 text-[11px] text-rose-600 mt-2 font-medium">
                <span>Finance Controller sign-off required</span>
              </div>
            </CardContent>
          </Card>

          {/* KPI 4: Revenue / Pipeline Value */}
          <Card className="hover:border-slate-300">
            <CardContent className="p-5">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Pipeline Value
                </span>
                <div className="p-2 rounded-md bg-slate-100 text-slate-700 shadow-2xs">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 tracking-tight">
                  {formatCurrency(totalPipelineRevenue)}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Net contracted value after enforced discounts
              </p>
              <div className="flex items-center gap-1 text-[11px] text-teal-700 mt-2 font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>86% average margin preservation</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. ACTION REQUIRED (PROMINENT COMMAND CENTER)            */}
      {/* ======================================================== */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Action Required — Decision Command Center
            </h2>
          </div>
          <span className="text-xs text-slate-500">
            Click any item below to resolve immediately
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Action Item 1 */}
          <button
            type="button"
            onClick={() => {
              const pending = quotations.find((q) => q.status === 'PENDING_APPROVAL') || quotations[0];
              setInspectQuotation(pending);
            }}
            className="text-left p-4 rounded-lg border border-amber-200 bg-amber-50/70 hover:bg-amber-100/70 transition shadow-enterprise group cursor-pointer"
          >
            <div className="flex items-center justify-between text-amber-900">
              <span className="text-xs font-bold uppercase tracking-wider">
                {pendingApprovals.length} Awaiting Approval
              </span>
              <ChevronRight className="w-4 h-4 text-amber-700 group-hover:translate-x-0.5 transition" />
            </div>
            <p className="text-xs font-semibold text-slate-900 mt-1">
              {q1042Title} <span className="font-mono text-[10px] text-slate-500">(Ref: Q-1042)</span>
            </p>
            <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
              Onsite Setup service discount exceeds permitted limit.
            </p>
            <div className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-amber-900">
              Review & Sign-off →
            </div>
          </button>

          {/* Action Item 2 */}
          <button
            type="button"
            onClick={() => {
              const atRisk = atRiskDeals[0] || quotations[0];
              setInspectQuotation(atRisk);
            }}
            className="text-left p-4 rounded-lg border border-rose-200 bg-rose-50/70 hover:bg-rose-100/70 transition shadow-enterprise group cursor-pointer"
          >
            <div className="flex items-center justify-between text-rose-900">
              <span className="text-xs font-bold uppercase tracking-wider">
                {atRiskDeals.length} High-Risk Policy Breach
              </span>
              <ChevronRight className="w-4 h-4 text-rose-700 group-hover:translate-x-0.5 transition" />
            </div>
            <p className="text-xs font-semibold text-slate-900 mt-1">
              {q1042Title} <span className="font-mono text-[10px] text-slate-500">(Ref: Q-1042)</span>
            </p>
            <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
              +8% over category limit. Customer Gold tier cannot bypass rule.
            </p>
            <div className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-rose-800">
              Inspect Risk Diagnosis →
            </div>
          </button>

          {/* Action Item 3 */}
          <button
            type="button"
            onClick={() => {
              const stalled = stalledDeals[0] || quotations[0];
              setInspectQuotation(stalled);
            }}
            className="text-left p-4 rounded-lg border border-blue-200 bg-blue-50/70 hover:bg-blue-100/70 transition shadow-enterprise group cursor-pointer"
          >
            <div className="flex items-center justify-between text-blue-900">
              <span className="text-xs font-bold uppercase tracking-wider">
                {stalledDeals.length} Stalled Deals
              </span>
              <ChevronRight className="w-4 h-4 text-blue-700 group-hover:translate-x-0.5 transition" />
            </div>
            <p className="text-xs font-semibold text-slate-900 mt-1">
              {q1045Title} <span className="font-mono text-[10px] text-slate-500">(Ref: Q-1045)</span>
            </p>
            <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
              Negotiating counter-offer: client requested 2 Care Plan months.
            </p>
            <div className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-blue-900">
              View Negotiation Terms →
            </div>
          </button>

          {/* Action Item 4 */}
          <button
            type="button"
            onClick={() => {
              const confirmed = quotations.find((q) => q.status === 'CONFIRMED') || quotations[0];
              setInspectQuotation(confirmed);
            }}
            className="text-left p-4 rounded-lg border border-teal-200 bg-teal-50/70 hover:bg-teal-100/70 transition shadow-enterprise group cursor-pointer"
          >
            <div className="flex items-center justify-between text-teal-900">
              <span className="text-xs font-bold uppercase tracking-wider">
                1 Fulfillment In-Transit
              </span>
              <ChevronRight className="w-4 h-4 text-teal-700 group-hover:translate-x-0.5 transition" />
            </div>
            <p className="text-xs font-semibold text-slate-900 mt-1">
              Order FUL-801 (Nova Systems)
            </p>
            <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
              Priority shipment via FedEx Freight. Est. delivery Sept 8.
            </p>
            <div className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-teal-900">
              Track Shipment Status →
            </div>
          </button>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 4. MAIN SECTION: DEAL PIPELINE PROGRESSION                */}
      {/* ======================================================== */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-600" />
              Deal Pipeline Lifecycle Progression
            </h2>
            <p className="text-xs text-slate-500">
              End-to-end deal progression from initial draft through governance sign-off and confirmation.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500 font-medium">
            {filteredQuotations.length} Tracked Deals
          </span>
        </div>

        {/* 5 Kanban-style Pipeline Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {pipelineStages.map((stage) => {
            const stageTotal = stage.items.reduce((acc, q) => acc + q.grandTotal, 0);
            return (
              <div
                key={stage.key}
                className="flex flex-col rounded-lg border border-slate-200 bg-slate-100/50 p-3 shadow-2xs min-h-60"
              >
                {/* Stage Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div>
                    <span className="font-semibold text-xs text-slate-800">
                      {stage.label}
                    </span>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {formatCurrency(stageTotal)}
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold bg-white text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                    {stage.items.length}
                  </span>
                </div>

                {/* Stage Cards */}
                <div className="mt-3 space-y-2.5 flex-1">
                  {stage.items.length === 0 ? (
                    <div className="h-28 flex items-center justify-center text-[11px] text-slate-400 italic">
                      No deals in this stage
                    </div>
                  ) : (
                    stage.items.map((q) => (
                      <div
                        key={q.id}
                        onClick={() => setInspectQuotation(q)}
                        className="p-3 rounded-md border border-slate-200 bg-white hover:border-teal-400 hover:shadow-enterprise transition cursor-pointer space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900 line-clamp-2" title={q.title}>
                            {q.title}
                          </span>
                          <TierBadge tier={q.customerTier} size="sm" />
                        </div>
                        <span className="font-mono text-[10px] text-slate-400">Ref: {q.id}</span>
                        <p className="text-xs font-medium text-slate-800 line-clamp-1">
                          {q.customerName}
                        </p>
                        <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-100">
                          <span className="font-mono font-bold text-slate-900">
                            {formatCurrency(q.grandTotal)}
                          </span>
                          <RiskBadge level={q.riskDiagnosis.level} />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ======================================================== */}
      {/* 5. APPROVAL RISK & DEAL HEALTH (2-COLUMN GRID)           */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* APPROVAL RISK RADAR */}
        <Card className="h-full">
          <CardHeader className="p-5 pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm uppercase tracking-wider flex items-center gap-2 text-slate-800">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                Approval Risk Radar
              </CardTitle>
              <span className="text-xs font-medium text-slate-400">
                Categorized by Risk Tier
              </span>
            </div>
            <CardDescription>
              Discounts evaluated against Customer Tier & Category caps.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-3 space-y-3">
            {/* HIGH RISK SECTION */}
            <div className="p-3.5 rounded-lg border border-rose-300 bg-rose-50/60 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white uppercase">
                    High Risk
                  </span>
                  <span className="text-xs font-bold text-rose-950">{q1042Title} <span className="font-mono text-[10px]">(Ref: Q-1042)</span></span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const q = quotations.find((item) => item.id === 'Q-1042') || quotations[0];
                    setInspectQuotation(q);
                  }}
                  className="h-7 text-[11px] bg-white border-rose-300 text-rose-800 hover:bg-rose-100"
                >
                  Review
                </Button>
              </div>
              <p className="text-xs text-rose-900 font-medium leading-relaxed">
                Onsite Setup exceeds permitted service discount by 8% (Requested: 18%, Allowed: 10%). Finance approval required.
              </p>
              <div className="text-[11px] text-rose-700 pt-1 border-t border-rose-200/80 flex justify-between">
                <span>Total Value: $24,850</span>
                <span>Rule: Gold tier does not bypass limits</span>
              </div>
            </div>

            {/* MEDIUM RISK SECTION */}
            <div className="p-3.5 rounded-lg border border-amber-200 bg-amber-50/60 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-600 text-white uppercase">
                    Medium Risk
                  </span>
                  <span className="text-xs font-bold text-amber-950">{q1045Title} <span className="font-mono text-[10px]">(Ref: Q-1045)</span></span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const q = quotations.find((item) => item.id === 'Q-1045') || quotations[0];
                    setInspectQuotation(q);
                  }}
                  className="h-7 text-[11px] bg-white border-amber-300 text-amber-800 hover:bg-amber-100"
                >
                  Review
                </Button>
              </div>
              <p className="text-xs text-amber-900 leading-relaxed">
                Aggregate discount reaches 14.2%. Client counter-offer requested 2 additional Care Plan months.
              </p>
              <div className="text-[11px] text-amber-700 pt-1 border-t border-amber-200/80 flex justify-between">
                <span>Total Value: $37,800</span>
                <span>Requires Sales Director sign-off</span>
              </div>
            </div>

            {/* LOW RISK SECTION */}
            <div className="p-3.5 rounded-lg border border-emerald-200 bg-emerald-50/60 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white uppercase">
                    Low Risk
                  </span>
                  <span className="text-xs font-bold text-emerald-950">Q-1039 & Q-1035</span>
                </div>
                <span className="text-[11px] font-semibold text-emerald-700 font-mono">
                  100% Compliant
                </span>
              </div>
              <p className="text-xs text-emerald-900 leading-relaxed">
                All line item discounts strictly conform to customer tier and category allowance caps. Auto-approved.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* DEAL HEALTH */}
        <Card className="h-full">
          <CardHeader className="p-5 pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm uppercase tracking-wider flex items-center gap-2 text-slate-800">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                Deal Health & Velocity
              </CardTitle>
              <span className="text-xs font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Avg Health: {avgDealHealth}/100
              </span>
            </div>
            <CardDescription>
              Stalled negotiations, discount anomalies, and fulfillment risks.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-3 space-y-3">
            {/* Stalled Deals */}
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  Stalled Deals (Velocity Check)
                </span>
                <span className="text-[10px] font-mono text-slate-500">2 Deals</span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between items-center bg-white p-2 rounded border border-slate-200">
                  <span><strong>{q1045Title}</strong> • <span className="font-mono text-[10px]">Ref: Q-1045</span></span>
                  <span className="text-blue-700 font-medium text-[11px]">In negotiation: 6 days</span>
                </div>
                <div className="flex justify-between items-center bg-white p-2 rounded border border-slate-200">
                  <span><strong>Q-1048</strong> • Delta Solutions</span>
                  <span className="text-slate-500 text-[11px]">Awaiting AE submission: 3 days</span>
                </div>
              </div>
            </div>

            {/* Discount Anomalies */}
            <div className="p-3 rounded-lg border border-rose-200 bg-rose-50/40 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-rose-950">
                <span className="flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                  Discount Anomalies
                </span>
                <span className="text-[10px] font-mono text-rose-700">1 Detected</span>
              </div>
              <div className="bg-white p-2 rounded border border-rose-200 text-xs flex justify-between items-center">
                <span><strong>{q1042Title}</strong> <span className="font-mono text-[10px]">(Ref: Q-1042)</span>: Onsite Setup (18% vs 10% allowed)</span>
                <span className="text-rose-700 font-bold font-mono text-[11px]">+8% Excess</span>
              </div>
            </div>

            {/* Delivery Risks */}
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                <span className="flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-teal-600" />
                  Delivery & Logistics Risks
                </span>
                <span className="text-[10px] font-mono text-slate-500">1 Shipment</span>
              </div>
              <div className="bg-white p-2 rounded border border-slate-200 text-xs flex justify-between items-center">
                <span>Order <strong>FUL-801</strong>: FedEx Freight (Nova Systems)</span>
                <span className="text-emerald-700 font-medium text-[11px]">On schedule: Sept 8</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ======================================================== */}
      {/* 6. RECENT ACTIVITY STREAM                                */}
      {/* ======================================================== */}
      <section>
        <Card>
          <CardHeader className="p-5 pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm uppercase tracking-wider flex items-center gap-2 text-slate-800">
                <Clock className="w-4 h-4 text-teal-600" />
                Recent Activity & Audit Stream
              </CardTitle>
              <span className="text-xs text-slate-400 font-medium">Real-time audit log</span>
            </div>
            <CardDescription>
              Chronological ledger of quotation submissions, approvals, counter-offers, and shipments.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-3">
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition shadow-2xs">
                <div className="p-2 rounded-md bg-amber-50 text-amber-700 shrink-0 mt-0.5">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-900">
                      {q1042Title} submitted for Finance approval <span className="font-mono text-[10px]">(Ref: Q-1042)</span>
                    </p>
                    <span className="text-[10px] text-slate-400 font-mono">Today, 10:36 AM</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Marcus Vance escalated deal for Acme Corporation due to +8% service discount exception.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition shadow-2xs">
                <div className="p-2 rounded-md bg-emerald-50 text-emerald-700 shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-900">
                      Q-1039 approved by Finance
                    </p>
                    <span className="text-[10px] text-slate-400 font-mono">Yesterday, 3:00 PM</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Sarah Sterling approved $24,850 FinTech engineering bundle for Beta Technologies (Silver Tier compliant).
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition shadow-2xs">
                <div className="p-2 rounded-md bg-blue-50 text-blue-700 shrink-0 mt-0.5">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-900">
                      Zenith Industries counter-offered 12% discount on {q1045Title} <span className="font-mono text-[10px]">(Ref: Q-1045)</span>
                    </p>
                    <span className="text-[10px] text-slate-400 font-mono">2 days ago</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Client requested 2 additional Care Plan months in exchange for Q3 signature commitment.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition shadow-2xs">
                <div className="p-2 rounded-md bg-teal-50 text-teal-700 shrink-0 mt-0.5">
                  <Truck className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-900">
                      Shipment FUL-801 created for Q-1035
                    </p>
                    <span className="text-[10px] text-slate-400 font-mono">3 days ago</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    FedEx Freight Priority tracking 1Z9999999999999999 generated for Nova Systems clinic delivery.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ======================================================== */}
      {/* 7. MODALS & DIALOGS                                      */}
      {/* ======================================================== */}
      {/* New Quotation Dialog */}
      <NewQuotationDialog
        open={isNewQuotationOpen}
        onOpenChange={setIsNewQuotationOpen}
        onSuccess={(created) => {
          setInspectQuotation(created);
        }}
      />

      {/* Inspect Deal Sheet Modal Dialog */}
      {inspectQuotation && (
        <Dialog
          open={Boolean(inspectQuotation)}
          onOpenChange={(open) => {
            if (!open) setInspectQuotation(null);
          }}
        >
          <DialogHeader>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-slate-900 text-sm">{inspectQuotation.id}</span>
              <StatusBadge status={inspectQuotation.status} />
              <RiskBadge level={inspectQuotation.riskDiagnosis.level} />
            </div>
            <DialogTitle className="mt-1">{inspectQuotation.title}</DialogTitle>
            <DialogDescription>
              Deal sheet details, tier governance, and pricing composition for {inspectQuotation.customerName}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-xs py-1 max-h-[60vh] overflow-y-auto pr-1">
            {/* Account & Health Summary */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <span className="text-slate-500 text-[11px]">Customer Account</span>
                <p className="font-semibold text-slate-900 mt-0.5">{inspectQuotation.customerName}</p>
              </div>
              <div>
                <span className="text-slate-500 text-[11px]">Customer Tier</span>
                <div className="mt-0.5">
                  <TierBadge tier={inspectQuotation.customerTier} size="sm" showLimitNotice />
                </div>
              </div>
              <div>
                <span className="text-slate-500 text-[11px]">Deal Health Rating</span>
                <p className="font-semibold text-slate-900 mt-0.5">{inspectQuotation.dealHealthScore} / 100</p>
              </div>
              <div>
                <span className="text-slate-500 text-[11px]">Net Grand Total</span>
                <p className="font-bold text-teal-700 font-mono text-sm mt-0.5">
                  {formatCurrency(inspectQuotation.grandTotal)}
                </p>
              </div>
            </div>

            {/* Diagnostic Box */}
            <div
              className={`p-3 rounded-lg border text-xs leading-relaxed ${
                inspectQuotation.riskDiagnosis.level === 'CRITICAL' ||
                inspectQuotation.riskDiagnosis.level === 'HIGH'
                  ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                  : 'bg-slate-100 border-slate-200 text-slate-800'
              }`}
            >
              <div className="font-bold uppercase tracking-wider text-[10px] mb-1.5 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                Intelligence & Governance Assessment
              </div>
              <p><strong>What happened:</strong> {inspectQuotation.riskDiagnosis.whatHappened}</p>
              <p className="mt-1"><strong>Why it matters:</strong> {inspectQuotation.riskDiagnosis.whyItMatters}</p>
              <p className="mt-1"><strong>Action required:</strong> {inspectQuotation.riskDiagnosis.nextAction}</p>
            </div>

            {/* Line Items Table */}
            <div>
              <span className="font-semibold text-slate-800 block mb-1.5">Line Items & Discounts</span>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Discount</TableHead>
                    <TableHead className="text-right">Limit</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inspectQuotation.items.map((item) => (
                    <TableRow key={item.id} className={item.isViolation ? 'bg-rose-50/30' : undefined}>
                      <TableCell>
                        <span className="font-medium text-slate-900">{item.productName}</span>
                        <span className="text-[10px] text-slate-400 block font-mono">{item.category}</span>
                      </TableCell>
                      <TableCell className="text-right font-mono">{item.quantity}</TableCell>
                      <TableCell className="text-right font-mono font-semibold">
                        <span className={item.isViolation ? 'text-rose-600' : 'text-slate-800'}>
                          {formatPercent(item.discountPercent)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono text-slate-500">
                        {formatPercent(item.effectiveLimit)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-slate-900">
                        {formatCurrency(item.lineTotal)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setInspectQuotation(null)}
            >
              Close
            </Button>
            {inspectQuotation.status === 'PENDING_APPROVAL' && (
              <>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleReject(inspectQuotation)}
                  loading={updateQuotationStatus.isPending}
                >
                  <XCircle className="w-3.5 h-3.5 mr-1" />
                  Reject Deal
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleApprove(inspectQuotation)}
                  loading={updateQuotationStatus.isPending}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  Approve Deal
                </Button>
              </>
            )}
          </DialogFooter>
        </Dialog>
      )}
    </div>
  );
}
