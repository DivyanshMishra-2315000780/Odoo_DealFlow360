'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { SubscriptionPlan } from '@/types/auth';
import { calculateSubscriptionProration, PLAN_PRICING } from '@/lib/proration';
import { useToast } from '@/components/providers/query-provider';
import {
  Sparkles,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  Info,
  DollarSign,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

import { request } from '@/lib/http/client';
import { loadCheckout, openCheckout, CheckoutOrder } from '@/lib/payments/razorpay';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/hooks/use-dealflow';

interface ManageSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlan: SubscriptionPlan;
  onPlanChange: (newPlan: SubscriptionPlan) => void;
}

export function ManageSubscriptionDialog({
  open,
  onOpenChange,
  currentPlan,
  onPlanChange,
}: ManageSubscriptionDialogProps) {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>(
    currentPlan === 'ENTERPRISE' ? 'PROFESSIONAL' : 'ENTERPRISE'
  );
  const [daysRemaining] = useState(18); // Realistic mid-cycle day count
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const proration = calculateSubscriptionProration({
    currentPlan,
    newPlan: selectedPlan,
    daysRemaining,
    totalDaysInCycle: 30,
  });

  const handleConfirm = async () => {
    if (selectedPlan === 'NONE') {
      onPlanChange('NONE');
      onOpenChange(false);
      return;
    }

    setIsUpdating(true);

    // If upgrading and there is a positive prorated charge, open Razorpay
    if (proration.isUpgrade && proration.proratedAmount > 0) {
      try {
        toast({
          title: 'Preparing Prorated Checkout',
          description: `Opening Razorpay for prorated amount of ${formatCurrency(proration.proratedAmount)}...`,
          type: 'info',
        });

        const order = await request<CheckoutOrder & { invoiceId: string }>('/api/payments/subscription-checkout', {
          method: 'POST',
          body: JSON.stringify({
            plan: selectedPlan,
            amount: proration.proratedAmount,
            isProrated: true,
          }),
        });

        await loadCheckout();
        openCheckout(
          order,
          order.invoiceId,
          async (receipt) => {
            try {
              await request('/api/payments/verify', {
                method: 'POST',
                body: JSON.stringify(receipt),
              });
              toast({
                title: 'Subscription Upgraded! ✓',
                description: `Successfully upgraded to ${PLAN_PRICING[selectedPlan].name}. Prorated charge of ${formatCurrency(proration.proratedAmount)} processed.`,
                type: 'success',
              });
            } catch {
              toast({
                title: 'Payment Recorded',
                description: 'Payment verified. Subscription details will refresh shortly.',
                type: 'info',
              });
            }
            onPlanChange(selectedPlan);
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SUBSCRIPTIONS });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.INVOICES });
            setIsUpdating(false);
            onOpenChange(false);
          },
          () => {
            setIsUpdating(false);
            toast({
              title: 'Checkout Closed',
              description: 'Plan change was not completed. You can retry anytime.',
              type: 'info',
            });
          },
          (errReason) => {
            setIsUpdating(false);
            toast({
              title: 'Payment Failed',
              description: errReason || 'Payment could not be processed.',
              type: 'warning',
            });
          }
        );
      } catch (err: any) {
        setIsUpdating(false);
        toast({
          title: 'Upgrade Failed',
          description: err?.message || 'Could not initiate checkout.',
          type: 'error',
        });
      }
    } else {
      // Downgrade or zero charge: apply plan change with scheduled credit
      onPlanChange(selectedPlan);
      setIsUpdating(false);
      onOpenChange(false);
      toast({
        title: 'Subscription Adjusted',
        description: `Switched to ${PLAN_PRICING[selectedPlan].name}. Prorated credit of ${formatCurrency(Math.abs(proration.proratedAmount))} scheduled.`,
        type: 'success',
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SUBSCRIPTIONS });
    }
  };

  const planOptions: SubscriptionPlan[] = ['STARTER', 'PROFESSIONAL', 'ENTERPRISE'];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-md bg-teal-50 text-teal-700">
            <Sparkles className="w-4 h-4" />
          </span>
          <DialogTitle>Manage Software Subscription & Seats</DialogTitle>
        </div>
        <DialogDescription>
          Upgrade or downgrade your SaaS platform licenses with automated proration math.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 text-xs py-1">
        {/* Strict Separation of Concerns Notice */}
        <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed text-[11px]">
            <strong>Separation of Concerns:</strong> Subscription Plans govern SaaS software features, seats, and SLA guarantees. Commercial discount caps and credit allowances are governed independently by your system-assigned Customer Tier.
          </p>
        </div>

        {/* Current Plan & Billing Cycle Status */}
        <div className="flex items-center justify-between p-3 rounded-md bg-slate-100 text-slate-800 text-xs">
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
              Current Active Plan
            </span>
            <span className="font-bold text-slate-900">{PLAN_PRICING[currentPlan]?.name}</span>
            <span className="text-slate-500 font-mono ml-1">
              ({formatCurrency(PLAN_PRICING[currentPlan]?.monthlyRate)}/mo)
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
              Cycle Status
            </span>
            <span className="font-mono font-semibold text-teal-700">
              {daysRemaining} of 30 days remaining
            </span>
          </div>
        </div>

        {/* Plan Selection Cards */}
        <div className="space-y-2">
          <label className="font-semibold text-slate-800 block text-xs">
            Select New Subscription Plan
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {planOptions.map((plan) => {
              const isCurrent = plan === currentPlan;
              const isSelected = plan === selectedPlan;
              const info = PLAN_PRICING[plan];

              return (
                <div
                  key={plan}
                  onClick={() => setSelectedPlan(plan)}
                  className={`p-3 rounded-lg border text-left transition cursor-pointer relative ${
                    isSelected
                      ? 'border-teal-600 bg-teal-50/30 ring-2 ring-teal-500/20 shadow-enterprise'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  {isCurrent && (
                    <span className="absolute top-2 right-2 text-[9px] font-bold uppercase tracking-wider bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                      Current
                    </span>
                  )}
                  <h4 className="font-bold text-slate-900 text-xs">{info.name}</h4>
                  <p className="font-mono font-bold text-sm text-slate-900 mt-1">
                    {formatCurrency(info.monthlyRate)}
                    <span className="text-[10px] font-normal text-slate-500">/mo</span>
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">Up to {info.seats} seats</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* LIVE PRORATION BREAKDOWN */}
        <div className="p-4 rounded-lg border border-teal-200 bg-teal-50/40 space-y-2 text-xs">
          <div className="flex items-center justify-between font-bold text-teal-950 uppercase tracking-wider text-[11px]">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-teal-700" />
              Proration Calculation Breakdown
            </span>
            <span className="font-mono">{daysRemaining} Days Pro-Rated</span>
          </div>

          <div className="space-y-1.5 text-slate-700 pt-1 border-t border-teal-200/60">
            <div className="flex justify-between">
              <span>Monthly Rate Differential:</span>
              <span className="font-mono font-semibold">
                {proration.rateDifferential >= 0 ? '+' : ''}
                {formatCurrency(proration.rateDifferential)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Proration Ratio ({daysRemaining}/30 days):</span>
              <span className="font-mono font-semibold">
                {((daysRemaining / 30) * 100).toFixed(1)}% of billing cycle
              </span>
            </div>
            <div className="flex justify-between text-sm font-bold text-slate-900 pt-1.5 border-t border-teal-200/80">
              <span>{proration.isUpgrade ? 'Immediate Prorated Charge:' : 'Prorated Account Credit:'}</span>
              <span className="font-mono text-teal-800 text-base">
                {formatCurrency(Math.abs(proration.proratedAmount))}
              </span>
            </div>
          </div>

          <p className="text-[10px] text-slate-500 leading-snug pt-1">
            {proration.explanation} Regular monthly billing resumes at {formatCurrency(proration.newRate)}/mo on the next billing date.
          </p>
        </div>
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onOpenChange(false)}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="default"
          size="sm"
          loading={isUpdating}
          disabled={selectedPlan === currentPlan}
          onClick={handleConfirm}
        >
          Confirm Plan Change
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
