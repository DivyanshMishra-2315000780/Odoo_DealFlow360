'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowLeft,
  FileText,
  Truck,
  ShieldCheck,
  Download,
  Printer,
  Building,
  DollarSign,
  AlertCircle,
  Calendar,
  Lock,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { StatusBadge } from '@/components/ui/status-badge';
import { TierBadge } from '@/components/ui/tier-badge';
import { CardLoadingSkeleton } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { useInvoice, useRecordInvoicePayment } from '@/hooks/use-dealflow';
import { useToast } from '@/components/providers/query-provider';
import { formatCurrency } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { InvoiceLifecycleStage, ChargeType } from '@/types/dealflow';

interface InvoiceDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function InvoiceDetailPage({ params }: InvoiceDetailPageProps) {
  const resolvedParams = use(params);
  const invoiceId = resolvedParams.id;

  const { data: invoice, isLoading, error } = useInvoice(invoiceId);
  const recordPayment = useRecordInvoicePayment();
  const {user}=useAuth();
  const { toast } = useToast();

  // Payment Dialog State
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('ACH Wire Transfer');
  const [paymentReference, setPaymentReference] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-6 pb-12">
        <div className="h-8 w-48 bg-slate-200 animate-pulse rounded" />
        <CardLoadingSkeleton />
        <CardLoadingSkeleton />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="py-12">
        <ErrorState
          title="Invoice Not Found"
          message={`Could not find invoice with ID ${invoiceId}. It may have been archived or removed.`}
        />
        <div className="mt-4 text-center">
          <Link href="/invoices">
            <Button variant="outline">Return to Invoices</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isPreShipmentLocked = !invoice.isShipped;
  const isFullySettled = invoice.status === 'PAID';
  const remaining = invoice.remainingAmount ?? (invoice.amount - (invoice.paidAmount || 0));

  // Open payment dialog with prefilled balance
  const handleOpenPaymentDialog = () => {
    if (isPreShipmentLocked) return;
    setPaymentAmount(remaining.toString());
    setPaymentReference(`PMT-${Date.now().toString().slice(-6)}`);
    setIsPaymentDialogOpen(true);
  };

  const handleRecordPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(paymentAmount);

    if (isNaN(amountNum) || amountNum <= 0) {
      toast({
        title: 'Invalid Payment Amount',
        description: 'Please enter a valid payment amount greater than zero.',
        type: 'error',
      });
      return;
    }

    if (amountNum > remaining) {
      toast({
        title: 'Amount Exceeds Balance',
        description: `Payment cannot exceed the outstanding balance of ${formatCurrency(remaining)}.`,
        type: 'error',
      });
      return;
    }

    if (!paymentReference.trim()) {
      toast({
        title: 'Reference Required',
        description: 'Please specify a transaction or settlement reference number.',
        type: 'error',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = await recordPayment.mutateAsync({
        id: invoice.id,
        amount: amountNum,
        paymentMethod,
        paymentReference: paymentReference.trim(),
      });

      setIsPaymentDialogOpen(false);
      toast({
        title: 'Payment Recorded Successfully',
        description: `Collected ${formatCurrency(amountNum)} for ${invoice.id}. New status: ${updated.paymentStatus.replace(/_/g, ' ')}.`,
        type: 'success',
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to record payment.';
      toast({
        title: 'Payment Processing Failed',
        description: message,
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Lifecycle steps: Order Confirmed -> Shipped -> Invoiced -> Paid
  const lifecycleStages: { key: InvoiceLifecycleStage; label: string; desc: string }[] = [
    { key: 'ORDER_CONFIRMED', label: 'Order Confirmed', desc: 'Commercial contract signed' },
    { key: 'SHIPPED', label: 'Shipped', desc: 'Carrier dispatch verified' },
    { key: 'INVOICED', label: 'Invoiced', desc: 'Billing statement issued' },
    { key: 'PAID', label: 'Paid', desc: 'Funds settled in ledger' },
  ];

  const getStageIndex = (stage: InvoiceLifecycleStage): number => {
    switch (stage) {
      case 'ORDER_CONFIRMED':
        return 0;
      case 'SHIPPED':
        return 1;
      case 'INVOICED':
        return 2;
      case 'PAID':
        return 3;
      default:
        return 0;
    }
  };

  const currentStageIndex = getStageIndex(invoice.lifecycleStage);

  // Separate one-time vs recurring charges
  const oneTimeCharges = invoice.items.filter((item) => item.chargeType === 'ONE_TIME');
  const recurringCharges = invoice.items.filter((item) => item.chargeType === 'RECURRING');

  return (
    <div className="space-y-6 pb-12">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <Link href="/invoices">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-lg font-bold text-slate-900">
                {invoice.id}
              </span>
              <StatusBadge status={invoice.status} />
              <TierBadge tier={invoice.customerTier} />
              {isPreShipmentLocked && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-300">
                  <Lock className="w-3 h-3 text-amber-600" />
                  Pre-Shipment Lock
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Issued for <span className="font-medium text-slate-900">{invoice.customerName}</span> • Related to quote{' '}
              <Link href={`/quotes/${invoice.quotationId}`} className="font-mono text-teal-700 hover:underline">
                {invoice.quotationId}
              </Link>
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            className="text-xs gap-1.5"
            onClick={() => {
              toast({
                title: 'Generating PDF Statement',
                description: `Invoice ${invoice.id} exported with digital seal.`,
                type: 'info',
              });
            }}
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            Print / PDF
          </Button>

          {/* Record Payment Button */}
          <Button
            size="sm"
            className="text-xs gap-1.5 bg-teal-600 hover:bg-teal-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isPreShipmentLocked || isFullySettled}
            onClick={handleOpenPaymentDialog}
          >
            <CreditCard className="w-3.5 h-3.5" />
            {isFullySettled
              ? 'Invoice Fully Settled'
              : isPreShipmentLocked
              ? 'Payment Locked (Pre-Shipment)'
              : 'Record Payment'}
          </Button>
        </div>
      </div>

      {/* 4-Stage Lifecycle Stepper */}
      <Card>
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-600" />
              Invoice Lifecycle State Machine
            </CardTitle>
            <span className="text-xs text-slate-500 font-mono">
              Stage {currentStageIndex + 1} of 4: {lifecycleStages[currentStageIndex].label}
            </span>
          </div>
        </CardHeader>
        <CardContent className="pt-4 pb-5">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {lifecycleStages.map((stage, idx) => {
              const isCompleted = idx < currentStageIndex;
              const isCurrent = idx === currentStageIndex;
              const isPending = idx > currentStageIndex;

              return (
                <div
                  key={stage.key}
                  className={`relative p-3.5 rounded-lg border transition-all ${
                    isCurrent
                      ? 'bg-teal-50/70 border-teal-500 ring-2 ring-teal-500/20 shadow-xs'
                      : isCompleted
                      ? 'bg-emerald-50/50 border-emerald-300'
                      : 'bg-slate-50/50 border-slate-200 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-[11px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        isCurrent
                          ? 'bg-teal-600 text-white'
                          : isCompleted
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      0{idx + 1}
                    </span>
                    {isCompleted && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    {isCurrent && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-100 px-2 py-0.5 rounded-full animate-pulse">
                        Active State
                      </span>
                    )}
                  </div>
                  <h4
                    className={`text-xs font-bold ${
                      isCurrent ? 'text-teal-900' : isCompleted ? 'text-emerald-900' : 'text-slate-700'
                    }`}
                  >
                    {stage.label}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">{stage.desc}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* IMPORTANT BUSINESS RULE: Pre-Shipment Payment Lock Alert */}
      {isPreShipmentLocked && (
        <div className="p-4 rounded-lg bg-amber-50 border-2 border-amber-300 shadow-2xs">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-md bg-amber-100 text-amber-800 shrink-0 mt-0.5">
              <Lock className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-amber-950 flex items-center gap-2">
                Mandatory Commercial Governance Rule: Invoicing Locked Before Shipment
              </h4>
              <p className="text-xs text-amber-900 leading-relaxed">
                DealFlow360 commercial governance policy strictly prohibits collecting or recording invoice payments before hardware assets and bill of materials have received carrier dispatch confirmation.
              </p>
              <div className="pt-2 flex items-center gap-3">
                <Link href={`/fulfillment`}>
                  <Button size="sm" variant="outline" className="text-xs border-amber-400 bg-white text-amber-900 hover:bg-amber-100">
                    <Truck className="w-3.5 h-3.5 mr-1" />
                    Inspect Warehouse Dispatch Status
                  </Button>
                </Link>
                <span className="text-[11px] text-amber-800 italic">
                  Payment button is locked until shipment is verified.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Partial Delivery Invoicing Callout */}
      {invoice.isPartialDelivery && (
        <div className="p-4 rounded-lg bg-sky-50 border-2 border-sky-300 shadow-2xs">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-md bg-sky-100 text-sky-800 shrink-0 mt-0.5">
              <Truck className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-sky-950 flex items-center gap-2">
                Partial Delivery Billing Active
              </h4>
              <p className="text-xs text-sky-900 leading-relaxed">
                {invoice.partialDeliveryNotes ||
                  'This invoice reflects partial order fulfillment. Line items represent verified delivered equipment batches; residual quantities will be invoiced upon subsequent dispatch.'}
              </p>
              <div className="pt-1 flex items-center gap-3 text-xs text-sky-800 font-mono">
                <span>Paid to Date: {formatCurrency(invoice.paidAmount)}</span>
                <span>•</span>
                <span>Remaining: {formatCurrency(remaining)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Invoice Sheet (Enterprise Billing Statement Layout) */}
      <Card className="overflow-hidden border-slate-300 shadow-sm">
        {/* Invoice Statement Header */}
        <div className="p-6 bg-slate-900 text-white">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-teal-400 font-bold tracking-tight text-lg">DEALFLOW360</span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">REVENUE OPS</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Enterprise Quotation & Commercial Deal Governance
              </p>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Tax ID: US-EIN-884920194 • One Market Plaza, Ste 400, San Francisco, CA
              </p>
            </div>

            <div className="text-left sm:text-right">
              <h2 className="text-2xl font-bold font-mono text-white tracking-tight">COMMERCIAL INVOICE</h2>
              <p className="text-sm font-mono text-teal-400 font-semibold mt-0.5">{invoice.id}</p>
              <div className="mt-2 text-xs text-slate-300 space-y-0.5 font-mono">
                <p>Issue Date: {invoice.issueDate}</p>
                <p className="text-amber-400 font-bold">Due Date: {invoice.dueDate}</p>
                <p>Terms: Net 30 Days</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bill To & Deal Context Grid */}
        <div className="p-6 bg-slate-50/60 border-b border-slate-200">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Bill To */}
            <div>
              <span className="text-[11px] uppercase font-bold text-slate-500 tracking-wider">
                Billed Account
              </span>
              <h3 className="text-sm font-bold text-slate-900 mt-1">{invoice.customerName}</h3>
              <div className="mt-1">
                <TierBadge tier={invoice.customerTier} />
              </div>
              <p className="text-xs text-slate-500 mt-1 font-mono">
                Account ID: {invoice.customerId || 'CUST-ENTERPRISE'}
              </p>
            </div>

            {/* Related Order / Contract */}
            <div>
              <span className="text-[11px] uppercase font-bold text-slate-500 tracking-wider">
                Commercial Contract
              </span>
              <div className="mt-1 flex items-center gap-1.5">
                <Link
                  href={`/quotes/${invoice.quotationId}`}
                  className="text-sm font-bold font-mono text-teal-700 hover:underline flex items-center gap-1"
                >
                  <FileText className="w-3.5 h-3.5" />
                  {invoice.quotationId}
                </Link>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Approved Commercial Quotation
              </p>
            </div>

            {/* Shipment & Payment Status */}
            <div>
              <span className="text-[11px] uppercase font-bold text-slate-500 tracking-wider">
                Shipment & Payment Standing
              </span>
              <div className="mt-1 flex items-center gap-2 flex-wrap">
                <StatusBadge status={invoice.status} />
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    invoice.paymentStatus === 'PAID'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : invoice.paymentStatus === 'PARTIALLY_PAID'
                      ? 'bg-sky-50 text-sky-800 border border-sky-200'
                      : 'bg-slate-100 text-slate-800 border border-slate-300'
                  }`}
                >
                  Payment: {invoice.paymentStatus.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Shipment: <span className="font-semibold text-slate-800">{invoice.shipmentStatus.replace(/_/g, ' ')}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Line Items Section */}
        <div className="p-6 space-y-6">
          {/* One-Time Charges */}
          {oneTimeCharges.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-teal-600" />
                  One-Time Charges (Hardware & Professional Services)
                </h4>
                <span className="text-xs text-slate-500 font-mono">
                  {oneTimeCharges.length} item{oneTimeCharges.length > 1 ? 's' : ''}
                </span>
              </div>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/75">
                      <TableHead className="font-semibold text-slate-900">Description</TableHead>
                      <TableHead className="font-semibold text-slate-900">Charge Type</TableHead>
                      <TableHead className="font-semibold text-slate-900 text-center">Delivery Status</TableHead>
                      <TableHead className="font-semibold text-slate-900 text-right">Qty</TableHead>
                      <TableHead className="font-semibold text-slate-900 text-right">Unit Price</TableHead>
                      <TableHead className="font-semibold text-slate-900 text-right">Total Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {oneTimeCharges.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium text-slate-900">
                          {item.description}
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                            One-Time
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          {item.isDelivered ? (
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Delivered
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-amber-700 font-medium">
                              <Clock className="w-3.5 h-3.5" />
                              Pending Dispatch
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono">{item.quantity}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(item.unitPrice)}</TableCell>
                        <TableCell className="text-right font-mono font-bold text-slate-900">
                          {formatCurrency(item.total)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Recurring Charges */}
          {recurringCharges.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  Recurring Subscription & Maintenance Retainers
                </h4>
                <span className="text-xs text-slate-500 font-mono">
                  {recurringCharges.length} item{recurringCharges.length > 1 ? 's' : ''}
                </span>
              </div>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/75">
                      <TableHead className="font-semibold text-slate-900">Description</TableHead>
                      <TableHead className="font-semibold text-slate-900">Billing Cycle</TableHead>
                      <TableHead className="font-semibold text-slate-900 text-center">Service Standing</TableHead>
                      <TableHead className="font-semibold text-slate-900 text-right">Seats / Qty</TableHead>
                      <TableHead className="font-semibold text-slate-900 text-right">Cycle Rate</TableHead>
                      <TableHead className="font-semibold text-slate-900 text-right">Total Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recurringCharges.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium text-slate-900">
                          {item.description}
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                            {item.period || 'Recurring'}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Active SLA
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-mono">{item.quantity}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(item.unitPrice)}</TableCell>
                        <TableCell className="text-right font-mono font-bold text-slate-900">
                          {formatCurrency(item.total)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Financial Totals & Settlement History */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200">
            {/* Notes & Audit / Payment Settlement Record */}
            <div className="space-y-4">
              <div>
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Billing Notes & Instructions
                </h5>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed bg-slate-50 p-3 rounded-md border border-slate-200 font-mono">
                  {invoice.notes || 'Please remit payment via corporate ACH or direct wire. Specify invoice number in transfer notes.'}
                </p>
              </div>

              {/* Settlement History */}
              {invoice.paidAmount > 0 && (
                <div className="p-3.5 rounded-lg bg-emerald-50/60 border border-emerald-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Settlement Verification Record
                    </span>
                    <span className="text-[11px] font-mono text-emerald-700">
                      {invoice.paidAt ? new Date(invoice.paidAt).toLocaleDateString() : 'Settled'}
                    </span>
                  </div>
                  <div className="text-xs text-emerald-900 space-y-1 font-mono">
                    <p>Method: {invoice.paymentMethod || 'Corporate ACH'}</p>
                    {invoice.paymentReference && <p>Reference: {invoice.paymentReference}</p>}
                    <p className="font-bold">Total Paid: {formatCurrency(invoice.paidAmount)}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Totals Calculation */}
            <div className="bg-slate-50 p-5 rounded-lg border border-slate-200 space-y-2.5">
              <div className="flex justify-between text-xs text-slate-600 font-mono">
                <span>Subtotal (Net Concessions)</span>
                <span className="font-semibold text-slate-900">{formatCurrency(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-600 font-mono">
                <span>Tax & Handling (8.5% Standard)</span>
                <span className="font-semibold text-slate-900">
                  {formatCurrency(invoice.taxAmount || invoice.amount - invoice.subtotal)}
                </span>
              </div>
              <div className="border-t border-slate-300 pt-2 flex justify-between text-sm font-bold text-slate-900 font-mono">
                <span>Total Invoice Value</span>
                <span className="text-base text-slate-950">{formatCurrency(invoice.amount)}</span>
              </div>

              {invoice.paidAmount > 0 && (
                <div className="flex justify-between text-xs font-mono text-emerald-700 font-medium">
                  <span>Amount Settled / Paid</span>
                  <span>- {formatCurrency(invoice.paidAmount)}</span>
                </div>
              )}

              <div className="border-t-2 border-slate-900 pt-2.5 flex justify-between items-baseline font-mono">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Outstanding Balance Due
                </span>
                <span className={`text-xl font-bold ${remaining === 0 ? 'text-emerald-700' : 'text-slate-900'}`}>
                  {formatCurrency(remaining)}
                </span>
              </div>

              {remaining === 0 ? (
                <div className="mt-2 text-center py-1 rounded bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
                  PAID IN FULL
                </div>
              ) : isPreShipmentLocked ? (
                <div className="mt-2 text-center py-1 rounded bg-amber-100 text-amber-900 text-xs font-bold uppercase tracking-wider">
                  PAYMENT ON HOLD (PRE-SHIPMENT)
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </Card>

      {/* Record Payment Dialog */}
      <Dialog
        open={isPaymentDialogOpen}
        onOpenChange={(open) => {
          if (!open) setIsPaymentDialogOpen(false);
        }}
      >
        <form onSubmit={handleRecordPaymentSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900">
              <CreditCard className="w-5 h-5 text-teal-600" />
              Record Commercial Payment for {invoice.id}
            </DialogTitle>
            <DialogDescription>
              Remit settlement payment to accounts receivable. Status will transition to Paid or Partially Paid based on amount.
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 space-y-4">
            {/* Balance Overview Pill */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-500">Current Outstanding Balance:</span>
              <span className="font-bold text-slate-900 text-sm">{formatCurrency(remaining)}</span>
            </div>

            {/* Payment Amount */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex justify-between">
                <span>Payment Amount ($ USD)</span>
                <button
                  type="button"
                  onClick={() => setPaymentAmount(remaining.toString())}
                  className="text-[11px] text-teal-600 hover:text-teal-800 underline font-mono"
                >
                  Pay Full Balance ({formatCurrency(remaining)})
                </button>
              </label>
              <Input
                type="number"
                step="0.01"
                min="1"
                max={remaining}
                required
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="0.00"
                className="font-mono text-sm"
              />
              <p className="text-[11px] text-slate-500">
                Entering less than {formatCurrency(remaining)} will set status to <span className="font-semibold text-sky-700">Partially Paid</span>.
              </p>
            </div>

            {/* Payment Method */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Payment Method</label>
              <Select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="ACH Wire Transfer">ACH Wire Transfer (Automated Clearing House)</option>
                <option value="Corporate Wire Transfer">Corporate Wire Transfer (Fedwire / SWIFT)</option>
                <option value="Procurement Card / Corporate Card">Procurement Card / Corporate Visa</option>
                <option value="Commercial Check / Draft">Commercial Check / Treasury Draft</option>
              </Select>
            </div>

            {/* Payment Reference */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Payment Reference / Transaction ID</label>
              <Input
                type="text"
                required
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="e.g. ACH-99201-BETA or WIRE-2026-X01"
                className="font-mono text-xs"
              />
              <p className="text-[11px] text-slate-500">
                Audit record reference issued by commercial banking partner.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsPaymentDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-teal-600 hover:bg-teal-700 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Recording Settlement...' : 'Confirm & Record Payment'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
