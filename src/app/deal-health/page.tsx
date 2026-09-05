'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertTriangle,
  Clock,
  TrendingDown,
  TrendingUp,
  ShieldAlert,
  Truck,
  ArrowRight,
  CheckCircle2,
  Send,
  Sliders,
  RotateCcw,
  Sparkles,
  Zap,
  Info,
  Calendar,
  Building,
  DollarSign,
  Package,
  Layers,
  ArrowUpRight,
  Percent,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { TierBadge } from '@/components/ui/tier-badge';
import { useToast } from '@/components/providers/query-provider';
import { formatCurrency } from '@/lib/utils';
import {
  SEEDED_STALLED_DEALS,
  SEEDED_DISCOUNT_ANOMALIES,
  SEEDED_DELIVERY_RISKS,
  SEEDED_RECOMMENDED_ACTIONS,
  SEEDED_HEALTH_TIMELINE,
  StalledDeal,
  DiscountAnomaly,
  DeliveryRiskItem,
  RecommendedActionItem,
  HealthTimelineEvent,
} from '@/lib/deal-health';

export default function DealHealthPage() {
  const { toast } = useToast();

  // Active filter for timeline
  const [timelineFilter, setTimelineFilter] = useState<string>('ALL');

  // Dialog states
  const [nudgeDialogOpen, setNudgeDialogOpen] = useState(false);
  const [reviewDiscountDialogOpen, setReviewDiscountDialogOpen] = useState(false);
  const [stockShortageDialogOpen, setStockShortageDialogOpen] = useState(false);

  // Stalled deals state (can be updated by nudging)
  const [stalledDeals, setStalledDeals] = useState<StalledDeal[]>(SEEDED_STALLED_DEALS);
  const [discountAnomalies, setDiscountAnomalies] = useState<DiscountAnomaly[]>(SEEDED_DISCOUNT_ANOMALIES);
  const [deliveryRisks, setDeliveryRisks] = useState<DeliveryRiskItem[]>(SEEDED_DELIVERY_RISKS);

  // Nudge form state
  const [nudgeMessage, setNudgeMessage] = useState(
    'Dear Zenith Procurement Team,\n\nFollowing up on Quotation Q-1028 for the Automated Manufacturing Telemetry Workstations. Our standard quarterly pricing schedule is guaranteed for an additional 7 business days.\n\nPlease let us know if your technical evaluation committee requires any further configuration documentation or deployment scheduling adjustments.\n\nBest regards,\nElena Rostova — Enterprise Account Manager'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Review Discount state
  const [selectedCeilingOption, setSelectedCeilingOption] = useState<'ENFORCE_10' | 'COUNTER_12' | 'ESCALATE_CFO'>('ENFORCE_10');
  const [discountReviewNotes, setDiscountReviewNotes] = useState('Enforcing Silver Tier category ceiling (10%). Recommending bundling 12-month care plan to preserve net account gross margin.');

  // Stock shortage form state
  const [transferSource, setTransferSource] = useState<'WEST_HUB' | 'CENTRAL_CHICAGO'>('WEST_HUB');
  const [transferUnits, setTransferUnits] = useState('8');

  // KPIs
  const kpiData = useMemo(() => {
    return {
      healthyDeals: 5,
      atRiskDeals: 3,
      stalledDeals: stalledDeals.length,
      discountAnomalies: discountAnomalies.length,
      avgHealthScore: 74,
      totalPipelineEvaluated: 168900,
    };
  }, [stalledDeals, discountAnomalies]);

  // Handle Nudge Action
  const handleNudgeSubmit = async () => {
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    setStalledDeals((prev) =>
      prev.map((d) =>
        d.quotationId === 'Q-1028'
          ? {
              ...d,
              daysIdle: 0,
              lastActivityDate: new Date().toISOString().slice(0, 10),
              lastActor: 'Elena Rostova (Commercial Nudge Sent)',
              recommendedAction: 'Nudge sent (Awaiting response)',
              velocityScore: 75,
              stalenessReason: 'Automated executive nudge email dispatched with 7-day price lock guarantee.',
            }
          : d
      )
    );
    setIsSubmitting(false);
    setNudgeDialogOpen(false);
    toast({
      title: 'Commercial Nudge Dispatched',
      description: 'Quotation Q-1028 follow-up sent to Zenith procurement director. Audit trail updated.',
      type: 'success',
    });
  };

  // Handle Discount Review
  const handleDiscountReviewSubmit = async () => {
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    setDiscountAnomalies((prev) =>
      prev.map((a) =>
        a.quotationId === 'Q-1052'
          ? {
              ...a,
              requestedDiscount: selectedCeilingOption === 'ENFORCE_10' ? 10 : 12,
              variancePoints: selectedCeilingOption === 'ENFORCE_10' ? 2 : 4,
              excessPoints: selectedCeilingOption === 'ENFORCE_10' ? 0 : 2,
              status: selectedCeilingOption === 'ENFORCE_10' ? 'FLAGGED' : 'UNDER_REVIEW',
              explanation: `Counter-offer adjusted by sales desk: ${selectedCeilingOption === 'ENFORCE_10' ? 'Enforced 10% policy ceiling' : 'Countered at 12% with warranty bundle'}.`,
              recommendedAction: 'Restructured deal terms sent to Delta Solutions',
            }
          : a
      )
    );
    setIsSubmitting(false);
    setReviewDiscountDialogOpen(false);
    toast({
      title: 'Discount Restructuring Saved',
      description: 'Delta Solutions (Q-1052) discount updated to compliant category ceiling. Margin protected.',
      type: 'success',
    });
  };

  // Handle Stock Shortage Resolution
  const handleStockResolveSubmit = async () => {
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    setDeliveryRisks((prev) =>
      prev.map((r) =>
        r.fulfillmentId === 'FUL-803'
          ? {
              ...r,
              availableQty: 8,
              backorderQty: 0,
              riskType: 'DELAYED_FULFILLMENT',
              severity: 'MEDIUM',
              suggestedAction: 'Inter-warehouse expedited freight initiated from West Logistics Hub',
              impactSummary: '8 units transferred from West Logistics Hub. Delivery on track for Sep 16 (within SLA window).',
            }
          : r
      )
    );
    setIsSubmitting(false);
    setStockShortageDialogOpen(false);
    toast({
      title: 'Warehouse Transfer Dispatched',
      description: '8 units of Laptop Pro 14 routed from West Logistics Hub to East Depot. Backorder cleared.',
      type: 'success',
    });
  };

  // Filtered timeline
  const filteredTimeline = useMemo(() => {
    if (timelineFilter === 'ALL') return SEEDED_HEALTH_TIMELINE;
    return SEEDED_HEALTH_TIMELINE.filter(
      (e) => e.quotationId.includes(timelineFilter) || e.customerName.toLowerCase().includes(timelineFilter.toLowerCase())
    );
  }, [timelineFilter]);

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-teal-600 text-white rounded-lg shadow-sm">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Deal Health & Anomaly Center
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Deterministic governance intelligence, velocity benchmarks, and inventory constraint diagnostics.
              </p>
            </div>
          </div>
        </div>

        {/* Intelligence Engine Status Pill */}
        <div className="flex items-center gap-2 bg-teal-50/80 border border-teal-200 px-3 py-1.5 rounded-full text-xs font-medium text-teal-800 self-start sm:self-auto">
          <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
          <span>Rules-Based Governance Engine: <strong>Active</strong></span>
        </div>
      </div>

      {/* Intelligence Engine Explanation Banner */}
      <div className="p-4 rounded-lg bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 text-white shadow-enterprise">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-teal-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-teal-300">
                Deterministic Dealflow Governance Rules
              </span>
            </div>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              DealFlow360 continuously evaluates pipeline velocity against 12-month historical closing medians, compares requested discounts against category limits (<span className="text-white font-semibold">min(Tier, Category)</span>), and monitors multi-warehouse stock allocations to flag risks before customer commitments are breached.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Average Deal Health</div>
              <div className="text-2xl font-bold font-mono text-teal-400">{kpiData.avgHealthScore}/100</div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: Overall Deal Health KPIs */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-teal-600" />
            1. Overall Deal Health & Risk Matrix
          </h2>
          <span className="text-xs text-slate-400 font-mono">8 Pipeline Deals Evaluated</span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Healthy Deals */}
          <Card className="border-l-4 border-l-emerald-500 bg-white hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Healthy Deals</span>
                <div className="p-2 rounded-md bg-emerald-50 text-emerald-700">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <p className="text-3xl font-bold font-mono text-emerald-700 mt-2">{kpiData.healthyDeals}</p>
              <p className="text-[11px] text-emerald-600 font-medium mt-1">Within policy margins & SLA timeline</p>
            </CardContent>
          </Card>

          {/* At-Risk Deals */}
          <Card className="border-l-4 border-l-amber-500 bg-white hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">At-Risk Deals</span>
                <div className="p-2 rounded-md bg-amber-50 text-amber-700">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <p className="text-3xl font-bold font-mono text-amber-600 mt-2">{kpiData.atRiskDeals}</p>
              <p className="text-[11px] text-amber-700 font-medium mt-1">Policy exception or margin drift</p>
            </CardContent>
          </Card>

          {/* Stalled Deals */}
          <Card className="border-l-4 border-l-violet-500 bg-white hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Stalled Deals</span>
                <div className="p-2 rounded-md bg-violet-50 text-violet-700">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <p className="text-3xl font-bold font-mono text-violet-700 mt-2">{kpiData.stalledDeals}</p>
              <p className="text-[11px] text-violet-700 font-medium mt-1">Idle &gt; 4 days in negotiation</p>
            </CardContent>
          </Card>

          {/* Discount Anomalies */}
          <Card className="border-l-4 border-l-rose-500 bg-white hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Discount Anomalies</span>
                <div className="p-2 rounded-md bg-rose-50 text-rose-700">
                  <Percent className="w-4 h-4" />
                </div>
              </div>
              <p className="text-3xl font-bold font-mono text-rose-600 mt-2">{kpiData.discountAnomalies}</p>
              <p className="text-[11px] text-rose-600 font-medium mt-1">Severe deviation from account median</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* SECTION 5 (PROMINENT): Recommended Actions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-teal-600" />
              Recommended Commercial Actions
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-teal-100 text-teal-800">
              High Impact
            </span>
          </div>
          <span className="text-xs text-slate-400">Contextual Next Steps Generated by Policy Engine</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Follow up with Zenith */}
          <Card className="border-2 border-slate-200 hover:border-teal-400 transition-all shadow-sm">
            <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-violet-50 text-violet-800 border border-violet-200">
                    Stalled Deal
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-500">Q-1028</span>
                </div>
                <h3 className="text-base font-bold text-slate-900">Follow up with Zenith</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Quotation Q-1028 has been idle for 9 business days in procurement review. Deal velocity is 62% below median account cadence.
                </p>
                <div className="p-2.5 rounded bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
                  <strong className="text-slate-900">Revenue Impact:</strong> $15,100 pipeline value at risk of Q4 slippage.
                </div>
              </div>
              <Button
                className="w-full bg-teal-600 hover:bg-teal-700 text-white text-xs gap-1.5"
                onClick={() => setNudgeDialogOpen(true)}
              >
                <Send className="w-3.5 h-3.5" />
                Nudge Zenith Procurement
              </Button>
            </CardContent>
          </Card>

          {/* Card 2: Review Delta discount */}
          <Card className="border-2 border-rose-200 bg-rose-50/20 hover:border-rose-400 transition-all shadow-sm">
            <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-900 border border-rose-300">
                    Critical Anomaly
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-500">Q-1052</span>
                </div>
                <h3 className="text-base font-bold text-rose-950">Review Delta discount</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Requested discount (22%) has a +14 point variance over Delta’s 8% median benchmark, causing $4,180 in gross margin erosion.
                </p>
                <div className="p-2.5 rounded bg-white border border-rose-200 text-[11px] text-rose-900">
                  <strong className="text-rose-950">Policy Violation:</strong> Exceeds Silver Hardware ceiling (10%) by +12 points.
                </div>
              </div>
              <Button
                className="w-full bg-rose-600 hover:bg-rose-700 text-white text-xs gap-1.5"
                onClick={() => setReviewDiscountDialogOpen(true)}
              >
                <Sliders className="w-3.5 h-3.5" />
                Review Delta Discount
              </Button>
            </CardContent>
          </Card>

          {/* Card 3: Resolve East Depot stock shortage */}
          <Card className="border-2 border-amber-200 bg-amber-50/20 hover:border-amber-400 transition-all shadow-sm">
            <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                    Fulfillment Deficit
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-500">FUL-803</span>
                </div>
                <h3 className="text-base font-bold text-amber-950">Resolve East Depot stock shortage</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  8 units of Laptop Pro 14 backordered at East Depot. SLA delivery is in 5 days; client penalty window triggers on Sep 22.
                </p>
                <div className="p-2.5 rounded bg-white border border-amber-200 text-[11px] text-amber-900">
                  <strong className="text-amber-950">Resolution Route:</strong> Transfer available buffer from West Logistics Hub.
                </div>
              </div>
              <Button
                className="w-full bg-amber-600 hover:bg-amber-700 text-white text-xs gap-1.5"
                onClick={() => setStockShortageDialogOpen(true)}
              >
                <Truck className="w-3.5 h-3.5" />
                Resolve Stock Shortage
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* SECTION 2 & 3: Stalled Deals & Discount Anomalies Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SECTION 2: Stalled Deals */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Clock className="w-4 h-4 text-violet-600" />
              2. Stalled Deals & Velocity Diagnostics
            </h2>
            <span className="text-xs text-slate-400 font-mono">{stalledDeals.length} Idle Deals</span>
          </div>

          <div className="space-y-3">
            {stalledDeals.map((deal) => (
              <Card key={deal.quotationId} className="border-slate-200 hover:border-slate-300 transition-colors">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{deal.customerName}</span>
                        <TierBadge tier={deal.customerTier} />
                        <span className="font-mono text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                          {deal.quotationId}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5 font-medium">{deal.title}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-mono font-bold text-slate-900 text-sm">{formatCurrency(deal.amount)}</div>
                      <div className="inline-flex items-center gap-1 text-[11px] font-bold text-violet-700 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded mt-1">
                        <Clock className="w-3 h-3" />
                        Idle for {deal.daysIdle} days
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-md border border-slate-200 text-xs text-slate-700 space-y-1.5">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-500">Stage: <strong className="text-slate-800">{deal.stage}</strong></span>
                      <span className="text-slate-500">Last Activity: <strong className="text-slate-800">{deal.lastActivityDate}</strong></span>
                    </div>
                    <p className="text-slate-600 text-[11px]">{deal.stalenessReason}</p>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-slate-500">Recommended action:</span>
                      <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                        {deal.recommendedAction}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs gap-1 h-7 border-teal-200 text-teal-700 hover:bg-teal-50"
                      onClick={() => {
                        if (deal.quotationId === 'Q-1028') setNudgeDialogOpen(true);
                        else toast({ title: 'Quotation Selected', description: `Inspecting ${deal.quotationId}`, type: 'info' });
                      }}
                    >
                      Take Action
                      <ArrowRight className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* SECTION 3: Discount Anomalies */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Percent className="w-4 h-4 text-rose-600" />
              3. Discount Anomalies & Margin Erosion
            </h2>
            <span className="text-xs text-slate-400 font-mono">{discountAnomalies.length} Flagged Concessions</span>
          </div>

          <div className="space-y-3">
            {discountAnomalies.map((anomaly) => (
              <Card key={anomaly.id} className="border-slate-200 hover:border-slate-300 transition-colors">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-sm">{anomaly.customerName}</span>
                        <TierBadge tier={anomaly.customerTier} />
                        <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          {anomaly.quotationId}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">{anomaly.productName}</p>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                      anomaly.status === 'ESCALATED'
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : anomaly.status === 'UNDER_REVIEW'
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-slate-100 text-slate-700 border border-slate-300'
                    }`}>
                      Status: {anomaly.status}
                    </span>
                  </div>

                  {/* Concession Metrics Row */}
                  <div className="grid grid-cols-4 gap-2 text-center p-2.5 bg-slate-50 rounded-md border border-slate-200 font-mono">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Requested</span>
                      <span className="text-sm font-bold text-rose-600">{anomaly.requestedDiscount}%</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Typical</span>
                      <span className="text-sm font-semibold text-slate-700">{anomaly.typicalDiscount}%</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Variance</span>
                      <span className="text-sm font-bold text-rose-700">+{anomaly.variancePoints} pts</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Policy Cap</span>
                      <span className="text-sm font-semibold text-teal-700">{anomaly.categoryLimit}%</span>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs">
                    <p className="text-[11px] text-slate-500 font-mono font-semibold">{anomaly.ruleTriggered}</p>
                    <p className="text-slate-600 text-[11px] leading-relaxed">{anomaly.explanation}</p>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                    <span className="text-[11px] text-rose-700 font-semibold font-mono">
                      Estimated Margin Erosion: -{formatCurrency(anomaly.marginErosionAmount)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-7 border-rose-200 text-rose-700 hover:bg-rose-50"
                      onClick={() => {
                        if (anomaly.quotationId === 'Q-1052') setReviewDiscountDialogOpen(true);
                        else toast({ title: 'Quotation Link', description: `Opening ${anomaly.quotationId}`, type: 'info' });
                      }}
                    >
                      Review Anomaly
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 4: Delivery Risk & Fulfillment Bottlenecks */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <Truck className="w-4 h-4 text-amber-600" />
            4. Delivery Risk & Warehouse Deficit Ledger
          </h2>
          <span className="text-xs text-slate-400 font-mono">{deliveryRisks.length} Constrained Shipments</span>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/75 hover:bg-slate-50/75">
                    <TableHead className="font-semibold text-slate-900">Fulfillment / Deal</TableHead>
                    <TableHead className="font-semibold text-slate-900">Customer & Product</TableHead>
                    <TableHead className="font-semibold text-slate-900">Inventory Status</TableHead>
                    <TableHead className="font-semibold text-slate-900">Risk Category</TableHead>
                    <TableHead className="font-semibold text-slate-900">Warehouse Facility</TableHead>
                    <TableHead className="font-semibold text-slate-900">Estimated Delivery</TableHead>
                    <TableHead className="font-semibold text-slate-900 text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deliveryRisks.map((risk) => (
                    <TableRow key={risk.id} className="hover:bg-slate-50/60 transition-colors">
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-mono text-xs font-bold text-teal-800">{risk.fulfillmentId}</span>
                          <span className="font-mono text-[11px] text-slate-500">{risk.quotationId}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-xs text-slate-900">{risk.customerName}</span>
                          <span className="text-[11px] text-slate-600">{risk.productName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-slate-600">Ord: <strong>{risk.orderedQty}</strong></span>
                          <span className="text-slate-400">·</span>
                          <span className="text-teal-700">Res: <strong>{risk.reservedQty}</strong></span>
                          {risk.backorderQty > 0 && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                              Backorder: {risk.backorderQty}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          risk.riskType === 'BACKORDER'
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : risk.riskType === 'FACILITY_BOTTLENECK'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-sky-100 text-sky-800 border border-sky-300'
                        }`}>
                          {risk.riskType.replace('_', ' ')}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        {risk.warehouse}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-mono text-xs text-slate-900 font-medium">{risk.estimatedDelivery}</span>
                          <span className={`text-[10px] font-semibold ${risk.daysUntilSlaBreach <= 5 ? 'text-rose-600' : 'text-slate-500'}`}>
                            {risk.daysUntilSlaBreach} days until SLA window
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-7 border-amber-300 text-amber-900 hover:bg-amber-50"
                          onClick={() => {
                            if (risk.fulfillmentId === 'FUL-803') setStockShortageDialogOpen(true);
                            else toast({ title: 'Fulfillment Order', description: `Inspecting ${risk.fulfillmentId}`, type: 'info' });
                          }}
                        >
                          Resolve
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 6: Deal Health Timeline */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal-600" />
              6. Governance Event & Anomaly Timeline
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Deterministic log of anomaly detections, policy ceiling breaches, and velocity alerts.
            </p>
          </div>

          {/* Deal Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { label: 'All Deals', value: 'ALL' },
              { label: 'Q-1028 (Zenith)', value: 'Q-1028' },
              { label: 'Q-1052 (Delta)', value: 'Q-1052' },
              { label: 'FUL-803 (Zenith)', value: 'FUL-803' },
              { label: 'Q-1042 (Acme)', value: 'Q-1042' },
            ].map((pill) => (
              <button
                key={pill.value}
                onClick={() => setTimelineFilter(pill.value)}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                  timelineFilter === pill.value
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-6 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200">
              {filteredTimeline.map((item) => (
                <div key={item.id} className="relative flex items-start gap-4 pl-8">
                  {/* Bullet */}
                  <div className={`absolute left-2 top-1 w-3.5 h-3.5 rounded-full border-2 bg-white ${
                    item.severity === 'CRITICAL'
                      ? 'border-rose-600 bg-rose-50'
                      : item.severity === 'HIGH'
                      ? 'border-amber-500 bg-amber-50'
                      : 'border-teal-600 bg-teal-50'
                  }`} />

                  {/* Content Box */}
                  <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-sm">{item.headline}</span>
                        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                          {item.quotationId}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">({item.customerName})</span>
                      </div>
                      <span className="font-mono text-[11px] text-slate-400">{item.timestamp.replace('T', ' ').slice(0, 16)} UTC</span>
                    </div>

                    <div className="text-xs text-slate-700 space-y-1">
                      <p className="font-mono text-[11px] text-teal-800 font-semibold">{item.ruleTriggered}</p>
                      <p className="text-slate-600 leading-relaxed">{item.details}</p>
                    </div>

                    <div className="p-2 bg-white rounded border border-slate-200 text-[11px] text-slate-700 flex items-start gap-1.5">
                      <Info className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Recommended Next Step:</strong> {item.recommendedNextStep}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* DIALOG 1: NUDGE ZENITH DIALOG */}
      <Dialog open={nudgeDialogOpen} onOpenChange={setNudgeDialogOpen}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900">
            <Send className="w-5 h-5 text-teal-600" />
            Nudge Customer — Zenith Industries (Q-1028)
          </DialogTitle>
          <DialogDescription>
            Quotation Q-1028 has been idle for 9 days. Dispatching an automated commercial follow-up resets the deal velocity watchdog and logs an audit timestamp.
          </DialogDescription>
        </DialogHeader>
        <div className="p-6 space-y-4">
          <div className="p-3 bg-violet-50 border border-violet-200 rounded-md text-xs space-y-1">
            <p className="font-bold text-violet-950">Deal Summary:</p>
            <p className="text-violet-900">
              Automated Manufacturing Telemetry Workstations • Value: <strong>$15,100</strong> • Stage: <strong>Customer Review</strong>
            </p>
            <p className="text-violet-800 text-[11px]">
              Assigned Account Manager: Elena Rostova • Inactivity: 9 Business Days
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Follow-Up Email Template Preview</label>
            <textarea
              className="w-full text-xs font-sans border border-slate-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none min-h-[140px] leading-relaxed"
              value={nudgeMessage}
              onChange={(e) => setNudgeMessage(e.target.value)}
            />
            <p className="text-[11px] text-slate-400">
              Includes refreshed 7-day price guarantee. Dispatches via DealFlow360 Mail Relay.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setNudgeDialogOpen(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            className="bg-teal-600 hover:bg-teal-700 text-white gap-1.5 text-xs"
            onClick={handleNudgeSubmit}
            disabled={isSubmitting || !nudgeMessage.trim()}
          >
            <Send className="w-3.5 h-3.5" />
            {isSubmitting ? 'Dispatching...' : 'Confirm & Dispatch Nudge'}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* DIALOG 2: REVIEW DELTA DISCOUNT DIALOG */}
      <Dialog open={reviewDiscountDialogOpen} onOpenChange={setReviewDiscountDialogOpen}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-rose-900">
            <Sliders className="w-5 h-5 text-rose-600" />
            Review Discount Anomaly — Delta Solutions (Q-1052)
          </DialogTitle>
          <DialogDescription>
            Requested concession is 22% (+14 points above Delta’s 8% median benchmark). Silver tier category limit for Hardware is strictly 10%.
          </DialogDescription>
        </DialogHeader>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-3 gap-2 text-center p-3 bg-rose-50 border border-rose-200 rounded-md text-xs font-mono">
            <div>
              <span className="text-[10px] uppercase font-bold text-rose-500 block">Requested</span>
              <span className="text-base font-bold text-rose-700">22%</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Account Median</span>
              <span className="text-base font-bold text-slate-700">8%</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-teal-600 block">Category Ceiling</span>
              <span className="text-base font-bold text-teal-700">10%</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700">Select Resolution Strategy:</label>
            <div className="space-y-2">
              <label className="flex items-start gap-2.5 p-3 rounded border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs">
                <input
                  type="radio"
                  name="ceilingOption"
                  checked={selectedCeilingOption === 'ENFORCE_10'}
                  onChange={() => setSelectedCeilingOption('ENFORCE_10')}
                  className="accent-teal-600 mt-0.5"
                />
                <div>
                  <strong className="text-slate-900">Enforce 10% Policy Ceiling (Recommended)</strong>
                  <p className="text-slate-500 mt-0.5">Restructures quotation to conform to Silver Hardware ceiling. Prevents $4,180 margin erosion.</p>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-3 rounded border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs">
                <input
                  type="radio"
                  name="ceilingOption"
                  checked={selectedCeilingOption === 'COUNTER_12'}
                  onChange={() => setSelectedCeilingOption('COUNTER_12')}
                  className="accent-teal-600 mt-0.5"
                />
                <div>
                  <strong className="text-slate-900">Counter-Propose 12% with Bundled Care Plan</strong>
                  <p className="text-slate-500 mt-0.5">Offers +2 points concession in exchange for a mandatory 1-year Support Retainer to offset gross margin.</p>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-3 rounded border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs">
                <input
                  type="radio"
                  name="ceilingOption"
                  checked={selectedCeilingOption === 'ESCALATE_CFO'}
                  onChange={() => setSelectedCeilingOption('ESCALATE_CFO')}
                  className="accent-teal-600 mt-0.5"
                />
                <div>
                  <strong className="text-slate-900">Escalate to CFO Executive Sign-Off</strong>
                  <p className="text-slate-500 mt-0.5">Routes full 22% exception to CFO desk for strategic account exception sign-off.</p>
                </div>
              </label>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Commercial Rationale Notes</label>
            <textarea
              className="w-full text-xs border border-slate-300 rounded-md p-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none min-h-[70px]"
              value={discountReviewNotes}
              onChange={(e) => setDiscountReviewNotes(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setReviewDiscountDialogOpen(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            className="bg-rose-600 hover:bg-rose-700 text-white text-xs"
            onClick={handleDiscountReviewSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Apply Resolution Strategy'}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* DIALOG 3: RESOLVE STOCK SHORTAGE DIALOG */}
      <Dialog open={stockShortageDialogOpen} onOpenChange={setStockShortageDialogOpen}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-900">
            <Truck className="w-5 h-5 text-amber-600" />
            Resolve Warehouse Shortage — FUL-803 (Zenith Industries)
          </DialogTitle>
          <DialogDescription>
            East Depot has 8 units backordered for Laptop Pro 14. Customer delivery SLA triggers in 5 days.
          </DialogDescription>
        </DialogHeader>
        <div className="p-6 space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-xs space-y-1">
            <p className="font-bold text-amber-950">Fulfillment Constraint:</p>
            <p className="text-amber-900">
              Zenith Order: 30 units | Reserved: 22 units (Chicago) | Backordered: <strong>8 units (East Depot)</strong>
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700">Select Reallocation Source Facility:</label>
            <div className="space-y-2">
              <label className="flex items-start gap-2.5 p-3 rounded border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs">
                <input
                  type="radio"
                  name="transferSource"
                  checked={transferSource === 'WEST_HUB'}
                  onChange={() => setTransferSource('WEST_HUB')}
                  className="accent-teal-600 mt-0.5"
                />
                <div>
                  <strong className="text-slate-900">West Logistics Hub (Reno, NV) — 5 Available Units</strong>
                  <p className="text-slate-500 mt-0.5">Expedite 5 units via 2-day air freight + 3 units manufacturer direct ship.</p>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-3 rounded border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs">
                <input
                  type="radio"
                  name="transferSource"
                  checked={transferSource === 'CENTRAL_CHICAGO'}
                  onChange={() => setTransferSource('CENTRAL_CHICAGO')}
                  className="accent-teal-600 mt-0.5"
                />
                <div>
                  <strong className="text-slate-900">Central Logistics Hub (Chicago Hub) Restock Batch</strong>
                  <p className="text-slate-500 mt-0.5">Release 8 units from inbound dock arrival batch #B-402 scheduled for Sep 10.</p>
                </div>
              </label>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Units to Transfer to East Depot</label>
            <input
              type="number"
              className="w-full text-xs font-mono border border-slate-300 rounded-md p-2"
              value={transferUnits}
              onChange={(e) => setTransferUnits(e.target.value)}
              min="1"
              max="8"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setStockShortageDialogOpen(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            className="bg-amber-600 hover:bg-amber-700 text-white text-xs gap-1.5"
            onClick={handleStockResolveSubmit}
            disabled={isSubmitting}
          >
            <Truck className="w-3.5 h-3.5" />
            {isSubmitting ? 'Routing...' : 'Authorize Emergency Transfer'}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
