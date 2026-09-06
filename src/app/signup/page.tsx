'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Sparkles,
  Eye,
  EyeOff,
  Building,
  User,
  Mail,
  Lock,
  Crown,
  Shield,
  Award,
  CheckCircle2,
  ArrowRight,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CustomerTier } from '@/types/dealflow';
import { SubscriptionPlan } from '@/types/auth';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/components/providers/query-provider';

const signupSchema = z
  .object({
    fullName: z.string().min(2, 'Full Name must be at least 2 characters'),
    email: z.email('Please enter a valid business email address'),
    company: z.string().min(2, 'Company name is required'),
    password: z.string().min(10).max(128)
        .regex(/[a-z]/, 'Password must contain a lowercase letter')
        .regex(/[A-Z]/, 'Password must contain an uppercase letter')
        .regex(/[0-9]/, 'Password must contain a number')
        .regex(/[^A-Za-z0-9]/, 'Password must contain a special character'),
    confirmPassword: z.string().min(10).max(128)
        .regex(/[a-z]/, 'Password must contain a lowercase letter')
        .regex(/[A-Z]/, 'Password must contain an uppercase letter')
        .regex(/[0-9]/, 'Password must contain a number')
        .regex(/[^A-Za-z0-9]/, 'Password must contain a special character'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type SignupFormValues = z.infer<typeof signupSchema>;

interface SubscriptionCard {
  id: SubscriptionPlan;
  title: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  popular?: boolean;
}

const SUBSCRIPTION_PLANS: SubscriptionCard[] = [
  {
    id: 'STARTER',
    title: 'Starter Deal Desk',
    price: '$499',
    period: '/month',
    description: 'Essential discount policy rules & standard quotation workflow.',
    features: [
      'Up to 5 Deal Managers',
      'Automated Tier Limit Enforcement',
      'Standard Quotation Generation',
      'Email Support SLA (24h)',
    ],
  },
  {
    id: 'PROFESSIONAL',
    title: 'Professional Suite',
    price: '$1,499',
    period: '/month',
    description: 'Advanced margin radar, multi-level approvals & counter-offers.',
    features: [
      'Up to 25 Commercial Approvers',
      'Interactive Negotiation Simulator',
      'Real-time Margin Dilution Radar',
      'ERP / Invoicing Pipeline Sync',
      'Priority SLA (4h response)',
    ],
    popular: true,
  },
  {
    id: 'ENTERPRISE',
    title: 'Global Enterprise',
    price: '$3,999',
    period: '/month',
    description: 'Custom governance matrices, dedicated deal desk & audit compliance.',
    features: [
      'Unlimited Commercial Users',
      'Executive Dual-Signoff Escalation',
      'Custom Tier & Category Matrix Engine',
      'Full Audit Trail Compliance Export',
      'Dedicated Account Director & 1h SLA',
    ],
  },
];

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();
  const { toast } = useToast();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>('NONE');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: '',
      email: '',
      company: '',
      password: '',
      confirmPassword: '',
    },
  });

  const handleQuickFillAcme = () => {
    setValue('fullName', 'Sarah Jenkins');
    setValue('email', 's.jenkins@acmecorp.com');
    setValue('company', 'Acme Corporation');
    setValue('password', 'acme123');
    setValue('confirmPassword', 'acme123');
    toast({
      title: 'Demo Data Prefilled',
      description: 'Acme Corporation credentials filled (System will qualify as Gold Tier).',
      type: 'info',
    });
  };

  const onSubmit = async (values: SignupFormValues) => {
    try {
      const user = await signup({
        fullName: values.fullName,
        email: values.email,
        company: values.company,
        password: values.password,
        tier:'Bronze',
        subscriptionPlan: selectedPlan,
      });

      toast({
        title: 'Account Registered',
        description: `Welcome to DealFlow360, ${user.name}. ${user.company} initialized under ${user.tier} Tier governance.`,
        type: 'success',
      });

      router.push('/portal');
    } catch {
      toast({
        title: 'Registration Error',
        description: 'Unable to complete registration. Please verify details.',
        type: 'error',
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-10 px-4 sm:px-6 lg:px-8 selection:bg-teal-100 selection:text-teal-900">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-lg bg-teal-600 flex items-center justify-center text-white shadow-enterprise group-hover:bg-teal-700 transition">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 tracking-tight text-xl">
                  DealFlow<span className="text-teal-600">360</span>
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider bg-teal-50 text-teal-700 border border-teal-200 px-1.5 py-0.5 rounded">
                  Enterprise Onboarding
                </span>
              </div>
              <p className="text-xs text-slate-400">Account setup & tier governance configuration</p>
            </div>
          </Link>

          <p className="text-xs text-slate-500">
            Already registered?{' '}
            <Link href="/login" className="font-semibold text-teal-700 hover:text-teal-800 hover:underline">
              Sign In →
            </Link>
          </p>
        </div>

        {/* Quick-Fill Demo Helper */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-teal-50 border border-teal-200 rounded-lg shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-teal-600 animate-ping" />
            <p className="text-xs font-semibold text-teal-950">
              Demo Fast-Track: Register as Acme Corporation (Gold Tier)
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={handleQuickFillAcme}
            className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-enterprise shrink-0"
          >
            ⚡ 1-Click Demo Fill (Acme Corp • Gold)
          </Button>
        </div>

        {/* Signup Form Container */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* SECTION 1: Personal & Corporate Info */}
          <Card>
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-sm uppercase tracking-wider flex items-center gap-2 text-slate-800">
                <User className="w-4 h-4 text-teal-600" />
                1. Account & Organization Credentials
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-3 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <Input
                      type="text"
                      placeholder="e.g. Marcus Vance"
                      className="pl-9"
                      error={Boolean(errors.fullName)}
                      {...register('fullName')}
                    />
                  </div>
                  {errors.fullName && (
                    <p className="text-[11px] text-rose-600">{errors.fullName.message}</p>
                  )}
                </div>

                {/* Email Address */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Corporate Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <Input
                      type="email"
                      placeholder="name@company.com"
                      className="pl-9"
                      error={Boolean(errors.email)}
                      {...register('email')}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-[11px] text-rose-600">{errors.email.message}</p>
                  )}
                </div>

                {/* Company Name */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Company / Organization
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <Input
                      type="text"
                      placeholder="e.g. Acme Corporation"
                      className="pl-9"
                      error={Boolean(errors.company)}
                      {...register('company')}
                    />
                  </div>
                  {errors.company && (
                    <p className="text-[11px] text-rose-600">{errors.company.message}</p>
                  )}
                </div>

                {/* Blank col for symmetry on sm screens */}
                <div className="hidden sm:block" />

                {/* Password */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="pl-9 pr-9"
                      error={Boolean(errors.password)}
                      {...register('password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-[11px] text-rose-600">{errors.password.message}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="pl-9 pr-9"
                      error={Boolean(errors.confirmPassword)}
                      {...register('confirmPassword')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-[11px] text-rose-600">
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SECTION 2: Commercial Tier Governance */}
          <Card>
            <CardHeader className="p-5 pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-sm uppercase tracking-wider flex items-center gap-2 text-slate-800">
                    <Award className="w-4 h-4 text-teal-600" />
                    2. System-Assigned Commercial Tier Qualification
                  </CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Customer Tiers govern maximum discount ceilings and are evaluated automatically by the DealFlow360 qualification matrix.
                  </p>
                </div>
                <span className="text-xs font-semibold font-mono bg-teal-50 text-teal-700 px-2 py-0.5 rounded border border-teal-200">
                  System Automated
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-5 pt-3 space-y-4">
              <div className="p-3.5 rounded-lg border border-teal-200 bg-teal-50/50 text-xs text-teal-950 flex items-start gap-2.5 shadow-2xs">
                <Info className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                <div className="leading-relaxed space-y-1">
                  <p>
                    <strong>Automatic Tier Assignment:</strong> New client organizations initialize at <strong>Bronze Tier (5% cap)</strong>. Verified accounts with spend history (such as Acme Corporation) are automatically recognized as <strong>Gold Tier (15% hardware cap)</strong>.
                  </p>
                  <p className="text-[11px] text-teal-900 font-medium">
                    ⚠️ Mandatory Governance: Customer Gold Tier never bypasses approval rules. Services are strictly capped at 10% regardless of tier.
                  </p>
                </div>
              </div>

              {/* Tier Qualification Matrix Grid - Informational */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                {/* Bronze Card */}
                <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 text-left relative">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-900 border border-orange-200">
                      <Shield className="w-3.5 h-3.5 text-orange-600" />
                      Bronze Tier
                    </span>
                    <span className="font-mono text-xs font-bold text-teal-900">
                      5% Max Cap
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">
                    Default introductory tier for new registrations without prior historical enterprise spend.
                  </p>
                  <div className="mt-3 text-[11px] text-slate-500 font-mono">
                    Criteria: Standard Onboarding
                  </div>
                </div>

                {/* Silver Card */}
                <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 text-left relative">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-200 text-slate-800">
                      <Award className="w-3.5 h-3.5 text-slate-600" />
                      Silver Tier
                    </span>
                    <span className="font-mono text-xs font-semibold text-slate-700">
                      10% Max Cap
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">
                    Unlocked for mid-market accounts with $100k+ annual volume and credit score of A or above.
                  </p>
                  <div className="mt-3 text-[11px] text-slate-500 font-mono">
                    Criteria: $100k+ spend & A credit
                  </div>
                </div>

                {/* Gold Card */}
                <div className="p-4 rounded-lg border border-amber-200 bg-amber-50/30 text-left relative">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300">
                      <Crown className="w-3.5 h-3.5 text-amber-600" />
                      Gold Tier
                    </span>
                    <span className="font-mono text-xs font-semibold text-amber-900">
                      15% Max Cap
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">
                    Premier tier for accounts with $300k+ volume (e.g. Acme Corp). 15% hardware ceiling, 10% services ceiling.
                  </p>
                  <div className="mt-3 text-[11px] text-amber-900 font-mono font-medium">
                    Criteria: $300k+ spend & AAA credit
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SECTION 3: Subscription Selection with Valid Skip Option (Separate Concern) */}
          <Card>
            <CardHeader className="p-5 pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-sm uppercase tracking-wider flex items-center gap-2 text-slate-800">
                    <Sparkles className="w-4 h-4 text-teal-600" />
                    3. Software Subscription Plan (Separate Concern)
                  </CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Governs SaaS platform seats, SLA guarantees, and deal desk features.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPlan('NONE')}
                  className={`text-xs px-3 py-1.5 rounded-md font-semibold border transition cursor-pointer ${
                    selectedPlan === 'NONE'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-enterprise'
                      : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  ✓ Skip Subscription (Free Trial)
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-5 pt-3 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {SUBSCRIPTION_PLANS.map((plan) => {
                  const isSelected = selectedPlan === plan.id;
                  return (
                    <div
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan.id)}
                      className={`flex flex-col justify-between p-5 rounded-lg border text-left transition cursor-pointer relative ${
                        isSelected
                          ? 'border-teal-600 bg-teal-50/20 ring-2 ring-teal-500/20 shadow-enterprise'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {plan.popular && (
                        <div className="absolute -top-2.5 right-4 bg-teal-600 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-2xs">
                          Most Popular
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{plan.title}</h4>
                        <div className="mt-2 flex items-baseline">
                          <span className="text-2xl font-bold font-mono text-slate-900">
                            {plan.price}
                          </span>
                          <span className="text-xs text-slate-500 ml-1">{plan.period}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">{plan.description}</p>
                        <div className="my-4 border-t border-slate-100" />
                        <ul className="space-y-2 text-xs text-slate-600">
                          {plan.features.map((feat) => (
                            <li key={feat} className="flex items-start gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                              <span className="text-[11px] leading-tight">{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="pt-4">
                        <Button
                          type="button"
                          variant={isSelected ? 'default' : 'outline'}
                          size="sm"
                          className="w-full text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPlan(plan.id);
                          }}
                        >
                          {isSelected ? '✓ Selected' : 'Select Plan'}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedPlan === 'NONE' && (
                <div className="p-3 rounded-lg border border-slate-200 bg-slate-100/70 text-xs text-slate-600 flex items-center justify-between">
                  <span>
                    <strong>Subscription skipped.</strong> You will be provisioned on the standard 14-day DealFlow360 trial.
                  </span>
                  <span className="font-semibold text-slate-800">No payment method required</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Final Submit Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-lg border border-slate-200 bg-white shadow-enterprise">
            <div>
              <p className="text-xs font-semibold text-slate-800">
                Ready to deploy your deal governance center?
              </p>
              <p className="text-[11px] text-slate-500">
                By registering, your account is enrolled under DealFlow360 governance rules. Commercial tier re-evaluations occur quarterly.
              </p>
            </div>

            <Button
              type="submit"
              variant="default"
              size="lg"
              loading={isSubmitting}
              className="text-xs font-semibold shadow-enterprise shrink-0"
            >
              Complete Registration & Access Dashboard
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
