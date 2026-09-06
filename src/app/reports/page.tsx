'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  DollarSign,
  Package,
  Layers,
  FileText,
  ShieldCheck,
  Download,
  Printer,
  Calendar,
  Filter,
  ArrowUpRight,
  Info,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  Users,
  Target,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { TierBadge } from '@/components/ui/tier-badge';
import { useQuotations, useCustomers, useProducts, useSubscriptions, useInvoices } from '@/hooks/use-dealflow';
import { useToast } from '@/components/providers/query-provider';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { CustomerTier } from '@/types/dealflow';

// Static seed benchmark data combined with dynamic store data for enterprise reporting
const HISTORICAL_MONTHS = [
  { month: 'Apr 2026', avgApprovalHours: 12.2, quotes: 18, revenue: 112000, mrr: 28000, targetHours: 8.0 },
  { month: 'May 2026', avgApprovalHours: 10.4, quotes: 22, revenue: 128500, mrr: 34000, targetHours: 8.0 },
  { month: 'Jun 2026', avgApprovalHours: 8.8, quotes: 26, revenue: 142000, mrr: 39500, targetHours: 8.0 },
  { month: 'Jul 2026', avgApprovalHours: 7.9, quotes: 24, revenue: 138000, mrr: 45200, targetHours: 8.0 },
  { month: 'Aug 2026', avgApprovalHours: 7.1, quotes: 28, revenue: 156000, mrr: 52100, targetHours: 8.0 },
  { month: 'Sep 2026', avgApprovalHours: 6.4, quotes: 30, revenue: 166000, mrr: 58400, targetHours: 8.0 },
];

const STAGE_BREAKDOWN = [
  { stage: 'Draft', count: 24, value: 215400, color: 'bg-slate-400', textColor: 'text-slate-700', pct: 16.2, conversionRate: '100%' },
  { stage: 'Pending Approval', count: 18, value: 264800, color: 'bg-amber-500', textColor: 'text-amber-700', pct: 12.2, conversionRate: '88.5%' },
  { stage: 'Approved', count: 32, value: 348200, color: 'bg-blue-500', textColor: 'text-blue-700', pct: 21.6, conversionRate: '81.2%' },
  { stage: 'In Negotiation', count: 22, value: 214100, color: 'bg-purple-500', textColor: 'text-purple-700', pct: 14.9, conversionRate: '76.0%' },
  { stage: 'Confirmed / Won', count: 52, value: 440000, color: 'bg-emerald-500', textColor: 'text-emerald-700', pct: 35.1, conversionRate: '68.4%' },
];

const TOP_PRODUCTS = [
  {
    name: 'Care Plan 2yr',
    sku: 'SRV-CARE-PLN',
    category: 'Services',
    isUpsell: true,
    attachRate: 44,
    revenue: 184800,
    marginPct: 89,
    unitsSold: 38,
    type: 'Recurring Monthly ($1,200/mo)',
  },
  {
    name: 'Laptop Pro 14',
    sku: 'HW-LP14-M3',
    category: 'Hardware',
    isUpsell: false,
    attachRate: 78,
    revenue: 542000,
    marginPct: 42,
    unitsSold: 362,
    type: 'One-Time Hardware',
  },
  {
    name: 'Docking Station Thunderbolt 4',
    sku: 'HW-DK-TH4',
    category: 'Hardware',
    isUpsell: true,
    attachRate: 62,
    revenue: 98400,
    marginPct: 48,
    unitsSold: 395,
    type: 'Hardware Accessory',
  },
  {
    name: 'Extended Warranty (3-Year)',
    sku: 'SRV-WRNTY-EXT',
    category: 'Services',
    isUpsell: true,
    attachRate: 31,
    revenue: 74200,
    marginPct: 92,
    unitsSold: 212,
    type: 'Recurring Annual ($350/yr)',
  },
  {
    name: 'Onsite Deployment & Setup',
    sku: 'SRV-ONS-ENG',
    category: 'Services',
    isUpsell: true,
    attachRate: 28,
    revenue: 62500,
    marginPct: 38,
    unitsSold: 83,
    type: 'Turnkey Professional Service',
  },
];

export default function ReportsPage() {
  const { toast } = useToast();
  const { data: quotations = [] } = useQuotations();
  const { data: customers = [] } = useCustomers();
  const { data: invoices = [] } = useInvoices();
  const { data: subscriptions = [] } = useSubscriptions();

  // Filter states
  const [dateRange, setDateRange] = useState<'30D' | 'Q3_2026' | 'YTD' | 'L12M'>('Q3_2026');
  const [salesTeam, setSalesTeam] = useState<'ALL' | 'ENTERPRISE' | 'COMMERCIAL' | 'DIRECT'>('ALL');
  const [customerTier, setCustomerTier] = useState<'ALL' | CustomerTier>('ALL');
  const [category, setCategory] = useState<'ALL' | 'HARDWARE' | 'SERVICES' | 'SUBSCRIPTION'>('ALL');

  // Filter multipliers for simulated dynamic slices
  const filterMultiplier = useMemo(() => {
    let mult = 1.0;
    if (customerTier === 'Gold') mult *= 0.65;
    if (customerTier === 'Silver') mult *= 0.25;
    if (customerTier === 'Bronze') mult *= 0.1;
    if (salesTeam === 'ENTERPRISE') mult *= 0.72;
    if (salesTeam === 'COMMERCIAL') mult *= 0.28;
    if (dateRange === '30D') mult *= 0.38;
    if (dateRange === 'YTD') mult *= 1.45;
    if (dateRange === 'L12M') mult *= 1.85;
    return mult;
  }, [customerTier, salesTeam, dateRange]);

  // Scaled KPIs based on active filters
  const kpis = useMemo(() => {
    const quotesCreated = Math.round(148 * filterMultiplier);
    const avgApprovalTime = (6.4 * (customerTier === 'Gold' ? 0.9 : customerTier === 'Bronze' ? 1.15 : 1.0)).toFixed(1);
    const conversionRate = (68.4 * (salesTeam === 'ENTERPRISE' ? 1.05 : 0.98)).toFixed(1);
    const pipelineValue = Math.round(1482500 * filterMultiplier);
    const revenue = Math.round(842500 * filterMultiplier);
    const topUpsell = 'Care Plan 2yr';

    return {
      quotesCreated,
      avgApprovalTime,
      conversionRate,
      pipelineValue,
      revenue,
      topUpsell,
    };
  }, [filterMultiplier, customerTier, salesTeam]);

  // Dynamic CSV Export
  const handleExportCSV = () => {
    try {
      const csvHeader = 'Report Name,Period,Quotes Created,Avg Approval Time (h),Conversion Rate (%),Pipeline Value ($),Revenue ($),Top Upsell\n';
      const csvRow = `"DealFlow360 Executive Commercial Report","${dateRange}",${kpis.quotesCreated},${kpis.avgApprovalTime},${kpis.conversionRate}%,${kpis.pipelineValue},${kpis.revenue},"${kpis.topUpsell}"\n\n` +
        'Month,Avg Approval Time (h),Quotes Initiated,Gross Revenue ($),Recurring MRR ($)\n' +
        HISTORICAL_MONTHS.map(
          (m) => `"${m.month}",${m.avgApprovalHours},${m.quotes},${m.revenue},${m.mrr}`
        ).join('\n') +
        '\n\nStage,Deals Count,Volume ($),Share (%)\n' +
        STAGE_BREAKDOWN.map(
          (s) => `"${s.stage}",${s.count},${s.value},${s.pct}%`
        ).join('\n') +
        '\n\nProduct / Upsell,SKU,Category,Attach Rate (%),Revenue ($),Gross Margin (%)\n' +
        TOP_PRODUCTS.map(
          (p) => `"${p.name}","${p.sku}","${p.category}",${p.attachRate}%,${p.revenue},${p.marginPct}%`
        ).join('\n');

      const blob = new Blob([csvHeader + csvRow], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `DealFlow360_Executive_Report_${dateRange}_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'CSV Report Exported',
        description: `Downloaded comprehensive commercial dataset for ${dateRange}.`,
        type: 'success',
      });
    } catch {
      toast({
        title: 'Export Failed',
        description: 'Unable to compile CSV document.',
        type: 'error',
      });
    }
  };

  // Executive PDF Print Simulation
  const handleExportPDF = () => {
    toast({
      title: 'Generating Executive PDF Report',
      description: 'Compiling high-resolution vector report for executive presentation...',
      type: 'info',
    });
    setTimeout(() => {
      window.print();
    }, 400);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
              <BarChart3 className="w-3.5 h-3.5" />
              Executive Analytics
            </span>
            <span className="text-xs text-slate-500 font-mono">Q3 2026 Fiscal Performance</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 mt-1">
            Commercial Reports & Revenue Intelligence
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-3xl">
            Real-time pipeline conversion analytics, SLA approval velocity trends, recurring cashflow realization, and high-margin product upsell distribution.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="border-slate-300 text-slate-700 hover:bg-slate-50 gap-1.5"
          >
            <Download className="w-4 h-4 text-slate-600" />
            Export CSV
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPDF}
            className="border-slate-300 text-slate-700 hover:bg-slate-50 gap-1.5"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            Executive PDF
          </Button>
        </div>
      </div>

      {/* 2. Enterprise Filter Bar */}
      <Card className="border-slate-200 bg-white shadow-xs">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Filter className="w-4 h-4 text-teal-600" />
              <span>Report Dimensions:</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Date Range */}
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">
                  Date Range
                </label>
                <select
                  aria-label="Filter by date range"
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value as any)}
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-md py-1.5 px-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="30D">Last 30 Days</option>
                  <option value="Q3_2026">This Quarter (Q3 2026)</option>
                  <option value="YTD">Year to Date (YTD)</option>
                  <option value="L12M">Last 12 Months</option>
                </select>
              </div>

              {/* Sales Team */}
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">
                  Sales Team
                </label>
                <select
                  aria-label="Filter by sales team"
                  value={salesTeam}
                  onChange={(e) => setSalesTeam(e.target.value as any)}
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-md py-1.5 px-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="ALL">All Sales Teams</option>
                  <option value="ENTERPRISE">Enterprise Strategic</option>
                  <option value="COMMERCIAL">Commercial Mid-Market</option>
                  <option value="DIRECT">Direct Procurement</option>
                </select>
              </div>

              {/* Customer Tier */}
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">
                  Customer Tier
                </label>
                <select
                  aria-label="Filter by customer tier"
                  value={customerTier}
                  onChange={(e) => setCustomerTier(e.target.value as any)}
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-md py-1.5 px-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="ALL">All Tiers (Gold, Silver, Bronze)</option>
                  <option value="Gold">Gold Tier (15% Cap)</option>
                  <option value="Silver">Silver Tier (10% Cap)</option>
                  <option value="Bronze">Bronze Tier (5% Cap)</option>
                </select>
              </div>

              {/* Product / Category */}
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">
                  Category
                </label>
                <select
                  aria-label="Filter by product category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-md py-1.5 px-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="ALL">All Products & Services</option>
                  <option value="HARDWARE">Hardware Systems (15% Cap)</option>
                  <option value="SERVICES">Services & SLAs (10% Cap)</option>
                  <option value="SUBSCRIPTION">Recurring Subscriptions</option>
                </select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Primary Business KPIs Grid (6 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* KPI 1: Quotes Created */}
        <Card className="border-slate-200 shadow-xs hover:border-teal-300 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Quotes Created</span>
              <div className="w-7 h-7 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
                <FileText className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold font-mono text-slate-900">{kpis.quotesCreated}</div>
              <div className="flex items-center gap-1 mt-1 text-[11px] text-emerald-600 font-medium">
                <TrendingUp className="w-3 h-3" />
                <span>+18.4% vs last period</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI 2: Average Approval Time */}
        <Card className="border-slate-200 shadow-xs hover:border-teal-300 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Avg Approval Time</span>
              <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                <Clock className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold font-mono text-slate-900">{kpis.avgApprovalTime}h</div>
              <div className="flex items-center gap-1 mt-1 text-[11px] text-emerald-600 font-medium">
                <TrendingDown className="w-3 h-3" />
                <span>-3.2h reduction (SLA &lt;8.0h)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI 3: Conversion Rate */}
        <Card className="border-slate-200 shadow-xs hover:border-teal-300 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Conversion Rate</span>
              <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                <Target className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold font-mono text-slate-900">{kpis.conversionRate}%</div>
              <div className="flex items-center gap-1 mt-1 text-[11px] text-emerald-600 font-medium">
                <TrendingUp className="w-3 h-3" />
                <span>+4.1% win-rate</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI 4: Pipeline Value */}
        <Card className="border-slate-200 shadow-xs hover:border-teal-300 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Pipeline Value</span>
              <div className="w-7 h-7 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
                <DollarSign className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold font-mono text-slate-900">{formatCurrency(kpis.pipelineValue)}</div>
              <div className="flex items-center gap-1 mt-1 text-[11px] text-purple-600 font-medium">
                <span>Active in 5 stages</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI 5: Revenue */}
        <Card className="border-slate-200 shadow-xs hover:border-teal-300 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Realized Revenue</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold font-mono text-slate-900">{formatCurrency(kpis.revenue)}</div>
              <div className="flex items-center gap-1 mt-1 text-[11px] text-emerald-600 font-medium">
                <span>86.2% margin retention</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI 6: Top Upsell */}
        <Card className="border-slate-200 shadow-xs hover:border-teal-300 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Top Upsell</span>
              <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-base font-bold text-slate-900 truncate" title="Care Plan 2yr">
                {kpis.topUpsell}
              </div>
              <div className="flex items-center gap-1 mt-1 text-[11px] text-indigo-600 font-medium">
                <span>44% attach rate ($1,200/mo)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 4. Meaningful Data Charts (2x2 Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Quotation Pipeline by Status */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-teal-600" />
                  Quotation Pipeline by Status
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Distribution of {kpis.quotesCreated} deals across stage lifecycle with volume value
                </CardDescription>
              </div>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                100% Accounted
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Visual Segmented Pipeline Bar */}
            <div className="w-full h-4 rounded-full overflow-hidden flex bg-slate-100 border border-slate-200">
              {STAGE_BREAKDOWN.map((s) => (
                <div
                  key={s.stage}
                  className={`${s.color} transition-all duration-300`}
                  style={{ width: `${s.pct}%` }}
                  title={`${s.stage}: ${s.count} deals (${s.pct}%) - ${formatCurrency(s.value)}`}
                />
              ))}
            </div>

            {/* Stage Detail Table */}
            <div className="divide-y divide-slate-100 text-xs">
              {STAGE_BREAKDOWN.map((s) => (
                <div key={s.stage} className="py-2.5 flex items-center justify-between hover:bg-slate-50 px-1 rounded transition-colors">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
                    <span className="font-medium text-slate-800">{s.stage}</span>
                    <span className="font-mono text-slate-400 text-[11px]">({s.count} deals)</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-mono font-bold text-slate-900">{formatCurrency(s.value)}</span>
                    <span className="w-12 text-right font-mono text-slate-500">{s.pct}%</span>
                    <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-100">
                      {s.conversionRate} win
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
              <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <span>
                <strong>Pipeline Velocity Insight:</strong> Conversion rate drops from 81.2% to 76.0% during customer counter-negotiations. Stalled deals idle in Pending Approval account for $264,800 in unearned revenue.
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Chart 2: Approval Time Trend */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600" />
                  Approval Time Trend (6 Months)
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Average turnaround time in hours vs. enterprise SLA threshold (8.0h)
                </CardDescription>
              </div>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                -47.5% Faster Turnaround
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* SVG Visual Trend Chart */}
            <div className="w-full bg-slate-50 border border-slate-200 rounded-lg p-4">
              <div className="relative h-44 w-full">
                {/* SLA Target Line (8.0h) */}
                <div
                  className="absolute left-0 right-0 border-b border-dashed border-amber-400 z-10 flex items-center justify-end pr-2"
                  style={{ top: '35%' }}
                >
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1 rounded border border-amber-200">
                    SLA Ceiling: 8.0h
                  </span>
                </div>

                {/* SVG Area & Polyline */}
                <svg className="w-full h-full overflow-visible" viewBox="0 0 500 140" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="approvalGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0d9488" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#0d9488" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  {/* Area fill */}
                  <polygon
                    points="25,12 115,36 205,58 295,70 385,82 475,92 475,140 25,140"
                    fill="url(#approvalGrad)"
                  />
                  {/* Trend line */}
                  <polyline
                    fill="none"
                    stroke="#0d9488"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points="25,12 115,36 205,58 295,70 385,82 475,92"
                  />
                  {/* Data Points */}
                  {[
                    { cx: 25, cy: 12, label: '12.2h' },
                    { cx: 115, cy: 36, label: '10.4h' },
                    { cx: 205, cy: 58, label: '8.8h' },
                    { cx: 295, cy: 70, label: '7.9h' },
                    { cx: 385, cy: 82, label: '7.1h' },
                    { cx: 475, cy: 92, label: '6.4h' },
                  ].map((pt, idx) => (
                    <g key={idx}>
                      <circle cx={pt.cx} cy={pt.cy} r="4.5" fill="#ffffff" stroke="#0f766e" strokeWidth="2.5" />
                      <text
                        x={pt.cx}
                        y={pt.cy - 8}
                        textAnchor="middle"
                        fontSize="10"
                        fontWeight="700"
                        fill="#0f172a"
                        fontFamily="monospace"
                      >
                        {pt.label}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>

              {/* Month X-Axis */}
              <div className="grid grid-cols-6 text-center text-[11px] font-mono font-medium text-slate-500 mt-2">
                {HISTORICAL_MONTHS.map((m) => (
                  <div key={m.month}>
                    <div>{m.month.split(' ')[0]}</div>
                    <div className="text-[10px] text-slate-400">{m.quotes} quotes</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Governance Velocity Achievement:</strong> September average approval time stands at <strong>6.4 hours</strong>, outperforming the executive target SLA (&lt;8.0h) by 1.6 hours due to deterministic policy checks.
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Chart 3: Revenue Trend & Recurring MRR Realization */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  Revenue Realization & MRR Growth
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Gross commercial billings and recurring subscription MRR trajectory
                </CardDescription>
              </div>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                +$58.4k Monthly MRR
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Monthly Bar Progression */}
            <div className="space-y-3">
              {HISTORICAL_MONTHS.map((m) => {
                const maxRev = 180000;
                const revWidth = (m.revenue / maxRev) * 100;
                const mrrWidth = (m.mrr / maxRev) * 100;

                return (
                  <div key={m.month} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 w-20">{m.month}</span>
                      <div className="flex items-center gap-3 font-mono">
                        <span className="text-slate-500 text-[11px]">
                          MRR: <strong className="text-purple-700">{formatCurrency(m.mrr)}</strong>
                        </span>
                        <span className="text-slate-900 font-bold">
                          Gross: {formatCurrency(m.revenue)}
                        </span>
                      </div>
                    </div>
                    {/* Visual Dual Bar */}
                    <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden flex border border-slate-200">
                      <div
                        className="bg-emerald-500 h-full rounded-l-full"
                        style={{ width: `${revWidth - mrrWidth}%` }}
                        title={`One-time Billings: ${formatCurrency(m.revenue - mrrWidth)}`}
                      />
                      <div
                        className="bg-purple-600 h-full"
                        style={{ width: `${mrrWidth}%` }}
                        title={`Recurring MRR: ${formatCurrency(m.mrr)}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend & KPI summary */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-emerald-500" />
                  <span className="text-slate-600">One-Time Hardware/Services</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-purple-600" />
                  <span className="text-slate-600">Recurring MRR Retainers</span>
                </div>
              </div>
              <span className="font-mono text-xs font-bold text-slate-900">
                Annual Run-Rate: {formatCurrency(58400 * 12)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Chart 4: Top Products & Upsell Attach Rates */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Package className="w-4 h-4 text-indigo-600" />
                  Top Products & Upsell Performance
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Attach rates, volume revenue contribution, and profit margins
                </CardDescription>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                Care Plan #1 Upsell
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {TOP_PRODUCTS.map((prod) => (
              <div
                key={prod.sku}
                className="p-3 rounded-lg border border-slate-200 hover:border-indigo-200 bg-white hover:bg-indigo-50/20 transition-colors space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-slate-900">{prod.name}</span>
                    {prod.isUpsell ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700 border border-indigo-200">
                        TOP UPSELL
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                        CORE SKU
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-xs font-bold text-slate-900">
                    {formatCurrency(prod.revenue)}
                  </span>
                </div>

                {/* Attach Rate Meter & Margin */}
                <div className="flex items-center justify-between gap-4 text-xs">
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>Attach Rate: <strong className="text-slate-800">{prod.attachRate}%</strong></span>
                      <span>Margin: <strong className="text-emerald-700">{prod.marginPct}%</strong></span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          prod.isUpsell ? 'bg-indigo-500' : 'bg-slate-500'
                        }`}
                        style={{ width: `${prod.attachRate}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[11px] font-mono text-slate-500 block">{prod.unitsSold} units</span>
                    <span className="text-[10px] text-slate-400 block">{prod.type}</span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* 5. Discount Governance & Tier Audit Section */}
      <Card className="border-slate-200 shadow-xs">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                Commercial Discount Governance Audit
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Policy compliance monitoring across customer tiers and product category caps
              </CardDescription>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
              Deterministic Rules Active
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Gold Tier Audit */}
            <div className="p-4 rounded-lg bg-amber-50/50 border border-amber-200 space-y-2">
              <div className="flex items-center justify-between">
                <TierBadge tier="Gold" />
                <span className="text-xs font-mono font-bold text-amber-900">12.8% avg concession</span>
              </div>
              <p className="text-xs text-slate-700">
                Strategic Accounts (Acme Corp, Zenith Ind). Policy ceiling: <strong>15% Hardware</strong>, <strong>10% Services</strong>.
              </p>
              <div className="pt-2 border-t border-amber-200/60 text-[11px] text-amber-800 font-medium">
                ⚠️ Strict Policy Rule: Gold standing never bypasses Services 10% ceiling.
              </div>
            </div>

            {/* Silver Tier Audit */}
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <TierBadge tier="Silver" />
                <span className="text-xs font-mono font-bold text-slate-900">7.9% avg concession</span>
              </div>
              <p className="text-xs text-slate-700">
                Growth Accounts (Beta Tech, Delta Sol). Policy ceiling: <strong>10% maximum</strong> across all SKUs.
              </p>
              <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-600 font-medium">
                ✅ 100% compliant discount variance within authorized limits.
              </div>
            </div>

            {/* Bronze Tier Audit */}
            <div className="p-4 rounded-lg bg-orange-50/30 border border-orange-200 space-y-2">
              <div className="flex items-center justify-between">
                <TierBadge tier="Bronze" />
                <span className="text-xs font-mono font-bold text-orange-950">3.2% avg concession</span>
              </div>
              <p className="text-xs text-slate-700">
                Introductory Accounts (Nova Systems). Policy ceiling: <strong>5% introductory cap</strong>.
              </p>
              <div className="pt-2 border-t border-orange-200/60 text-[11px] text-orange-800 font-medium">
                ⭐ Zero escalations; all orders auto-approved at Sales Manager tier.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 6. Actionable Executive Recommendations */}
      <Card className="border-teal-200 bg-linear-to-br from-white to-teal-50/40 shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-600" />
            Executive Revenue Recommendations
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Automated intelligence suggestions based on Q3 pipeline velocity and margin data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3.5 bg-white rounded-lg border border-slate-200 shadow-2xs space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-teal-700">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Upsell Care Plan 2yr to Hardware Deals</span>
              </div>
              <p className="text-xs text-slate-600">
                Attaching Care Plan 2yr ($1,200/mo) to 12 in-flight Laptop Pro 14 quotations would yield an incremental <strong>+$28,800 MRR</strong> at an 89% gross margin.
              </p>
            </div>

            <div className="p-3.5 bg-white rounded-lg border border-slate-200 shadow-2xs space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700">
                <Clock className="w-3.5 h-3.5" />
                <span>Auto-Approve Sub-3% Concessions</span>
              </div>
              <p className="text-xs text-slate-600">
                Routing low-variance proposals (&lt;3% discount) through single-click approvals would contract average sign-off time from <strong>6.4h to 3.8h</strong>.
              </p>
            </div>

            <div className="p-3.5 bg-white rounded-lg border border-slate-200 shadow-2xs space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-purple-700">
                <DollarSign className="w-3.5 h-3.5" />
                <span>Accelerate Net 30 Cash Collections</span>
              </div>
              <p className="text-xs text-slate-600">
                Offering 2% Net 10 settlement discounts on $58,400 in open invoices can accelerate cash conversion cycle by 14 days.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
