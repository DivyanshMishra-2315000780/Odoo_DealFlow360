"use client";
import { useState } from "react";
import { useSubscriptions } from "@/hooks/use-dealflow";
import { PageHeading } from "@/components/ui/page-heading";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { ManageSubscriptionDialog } from "@/components/subscriptions/manage-subscription-dialog";
import { SubscriptionPlan } from "@/types/auth";
import { Sparkles, ArrowUpRight } from "lucide-react";

export default function CustomerSubscriptions() {
  const query = useSubscriptions();
  const [dialogOpen, setDialogOpen] = useState(false);

  // Determine current active plan from subscriptions or default to NONE
  const activeSub = query.data?.find((s) => s.status === 'ACTIVE');
  let currentPlan: SubscriptionPlan = 'NONE';
  if (activeSub) {
    const name = activeSub.planName.toLowerCase();
    if (name.includes('enterprise')) currentPlan = 'ENTERPRISE';
    else if (name.includes('pro')) currentPlan = 'PROFESSIONAL';
    else if (name.includes('starter')) currentPlan = 'STARTER';
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeading
          title="Your SaaS Subscriptions & Seats"
          description="Manage software license seats, SaaS tiers, and view scheduled renewals with automated mid-cycle proration."
        />
        <Button
          onClick={() => setDialogOpen(true)}
          className="bg-teal-600 hover:bg-teal-700 text-white font-medium flex items-center gap-2 shrink-0 self-start sm:self-auto"
        >
          <Sparkles className="w-4 h-4" />
          {activeSub ? "Upgrade / Change Plan" : "Choose SaaS Plan"}
          <ArrowUpRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      {query.error && <p role="alert" className="text-red-600 text-sm">{query.error.message}</p>}

      {query.data?.map((sub) => (
        <Card key={sub.id} className="border-slate-200">
          <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-slate-900 text-base">{sub.planName}</h2>
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                  sub.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                }`}>
                  {sub.status}
                </span>
              </div>
              <p className="text-sm text-slate-600">
                {sub.seatsOrLicenses ?? 1} licensed unit{sub.seatsOrLicenses !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-slate-500">
                Next scheduled billing: {sub.nextBillingDate ? new Date(sub.nextBillingDate).toLocaleDateString() : 'N/A'}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="font-mono font-bold text-lg text-slate-900 block">
                  {formatCurrency(sub.recurringAmount)}
                </span>
                <span className="text-[11px] text-slate-500 uppercase tracking-wider">
                  per {sub.billingFrequency.toLowerCase()}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDialogOpen(true)}
                className="text-xs"
              >
                Change
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {!query.data?.length && !query.isLoading && (
        <Card className="border-dashed border-slate-300 bg-slate-50/50 text-center py-10">
          <CardContent className="space-y-3">
            <Sparkles className="w-8 h-8 text-teal-600 mx-auto" />
            <div className="space-y-1">
              <h3 className="font-medium text-slate-800">No Active SaaS Subscription</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                You are currently on the 14-day evaluation trial. Upgrade to a paid plan anytime to unlock unlimited seats and SLA support.
              </p>
            </div>
            <Button
              onClick={() => setDialogOpen(true)}
              className="bg-teal-600 hover:bg-teal-700 text-white text-xs mt-2"
            >
              Choose a Subscription Plan
            </Button>
          </CardContent>
        </Card>
      )}

      {query.isLoading && (
        <p className="text-slate-500 text-sm">Loading subscriptions...</p>
      )}

      {/* Proration & Plan Change Modal */}
      <ManageSubscriptionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        currentPlan={currentPlan}
        onPlanChange={() => {
          query.refetch();
        }}
      />
    </div>
  );
}
