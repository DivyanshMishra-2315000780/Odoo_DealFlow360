'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Building,
  Calendar,
  Truck,
  Clock,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Sparkles,
  Send,
  Lock,
  DollarSign,
  FileCheck,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge, RiskBadge } from '@/components/ui/status-badge';
import { TierBadge } from '@/components/ui/tier-badge';
import { useQuotations, useUpdateQuotationStatus } from '@/hooks/use-dealflow';
import { useToast } from '@/components/providers/query-provider';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { calculateEffectiveDiscountLimit } from '@/lib/discount-engine';

export default function CustomerQuotationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: quotations = [], isLoading } = useQuotations();
  const updateQuotationStatus = useUpdateQuotationStatus();
  const { toast } = useToast();

  const quotationId = typeof params?.id === 'string' ? params.id : 'Q-1042';
  const quotation = quotations.find((q) => q.id === quotationId) || quotations[0];

  // Negotiation form state
  const [comment, setComment] = useState('');
  const [requestedDiscount, setRequestedDiscount] = useState<number>(14);
  const [requestedDeliveryDate, setRequestedDeliveryDate] = useState('2026-09-18');
  const [isSubmittingNegotiation, setIsSubmittingNegotiation] = useState(false);

  if (!quotation) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-sm text-slate-500">Quotation not found.</p>
        <Link href="/portal/quotations">
          <Button variant="outline" size="sm">Back to Quotations</Button>
        </Link>
      </div>
    );
  }

  // Calculate if the requested negotiation discount exceeds limits
  const customerTier = quotation.customerTier;
  const maxCategoryLimit = Math.max(
    ...quotation.items.map((i) => calculateEffectiveDiscountLimit(customerTier, i.category))
  );
  const isOverLimit = requestedDiscount > maxCategoryLimit;
  const excess = isOverLimit ? requestedDiscount - maxCategoryLimit : 0;

  // Confirmation guard: only allowed if status is APPROVED
  const canConfirm = quotation.status === 'APPROVED';

  // Handle Negotiation Submission
  const handleSubmitNegotiation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      toast({
        title: 'Comment Required',
        description: 'Please add a note explaining your counter-proposal.',
        type: 'warning',
      });
      return;
    }

    setIsSubmittingNegotiation(true);
    try {
      const noteDetails = `Client Counter-Proposal: Requested ${requestedDiscount}% discount (Allowed max: ${maxCategoryLimit}%). Target delivery: ${requestedDeliveryDate}. Note: "${comment.trim()}"`;
      await updateQuotationStatus.mutateAsync({
        id: quotation.id,
        status: isOverLimit ? 'PENDING_FINANCE_APPROVAL' : 'IN_NEGOTIATION',
        note: noteDetails,
        actor: `${quotation.customerName} (Client Procurement)`,
      });

      toast({
        title: 'Negotiation Submitted',
        description: isOverLimit
          ? 'Counter-offer exceeds permitted discount ceiling. Additional finance approval required.'
          : 'Your terms have been sent to Marcus Vance for review.',
        type: isOverLimit ? 'warning' : 'success',
      });
      setComment('');
    } catch {
      toast({
        title: 'Submission Failed',
        type: 'error',
      });
    } finally {
      setIsSubmittingNegotiation(false);
    }
  };

  // Handle Official Confirmation
  const handleConfirmQuotation = async () => {
    if (!canConfirm) return;
    try {
      await updateQuotationStatus.mutateAsync({
        id: quotation.id,
        status: 'CONFIRMED',
        note: 'Customer confirmed and bound terms via Client Portal.',
        actor: `${quotation.customerName} (Client Signatory)`,
      });
      toast({
        title: 'Quotation Confirmed!',
        description: `${quotation.id} accepted. Order moved to Fulfillment and Invoice generation.`,
        type: 'success',
      });
    } catch {
      toast({
        title: 'Confirmation Failed',
        type: 'error',
      });
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Back link & Actions */}
      <div className="flex items-center justify-between">
        <Link
          href="/portal/quotations"
          className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to My Quotations
        </Link>
        <span className="text-xs text-slate-400 font-mono">Deal ID: {quotation.id}</span>
      </div>

      {/* Hero Header Card */}
      <div className="p-6 rounded-lg bg-white border border-slate-200 shadow-enterprise">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-mono font-bold text-lg text-slate-900">{quotation.id}</span>
              <span className="text-slate-300">•</span>
              <StatusBadge status={quotation.status} />
              <TierBadge tier={quotation.customerTier} size="sm" showLimitNotice />
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1.5">{quotation.title}</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Prepared for <strong>{quotation.customerName}</strong> • Account Executive: Marcus Vance
            </p>
          </div>

          <div className="text-left md:text-right bg-slate-50 md:bg-transparent p-3 md:p-0 rounded-md border md:border-0 border-slate-200">
            <span className="text-xs text-slate-400 uppercase tracking-wider block">
              Net Contracted Total
            </span>
            <span className="text-2xl font-bold font-mono text-teal-700">
              {formatCurrency(quotation.grandTotal)}
            </span>
            <span className="text-[11px] text-slate-500 block">
              Includes -{formatCurrency(quotation.totalDiscountAmount)} negotiated discount
            </span>
          </div>
        </div>

        {/* 4 Metadata Callouts */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-5 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2.5 text-slate-600">
            <Calendar className="w-4 h-4 text-slate-400" />
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Validity Period</span>
              <span className="font-semibold text-slate-800">Valid until Sept 30, 2026</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-slate-600">
            <Truck className="w-4 h-4 text-teal-600" />
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Delivery SLA</span>
              <span className="font-semibold text-slate-800">FedEx Freight Priority (3-5 Days)</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-slate-600">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Approval Status</span>
              <span className="font-semibold text-slate-800">
                {quotation.status === 'APPROVED'
                  ? 'Finance Approved'
                  : quotation.status === 'CONFIRMED'
                  ? 'Confirmed & Binding'
                  : 'Awaiting Finance Review'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content: Line Items (Left) + Negotiation Panel (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Line Items & Pricing Breakdown */}
        <div className="lg:col-span-7 space-y-6">
          <Card>
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-sm uppercase tracking-wider text-slate-800">
                Contract Line Items & Pricing
              </CardTitle>
              <CardDescription>
                Detailed itemization of hardware hardware endpoints and enterprise services.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product / Description</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Discount</TableHead>
                    <TableHead className="text-right">Net Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quotation.items.map((item) => (
                    <TableRow key={item.id} className={item.isViolation ? 'bg-amber-50/40' : undefined}>
                      <TableCell>
                        <span className="font-semibold text-slate-900 block text-xs">
                          {item.productName}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {item.category} • SKU: {item.productId}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono text-slate-600">
                        {formatCurrency(item.unitPrice)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-slate-600">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold">
                        <span className={item.isViolation ? 'text-amber-700 font-bold' : 'text-slate-800'}>
                          {formatPercent(item.discountPercent)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-slate-900">
                        {formatCurrency(item.lineTotal)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>

            {/* Total summary */}
            <CardFooter className="p-5 border-t border-slate-200 bg-slate-50/50 flex flex-col items-end space-y-1 text-xs">
              <div className="flex justify-between w-48 text-slate-500">
                <span>Gross Subtotal:</span>
                <span className="font-mono">{formatCurrency(quotation.subtotal)}</span>
              </div>
              <div className="flex justify-between w-48 text-slate-600 font-medium">
                <span>Applied Discount:</span>
                <span className="font-mono text-rose-600">-{formatCurrency(quotation.totalDiscountAmount)}</span>
              </div>
              <div className="flex justify-between w-48 text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>Final Net Total:</span>
                <span className="font-mono text-base text-teal-700">
                  {formatCurrency(quotation.grandTotal)}
                </span>
              </div>
            </CardFooter>
          </Card>

          {/* Policy Context Callout */}
          <div className="p-4 rounded-lg border border-slate-200 bg-white text-xs space-y-2">
            <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] block">
              Enterprise Governance Notice
            </span>
            <p className="text-slate-600 leading-relaxed">
              DealFlow360 guarantees price transparency. Hardware items permit up to 15% discount for Gold tier accounts. Turnkey integration services are governed under strict 10% delivery margin limits.
            </p>
          </div>
        </div>

        {/* Right: Negotiation Side Panel & Confirmation Guard */}
        <div className="lg:col-span-5 space-y-6">
          {/* Confirmation Guard Card */}
          <Card className={canConfirm ? 'border-teal-300 bg-teal-50/20 shadow-enterprise' : 'border-slate-200'}>
            <CardHeader className="p-5 pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm uppercase tracking-wider flex items-center gap-1.5 text-slate-800">
                  <FileCheck className="w-4 h-4 text-teal-600" />
                  Contract Execution
                </CardTitle>
                <StatusBadge status={quotation.status} />
              </div>
            </CardHeader>
            <CardContent className="p-5 pt-1 space-y-3">
              {canConfirm ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Terms Approved & Ready to Confirm</p>
                      <p className="text-slate-600 text-[11px] mt-0.5">
                        Finance and commercial sign-offs cleared. You can now execute this binding order.
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="default"
                    size="lg"
                    onClick={handleConfirmQuotation}
                    loading={updateQuotationStatus.isPending}
                    className="w-full text-xs font-semibold shadow-enterprise"
                  >
                    Confirm & Accept Quotation
                  </Button>
                </div>
              ) : quotation.status === 'CONFIRMED' ? (
                <div className="p-3 rounded-md bg-teal-50 border border-teal-200 text-teal-900 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  <span className="font-semibold">Quotation Confirmed & Binding</span>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 rounded-md bg-amber-50 border border-amber-200 text-amber-950 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <Lock className="w-3.5 h-3.5 text-amber-700" />
                      <span>Confirmation Locked</span>
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      Cannot confirm quotation while awaiting finance approval. You may submit a counter-proposal below or wait for sign-off.
                    </p>
                  </div>
                  <Button
                    disabled
                    variant="secondary"
                    size="lg"
                    className="w-full text-xs opacity-60 cursor-not-allowed"
                  >
                    <Lock className="w-3.5 h-3.5 mr-1" />
                    Acceptance Locked (Pending Approval)
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Interactive Negotiation Drawer / Card */}
          <Card className="border-slate-200 shadow-enterprise">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-sm uppercase tracking-wider flex items-center gap-2 text-slate-800">
                <MessageSquare className="w-4 h-4 text-teal-600" />
                Submit Counter-Offer & Negotiation
              </CardTitle>
              <CardDescription>
                Request custom discounts or adjusted delivery timetables.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-3">
              <form onSubmit={handleSubmitNegotiation} className="space-y-4 text-xs">
                {/* Proposed Discount % Slider */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="font-semibold text-slate-700">
                      Requested Discount %
                    </label>
                    <span className="font-mono font-bold text-xs text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                      {requestedDiscount}% (Policy Max: {maxCategoryLimit}%)
                    </span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="25"
                    step="1"
                    value={requestedDiscount}
                    onChange={(e) => setRequestedDiscount(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                  />
                </div>

                {/* POLICY ALERT: Additional Approval Required */}
                {isOverLimit && (
                  <div className="p-3 rounded-lg border border-amber-300 bg-amber-50 text-amber-950 space-y-1 shadow-2xs">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-amber-900">
                      <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                      <span>Additional approval required</span>
                    </div>
                    <p className="text-[11px] text-slate-700 leading-relaxed">
                      Your requested discount of <strong>{requestedDiscount}%</strong> exceeds your permitted {customerTier} category ceiling ({maxCategoryLimit}%) by <strong>+{excess}%</strong>.
                    </p>
                    <p className="text-[10px] text-amber-800 italic pt-0.5">
                      Submitting this request will escalate the quotation to the Finance Controller for review.
                    </p>
                  </div>
                )}

                {/* Requested Delivery Date */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Requested Target Delivery Date
                  </label>
                  <Input
                    type="date"
                    value={requestedDeliveryDate}
                    onChange={(e) => setRequestedDeliveryDate(e.target.value)}
                    required
                  />
                </div>

                {/* Negotiation Comment / Notes */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Procurement Comments / Justification
                  </label>
                  <textarea
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="e.g. We are ready to execute if hardware can be expedited by next Friday."
                    className="w-full rounded-md border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder:text-slate-400"
                    required
                  />
                </div>

                {/* Submit Action */}
                <Button
                  type="submit"
                  variant="default"
                  size="md"
                  loading={isSubmittingNegotiation}
                  className="w-full text-xs font-semibold gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  Submit Negotiation Request
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
