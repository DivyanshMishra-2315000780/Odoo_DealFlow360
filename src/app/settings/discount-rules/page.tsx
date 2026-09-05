'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ShieldCheck,
  SlidersHorizontal,
  Info,
  AlertTriangle,
  CheckCircle2,
  Lock,
  ArrowRight,
  Clock,
  History,
  RotateCcw,
  Sparkles,
  Users,
  Layers,
  FileText,
  Save,
  Check,
  AlertCircle,
  HelpCircle,
  Building,
  DollarSign,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { TierBadge } from '@/components/ui/tier-badge';
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useDiscountRules, useDiscountAuditLogs, useUpdateDiscountRules } from '@/hooks/use-dealflow';
import { useToast } from '@/components/providers/query-provider';
import { DiscountPolicyConfig } from '@/types/dealflow';

// Zod validation schema for discount rules configuration form
const discountRulesSchema = z
  .object({
    bronzeLimit: z.coerce
      .number()
      .min(0, 'Minimum discount is 0%')
      .max(100, 'Maximum discount is 100%'),
    silverLimit: z.coerce
      .number()
      .min(0, 'Minimum discount is 0%')
      .max(100, 'Maximum discount is 100%'),
    goldLimit: z.coerce
      .number()
      .min(0, 'Minimum discount is 0%')
      .max(100, 'Maximum discount is 100%'),
    hardwareLimit: z.coerce
      .number()
      .min(0, 'Minimum discount is 0%')
      .max(100, 'Maximum discount is 100%'),
    servicesLimit: z.coerce
      .number()
      .min(0, 'Minimum discount is 0%')
      .max(100, 'Maximum discount is 100%'),
    highRiskThresholdPoints: z.coerce
      .number()
      .min(1, 'Threshold must be at least 1 percentage point')
      .max(50, 'Threshold cannot exceed 50 percentage points'),
    changedBy: z.string().min(3, 'Author name is required'),
    justificationReason: z.string().min(8, 'Please provide an audit justification reason (min 8 characters)'),
  })
  .refine((data) => data.bronzeLimit <= data.silverLimit, {
    message: 'Bronze tier limit cannot exceed Silver tier limit',
    path: ['bronzeLimit'],
  })
  .refine((data) => data.silverLimit <= data.goldLimit, {
    message: 'Silver tier limit cannot exceed Gold tier limit',
    path: ['silverLimit'],
  });

type DiscountRulesFormValues = z.infer<typeof discountRulesSchema>;

export default function DiscountRulesSettingsPage() {
  const { toast } = useToast();
  const { data: currentRules, isLoading: loadingRules } = useDiscountRules();
  const { data: auditLogs = [], isLoading: loadingAudits } = useDiscountAuditLogs();
  const updateMutation = useUpdateDiscountRules();

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingValues, setPendingValues] = useState<DiscountRulesFormValues | null>(null);
  const [auditSearch, setAuditSearch] = useState('');

  // Setup React Hook Form
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<DiscountRulesFormValues>({
    resolver: zodResolver(discountRulesSchema) as any,
    values: currentRules
      ? {
          bronzeLimit: currentRules.tierLimits.Bronze,
          silverLimit: currentRules.tierLimits.Silver,
          goldLimit: currentRules.tierLimits.Gold,
          hardwareLimit: currentRules.categoryLimits.Hardware,
          servicesLimit: currentRules.categoryLimits.Services,
          highRiskThresholdPoints: currentRules.workflowRules.highRiskThresholdPoints,
          changedBy: 'Sarah Sterling (Finance Controller)',
          justificationReason: '',
        }
      : undefined,
  });

  const watchedValues = watch();

  // Handle Form Submission (opens confirmation modal)
  const onFormSubmit = (data: DiscountRulesFormValues) => {
    setPendingValues(data);
    setIsConfirmOpen(true);
  };

  // Confirm and save changes
  const handleConfirmSave = async () => {
    if (!pendingValues || !currentRules) return;

    try {
      const updatedConfig: DiscountPolicyConfig = {
        ...currentRules,
        tierLimits: {
          Bronze: pendingValues.bronzeLimit,
          Silver: pendingValues.silverLimit,
          Gold: pendingValues.goldLimit,
        },
        categoryLimits: {
          Hardware: pendingValues.hardwareLimit,
          Services: pendingValues.servicesLimit,
        },
        workflowRules: {
          ...currentRules.workflowRules,
          highRiskThresholdPoints: pendingValues.highRiskThresholdPoints,
        },
      };

      await updateMutation.mutateAsync({
        config: updatedConfig,
        changedBy: pendingValues.changedBy,
        reason: pendingValues.justificationReason,
      });

      toast({
        title: 'Discount Rules Updated',
        description: 'New customer tier and category discount ceilings have been activated.',
        type: 'success',
      });

      setIsConfirmOpen(false);
      setPendingValues(null);
      reset({
        ...pendingValues,
        justificationReason: '',
      });
    } catch {
      toast({
        title: 'Update Failed',
        description: 'Unable to save discount rules to governance engine.',
        type: 'error',
      });
    }
  };

  // Filter audit logs
  const filteredAudits = auditLogs.filter((a) => {
    const q = auditSearch.toLowerCase();
    return (
      a.rule.toLowerCase().includes(q) ||
      a.changedBy.toLowerCase().includes(q) ||
      (a.reason && a.reason.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-8 pb-16">
      {/* 1. Header */}
      <div className="border-b border-slate-200 pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Commercial Governance
            </span>
            <span className="text-xs text-slate-500 font-mono">System Policy Engine v2.4</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 mt-1">
            Commercial Discount Rules & Policy Configuration
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-3xl">
            Configure customer tier maximum concessions, category discount ceilings, and deterministic approval routing workflows.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Deterministic Policy Active
          </span>
        </div>
      </div>

      {/* 2. Core Governance Formula Explainer (Crucial Rule Explanation) */}
      <Card className="border-teal-200 bg-linear-to-br from-teal-50/50 via-white to-slate-50 shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                fx
              </div>
              <div>
                <CardTitle className="text-base font-bold text-slate-900">
                  Effective Discount Limit Formula
                </CardTitle>
                <CardDescription className="text-xs text-slate-600">
                  Deterministic mathematical principle governing all quotation line items
                </CardDescription>
              </div>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-1 rounded bg-teal-100 text-teal-800 border border-teal-200">
              Strict Mathematical Precedence
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg bg-white border border-teal-200 shadow-2xs text-center">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Deterministic Calculation
            </div>
            <div className="text-lg md:text-xl font-mono font-extrabold text-teal-900">
              Effective Discount Limit = minimum(Customer Tier Limit, Category Limit)
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Example 1: Gold + Hardware
              </div>
              <p className="text-slate-600">
                Gold Tier (15%) on Laptop Pro 14 (Hardware 15%).
              </p>
              <div className="font-mono font-bold text-emerald-700 pt-1">
                min(15%, 15%) = 15% Allowed
              </div>
            </div>

            <div className="p-3 bg-white rounded-lg border border-amber-200 bg-amber-50/30 space-y-1">
              <div className="font-bold text-amber-950 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Example 2: Gold + Services (Critical!)
              </div>
              <p className="text-slate-600">
                Gold Tier (15%) on Onsite Setup (Services 10%).
              </p>
              <div className="font-mono font-bold text-amber-800 pt-1">
                min(15%, 10%) = 10% Allowed
              </div>
            </div>

            <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Example 3: Silver + Hardware
              </div>
              <p className="text-slate-600">
                Silver Tier (10%) on Laptop Pro 14 (Hardware 15%).
              </p>
              <div className="font-mono font-bold text-blue-800 pt-1">
                min(10%, 15%) = 10% Allowed
              </div>
            </div>
          </div>

          {/* Mandatory Governance Callout */}
          <div className="p-3.5 bg-amber-50 rounded-lg border border-amber-300 text-xs text-amber-900 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold block mb-0.5 text-amber-950">
                Mandatory Governance Rule: Customer Tier Never Bypasses Approval Rules
              </strong>
              <span>
                Gold customer priority communicates enterprise strategic standing, but category discount ceilings take strict precedence. If a Gold client requests 18% on a Service item (10% ceiling), it is flagged as <strong>+8 percentage points OVER LIMIT</strong> and mandates joint Finance Controller sign-off.
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Customer Tier Rules & Category Rules (Current Live Policies) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Tier Rules */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-teal-600" />
                  Customer Tier Rules
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  System-assigned commercial ceilings based on lifetime spend and credit rating
                </CardDescription>
              </div>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                3 Active Tiers
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Bronze Card */}
            <div className="p-3.5 rounded-lg border border-orange-200 bg-orange-50/20 flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <TierBadge tier="Bronze" />
                  <span className="text-xs font-semibold text-slate-800">Introductory Core Tier</span>
                </div>
                <p className="text-xs text-slate-500">
                  Spend &lt; $100,000. Default introductory qualification.
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-extrabold font-mono text-orange-900">
                  {currentRules ? `${currentRules.tierLimits.Bronze}%` : '5%'}
                </div>
                <span className="text-[11px] text-slate-500 font-medium">Max Discount Ceiling</span>
              </div>
            </div>

            {/* Silver Card */}
            <div className="p-3.5 rounded-lg border border-slate-300 bg-slate-50/50 flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <TierBadge tier="Silver" />
                  <span className="text-xs font-semibold text-slate-800">Growth Volume Tier</span>
                </div>
                <p className="text-xs text-slate-500">
                  Spend ≥ $100,000, 1+ closed deals, A credit rating.
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-extrabold font-mono text-slate-800">
                  {currentRules ? `${currentRules.tierLimits.Silver}%` : '10%'}
                </div>
                <span className="text-[11px] text-slate-500 font-medium">Max Discount Ceiling</span>
              </div>
            </div>

            {/* Gold Card */}
            <div className="p-3.5 rounded-lg border border-amber-300 bg-amber-50/30 flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <TierBadge tier="Gold" />
                  <span className="text-xs font-semibold text-amber-950">Strategic Enterprise Tier</span>
                </div>
                <p className="text-xs text-slate-600">
                  Spend ≥ $300,000, 3+ closed deals, AAA/AA credit rating.
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-extrabold font-mono text-amber-900">
                  {currentRules ? `${currentRules.tierLimits.Gold}%` : '15%'}
                </div>
                <span className="text-[11px] text-amber-800 font-medium">Max Discount Ceiling</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Product Category Rules */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-teal-600" />
                  Product Category Ceilings
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Category-level discount caps designed for gross margin preservation
                </CardDescription>
              </div>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                2 Categories
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Hardware Card */}
            <div className="p-4 rounded-lg border border-blue-200 bg-blue-50/20 flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                    Hardware
                  </span>
                  <span className="text-xs font-semibold text-slate-800">Physical Workstations & Docks</span>
                </div>
                <p className="text-xs text-slate-500">
                  Factory supply chain, OEM component costs, volume delivery agreements.
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-extrabold font-mono text-blue-900">
                  {currentRules ? `${currentRules.categoryLimits.Hardware}%` : '15%'}
                </div>
                <span className="text-[11px] text-slate-500 font-medium">Category Ceiling</span>
              </div>
            </div>

            {/* Services Card */}
            <div className="p-4 rounded-lg border border-purple-200 bg-purple-50/20 flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
                    Services
                  </span>
                  <span className="text-xs font-semibold text-slate-800">Engineering, Deployment & SLAs</span>
                </div>
                <p className="text-xs text-slate-500">
                  Engineering labor, onsite provisioning, recurring SLA obligations.
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-extrabold font-mono text-purple-900">
                  {currentRules ? `${currentRules.categoryLimits.Services}%` : '10%'}
                </div>
                <span className="text-[11px] text-purple-800 font-medium">Category Ceiling</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
              <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <span>
                <strong>Margin Protection Rationale:</strong> Services carry high direct engineering costs and lower gross margins than standardized hardware. Therefore, the Services ceiling is strictly pinned at 10%.
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 4. Workflow Rules Section */}
      <Card className="border-slate-200 shadow-xs">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                Workflow Approval Escalation Rules
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Automated deal governance routing hierarchy based on variance and concession risk
              </CardDescription>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
              4 Hierarchy Tiers
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Rule 1: Within Limit */}
            <div className="p-4 rounded-lg border border-emerald-200 bg-emerald-50/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 px-2 py-0.5 rounded bg-emerald-100 border border-emerald-200">
                  Within Limit
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-sm font-bold text-slate-900">
                No Approval Required
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Requested discount $\le$ Effective Limit. Deal qualifies for <strong>Straight-Through Processing</strong> with instant client quotation generation.
              </p>
              <div className="pt-2 border-t border-emerald-200/60 text-[11px] font-mono text-emerald-800">
                Status: Auto-Approved
              </div>
            </div>

            {/* Rule 2: Over Limit */}
            <div className="p-4 rounded-lg border border-blue-200 bg-blue-50/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-800 px-2 py-0.5 rounded bg-blue-100 border border-blue-200">
                  Over Limit
                </span>
                <Clock className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-sm font-bold text-slate-900">
                Sales Manager Sign-Off
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Requested discount exceeds Effective Limit by up to +{currentRules?.workflowRules.highRiskThresholdPoints ?? 5}% points. Routes to Sales Desk Director.
              </p>
              <div className="pt-2 border-t border-blue-200/60 text-[11px] font-mono text-blue-800">
                Level: Sales Desk
              </div>
            </div>

            {/* Rule 3: High Risk */}
            <div className="p-4 rounded-lg border border-rose-200 bg-rose-50/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-800 px-2 py-0.5 rounded bg-rose-100 border border-rose-200">
                  High Risk
                </span>
                <AlertTriangle className="w-4 h-4 text-rose-600" />
              </div>
              <div className="text-sm font-bold text-slate-900">
                Sales Manager + Finance
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Excess exceeds +{currentRules?.workflowRules.highRiskThresholdPoints ?? 5}% points OR total discount exceeds $15,000. Mandates joint Finance Controller sign-off.
              </p>
              <div className="pt-2 border-t border-rose-200/60 text-[11px] font-mono text-rose-800">
                Level: Finance Controller
              </div>
            </div>

            {/* Rule 4: Mixed Category */}
            <div className="p-4 rounded-lg border border-purple-200 bg-purple-50/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-800 px-2 py-0.5 rounded bg-purple-100 border border-purple-200">
                  Mixed Category
                </span>
                <Layers className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-sm font-bold text-slate-900">
                Highest Applicable Risk
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                In mixed bundles with hardware and service lines, the quotation risk evaluates to the <strong>highest severity line item</strong>.
              </p>
              <div className="pt-2 border-t border-purple-200/60 text-[11px] font-mono text-purple-800">
                Rule: Strict Precedence
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 5. Validated Rule Editor (React Hook Form + Zod) */}
      <Card className="border-slate-200 shadow-xs">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Save className="w-4 h-4 text-teal-600" />
                Edit Commercial Rules & Ceilings
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Validated form powered by React Hook Form + Zod with mandatory audit logging
              </CardDescription>
            </div>
            {isDirty && (
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                Unsaved Changes
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Bronze Tier Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <TierBadge tier="Bronze" />
                  Bronze Tier Limit (%)
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    step="1"
                    {...register('bronzeLimit')}
                    className={errors.bronzeLimit ? 'border-rose-400 focus:ring-rose-400' : ''}
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">%</span>
                </div>
                {errors.bronzeLimit && (
                  <p className="text-[11px] text-rose-600 font-medium">{errors.bronzeLimit.message}</p>
                )}
                <span className="text-[11px] text-slate-400">Baseline for introductory accounts</span>
              </div>

              {/* Silver Tier Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <TierBadge tier="Silver" />
                  Silver Tier Limit (%)
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    step="1"
                    {...register('silverLimit')}
                    className={errors.silverLimit ? 'border-rose-400 focus:ring-rose-400' : ''}
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">%</span>
                </div>
                {errors.silverLimit && (
                  <p className="text-[11px] text-rose-600 font-medium">{errors.silverLimit.message}</p>
                )}
                <span className="text-[11px] text-slate-400">Mid-market volume accounts</span>
              </div>

              {/* Gold Tier Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <TierBadge tier="Gold" />
                  Gold Tier Limit (%)
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    step="1"
                    {...register('goldLimit')}
                    className={errors.goldLimit ? 'border-rose-400 focus:ring-rose-400' : ''}
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">%</span>
                </div>
                {errors.goldLimit && (
                  <p className="text-[11px] text-rose-600 font-medium">{errors.goldLimit.message}</p>
                )}
                <span className="text-[11px] text-slate-400">Strategic enterprise partners</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2 border-t border-slate-100">
              {/* Hardware Ceiling */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 block">
                  Hardware Category Ceiling (%)
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    step="1"
                    {...register('hardwareLimit')}
                    className={errors.hardwareLimit ? 'border-rose-400 focus:ring-rose-400' : ''}
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">%</span>
                </div>
                {errors.hardwareLimit && (
                  <p className="text-[11px] text-rose-600 font-medium">{errors.hardwareLimit.message}</p>
                )}
                <span className="text-[11px] text-slate-400">Applies to laptops, docking stations, hardware</span>
              </div>

              {/* Services Ceiling */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 block">
                  Services Category Ceiling (%)
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    step="1"
                    {...register('servicesLimit')}
                    className={errors.servicesLimit ? 'border-rose-400 focus:ring-rose-400' : ''}
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">%</span>
                </div>
                {errors.servicesLimit && (
                  <p className="text-[11px] text-rose-600 font-medium">{errors.servicesLimit.message}</p>
                )}
                <span className="text-[11px] text-slate-400">Applies to onsite setup, engineering, SLAs</span>
              </div>

              {/* High Risk Excess Points */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 block">
                  High Risk Excess Trigger (+points)
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    step="1"
                    {...register('highRiskThresholdPoints')}
                    className={errors.highRiskThresholdPoints ? 'border-rose-400 focus:ring-rose-400' : ''}
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">pts</span>
                </div>
                {errors.highRiskThresholdPoints && (
                  <p className="text-[11px] text-rose-600 font-medium">{errors.highRiskThresholdPoints.message}</p>
                )}
                <span className="text-[11px] text-slate-400">Excess points triggering Finance sign-off</span>
              </div>
            </div>

            {/* Audit Author & Justification */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-slate-100">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 block">
                  Authorized Administrator / Officer
                </label>
                <Input
                  type="text"
                  {...register('changedBy')}
                  className={errors.changedBy ? 'border-rose-400 focus:ring-rose-400' : ''}
                />
                {errors.changedBy && (
                  <p className="text-[11px] text-rose-600 font-medium">{errors.changedBy.message}</p>
                )}
                <span className="text-[11px] text-slate-400">Recorded in immutable audit trail</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 block">
                  Audit Justification Reason <span className="text-rose-600">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Q4 margin optimization and enterprise hardware guideline adjustment"
                  {...register('justificationReason')}
                  className={errors.justificationReason ? 'border-rose-400 focus:ring-rose-400' : ''}
                />
                {errors.justificationReason && (
                  <p className="text-[11px] text-rose-600 font-medium">{errors.justificationReason.message}</p>
                )}
                <span className="text-[11px] text-slate-400">Required for compliance validation</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => reset()}
                disabled={!isDirty || updateMutation.isPending}
              >
                Discard Changes
              </Button>

              <Button
                type="submit"
                disabled={updateMutation.isPending}
                className="bg-teal-600 hover:bg-teal-700 text-white gap-1.5 shadow-xs"
              >
                <Save className="w-4 h-4" />
                Review & Save Policy Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 6. Confirmation Modal Before Saving Important Rule Changes */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-200 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle>Confirm Commercial Policy Revision</DialogTitle>
              <DialogDescription>
                Review rule modifications before applying changes to the active governance engine.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 my-2">
          <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
            <div className="bg-slate-50 font-semibold px-3 py-2 text-slate-700 border-b border-slate-200 grid grid-cols-3">
              <span>Rule Name</span>
              <span className="text-center">Current Value</span>
              <span className="text-right">New Value</span>
            </div>
            <div className="divide-y divide-slate-100">
              <div className="px-3 py-2 grid grid-cols-3">
                <span className="font-medium text-slate-800">Bronze Tier Limit</span>
                <span className="text-center font-mono text-slate-500">{currentRules?.tierLimits.Bronze}%</span>
                <span className="text-right font-mono font-bold text-teal-700">{pendingValues?.bronzeLimit}%</span>
              </div>
              <div className="px-3 py-2 grid grid-cols-3">
                <span className="font-medium text-slate-800">Silver Tier Limit</span>
                <span className="text-center font-mono text-slate-500">{currentRules?.tierLimits.Silver}%</span>
                <span className="text-right font-mono font-bold text-teal-700">{pendingValues?.silverLimit}%</span>
              </div>
              <div className="px-3 py-2 grid grid-cols-3">
                <span className="font-medium text-slate-800">Gold Tier Limit</span>
                <span className="text-center font-mono text-slate-500">{currentRules?.tierLimits.Gold}%</span>
                <span className="text-right font-mono font-bold text-teal-700">{pendingValues?.goldLimit}%</span>
              </div>
              <div className="px-3 py-2 grid grid-cols-3">
                <span className="font-medium text-slate-800">Hardware Ceiling</span>
                <span className="text-center font-mono text-slate-500">{currentRules?.categoryLimits.Hardware}%</span>
                <span className="text-right font-mono font-bold text-teal-700">{pendingValues?.hardwareLimit}%</span>
              </div>
              <div className="px-3 py-2 grid grid-cols-3">
                <span className="font-medium text-slate-800">Services Ceiling</span>
                <span className="text-center font-mono text-slate-500">{currentRules?.categoryLimits.Services}%</span>
                <span className="text-right font-mono font-bold text-teal-700">{pendingValues?.servicesLimit}%</span>
              </div>
              <div className="px-3 py-2 grid grid-cols-3">
                <span className="font-medium text-slate-800">High Risk Excess Trigger</span>
                <span className="text-center font-mono text-slate-500">+{currentRules?.workflowRules.highRiskThresholdPoints} pts</span>
                <span className="text-right font-mono font-bold text-teal-700">+{pendingValues?.highRiskThresholdPoints} pts</span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
            <div className="text-slate-500 font-semibold">Audit Justification:</div>
            <div className="text-slate-800 italic">&ldquo;{pendingValues?.justificationReason}&rdquo;</div>
            <div className="text-[11px] text-slate-400 pt-1">Authorized By: {pendingValues?.changedBy}</div>
          </div>

          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              <strong>Immediate Enforcement:</strong> Revised rules will immediately apply to all pending discount evaluations and newly drafted quotations.
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsConfirmOpen(false)}
            disabled={updateMutation.isPending}
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={handleConfirmSave}
            disabled={updateMutation.isPending}
            className="bg-teal-600 hover:bg-teal-700 text-white gap-1.5"
          >
            {updateMutation.isPending ? 'Applying Policy...' : 'Confirm Policy Revision'}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* 7. Audit Section (Policy Change Ledger) */}
      <Card className="border-slate-200 shadow-xs">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <History className="w-4 h-4 text-teal-600" />
                Discount Rule Audit Ledger
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Immutable chronological log of all policy modifications and administrative authorizations
              </CardDescription>
            </div>
            <div className="w-full sm:w-64">
              <Input
                type="text"
                placeholder="Search audit trail..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                className="text-xs py-1.5"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="text-xs font-semibold text-slate-700">Rule</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-700">Category</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-700 text-center">Previous</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-700 text-center">New Value</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-700">Changed By</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-700">Timestamp</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-700">Justification</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAudits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-xs text-slate-500">
                      No audit records match your search criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAudits.map((entry) => (
                    <TableRow key={entry.id} className="hover:bg-slate-50/50">
                      <TableCell className="font-semibold text-xs text-slate-900">
                        {entry.rule}
                      </TableCell>
                      <TableCell>
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {entry.category}
                        </span>
                      </TableCell>
                      <TableCell className="text-center font-mono text-xs text-slate-500">
                        {entry.previousValue}
                      </TableCell>
                      <TableCell className="text-center font-mono text-xs font-bold text-teal-700">
                        {entry.newValue}
                      </TableCell>
                      <TableCell className="text-xs text-slate-700">
                        {entry.changedBy}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-slate-500">
                        {entry.timestamp}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600 max-w-xs truncate" title={entry.reason}>
                        {entry.reason || 'Standard operational update'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
