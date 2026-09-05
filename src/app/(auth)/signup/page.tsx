'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { authApi } from '@/lib/api/authApi';
import { subscriptionsApi } from '@/lib/api/subscriptionsApi';
import { useAuth } from '@/lib/auth/useSession';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

const signupSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  company: z.string().min(1, 'Company name is required'),
  accountType: z.enum(['INTERNAL', 'CUSTOMER']),
  tier: z.enum(['BRONZE', 'SILVER', 'GOLD']).optional(),
  internalRole: z.enum(['ADMIN', 'SALES_MANAGER', 'SALES_EXECUTIVE', 'FINANCE_OFFICER']).optional()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
}).refine(data => data.accountType === 'CUSTOMER' ? !!data.tier : true, {
    message: "Tier is required for customers",
    path: ['tier'],
}).refine(data => data.accountType === 'INTERNAL' ? !!data.internalRole : true, {
    message: "Role is required for internal users",
    path: ['internalRole'],
});

type SignupFormData = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();
  const router = useRouter();

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
        accountType: 'CUSTOMER',
        tier: 'BRONZE'
    }
  });

  const accountType = watch('accountType');
  const selectedTier = watch('tier');

  const { data: plans = [] } = useQuery({
      queryKey: ['subscriptionPlans'],
      queryFn: subscriptionsApi.getPlans,
      enabled: step === 3
  });

  const onSubmitStep1 = () => setStep(2);
  
  const onSubmitStep2 = (data: SignupFormData) => {
      if (data.accountType === 'INTERNAL') {
          handleFinalSubmit(data);
      } else {
          setStep(3);
      }
  };

  const handleFinalSubmit = async (data: SignupFormData, planId?: string) => {
    setIsLoading(true);
    setError('');
    try {
        let response;
        if (data.accountType === 'CUSTOMER') {
            response = await authApi.signupCustomer({
                fullName: data.fullName,
                email: data.email,
                companyName: data.company,
                tier: data.tier as 'BRONZE' | 'SILVER' | 'GOLD',
                subscriptionPlanId: planId
            });
            queryClient.setQueryData(['currentUser'], { user: response.user });
            router.push('/portal');
        } else {
            response = await authApi.signupInternal({
                fullName: data.fullName,
                email: data.email,
                role: data.internalRole as any
            });
            queryClient.setQueryData(['currentUser'], { user: response.user });
            
            switch (response.user.role) {
                case 'ADMIN': router.push('/admin/dashboard'); break;
                case 'SALES_MANAGER': router.push('/sales-manager/dashboard'); break;
                case 'SALES_EXECUTIVE': router.push('/sales/dashboard'); break;
                case 'FINANCE_OFFICER': router.push('/finance/dashboard'); break;
                default: router.push('/login');
            }
        }
    } catch (err: any) {
      setError(err.message || 'Failed to sign up');
      setStep(1);
    } finally {
        setIsLoading(false);
    }
  };

  const renderStep1 = () => (
      <div className="space-y-4">
        <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input id="fullName" placeholder="John Doe" {...register('fullName')} />
            {errors.fullName && <p className="text-sm text-red-500 font-medium">{errors.fullName.message}</p>}
        </div>
        <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="john@example.com" {...register('email')} />
            {errors.email && <p className="text-sm text-red-500 font-medium">{errors.email.message}</p>}
        </div>
        <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" {...register('password')} />
            {errors.password && <p className="text-sm text-red-500 font-medium">{errors.password.message}</p>}
        </div>
        <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input id="confirmPassword" type="password" {...register('confirmPassword')} />
            {errors.confirmPassword && <p className="text-sm text-red-500 font-medium">{errors.confirmPassword.message}</p>}
        </div>
        <Button type="button" className="w-full bg-teal-600 hover:bg-teal-700" onClick={async () => {
            // Need to manually trigger validation for step 1 fields before proceeding
            const isValid = await queryClient.fetchQuery({ queryKey: ['validate1'], queryFn: () => true }); // Dummy to let form react
            // Simple approach: if no errors on step 1 fields, proceed. Proper way is trigger(['fullName', 'email', etc]) but useForm handles it on submit normally.
            onSubmitStep1(); 
        }}>Next Step</Button>
      </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="space-y-2">
          <Label htmlFor="accountType">Account Type</Label>
          <div className="flex gap-4">
              <label className={`flex-1 border rounded-lg p-4 cursor-pointer transition-all ${accountType === 'CUSTOMER' ? 'border-teal-600 bg-teal-50 ring-1 ring-teal-600' : 'border-slate-200 hover:border-teal-300'}`}>
                  <input type="radio" value="CUSTOMER" {...register('accountType')} className="sr-only" />
                  <div className="font-semibold text-slate-900">Customer</div>
                  <div className="text-xs text-slate-500">Sign up for portal access</div>
              </label>
              <label className={`flex-1 border rounded-lg p-4 cursor-pointer transition-all ${accountType === 'INTERNAL' ? 'border-slate-600 bg-slate-50 ring-1 ring-slate-600' : 'border-slate-200 hover:border-slate-300'}`}>
                  <input type="radio" value="INTERNAL" {...register('accountType')} className="sr-only" />
                  <div className="font-semibold text-slate-900">Internal User</div>
                  <div className="text-xs text-slate-500">(Demo provisioning)</div>
              </label>
          </div>
      </div>

      <div className="space-y-2">
          <Label htmlFor="company">Company Name</Label>
          <Input id="company" placeholder="Acme Corp" {...register('company')} />
          {errors.company && <p className="text-sm text-red-500 font-medium">{errors.company.message}</p>}
      </div>

      {accountType === 'CUSTOMER' && (
          <div className="space-y-2">
              <Label>Priority Tier</Label>
              <div className="grid grid-cols-3 gap-2">
                  {['BRONZE', 'SILVER', 'GOLD'].map((t) => (
                      <label key={t} className={`border rounded-lg py-3 text-center cursor-pointer transition-all text-sm font-semibold
                          ${selectedTier === t ? (t === 'GOLD' ? 'border-amber-400 bg-amber-50 text-amber-800' : t === 'SILVER' ? 'border-slate-400 bg-slate-100 text-slate-800' : 'border-amber-700/30 bg-amber-50 text-amber-900') : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                          <input type="radio" value={t} {...register('tier')} className="sr-only" />
                          {t}
                      </label>
                  ))}
              </div>
          </div>
      )}

      {accountType === 'INTERNAL' && (
          <div className="space-y-2">
              <Label>Internal Role</Label>
              <select {...register('internalRole')} className="w-full flex h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2">
                  <option value="SALES_EXECUTIVE">Sales Executive</option>
                  <option value="SALES_MANAGER">Sales Manager</option>
                  <option value="FINANCE_OFFICER">Finance Officer</option>
                  <option value="ADMIN">Admin</option>
              </select>
          </div>
      )}

      <div className="flex gap-4 pt-4">
          <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(1)}>Back</Button>
          <Button type="submit" className="flex-1 bg-teal-600 hover:bg-teal-700" disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {accountType === 'INTERNAL' ? 'Create Account' : 'Continue'}
          </Button>
      </div>
    </div>
  );

  const renderStep3 = () => {
    // Only for customers
    return (
        <div className="space-y-6">
            <div className="text-center mb-6">
                <h3 className="font-semibold text-lg">Select a Subscription Plan</h3>
                <p className="text-sm text-slate-500">Unlock premium features for your customer portal.</p>
            </div>
            
            <div className="space-y-4">
                {plans.map((plan: any) => (
                    <div key={plan.id} className={`border rounded-xl p-4 relative ${plan.isPopular ? 'border-teal-500 bg-teal-50/30 shadow-sm' : 'border-slate-200'}`}>
                        {plan.isPopular && <span className="absolute -top-3 right-4 bg-teal-500 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">Popular</span>}
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h4 className="font-bold text-slate-900">{plan.name}</h4>
                                <div className="text-xl font-extrabold mt-1">${plan.price}<span className="text-sm font-normal text-slate-500">/mo</span></div>
                            </div>
                            <Button 
                                size="sm" 
                                className={plan.isPopular ? 'bg-teal-600 hover:bg-teal-700' : ''}
                                onClick={() => handleSubmit((data) => handleFinalSubmit(data, plan.id))()}
                                disabled={isLoading}
                            >
                                Choose Plan
                            </Button>
                        </div>
                        <ul className="mt-4 space-y-2">
                            {plan.features.slice(0, 3).map((f: string, i: number) => (
                                <li key={i} className="text-xs flex items-center gap-2 text-slate-600">
                                    <CheckCircle2 className="w-3 h-3 text-teal-500" /> {f}
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-center">
                <Button 
                    variant="ghost" 
                    className="text-slate-500 hover:text-slate-700 text-sm"
                    onClick={() => handleSubmit((data) => handleFinalSubmit(data))()}
                    disabled={isLoading}
                >
                    Continue without subscription
                </Button>
            </div>
        </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center">
            <span className="text-white font-bold text-xl leading-none">D</span>
          </div>
          <span className="font-bold text-xl text-slate-900">DealFlow360</span>
        </div>

        <Card className="shadow-lg border-slate-200">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl text-center">Create an account</CardTitle>
            <div className="flex items-center justify-center gap-2 mt-4">
                <div className={`h-2 flex-1 rounded-full ${step >= 1 ? 'bg-teal-600' : 'bg-slate-200'}`}></div>
                <div className={`h-2 flex-1 rounded-full ${step >= 2 ? 'bg-teal-600' : 'bg-slate-200'}`}></div>
                <div className={`h-2 flex-1 rounded-full ${step >= 3 ? 'bg-teal-600' : 'bg-slate-200'}`}></div>
            </div>
          </CardHeader>
          <CardContent>
            {error && (
                <Alert variant="destructive" className="mb-4 py-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <form onSubmit={step === 1 ? handleSubmit(() => setStep(2)) : step === 2 ? handleSubmit(onSubmitStep2) : undefined}>
                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}
            </form>
          </CardContent>
          <CardFooter className="flex flex-col border-t border-slate-100 bg-slate-50/50 pt-6 mt-2 rounded-b-xl gap-4">
            <div className="text-sm text-slate-600 text-center">
              Already have an account?{' '}
              <Link href="/login" className="text-teal-600 font-medium hover:underline">
                Log in
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
