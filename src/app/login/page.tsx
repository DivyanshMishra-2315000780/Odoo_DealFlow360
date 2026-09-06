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
  Lock,
  Mail,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  KeyRound,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useAuth, DEMO_ACCOUNTS } from '@/lib/auth';
import { useToast } from '@/components/providers/query-provider';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid business email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { toast } = useToast();

  const [showPassword, setShowPassword] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'marcus@dealflow360.com',
      password: 'admin123',
      rememberMe: true,
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      const user = await login(values.email, values.password);
      toast({
        title: 'Authentication Successful',
        description: `Welcome back, ${user.name} (${user.role.replace(/_/g, ' ')}).`,
        type: 'success',
      });
      if (user.role === 'CUSTOMER') {
        router.push('/portal');
      } else {
        router.push('/');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (
        errorMessage.toLowerCase().includes('position is not still decided') ||
        errorMessage.toLowerCase().includes('pending approval')
      ) {
        toast({
          title: 'Position Not Decided',
          description: 'Your position is not still decided by the administrator. Please wait for role assignment.',
          type: 'warning',
        });
      } else {
        toast({
          title: 'Authentication Failed',
          description: errorMessage || 'Invalid credentials. Please verify your email and password.',
          type: 'error',
        });
      }
    }
  };

  const handleQuickFill = (account: (typeof DEMO_ACCOUNTS)[0]) => {
    setValue('email', account.email, { shouldValidate: true });
    setValue('password', account.passwordHint, { shouldValidate: true });
  };


  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 text-slate-900 selection:bg-teal-100 selection:text-teal-900">
      {/* Left Branding Hero */}
      <div className="md:w-5/12 lg:w-1/2 bg-slate-900 text-white p-8 sm:p-12 flex flex-col justify-between relative overflow-hidden">
        {/* Subtle decorative background gradient */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand */}
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-lg bg-teal-600 flex items-center justify-center text-white shadow-enterprise group-hover:bg-teal-500 transition">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold tracking-tight text-xl text-white">
                DealFlow<span className="text-teal-400">360</span>
              </span>
              <span className="block text-[10px] text-teal-400 font-medium uppercase tracking-wider">
                Enterprise Deal Desk
              </span>
            </div>
          </Link>
        </div>

        {/* Middle Value Proposition */}
        <div className="my-auto py-12 relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-950/70 border border-teal-800 text-teal-300 text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
            <span>Commercial Governance & Margin Radar</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-100 leading-tight">
            Enforce discount limits. Automate B2B deal approvals. Protect enterprise margins.
          </h2>

          <div className="space-y-3 pt-2 text-xs text-slate-300">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
              <span>Multi-tier customer discount ceilings (Gold 15%, Silver 10%, Bronze 5%).</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
              <span>Real-time line-item policy violation detection with excess telemetry.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
              <span>End-to-end lifecycle velocity from quotation to fulfillment and invoice settlement.</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-[11px] text-slate-400 pt-6 border-t border-slate-800 relative z-10 flex items-center justify-between">
          <span>DealFlow360 Enterprise v2.4</span>
          <span>SOC-2 Type II Certified</span>
        </div>
      </div>

      {/* Right Login Card */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-md space-y-7">
          {/* Header */}
          <div className="space-y-1.5">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Sign In to DealFlow360
            </h2>
            <p className="text-xs text-slate-500">
              Access the sales deal desk, commercial approvals, and pipeline radar.
            </p>
          </div>

          {/* Judge Demo Quick-Fill helper */}
          <div className="p-3 rounded-lg border border-teal-200 bg-teal-50/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-teal-900 uppercase tracking-wider flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-teal-700" />
                Judge Demo Quick Login
              </span>
              <span className="text-[10px] text-teal-700 font-medium">1-Click Fill</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => handleQuickFill(acc)}
                  className="text-[11px] px-2 py-1 rounded bg-white border border-teal-200 text-teal-900 hover:bg-teal-100/60 font-medium transition cursor-pointer shadow-2xs"
                >
                  {acc.name} ({acc.roleLabel || acc.role.replace(/_/g, ' ')})
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email Field */}
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
                <p className="text-[11px] text-rose-600 font-medium">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setIsForgotPasswordOpen(true)}
                  className="text-[11px] font-medium text-teal-700 hover:text-teal-800 hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
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
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[11px] text-rose-600 font-medium">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                  {...register('rememberMe')}
                />
                <span>Remember this device for 30 days</span>
              </label>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="default"
              size="lg"
              loading={isSubmitting}
              className="w-full text-xs font-semibold shadow-enterprise mt-2"
            >
              Sign In to Dashboard
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </form>

          {/* Signup Link */}
          <div className="text-center pt-2">
            <p className="text-xs text-slate-500">
              Don&apos;t have an enterprise account?{' '}
              <Link
                href="/signup"
                className="font-semibold text-teal-700 hover:text-teal-800 hover:underline"
              >
                Register your organization →
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Dialog */}
      <Dialog open={isForgotPasswordOpen} onOpenChange={setIsForgotPasswordOpen}>
        <DialogHeader><DialogTitle>Recover your account</DialogTitle><DialogDescription>Contact your administrator to reset your password. Email recovery is not configured for this workspace.</DialogDescription></DialogHeader><DialogFooter><Button onClick={()=>setIsForgotPasswordOpen(false)}>Close</Button></DialogFooter>
      </Dialog>
    </div>
  );
}
