'use client';

import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldAlert,
  ShieldCheck,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  RotateCcw,
  Building2,
  User,
  History,
  Info,
  Check,
  Ban,
  ArrowDown,
  Layers,
  FileText,
} from 'lucide-react';
import { useQuotation, useUpdateQuotationStatus } from '@/hooks/use-dealflow';
import { useToast } from '@/components/providers/query-provider';
import { useAuth } from '@/lib/auth';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TierBadge } from '@/components/ui/tier-badge';
import { StatusBadge, RiskBadge } from '@/components/ui/status-badge';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Dialog, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CardLoadingSkeleton } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { Quotation, QuotationStatus } from '@/types/dealflow';

export default function ApprovalDecisionPage() {
  const params = useParams();
  const router = useRouter();
  const quoteId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: quotation, isLoading, isError, refetch } = useQuotation(quoteId);
  const updateStatusMutation = useUpdateQuotationStatus();

  // Action Dialog State
  const [activeDialog, setActiveDialog] = useState<'APPROVE' | 'RETURN' | 'REJECT' | null>(null);
  const [dialogReason, setDialogReason] = useState('');
  const [reasonError, setReasonError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Identify highest violation item for the primary decision banner
  const primaryViolation = useMemo(() => {
    if (!quotation) return null;
    const violations = quotation.items.filter((i) => i.isViolation);
    if (violations.length === 0) return null;
    return violations.reduce((max, curr) => (curr.excessPercent > max.excessPercent ? curr : max));
  }, [quotation]);

  // Determine required hierarchy approval chain
  const approvalChain = useMemo(() => {
    if (!quotation) return 'Sales Manager → Finance';
    const maxExcess = Math.max(0, ...quotation.items.map((i) => i.excessPercent));
    if (quotation.riskDiagnosis.level === 'CRITICAL' || maxExcess > 10) {
      return 'Sales Manager → Finance → Executive VP';
    }
    return 'Sales Manager → Finance';
  }, [quotation]);

  // Workflow Timeline Stages
  // Submitted ↓ Sales Manager ↓ Finance ↓ Confirmed
  const timelineStages = useMemo(() => {
    if (!quotation) return [];

    const isFinancePending =
      quotation.status === 'PENDING_APPROVAL' ||
      quotation.status === 'PENDING_FINANCE_APPROVAL' ||
      quotation.status === 'PENDING_DISCOUNT_APPROVAL';
    const isReturned = quotation.status === 'RETURNED';
    const isApproved = quotation.status === 'APPROVED';
    const isConfirmed = quotation.status === 'CONFIRMED' || quotation.status === 'FULFILLED';
    const isRejected = quotation.status === 'REJECTED';

    return [
      {
        id: 'submitted',
        label: 'Submitted',
        actor: quotation.owner || 'Marcus Vance (AE)',
        date: new Date(quotation.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        status: 'COMPLETED' as const,
        description: 'Initial quotation created with concessions and policy checks.',
      },
      {
        id: 'sales_manager',
        label: 'Sales Manager',
        actor: 'Marcus Vance / Deal Desk',
        date: new Date(quotation.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        status: 'COMPLETED' as const,
        description: 'Endorsed deal strategic necessity and tier alignment.',
      },
      {
        id: 'finance',
        label: 'Finance',
        actor: 'Sarah Sterling (Finance Controller)',
        date: isFinancePending ? 'Awaiting Action' : 'Reviewed',
        status: isRejected
          ? ('REJECTED' as const)
          : isReturned
          ? ('RETURNED' as const)
          : isFinancePending
          ? ('CURRENT' as const)
          : ('COMPLETED' as const),
        description: isFinancePending
          ? 'Mandatory sign-off required for discount ceiling override.'
          : isReturned
          ? 'Returned to account team for margin restructuring.'
          : isRejected
          ? 'Rejected due to excessive margin dilution.'
          : 'Approved within executive margin exceptions.',
      },
      {
        id: 'confirmed',
        label: 'Confirmed',
        actor: 'Procurement / Commercial Desk',
        date: isConfirmed ? 'Signed' : 'Pending Sign-Off',
        status: isConfirmed ? ('COMPLETED' as const) : ('UPCOMING' as const),
        description: 'Deal terms legally executed and routed to shipment/billing.',
      },
    ];
  }, [quotation]);

  const handleAction = async (decision: 'APPROVED' | 'RETURNED' | 'REJECTED') => {
    if (!quotation) return;

    // Reason validation for return / reject
    if ((decision === 'RETURNED' || decision === 'REJECTED') && !dialogReason.trim()) {
      setReasonError('An explicit commercial justification is required for audit governance.');
      return;
    }

    setIsProcessing(true);
    setReasonError('');
    const actor = user?.name ? `${user.name} (${user.role})` : 'Sarah Sterling (Finance Controller)';

    try {
      await updateStatusMutation.mutateAsync({
        id: quotation.id,
        status: decision,
        note: dialogReason.trim() || `Quotation ${decision.toLowerCase()} by authorized controller.`,
        actor,
      });

      toast({
        title:
          decision === 'APPROVED'
            ? 'Quotation Approved'
            : decision === 'RETURNED'
            ? 'Returned for Revision'
            : 'Quotation Rejected',
        description: `Quotation ${quotation.id} has been transitioned to ${decision.replace(/_/g, ' ')}.`,
        type: decision === 'APPROVED' ? 'success' : decision === 'RETURNED' ? 'warning' : 'error',
      });

      setActiveDialog(null);
      setDialogReason('');
    } catch {
      toast({
        title: 'Decision Dispatch Failed',
        description: 'Unable to commit approval decision.',
        type: 'error',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 bg-slate-200 rounded-md animate-pulse w-1/3" />
        <CardLoadingSkeleton />
        <CardLoadingSkeleton />
      </div>
    );
  }

  if (isError || !quotation) {
    return (
      <ErrorState
        title="Quotation Not Found"
        message={`Could not load quotation "${quoteId}" for approval evaluation.`}
        onRetry={() => refetch()}
      />
    );
  }

  const isPending =
    quotation.status === 'PENDING_APPROVAL' ||
    quotation.status === 'PENDING_FINANCE_APPROVAL' ||
    quotation.status === 'PENDING_DISCOUNT_APPROVAL';

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link href="/approvals">
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs text-slate-600">
              <ArrowLeft className="w-3.5 h-3.5" />
              Approval Center
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold bg-slate-900 text-white px-2 py-0.5 rounded">
                {quotation.id}
              </span>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                {quotation.customerName}
              </h1>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-semibold text-slate-600 truncate max-w-sm">
                {quotation.title}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Decision Authority: <strong>Sarah Sterling (Finance Controller)</strong> • Value: <strong>{formatCurrency(quotation.grandTotal)}</strong>
            </p>
          </div>
        </div>

        {/* Status & Risk Badges */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <StatusBadge status={quotation.status} />
          <RiskBadge level={quotation.riskDiagnosis.level} />
        </div>
      </div>

      {/* TOP DECISION HERO SECTION */}
      <Card className="bg-white border-slate-200 shadow-enterprise overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/70">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-black text-slate-900 font-mono">
                  {quotation.id}
                </span>
                <span className="text-lg font-bold text-slate-800">
                  {quotation.customerName}
                </span>
                <TierBadge tier={quotation.customerTier} />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Owner / AE: <strong>{quotation.owner || 'Marcus Vance'}</strong> • Price Schedule:{' '}
                <strong>{quotation.priceList || 'Standard Commercial 2026'}</strong>
              </p>
            </div>

            {/* Risk Indicator Pill */}
            <div className="self-start">
              <RiskBadge level={quotation.riskDiagnosis.level} />
            </div>
          </div>
        </div>

        {/* Clear Policy Explanation & Gold Tier Governance Callout */}
        <div className="p-5 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left: Exception Explanation Box */}
          <div className="md:col-span-7 space-y-3.5">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span>Policy Exception Diagnosis</span>
            </div>

            {primaryViolation ? (
              <div className="bg-rose-50/70 border border-rose-200 rounded-lg p-4 space-y-2 text-xs">
                <div className="flex items-baseline justify-between border-b border-rose-200/60 pb-2">
                  <span className="font-bold text-slate-900 text-sm">
                    {primaryViolation.productName}
                  </span>
                  <span className="font-mono text-rose-800 font-bold bg-rose-100 px-2 py-0.5 rounded text-xs">
                    +{primaryViolation.excessPercent} points excess
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px] font-sans">Requested Discount:</span>
                    <span className="font-bold text-rose-800 text-sm">
                      {formatPercent(primaryViolation.discountPercent)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px] font-sans">Allowed Limit:</span>
                    <span className="font-bold text-slate-800 text-sm">
                      {primaryViolation.effectiveLimit}%
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px] font-sans">Excess:</span>
                    <span className="font-bold text-rose-800 text-sm">
                      +{primaryViolation.excessPercent} points
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-rose-200/60 text-slate-700">
                  <span className="font-semibold text-slate-900 font-sans">Required Approval: </span>
                  <span className="font-mono font-bold text-slate-900">{approvalChain}</span>
                </div>
              </div>
            ) : (
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-4 text-xs text-emerald-900">
                <p className="font-bold">Zero Policy Breaches Flagged</p>
                <p className="text-emerald-800 mt-1">
                  All line item discounts comply strictly with customer tier and product category limits.
                </p>
              </div>
            )}
          </div>

          {/* Right: Mandatory Customer Tier Governance Warning */}
          <div className="md:col-span-5 flex flex-col justify-between p-4 bg-slate-900 text-white rounded-lg space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-400">
                  Customer Tier Governance
                </span>
                <span className="text-xs font-mono bg-slate-800 text-teal-300 px-2 py-0.5 rounded border border-slate-700">
                  Tier: {quotation.customerTier}
                </span>
              </div>
              <h3 className="text-sm font-bold text-white mt-2">
                Priority Tier Rule Enforcement
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                IMPORTANT: <strong>Gold customer priority must NOT bypass approval rules.</strong>
              </p>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Under Section 3 deal governance, category ceilings take strict precedence: min(Customer Tier Limit, Category Limit). Hardware is capped at 15%; Services is capped at 10%.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span>Policy Status:</span>
              <span className="font-bold text-amber-400">Escalated to Controller</span>
            </div>
          </div>
        </div>

        {/* DECISION ACTION COMMAND BAR */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-600">
            {isPending ? (
              <span>
                Select your formal determination for <strong>{quotation.id}</strong>. Decisions are written to the permanent audit trail.
              </span>
            ) : (
              <span>
                Deal determination finalized. Current state: <strong>{quotation.status}</strong>.
              </span>
            )}
          </div>

          {/* Decision Buttons */}
          <div className="flex items-center gap-2">
            {isPending ? (
              <>
                <Button
                  onClick={() => setActiveDialog('APPROVE')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs gap-1.5 shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  Approve Deal
                </Button>

                <Button
                  onClick={() => setActiveDialog('RETURN')}
                  variant="outline"
                  className="bg-white hover:bg-amber-50 text-amber-900 border-amber-300 text-xs font-semibold gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                  Return for Revision
                </Button>

                <Button
                  onClick={() => setActiveDialog('REJECT')}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs gap-1.5 shadow-xs"
                >
                  <Ban className="w-3.5 h-3.5" />
                  Reject Deal
                </Button>
              </>
            ) : (
              <span className="text-xs font-semibold text-slate-700 bg-white px-3 py-1.5 rounded border border-slate-200">
                Decision Recorded
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* WORKFLOW TIMELINE: Submitted ↓ Sales Manager ↓ Finance ↓ Confirmed */}
      <Card className="bg-white border-slate-200 shadow-enterprise p-5">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>Approval Authority Hierarchy & Workflow Timeline</span>
          </h3>
          <span className="text-xs text-slate-500 font-mono">Stage {isPending ? '3 of 4' : 'Completed'}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
          {timelineStages.map((stage, idx) => {
            const isCompleted = stage.status === 'COMPLETED';
            const isCurrent = stage.status === 'CURRENT';
            const isRejected = stage.status === 'REJECTED';
            const isReturned = stage.status === 'RETURNED';

            return (
              <div
                key={stage.id}
                className={`p-3.5 rounded-lg border text-xs transition relative ${
                  isCurrent
                    ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-400/30 shadow-xs'
                    : isCompleted
                    ? 'bg-slate-50 border-slate-200'
                    : isRejected
                    ? 'bg-rose-50 border-rose-300'
                    : isReturned
                    ? 'bg-orange-50 border-orange-300'
                    : 'bg-white border-slate-200 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-900 text-xs">
                    {idx + 1}. {stage.label}
                  </span>
                  {isCompleted && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                      Cleared
                    </span>
                  )}
                  {isCurrent && (
                    <span className="text-[10px] bg-amber-500 text-slate-950 font-bold px-1.5 py-0.2 rounded animate-pulse">
                      Current Stage
                    </span>
                  )}
                  {isRejected && (
                    <span className="text-[10px] bg-rose-600 text-white font-bold px-1.5 py-0.2 rounded">
                      Rejected
                    </span>
                  )}
                  {isReturned && (
                    <span className="text-[10px] bg-orange-500 text-white font-bold px-1.5 py-0.2 rounded">
                      Returned
                    </span>
                  )}
                </div>

                <p className="font-semibold text-slate-800 text-[11px]">{stage.actor}</p>
                <p className="text-[11px] text-slate-500 mt-1 leading-snug">{stage.description}</p>
                <p className="text-[10px] text-slate-400 mt-2 font-mono">{stage.date}</p>
              </div>
            );
          })}
        </div>
      </Card>

      {/* RISK BREAKDOWN TABLE */}
      <Card className="bg-white border-slate-200 shadow-enterprise overflow-hidden">
        <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-600" />
              Line-by-Line Risk Breakdown & Margin Contribution
            </CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Evaluates individual item discount percentages against product category thresholds and customer tier ceilings.
            </p>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {quotation.items.length} Line Item{quotation.items.length === 1 ? '' : 's'}
          </span>
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 text-[11px] font-semibold text-slate-600">
                <TableHead className="w-48">Product / Line</TableHead>
                <TableHead className="w-20 text-center">Category</TableHead>
                <TableHead className="w-16 text-center">Qty</TableHead>
                <TableHead className="w-24 text-right">Unit Price</TableHead>
                <TableHead className="w-20 text-center">Discount</TableHead>
                <TableHead className="w-20 text-center">Allowed</TableHead>
                <TableHead className="w-24 text-center">Excess</TableHead>
                <TableHead>Why It Contributes to Risk</TableHead>
                <TableHead className="w-28 text-center">Policy Status</TableHead>
                <TableHead className="w-28 text-right">Line Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotation.items.map((item) => {
                const isViolation = item.isViolation;
                const excess = item.excessPercent;

                return (
                  <TableRow
                    key={item.id}
                    className={`hover:bg-slate-50/70 border-b border-slate-100 text-xs ${
                      isViolation ? 'bg-rose-50/40' : ''
                    }`}
                  >
                    {/* Product */}
                    <TableCell className="font-semibold text-slate-900">
                      {item.productName}
                    </TableCell>

                    {/* Category */}
                    <TableCell className="text-center text-slate-600 text-[11px]">
                      {item.category}
                    </TableCell>

                    {/* Quantity */}
                    <TableCell className="text-center font-medium">
                      {item.quantity}
                    </TableCell>

                    {/* Unit Price */}
                    <TableCell className="text-right font-mono text-slate-700">
                      {formatCurrency(item.unitPrice)}
                    </TableCell>

                    {/* Discount */}
                    <TableCell className="text-center font-bold text-slate-900 font-mono">
                      {formatPercent(item.discountPercent)}
                    </TableCell>

                    {/* Allowed */}
                    <TableCell className="text-center font-mono text-slate-600">
                      {item.effectiveLimit}%
                    </TableCell>

                    {/* Excess */}
                    <TableCell className="text-center font-mono font-bold">
                      {isViolation ? (
                        <span className="text-rose-800 bg-rose-100 px-1.5 py-0.5 rounded text-[11px]">
                          +{excess} pts
                        </span>
                      ) : (
                        <span className="text-emerald-700">0 pts</span>
                      )}
                    </TableCell>

                    {/* Risk Contribution Explanation */}
                    <TableCell className="text-slate-600 text-[11px]">
                      {isViolation ? (
                        <span className="text-rose-900 font-medium">
                          Breaches {item.category} cap ({item.category === 'Hardware' ? '15%' : '10%'}) by +{excess}% points. Dilutes gross contribution margin by {formatCurrency(item.unitPrice * item.quantity * (item.discountPercent / 100))}.
                        </span>
                      ) : (
                        <span className="text-slate-500">
                          Within allowable {quotation.customerTier} tier ceiling. Margin target maintained.
                        </span>
                      )}
                    </TableCell>

                    {/* Policy Status */}
                    <TableCell className="text-center">
                      {isViolation ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white shadow-2xs">
                          <AlertTriangle className="w-3 h-3" />
                          OVER LIMIT
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          WITHIN POLICY
                        </span>
                      )}
                    </TableCell>

                    {/* Line Total */}
                    <TableCell className="text-right font-mono font-bold text-slate-900">
                      {formatCurrency(item.lineTotal)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* AUDIT TRAIL BELOW */}
      <Card className="bg-white border-slate-200 shadow-enterprise">
        <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <History className="w-4 h-4 text-slate-700" />
            Permanent Governance Audit Ledger
          </CardTitle>
          <span className="text-xs text-slate-500 font-mono">Immutable Log</span>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-3.5 text-xs">
            {quotation.auditTrail.map((entry, idx) => (
              <div key={entry.id || idx} className="flex gap-3 text-xs border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                <div className="w-2 h-2 rounded-full bg-slate-900 mt-1.5 shrink-0 ring-4 ring-slate-100" />
                <div className="flex-1 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{entry.action}</span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(entry.timestamp).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-slate-700">{entry.details}</p>
                  <p className="text-[10px] text-slate-400 font-medium">Recorded by: {entry.actor}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* DECISION REASON DIALOG (MANDATORY REASON FOR RETURN / REJECT) */}
      {activeDialog && (
        <Dialog
          open={Boolean(activeDialog)}
          onOpenChange={(open) => {
            if (!open) {
              setActiveDialog(null);
              setDialogReason('');
              setReasonError('');
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {activeDialog === 'APPROVE' && 'Confirm Commercial Approval'}
              {activeDialog === 'RETURN' && 'Return Quotation for Revision'}
              {activeDialog === 'REJECT' && 'Reject Quotation (Policy Denial)'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 text-xs">
            <p className="text-slate-600 leading-relaxed">
              {activeDialog === 'APPROVE' && (
                <>
                  You are granting formal Finance sign-off for <strong>{quotation.id}</strong> (
                  {quotation.customerName}). All policy exceptions will be cleared under your credentials.
                </>
              )}
              {activeDialog === 'RETURN' && (
                <>
                  Specify the required commercial revisions before returning this quotation to{' '}
                  <strong>{quotation.owner || 'Marcus Vance'}</strong>. An explicit reason is mandatory.
                </>
              )}
              {activeDialog === 'REJECT' && (
                <>
                  Permanently reject this deal proposal. State the policy violation rationale. An explicit reason is mandatory.
                </>
              )}
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                {activeDialog === 'APPROVE'
                  ? 'Approval Rationale / Commercial Endorsement (Optional)'
                  : 'Mandatory Governance Rationale *'}
              </label>
              <textarea
                rows={3}
                value={dialogReason}
                onChange={(e) => {
                  setDialogReason(e.target.value);
                  if (e.target.value.trim()) setReasonError('');
                }}
                placeholder={
                  activeDialog === 'APPROVE'
                    ? 'e.g. Cleared based on multi-year ARR commitment and executive sponsor sign-off.'
                    : activeDialog === 'RETURN'
                    ? 'e.g. Service discount of 18% must be reduced to <= 12% or tied to a 24-month commitment.'
                    : 'e.g. Concession exceeds maximum margin threshold. Hard stop under governance policy.'
                }
                className="w-full text-xs p-2.5 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
              />
              {reasonError && (
                <p className="text-rose-600 text-[11px] font-semibold mt-1">{reasonError}</p>
              )}
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setActiveDialog(null);
                  setDialogReason('');
                  setReasonError('');
                }}
                disabled={isProcessing}
              >
                Cancel
              </Button>

              {activeDialog === 'APPROVE' && (
                <Button
                  size="sm"
                  onClick={() => handleAction('APPROVED')}
                  loading={isProcessing}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                >
                  Confirm Approval
                </Button>
              )}

              {activeDialog === 'RETURN' && (
                <Button
                  size="sm"
                  onClick={() => handleAction('RETURNED')}
                  loading={isProcessing}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                >
                  Return to AE
                </Button>
              )}

              {activeDialog === 'REJECT' && (
                <Button
                  size="sm"
                  onClick={() => handleAction('REJECTED')}
                  loading={isProcessing}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-semibold"
                >
                  Reject Proposal
                </Button>
              )}
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
