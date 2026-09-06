'use client';

import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FileText,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ShieldAlert,
  Sparkles,
  Send,
  RotateCcw,
  Building2,
  User,
  Calendar,
  Layers,
  History,
  Info,
  Check,
  Ban,
  MessageSquare,
  Inbox,
  ExternalLink,
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
import { Input } from '@/components/ui/input';
import { CardLoadingSkeleton } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { QuoteRevisionPanel } from '@/components/quotations/revision-panel';
import { QuotationStatus } from '@/types/dealflow';

export default function QuotationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const quoteId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: quotation, isLoading, isError, refetch } = useQuotation(quoteId);
  const updateStatusMutation = useUpdateQuotationStatus();

  // Action Dialog State
  const [activeDialog, setActiveDialog] = useState<
    'APPROVE' | 'REJECT' | 'RETURN' | 'SUBMIT' | 'SEND' | 'CONFIRM' | 'SUBMIT_REAPPROVAL' | null
  >(null);
  const [actionNote, setActionNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Stepper Stages
  const steps = [
    { key: 'DRAFT', label: '1. Draft' },
    { key: 'PENDING', label: '2. Approval' },
    { key: 'APPROVED', label: '3. Approved' },
    { key: 'SENT', label: '4. Sent' },
    { key: 'NEGOTIATION', label: '5. Negotiation' },
    { key: 'CONFIRMED', label: '6. Confirmed' },
    { key: 'FULFILLMENT', label: '7. Fulfillment' },
    { key: 'BILLING', label: '8. Billing' },
    { key: 'COMPLETED', label: '9. Completed' },
  ];

  const currentStepIndex = useMemo(() => {
    if (!quotation) return 0;
    switch (quotation.status) {
      case 'DRAFT':
        return 0;
      case 'PENDING_APPROVAL':
        return 1;
      case 'APPROVED':
        return 2;
      case 'SENT':
        return 3;
      case 'UNDER_NEGOTIATION':
        return 4;
      case 'CONFIRMED':
        return 5;
      case 'FULFILLMENT':
        return 6;
      case 'BILLING':
        return 7;
      case 'COMPLETED':
        return 8;
      case 'REVISION_REQUIRED':
        return 1; // back at approval stage / revision
      case 'REJECTED':
        return 1; // stopped at approval stage
      default:
        return 0;
    }
  }, [quotation]);

  const handleExecuteTransition = async (newStatus: QuotationStatus, defaultNote: string) => {
    if (!quotation) return;
    setIsProcessing(true);
    const actor = user?.name ? `${user.name} (${user.role})` : 'Sarah Sterling (Finance Controller)';

    try {
      await updateStatusMutation.mutateAsync({
        id: quotation.id,
        status: newStatus,
        note: actionNote.trim() || defaultNote,
        actor,
      });

      toast({
        title: 'Status Updated',
        description: `Quotation ${quotation.id} transitioned to ${newStatus.replace(/_/g, ' ')}.`,
        type: 'success',
      });
      setActiveDialog(null);
      setActionNote('');
    } catch {
      toast({
        title: 'Action Failed',
        description: 'Unable to update quotation status.',
        type: 'error',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-slate-200 rounded-md animate-pulse w-1/4" />
        <CardLoadingSkeleton />
        <CardLoadingSkeleton />
      </div>
    );
  }

  if (isError || !quotation) {
    return (
      <ErrorState
        title="Quotation Not Found"
        message={`The requested quotation "${quoteId}" could not be located in the governance store.`}
        onRetry={() => refetch()}
      />
    );
  }

  // Permission Checks based on current status
  const isPendingApproval = quotation.status === 'PENDING_APPROVAL' && quotation.approvalRole === user?.role;
  const isDraft = quotation.status === 'DRAFT' && user?.role === 'SALES_EXECUTIVE';
  const isReturned = ['REVISION_REQUIRED','REJECTED'].includes(quotation.status) && user?.role === 'SALES_EXECUTIVE';
  const isApproved = quotation.status === 'APPROVED' && user?.role === 'SALES_EXECUTIVE';
  const isNegotiation = quotation.status === 'UNDER_NEGOTIATION';
  const isConfirmed = quotation.status === 'CONFIRMED';
  const isRejected = quotation.status === 'REJECTED';

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link href="/quotes">
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs text-slate-600">
              <ArrowLeft className="w-3.5 h-3.5" />
              All Quotes
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-sm font-bold bg-teal-50 text-teal-800 px-2 py-0.5 rounded border border-teal-200">
                {quotation.id}
              </span>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                {quotation.title}
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Prepared for <strong>{quotation.customerName}</strong> • Created{' '}
              {new Date(quotation.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>

        {/* Status & Risk Badges */}
        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          {quotation.requirementId && (
            <Link
              href={`/requirements/${quotation.requirementId}`}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 transition-colors"
            >
              <Inbox className="w-3.5 h-3.5" />
              <span>Originated from {quotation.requirementId}</span>
              <ExternalLink className="w-3 h-3 ml-0.5" />
            </Link>
          )}
          <StatusBadge status={quotation.status} />
          <RiskBadge level={quotation.riskDiagnosis.level} />
        </div>
      </div>

      {/* Approval Lifecycle Stepper */}
      <Card className="bg-white border-slate-200 shadow-enterprise p-4">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 z-0" />
          {steps.map((step, idx) => {
            const isCompleted = idx < currentStepIndex || isConfirmed;
            const isCurrent = idx === currentStepIndex && !isConfirmed && !isRejected;
            const isTerminalReject = isRejected && idx === 1;

            return (
              <div key={step.key} className="relative z-10 flex flex-col items-center">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition ${
                    isTerminalReject
                      ? 'bg-rose-600 text-white ring-4 ring-rose-100'
                      : isCompleted
                      ? 'bg-teal-600 text-white ring-4 ring-teal-50'
                      : isCurrent
                      ? 'bg-amber-500 text-white ring-4 ring-amber-100'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {isTerminalReject ? (
                    <XCircle className="w-4 h-4" />
                  ) : isCompleted ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    idx + 1
                  )}
                </div>
                <span
                  className={`text-[11px] font-semibold mt-1.5 whitespace-nowrap ${
                    isTerminalReject
                      ? 'text-rose-700 font-bold'
                      : isCurrent
                      ? 'text-amber-800 font-bold'
                      : isCompleted
                      ? 'text-teal-900'
                      : 'text-slate-400'
                  }`}
                >
                  {step.label}
                  {isTerminalReject && ' (Rejected)'}
                  {isReturned && isCurrent && ' (Returned)'}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Guarded Operational Action Bar */}
      <div className="bg-slate-900 text-white p-4 rounded-lg shadow-enterprise flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-slate-400 font-medium">Current Workflow Phase</p>
          <p className="text-sm font-bold text-white flex items-center gap-2 mt-0.5">
            {isPendingApproval && '⚠️ Exception Approval Required by Finance Controller'}
            {isDraft && '📝 Draft Mode — Pending Internal Finalization'}
            {isReturned && '↩️ Returned for Concession Restructuring'}
            {isApproved && '✅ Approved — Authorized for Client Dispatch & Agreement'}
            {isNegotiation && '💬 Under Client Negotiation'}
            {isConfirmed && '🔒 Confirmed — Locked & En Route to Fulfillment'}
            {isRejected && '⛔ Rejected by Policy Guard'}
          </p>
        </div>

        {/* Dynamic State Machine Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Submit for Approval (Draft or Returned) */}
          {(isDraft || isReturned) && (
            <Button
              onClick={() => setActiveDialog('SUBMIT')}
              className="bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-xs gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Submit for Approval
            </Button>
          )}

          {/* Pending Approval Actions */}
          {isPendingApproval && (
            <>
              <Button
                onClick={() => setActiveDialog('APPROVE')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                Approve Deal
              </Button>
              <Button
                onClick={() => setActiveDialog('RETURN')}
                variant="outline"
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs font-semibold gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Return for Revision
              </Button>
              <Button
                onClick={() => setActiveDialog('REJECT')}
                className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-xs gap-1.5"
              >
                <Ban className="w-3.5 h-3.5" />
                Reject Deal
              </Button>
            </>
          )}

          {/* Approved Actions */}
          {isApproved && (
            <>
              <Button
                onClick={() => setActiveDialog('SEND')}
                className="bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-xs gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                Send to Customer
              </Button>
              <Button
                onClick={() => setActiveDialog('CONFIRM')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Confirm Quotation
              </Button>
            </>
          )}

          {/* Negotiation Actions */}
          {isNegotiation && (
            <>
              <Button
                onClick={() => setActiveDialog('SUBMIT_REAPPROVAL')}
                className="bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-xs gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Submit for Approval
              </Button>
              <Link href={`/portal/quotations/${quotation.id}`}>
                <Button
                  variant="outline"
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs font-semibold gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Open Negotiation Room
                </Button>
              </Link>
              <Button
                onClick={() => setActiveDialog('CONFIRM')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Confirm Terms
              </Button>
            </>
          )}

          {/* Confirmed */}
          {isConfirmed && (
            <span className="text-xs bg-emerald-950 text-emerald-300 px-3 py-1.5 rounded font-semibold border border-emerald-800">
              ✓ Deal Confirmed & Handed Off
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Customer Summary, Line Items Variance, & Audit Trail */}
        <div className="lg:col-span-8 space-y-6">
          {/* Customer Summary Card */}
          <Card className="bg-white border-slate-200 shadow-enterprise">
            <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-teal-600" />
                Commercial Account Information
              </CardTitle>
              <TierBadge tier={quotation.customerTier} />
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block">Customer Account:</span>
                <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                  {quotation.customerName}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Price Schedule:</span>
                <span className="font-semibold text-slate-800 mt-0.5 block">
                  {quotation.priceList || 'Standard Commercial 2026'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Assigned AE / Owner:</span>
                <span className="font-semibold text-slate-800 mt-0.5 block">
                  {quotation.owner || 'Marcus Vance'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Delivery Target SLA:</span>
                <span className="font-semibold text-slate-800 mt-0.5 block font-mono">
                  {quotation.deliveryDate || '2026-10-15'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Line Items & Discount Variance Table */}
          <Card className="bg-white border-slate-200 shadow-enterprise overflow-hidden">
            <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-teal-600" />
                  Line-by-Line Policy Variance Evaluation
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Effective discount limit evaluated against min(Customer Tier, Product Category).
                </p>
              </div>
              <span className="text-xs text-slate-600 font-medium font-mono">
                {quotation.items.length} Line Item{quotation.items.length === 1 ? '' : 's'}
              </span>
            </CardHeader>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 text-[11px] font-semibold text-slate-600">
                    <TableHead>Product / Description</TableHead>
                    <TableHead className="w-16 text-center">Qty</TableHead>
                    <TableHead className="w-24 text-right">Unit Price</TableHead>
                    <TableHead className="w-24 text-center">Discount</TableHead>
                    <TableHead className="w-24 text-center">Allowed</TableHead>
                    <TableHead className="w-32 text-center">Variance</TableHead>
                    <TableHead className="w-28 text-center">Status</TableHead>
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
                        className={`hover:bg-slate-50/70 border-b border-slate-100 ${
                          isViolation ? 'bg-amber-50/40' : ''
                        }`}
                      >
                        {/* Product */}
                        <TableCell>
                          <p className="font-semibold text-slate-900 text-xs">{item.productName}</p>
                          <span className="text-[10px] text-slate-400">
                            Category: {item.category} (Limit: {item.category === 'Hardware' ? '15%' : '10%'})
                          </span>
                        </TableCell>

                        {/* Quantity */}
                        <TableCell className="text-center font-medium text-xs">
                          {item.quantity}
                        </TableCell>

                        {/* Unit Price */}
                        <TableCell className="text-right font-mono text-xs text-slate-700">
                          {formatCurrency(item.unitPrice)}
                        </TableCell>

                        {/* Discount */}
                        <TableCell className="text-center font-bold text-xs text-slate-900 font-mono">
                          {formatPercent(item.discountPercent)}
                        </TableCell>

                        {/* Allowed */}
                        <TableCell className="text-center font-medium text-xs text-slate-600 font-mono">
                          {item.effectiveLimit}%
                        </TableCell>

                        {/* Variance */}
                        <TableCell className="text-center">
                          {isViolation ? (
                            <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold text-rose-800 bg-rose-100 border border-rose-200">
                              +{excess}% over limit
                            </span>
                          ) : (
                            <span className="text-[11px] font-medium text-emerald-700">
                              Compliant
                            </span>
                          )}
                        </TableCell>

                        {/* Status */}
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
                        <TableCell className="text-right font-mono font-bold text-xs text-slate-900">
                          {formatCurrency(item.lineTotal)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* Activity & Audit Timeline */}
          <Card className="bg-white border-slate-200 shadow-enterprise">
            <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <History className="w-4 h-4 text-teal-600" />
                Governance Audit Trail & Activity Log
              </CardTitle>
              <span className="text-xs text-slate-500">Immutable Ledger</span>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-4">
                {quotation.auditTrail.map((entry, idx) => (
                  <div key={entry.id || idx} className="flex gap-3 text-xs">
                    <div className="w-2 h-2 rounded-full bg-teal-500 mt-1.5 shrink-0 ring-4 ring-teal-50" />
                    <div className="flex-1 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{entry.action}</span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {new Date(entry.timestamp).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-slate-600">{entry.details}</p>
                      <p className="text-[10px] text-slate-400 font-medium">Actor: {entry.actor}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Financial Totals & Governance Risk Diagnosis */}
        <div className="lg:col-span-4 space-y-6">
          {/* Financial Totals */}
          <Card className="bg-white border-slate-200 shadow-enterprise">
            <CardHeader className="p-4 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900">
                Financial Settlement Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between text-xs text-slate-600">
                <span>Gross List Subtotal:</span>
                <span className="font-semibold text-slate-900 font-mono">
                  {formatCurrency(quotation.subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-xs text-amber-700">
                <span>Applied Discount:</span>
                <span className="font-semibold font-mono">
                  -{formatCurrency(quotation.totalDiscountAmount)}
                </span>
              </div>
              <div className="h-px bg-slate-200 my-2" />
              <div className="flex justify-between items-baseline">
                <span className="text-sm font-bold text-slate-900">Net Grand Total:</span>
                <span className="text-xl font-extrabold text-teal-700 font-mono">
                  {formatCurrency(quotation.grandTotal)}
                </span>
              </div>

              {/* Deal Health Meter */}
              <div className="pt-3 border-t border-slate-100">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-semibold text-slate-700">Deal Health Score:</span>
                  <span className="font-bold text-slate-900 font-mono">
                    {quotation.dealHealthScore || 90} / 100
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      (quotation.dealHealthScore || 90) >= 80
                        ? 'bg-emerald-500'
                        : (quotation.dealHealthScore || 90) >= 50
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${quotation.dealHealthScore || 90}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Why Is This Quotation Risky? Governance Diagnosis */}
          <Card className={`border shadow-enterprise ${
            quotation.riskDiagnosis.level === 'LOW'
              ? 'bg-emerald-50/40 border-emerald-200'
              : quotation.riskDiagnosis.level === 'MEDIUM'
              ? 'bg-amber-50/40 border-amber-200'
              : 'bg-rose-50/40 border-rose-300'
          }`}>
            <CardHeader className="p-4 pb-2 border-b border-slate-200/60 flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                <ShieldAlert className="w-4 h-4 text-slate-700" />
                Risk Diagnosis
              </CardTitle>
              <RiskBadge level={quotation.riskDiagnosis.level} />
            </CardHeader>
            <CardContent className="p-4 space-y-3.5 text-xs">
              <div>
                <p className="font-bold text-slate-900">1. What happened?</p>
                <p className="text-slate-700 mt-0.5 leading-relaxed">
                  {quotation.riskDiagnosis.whatHappened}
                </p>
              </div>

              <div>
                <p className="font-bold text-slate-900">2. Why does it matter?</p>
                <p className="text-slate-700 mt-0.5 leading-relaxed">
                  {quotation.riskDiagnosis.whyItMatters}
                </p>
              </div>

              <div>
                <p className="font-bold text-slate-900">3. What should you do next?</p>
                <p className="text-slate-800 font-semibold mt-0.5 leading-relaxed">
                  {quotation.riskDiagnosis.nextAction}
                </p>
              </div>

              {quotation.riskDiagnosis.requiresFinanceApproval && (
                <div className="p-2.5 rounded-md bg-rose-100 border border-rose-200 text-rose-900 text-[11px] font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>
                    Formal Finance Controller override sign-off is mandatory before quotation confirmation.
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Notes Card */}
          {quotation.notes && (
            <Card className="bg-white border-slate-200 shadow-enterprise p-4">
              <CardTitle className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                Procurement Notes
              </CardTitle>
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded border border-slate-200">
                {quotation.notes}
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* Confirmation & Transition Action Dialogs */}
      {activeDialog && (
        <Dialog
          open={Boolean(activeDialog)}
          onOpenChange={(open) => !open && setActiveDialog(null)}
        >
          <DialogHeader>
            <DialogTitle>
              {activeDialog === 'APPROVE'
                ? 'Approve Commercial Quotation'
                : activeDialog === 'REJECT'
                ? 'Reject Quotation'
                : activeDialog === 'RETURN'
                ? 'Return Quotation for Revision'
                : activeDialog === 'SUBMIT'
                ? 'Submit Quotation for Approval'
                : activeDialog === 'SUBMIT_REAPPROVAL'
                ? 'Submit Negotiated Quotation for Approval'
                : activeDialog === 'SEND'
                ? 'Send Quotation to Client'
                : 'Confirm & Lock Quotation'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-xs">
            <p className="text-slate-600">
              {activeDialog === 'APPROVE' &&
                'Are you sure you want to approve this deal? Any line item discount exceptions will be cleared under your credentials.'}
              {activeDialog === 'REJECT' &&
                'Are you sure you want to reject this quotation? The quotation will be permanently marked as rejected.'}
              {activeDialog === 'RETURN' &&
                'Please specify the terms to be modified before returning to the account executive.'}
              {activeDialog === 'SUBMIT' &&
                'Submit this quotation into the approval workflow. Deals with discount exceptions will automatically escalate to Finance.'}
              {activeDialog === 'SUBMIT_REAPPROVAL' &&
                'Submit this counter-offer proposal for commercial and finance re-approval. The deal terms will be evaluated against margin and policy rules.'}
              {activeDialog === 'SEND' &&
                'Deliver this quotation to the procurement contact. The status will transition to Negotiation.'}
              {activeDialog === 'CONFIRM' &&
                'Final confirmation locks all pricing terms and triggers downstream fulfillment order creation.'}
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Audit Trail Note (Optional)
              </label>
              <Input
                placeholder="Add contextual remarks for the audit record..."
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveDialog(null)}
                disabled={isProcessing}
              >
                Cancel
              </Button>

              {activeDialog === 'APPROVE' && (
                <Button
                  size="sm"
                  onClick={() =>
                    handleExecuteTransition('APPROVED', 'Quotation approved by commercial approver.')
                  }
                  loading={isProcessing}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                >
                  Approve Deal
                </Button>
              )}

              {activeDialog === 'REJECT' && (
                <Button
                  size="sm"
                  onClick={() =>
                    handleExecuteTransition('REJECTED', 'Quotation rejected due to policy breach.')
                  }
                  loading={isProcessing}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-semibold"
                >
                  Reject Deal
                </Button>
              )}

              {activeDialog === 'RETURN' && (
                <Button
                  size="sm"
                  onClick={() =>
                    handleExecuteTransition(
                      'REVISION_REQUIRED',
                      'Returned to AE for margin concession restructuring.'
                    )
                  }
                  loading={isProcessing}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                >
                  Return to Rep
                </Button>
              )}

              {activeDialog === 'SUBMIT' && (
                <Button
                  size="sm"
                  onClick={() => {
                    const nextStatus = quotation.riskDiagnosis.requiresFinanceApproval
                      ? 'PENDING_APPROVAL'
                      : 'APPROVED';
                    handleExecuteTransition(
                      nextStatus,
                      nextStatus === 'PENDING_APPROVAL'
                        ? 'Submitted for Finance approval due to policy exception.'
                        : 'Submitted and cleared automatically.'
                    );
                  }}
                  loading={isProcessing}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-semibold"
                >
                  Confirm Submission
                </Button>
              )}

              {activeDialog === 'SUBMIT_REAPPROVAL' && (
                <Button
                  size="sm"
                  onClick={() =>
                    handleExecuteTransition(
                      'PENDING_APPROVAL',
                      actionNote || 'Submitted counter-offer terms for approval re-evaluation.'
                    )
                  }
                  loading={isProcessing}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-semibold"
                >
                  Submit for Approval
                </Button>
              )}

              {activeDialog === 'SEND' && (
                <Button
                  size="sm"
                  onClick={() =>
                    handleExecuteTransition(
                      'SENT',
                      'Quotation dispatched to procurement client.'
                    )
                  }
                  loading={isProcessing}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-semibold"
                >
                  Send Proposal
                </Button>
              )}

              {activeDialog === 'CONFIRM' && (
                <Button
                  size="sm"
                  onClick={() =>
                    handleExecuteTransition(
                      'CONFIRMED',
                      'Customer accepted quotation terms. Deal confirmed.'
                    )
                  }
                  loading={isProcessing}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-semibold"
                >
                  Confirm Quotation
                </Button>
              )}
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
