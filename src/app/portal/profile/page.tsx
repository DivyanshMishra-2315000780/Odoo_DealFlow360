'use client';

import React, { useState } from 'react';
import {
  Building,
  User,
  Crown,
  Phone,
  DollarSign,
  Sparkles,
  CheckCircle2,
  Info,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TierBadge } from '@/components/ui/tier-badge';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/components/providers/query-provider';
import { formatCurrency } from '@/lib/utils';
import { SubscriptionPlan } from '@/types/auth';
import { ManageSubscriptionDialog } from '@/components/subscriptions/manage-subscription-dialog';
import { evaluateSystemAssignedTier } from '@/lib/customer-tier';
import { PLAN_PRICING } from '@/lib/proration';

export default function CustomerProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [contactName, setContactName] = useState('Sarah Jenkins');
  const [contactRole, setContactRole] = useState('VP Procurement & IT Infrastructure');
  const [phone, setPhone] = useState('+1 (555) 392-8190');
  const [isSaving, setIsSaving] = useState(false);

  // Subscription management state
  const [activePlan, setActivePlan] = useState<SubscriptionPlan>(
    user?.subscriptionPlan || 'ENTERPRISE'
  );
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);

  // System-assigned tier calculation
  const tierAssessment = evaluateSystemAssignedTier({
    annualSpend: 485000,
    dealCount: 3,
    creditRating: 'AAA',
    contractHistoryYears: 2,
  });

  const handleSaveContact = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast({
        title: 'Contact Profile Updated',
        description: 'Procurement administrator contact details saved.',
        type: 'success',
      });
    }, 350);
  };

  return (
    <div className="space-y-8 pb-16 max-w-4xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Organization Profile & Governance Settings
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Review system-assigned commercial discount ceilings, credit terms, and manage software subscription seats.
        </p>
      </div>

      {/* Account Overview Header Card */}
      <Card>
        <CardHeader className="p-5 pb-3 flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base text-slate-900">
              Acme Corporation
            </CardTitle>
            <CardDescription className="mt-0.5">Enterprise Software & Cloud Infrastructure</CardDescription>
          </div>
          <TierBadge tier="Gold" size="md" showLimitNotice />
        </CardHeader>
        <CardContent className="p-5 pt-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs">
            <div>
              <span className="text-[11px] text-slate-500 block">Assigned Credit Limit</span>
              <span className="text-lg font-bold font-mono text-slate-900 mt-0.5 block">
                {formatCurrency(250000)}
              </span>
              <span className="text-[10px] text-emerald-600 font-medium">Approved for Net-30</span>
            </div>

            <div>
              <span className="text-[11px] text-slate-500 block">Lifetime Transaction Spend</span>
              <span className="text-lg font-bold font-mono text-slate-900 mt-0.5 block">
                {formatCurrency(485000)}
              </span>
              <span className="text-[10px] text-slate-500">Corporate credit rating: AAA</span>
            </div>

            <div>
              <span className="text-[11px] text-slate-500 block">Assigned Account Executive</span>
              <span className="text-sm font-bold text-slate-900 mt-0.5 block">
                Marcus Vance
              </span>
              <span className="text-[10px] text-teal-700">marcus@dealflow360.com</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ======================================================== */}
      {/* SECTION 1: SYSTEM-ASSIGNED COMMERCIAL CUSTOMER TIER     */}
      {/* ======================================================== */}
      <Card className="border-amber-200 bg-amber-50/15">
        <CardHeader className="p-5 pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-sm uppercase tracking-wider flex items-center gap-2 text-amber-950">
                <Crown className="w-4 h-4 text-amber-600" />
                1. Commercial Customer Tier (System-Assigned)
              </CardTitle>
              <CardDescription>
                Customer Tiers are system-assigned by DealFlow360 Deal Governance based on verifiable annual spend, closed contract volume, and credit history.
              </CardDescription>
            </div>
            <span className="text-xs font-mono font-bold text-amber-900 bg-amber-100 px-2.5 py-1 rounded border border-amber-300 shadow-2xs">
              Gold Tier Standing
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-5 pt-2 space-y-4 text-xs">
          {/* Discount Policy Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-lg border border-amber-200 bg-white space-y-1 shadow-2xs">
              <span className="font-semibold text-slate-800">Hardware Discount Ceiling</span>
              <p className="text-xl font-bold font-mono text-amber-900">15% Max Allowed</p>
              <p className="text-[11px] text-slate-500">
                Applicable to Laptop workstations, docking hubs, and hardware endpoints.
              </p>
            </div>

            <div className="p-3.5 rounded-lg border border-amber-200 bg-white space-y-1 shadow-2xs">
              <span className="font-semibold text-slate-800">Services Discount Ceiling</span>
              <p className="text-xl font-bold font-mono text-amber-900">10% Max Allowed</p>
              <p className="text-[11px] text-slate-500">
                Applicable to turnkey onsite provisioning, warranties, and care plans.
              </p>
            </div>
          </div>

          {/* CRITICAL GOVERNANCE DISCLOSURE */}
          <div className="p-3.5 rounded-lg border border-amber-300 bg-amber-50/90 text-amber-950 flex items-start gap-2.5 text-xs shadow-2xs">
            <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="leading-relaxed space-y-1">
              <p>
                <strong>Non-Bypassable Governance Rule:</strong> Customer Tier priority confers commercial discounts and dedicated SLA response, but <strong>never bypasses approval rules</strong>. Category limits (e.g. Services 10%) are strictly binding regardless of tier status.
              </p>
              <p className="text-[11px] text-amber-900">
                System Evaluation Note: {tierAssessment.governanceNote}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ======================================================== */}
      {/* SECTION 2: SOFTWARE SUBSCRIPTION PLAN & PRORATION       */}
      {/* ======================================================== */}
      <Card className="border-teal-200 bg-white shadow-enterprise">
        <CardHeader className="p-5 pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-sm uppercase tracking-wider flex items-center gap-2 text-slate-800">
                <Sparkles className="w-4 h-4 text-teal-600" />
                2. Software Subscription Plan (Separate Concern)
              </CardTitle>
              <CardDescription>
                Governs SaaS software seats, SLA guarantees, and API access. Completely independent from commercial discount tiers.
              </CardDescription>
            </div>
            <Button
              variant="default"
              size="sm"
              onClick={() => setIsSubscriptionModalOpen(true)}
              className="gap-1.5 shadow-enterprise text-xs"
            >
              <Layers className="w-3.5 h-3.5" />
              Change Plan (Prorated)
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-5 pt-2 space-y-4 text-xs">
          {/* Active Plan Card */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-teal-50/30 border border-teal-200 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-sm">
                  {PLAN_PRICING[activePlan]?.name}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-600 text-white px-2 py-0.5 rounded-full">
                  Active
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Allocated Seats: <strong>{PLAN_PRICING[activePlan]?.seats} Commercial Users</strong> • 1-Hour Dedicated SLA
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-xl font-bold font-mono text-teal-800 block">
                {formatCurrency(PLAN_PRICING[activePlan]?.monthlyRate)}
                <span className="text-xs font-normal text-slate-500">/month</span>
              </span>
              <span className="text-[11px] text-slate-500">
                Next billing date: Sept 30, 2026
              </span>
            </div>
          </div>

          {/* Proration Explanation */}
          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 text-xs flex items-start gap-2">
            <Calendar className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Prorated Billing Support:</strong> Upgrading or downgrading your software subscription calculates immediate prorated billing adjustments based on the remaining days in your 30-day billing cycle.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Procurement Contact Settings Form */}
      <Card>
        <form onSubmit={handleSaveContact}>
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-sm uppercase tracking-wider flex items-center gap-2 text-slate-800">
              <User className="w-4 h-4 text-teal-600" />
              Primary Procurement Contact Details
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-3 space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contact Person
                </label>
                <Input
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Title / Role
                </label>
                <Input
                  value={contactRole}
                  onChange={(e) => setContactRole(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Procurement Email
                </label>
                <Input
                  type="email"
                  defaultValue="procurement@acmecorp.com"
                  disabled
                  className="bg-slate-100 text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Direct Phone Number
                </label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="p-5 border-t border-slate-100 flex justify-end">
            <Button type="submit" variant="default" size="sm" loading={isSaving}>
              Save Profile Changes
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Manage Subscription & Proration Modal */}
      <ManageSubscriptionDialog
        open={isSubscriptionModalOpen}
        onOpenChange={setIsSubscriptionModalOpen}
        currentPlan={activePlan}
        onPlanChange={(newPlan) => {
          setActivePlan(newPlan);
        }}
      />
    </div>
  );
}
