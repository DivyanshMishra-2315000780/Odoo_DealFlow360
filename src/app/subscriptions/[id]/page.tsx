'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import {
  RefreshCcw,
  ArrowLeft,
  CheckCircle2,
  PauseCircle,
  XCircle,
  Play,
  Calendar,
  DollarSign,
  Clock,
  Shield,
  FileText,
  Building,
  Zap,
  AlertTriangle,
  Settings,
  TrendingUp,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { TierBadge } from '@/components/ui/tier-badge';
import { CardLoadingSkeleton } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { useSubscription, useUpdateSubscriptionStatus, useModifySubscription } from '@/hooks/use-dealflow';
import { useToast } from '@/components/providers/query-provider';
import { formatCurrency } from '@/lib/utils';
import { SubscriptionStatus, BillingFrequency, CommercialSubscription } from '@/types/dealflow';

interface SubscriptionDetailPageProps {
  params: Promise<{ id: string }>;
}

function StatusBadge({ status }: { status: SubscriptionStatus }) {
  switch (status) {
    case 'ACTIVE':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          Active
        </span>
      );
    case 'PAUSED':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold bg-amber-50 text-amber-900 border border-amber-300">
          <PauseCircle className="w-4 h-4 text-amber-600" />
          Paused
        </span>
      );
    case 'CANCELLED':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold bg-rose-50 text-rose-800 border border-rose-200">
          <XCircle className="w-4 h-4 text-rose-600" />
          Cancelled
        </span>
      );
  }
}

function FreqLabel(freq: BillingFrequency): string {
  if (freq === 'MONTHLY') return 'Monthly';
  if (freq === 'QUARTERLY') return 'Quarterly';
  return 'Annual';
}

function InvoiceStatusBadge({ status }: { status: 'PAID' | 'UNPAID' | 'PARTIALLY_PAID' }) {
  if (status === 'PAID') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
      <CheckCircle2 className="w-3 h-3" /> Paid
    </span>
  );
  if (status === 'PARTIALLY_PAID') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-800 border border-sky-200">
      <Clock className="w-3 h-3" /> Partial
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
      <Clock className="w-3 h-3" /> Unpaid
    </span>
  );
}

export default function SubscriptionDetailPage({ params }: SubscriptionDetailPageProps) {
  const resolvedParams = use(params);
  const subId = resolvedParams.id;

  const { data: subscription, isLoading, error } = useSubscription(subId);
  const updateStatus = useUpdateSubscriptionStatus();
  const modifySubscription = useModifySubscription();
  const { toast } = useToast();

  // Dialogs
  const [pauseDialogOpen, setPauseDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [modifyDialogOpen, setModifyDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [pauseReason, setPauseReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modify form state
  const [modifyAmount, setModifyAmount] = useState('');
  const [modifyFrequency, setModifyFrequency] = useState<BillingFrequency>('MONTHLY');
  const [modifyAutoRenew, setModifyAutoRenew] = useState(true);

  if (isLoading) {
    return (
      <div className="space-y-6 pb-12">
        <div className="h-8 w-64 bg-slate-200 animate-pulse rounded" />
        <CardLoadingSkeleton />
        <CardLoadingSkeleton />
      </div>
    );
  }

  if (error || !subscription) {
    return (
      <div className="py-12">
        <ErrorState title="Subscription Not Found" message={`Could not find subscription ${subId}.`} />
        <div className="mt-4 text-center">
          <Link href="/subscriptions"><Button variant="outline">Return to Subscriptions</Button></Link>
        </div>
      </div>
    );
  }

  // Compute monthly equivalent
  let mrrEquiv = subscription.recurringAmount;
  if (subscription.billingFrequency === 'QUARTERLY') mrrEquiv = subscription.recurringAmount / 3;
  if (subscription.billingFrequency === 'ANNUAL') mrrEquiv = subscription.recurringAmount / 12;

  // Calculate annual contract value
  const annualValue = mrrEquiv * 12;

  const handlePause = async () => {
    setIsSubmitting(true);
    try {
      await updateStatus.mutateAsync({ id: subscription.id, status: 'PAUSED' });
      setPauseDialogOpen(false);
      toast({ title: 'Subscription Paused', description: `${subscription.productService} billing suspended.`, type: 'warning' });
    } catch {
      toast({ title: 'Failed to Pause', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResume = async () => {
    setIsSubmitting(true);
    try {
      await updateStatus.mutateAsync({ id: subscription.id, status: 'ACTIVE' });
      toast({ title: 'Subscription Resumed', description: `${subscription.productService} billing reactivated.`, type: 'success' });
    } catch {
      toast({ title: 'Failed to Resume', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      toast({ title: 'Reason Required', description: 'Please enter a cancellation reason.', type: 'error' });
      return;
    }
    setIsSubmitting(true);
    try {
      await updateStatus.mutateAsync({ id: subscription.id, status: 'CANCELLED' });
      setCancelDialogOpen(false);
      toast({ title: 'Subscription Cancelled', description: `${subscription.productService} has been terminated.`, type: 'info' });
    } catch {
      toast({ title: 'Failed to Cancel', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenModify = () => {
    setModifyAmount(subscription.recurringAmount.toString());
    setModifyFrequency(subscription.billingFrequency);
    setModifyAutoRenew(subscription.autoRenew);
    setModifyDialogOpen(true);
  };

  const handleModify = async () => {
    const amountNum = parseFloat(modifyAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast({ title: 'Invalid Amount', description: 'Enter a valid recurring amount.', type: 'error' });
      return;
    }
    setIsSubmitting(true);
    try {
      const updated: CommercialSubscription = {
        ...subscription,
        recurringAmount: amountNum,
        billingFrequency: modifyFrequency,
        autoRenew: modifyAutoRenew,
      };
      await modifySubscription.mutateAsync(updated);
      setModifyDialogOpen(false);
      toast({ title: 'Subscription Modified', description: 'Billing terms updated successfully.', type: 'success' });
    } catch {
      toast({ title: 'Failed to Modify', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Build a visual billing calendar — next 4 billing events
  const billingPeriodDays = subscription.billingFrequency === 'MONTHLY' ? 30 : subscription.billingFrequency === 'QUARTERLY' ? 90 : 365;
  const billingEvents = Array.from({ length: 4 }, (_, i) => {
    if (subscription.status !== 'ACTIVE' || subscription.nextBillingDate === 'Terminated') return null;
    try {
      const base = new Date(subscription.nextBillingDate);
      const eventDate = new Date(base.getTime() + i * billingPeriodDays * 24 * 60 * 60 * 1000);
      return {
        date: eventDate.toISOString().slice(0, 10),
        amount: subscription.recurringAmount,
        isCurrent: i === 0,
      };
    } catch {
      return null;
    }
  }).filter(Boolean);

  return (
    <div className="space-y-6 pb-12">
      {/* Breadcrumb & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <Link href="/subscriptions">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0"><ArrowLeft className="w-4 h-4" /></Button>
          </Link>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-mono text-lg font-bold text-slate-900">{subscription.id}</span>
              <StatusBadge status={subscription.status} />
              <TierBadge tier={subscription.customerTier} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              <span className="font-medium text-slate-900">{subscription.customerName}</span>
              {' · '}{subscription.productService}{' · '}{subscription.contractDuration} Contract
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {subscription.status !== 'CANCELLED' && (
            <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={handleOpenModify}>
              <Settings className="w-3.5 h-3.5 text-slate-500" />
              Modify Terms
            </Button>
          )}
          {subscription.status === 'ACTIVE' && (
            <Button variant="outline" size="sm"
              className="text-xs gap-1.5 border-amber-300 text-amber-800 hover:bg-amber-50"
              onClick={() => setPauseDialogOpen(true)}>
              <PauseCircle className="w-3.5 h-3.5" />
              Pause Billing
            </Button>
          )}
          {subscription.status === 'PAUSED' && (
            <Button size="sm" className="text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={isSubmitting} onClick={handleResume}>
              <Play className="w-3.5 h-3.5" />
              {isSubmitting ? 'Resuming...' : 'Resume Billing'}
            </Button>
          )}
          {subscription.status !== 'CANCELLED' && (
            <Button variant="outline" size="sm"
              className="text-xs gap-1.5 border-rose-300 text-rose-800 hover:bg-rose-50"
              onClick={() => setCancelDialogOpen(true)}>
              <XCircle className="w-3.5 h-3.5" />
              Cancel Agreement
            </Button>
          )}
        </div>
      </div>

      {/* Paused Notice */}
      {subscription.status === 'PAUSED' && (
        <div className="p-4 rounded-lg bg-amber-50 border-2 border-amber-300 flex items-start gap-3">
          <PauseCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-amber-950">Billing Temporarily Suspended</h4>
            <p className="text-xs text-amber-900 mt-0.5">{subscription.notes}</p>
            <Button size="sm" className="mt-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
              disabled={isSubmitting} onClick={handleResume}>
              <Play className="w-3 h-3" /> Resume Recurring Billing
            </Button>
          </div>
        </div>
      )}

      {/* Cancelled Notice */}
      {subscription.status === 'CANCELLED' && (
        <div className="p-4 rounded-lg bg-rose-50 border-2 border-rose-300 flex items-start gap-3">
          <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-rose-950">Agreement Terminated</h4>
            <p className="text-xs text-rose-900 mt-0.5">{subscription.notes}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-5">
          {/* Contract Overview */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Shield className="w-4 h-4 text-teal-600" />
                Service Agreement Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
                <div>
                  <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Customer</span>
                  <p className="text-sm font-semibold text-slate-900 mt-0.5">{subscription.customerName}</p>
                </div>
                <div>
                  <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Plan</span>
                  <p className="text-sm font-semibold text-slate-900 mt-0.5">{subscription.planName}</p>
                </div>
                <div>
                  <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Product / Service</span>
                  <p className="text-sm font-semibold text-slate-900 mt-0.5">{subscription.productService}</p>
                </div>
                <div>
                  <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Contract Duration</span>
                  <p className="text-sm font-semibold text-slate-900 mt-0.5">{subscription.contractDuration}</p>
                </div>
                <div>
                  <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Start Date</span>
                  <p className="text-sm font-semibold text-slate-900 mt-0.5">{subscription.startDate}</p>
                </div>
                <div>
                  <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Renewal Date</span>
                  <p className="text-sm font-semibold text-slate-900 mt-0.5">{subscription.renewalDate}</p>
                </div>
                <div>
                  <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Billing Frequency</span>
                  <p className="text-sm font-semibold text-slate-900 mt-0.5">{FreqLabel(subscription.billingFrequency)}</p>
                </div>
                <div>
                  <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Seats / Licenses</span>
                  <p className="text-sm font-semibold text-slate-900 mt-0.5">{subscription.seatsOrLicenses ?? '—'}</p>
                </div>
                <div>
                  <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Auto-Renew</span>
                  <p className={`text-sm font-semibold mt-0.5 ${subscription.autoRenew ? 'text-teal-700' : 'text-slate-500'}`}>
                    {subscription.autoRenew ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
              </div>

              {subscription.notes && (
                <div className="mt-5 p-3 bg-slate-50 rounded-md border border-slate-200">
                  <p className="text-xs text-slate-600 leading-relaxed">{subscription.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Included Services */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Zap className="w-4 h-4 text-teal-600" />
                Included Services & Entitlements
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <ul className="space-y-2.5">
                {subscription.includedServices.map((svc, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <span className="text-xs text-slate-700">{svc}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Invoice History */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-600" />
                Recurring Invoice History
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/75 hover:bg-slate-50/75">
                    <TableHead className="font-semibold text-slate-900">Invoice</TableHead>
                    <TableHead className="font-semibold text-slate-900">Billing Period</TableHead>
                    <TableHead className="font-semibold text-slate-900">Date Issued</TableHead>
                    <TableHead className="font-semibold text-slate-900 text-right">Amount</TableHead>
                    <TableHead className="font-semibold text-slate-900">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscription.invoiceHistory.map((inv) => (
                    <TableRow key={inv.id} className="hover:bg-slate-50/60">
                      <TableCell>
                        <span className="font-mono text-xs font-semibold text-teal-700">{inv.id}</span>
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">{inv.period}</TableCell>
                      <TableCell className="text-xs font-mono text-slate-600">{inv.date}</TableCell>
                      <TableCell className="text-right font-mono font-bold text-slate-900">
                        {formatCurrency(inv.amount)}
                      </TableCell>
                      <TableCell><InvoiceStatusBadge status={inv.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Billing Sidebar */}
        <div className="space-y-5">
          {/* Recurring Amount Card */}
          <Card className="border-2 border-teal-200 bg-teal-50/30">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-2">
                <RefreshCcw className="w-4 h-4 text-teal-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-teal-800">Recurring Billing</span>
              </div>

              <div>
                <p className="text-3xl font-bold font-mono text-slate-900">
                  {formatCurrency(subscription.recurringAmount)}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  per {FreqLabel(subscription.billingFrequency).toLowerCase()} charge
                </p>
              </div>

              <div className="border-t border-teal-200 pt-3 space-y-1.5">
                <div className="flex justify-between text-xs font-mono text-slate-600">
                  <span>Monthly Rate (MRR)</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(Math.round(mrrEquiv))}</span>
                </div>
                <div className="flex justify-between text-xs font-mono text-slate-600">
                  <span>Annual Contract Value</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(Math.round(annualValue))}</span>
                </div>
              </div>

              <div className="p-3 bg-white rounded-md border border-teal-200 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <Calendar className="w-3.5 h-3.5 text-teal-600" />
                  Next Billing Date
                </div>
                <p className={`text-sm font-mono font-bold ${subscription.status !== 'ACTIVE' ? 'text-rose-500 line-through' : 'text-slate-900'}`}>
                  {subscription.nextBillingDate}
                </p>
                {subscription.status === 'PAUSED' && (
                  <p className="text-[11px] text-amber-700 font-semibold">Billing suspended until resumed</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Billing Schedule */}
          {billingEvents.length > 0 && subscription.status === 'ACTIVE' && (
            <Card>
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5 text-teal-600" />
                  Upcoming Billing Schedule
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3 pb-4">
                <div className="space-y-2.5">
                  {billingEvents.map((evt, idx) => evt && (
                    <div key={idx} className={`flex items-center justify-between p-2.5 rounded-md ${evt.isCurrent ? 'bg-teal-50 border border-teal-200' : 'bg-slate-50 border border-slate-200'}`}>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${evt.isCurrent ? 'bg-teal-500 animate-pulse' : 'bg-slate-300'}`} />
                        <span className={`text-xs font-mono ${evt.isCurrent ? 'text-teal-900 font-bold' : 'text-slate-600'}`}>
                          {evt.date}
                        </span>
                        {evt.isCurrent && (
                          <span className="text-[10px] text-teal-700 font-bold uppercase tracking-wider bg-teal-100 px-1.5 py-0.5 rounded">Next</span>
                        )}
                      </div>
                      <span className={`text-xs font-mono font-bold ${evt.isCurrent ? 'text-teal-900' : 'text-slate-700'}`}>
                        {formatCurrency(evt.amount)}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-slate-400 mt-3">
                  {FreqLabel(subscription.billingFrequency)} billing. Dates shown are projected.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* PAUSE DIALOG */}
      <Dialog open={pauseDialogOpen} onOpenChange={setPauseDialogOpen}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-900">
            <PauseCircle className="w-5 h-5 text-amber-600" />
            Pause Recurring Billing
          </DialogTitle>
          <DialogDescription>
            Billing will be suspended immediately. Service levels remain active during the pause. You can resume at any time.
          </DialogDescription>
        </DialogHeader>
        <div className="p-6 space-y-4">
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900">
            <strong>Agreement:</strong> {subscription.productService} ({subscription.id})<br />
            <strong>Recurring Amount:</strong> {formatCurrency(subscription.recurringAmount)} / {FreqLabel(subscription.billingFrequency)}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Reason for Pause (required)</label>
            <textarea
              className="w-full text-xs border border-slate-300 rounded-md p-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none min-h-[80px]"
              placeholder="e.g. Client requested billing hold during facility renovation..."
              value={pauseReason}
              onChange={(e) => setPauseReason(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setPauseDialogOpen(false)} disabled={isSubmitting}>Cancel</Button>
          <Button
            className="bg-amber-600 hover:bg-amber-700 text-white"
            onClick={handlePause}
            disabled={isSubmitting || !pauseReason.trim()}
          >
            {isSubmitting ? 'Pausing...' : 'Confirm Pause'}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* CANCEL DIALOG */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-rose-900">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            Cancel Commercial Agreement
          </DialogTitle>
          <DialogDescription>
            This action is irreversible. The agreement will be permanently terminated and billing will stop immediately.
          </DialogDescription>
        </DialogHeader>
        <div className="p-6 space-y-4">
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-900">
            <strong>Agreement:</strong> {subscription.productService} ({subscription.id})<br />
            <strong>Customer:</strong> {subscription.customerName} • {subscription.customerTier} Tier<br />
            <strong>Annual Contract Value:</strong> {formatCurrency(Math.round(annualValue))}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Mandatory Cancellation Reason</label>
            <textarea
              className="w-full text-xs border border-slate-300 rounded-md p-2.5 focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none min-h-[90px]"
              placeholder="Provide full cancellation justification for audit trail..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
            <p className="text-[11px] text-slate-400">Required for governance audit record.</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setCancelDialogOpen(false)} disabled={isSubmitting}>Keep Active</Button>
          <Button
            className="bg-rose-600 hover:bg-rose-700 text-white"
            onClick={handleCancel}
            disabled={isSubmitting || !cancelReason.trim()}
          >
            {isSubmitting ? 'Cancelling...' : 'Terminate Agreement'}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* MODIFY DIALOG */}
      <Dialog open={modifyDialogOpen} onOpenChange={setModifyDialogOpen}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900">
            <Settings className="w-5 h-5 text-teal-600" />
            Modify Subscription Terms — {subscription.id}
          </DialogTitle>
          <DialogDescription>
            Update billing amount, frequency, or auto-renewal settings. Changes take effect from the next billing cycle.
          </DialogDescription>
        </DialogHeader>
        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Recurring Amount ($ USD)</label>
            <Input
              type="number"
              step="0.01"
              min="1"
              value={modifyAmount}
              onChange={(e) => setModifyAmount(e.target.value)}
              className="font-mono text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Billing Frequency</label>
            <Select value={modifyFrequency} onChange={(e) => setModifyFrequency(e.target.value as BillingFrequency)}>
              <option value="MONTHLY">Monthly</option>
              <option value="QUARTERLY">Quarterly</option>
              <option value="ANNUAL">Annual</option>
            </Select>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="autoRenew"
              checked={modifyAutoRenew}
              onChange={(e) => setModifyAutoRenew(e.target.checked)}
              className="w-4 h-4 accent-teal-600"
            />
            <label htmlFor="autoRenew" className="text-xs font-semibold text-slate-700">Auto-Renew at end of contract term</label>
          </div>

          {/* Preview changed MRR */}
          {modifyAmount && !isNaN(parseFloat(modifyAmount)) && (
            <div className="p-3 bg-teal-50 border border-teal-200 rounded-md text-xs font-mono space-y-1">
              <p className="font-bold text-teal-900">Preview New Billing Terms:</p>
              <p className="text-teal-800">
                {formatCurrency(parseFloat(modifyAmount))} /
                {' '}{FreqLabel(modifyFrequency).toLowerCase()}
                {modifyFrequency !== 'MONTHLY' && (
                  <span className="text-teal-600 ml-2">
                    ≈ {formatCurrency(Math.round(
                      modifyFrequency === 'QUARTERLY'
                        ? parseFloat(modifyAmount) / 3
                        : parseFloat(modifyAmount) / 12
                    ))} /mo
                  </span>
                )}
              </p>
              <p className="text-teal-700">
                Annual Contract Value: {formatCurrency(Math.round(
                  modifyFrequency === 'MONTHLY' ? parseFloat(modifyAmount) * 12
                    : modifyFrequency === 'QUARTERLY' ? parseFloat(modifyAmount) * 4
                    : parseFloat(modifyAmount)
                ))}
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setModifyDialogOpen(false)} disabled={isSubmitting}>Cancel</Button>
          <Button className="bg-teal-600 hover:bg-teal-700 text-white" onClick={handleModify} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
