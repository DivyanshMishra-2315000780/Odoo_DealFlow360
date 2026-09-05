'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { authApi } from '@/lib/api/authApi';
import { useAuth } from '@/lib/auth/useSession';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();
  const router = useRouter();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: 'demo1234' } // Pre-fill password for demo
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError('');
    try {
      const response = await authApi.login(data.email, data.password);
      // Update session query cache which will trigger AuthProvider redirect
      queryClient.setQueryData(['currentUser'], { user: response.user });
      
      // Navigate based on role explicitly here just in case, though AuthProvider handles it
      switch (response.user.role) {
        case 'CUSTOMER': router.push('/portal'); break;
        case 'ADMIN': router.push('/admin/dashboard'); break;
        case 'SALES_MANAGER': router.push('/sales-manager/dashboard'); break;
        case 'SALES_EXECUTIVE': router.push('/sales/dashboard'); break;
        case 'FINANCE_OFFICER': router.push('/finance/dashboard'); break;
        default: router.push('/login');
      }

    } catch (err: any) {
      setError(err.message || 'Failed to login');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center">
            <span className="text-white font-bold text-xl leading-none">D</span>
          </div>
          <span className="font-bold text-xl text-slate-900">DealFlow360</span>
        </div>

        <Card className="shadow-lg border-slate-200">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl text-center">Log in to your account</CardTitle>
            <CardDescription className="text-center">
              Enter your email and password to continue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="sales@dealflow360.com" 
                  {...register('email')} 
                />
                {errors.email && (
                  <p className="text-sm text-red-500 font-medium">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <a href="#" className="text-sm text-teal-600 hover:underline">Forgot password?</a>
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  {...register('password')} 
                />
                {errors.password && (
                  <p className="text-sm text-red-500 font-medium">{errors.password.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700" disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Log In
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col border-t border-slate-100 bg-slate-50/50 pt-6 mt-2 rounded-b-xl gap-4">
            <div className="text-sm text-slate-600 text-center">
              Don't have an account?{' '}
              <Link href="/signup" className="text-teal-600 font-medium hover:underline">
                Sign up
              </Link>
            </div>

            <div className="w-full text-xs text-slate-500 p-4 bg-white border border-slate-200 rounded-lg">
              <p className="font-semibold mb-2">Demo Credentials (Password: demo1234)</p>
              <ul className="space-y-1">
                <li>Sales Exec: <code>sales@dealflow360.com</code></li>
                <li>Sales Mgr: <code>manager@dealflow360.com</code></li>
                <li>Finance: <code>finance@dealflow360.com</code></li>
                <li>Admin: <code>admin@dealflow360.com</code></li>
                <li>Customer: <code>customer@acme.com</code></li>
              </ul>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
