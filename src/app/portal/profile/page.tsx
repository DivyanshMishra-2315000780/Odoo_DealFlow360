'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { request } from '@/lib/http/client';
import { useAuth } from '@/lib/auth';
import { useSubscriptions } from '@/hooks/use-dealflow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/providers/query-provider';

type Profile = {
  user: { firstName: string; lastName: string; email: string };
  customer: { name: string; tier: string; industry: string | null };
};

type SubscriptionPlan = {
  id: string;
  name: string;
  billingCycle: string;
  price: string | number;
};

export default function CustomerProfilePage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const ready = !isAuthLoading && user?.role === 'CUSTOMER' && Boolean(user.customerId);
  const profileQuery = useQuery({
    queryKey: ['customer-profile'],
    queryFn: () => request<Profile>('/api/customer/profile'),
    enabled: ready,
  });
  const plansQuery = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: () => request<SubscriptionPlan[]>('/api/subscription-plans'),
    enabled: ready,
  });
  const { data: subscriptions = [], isLoading: subscriptionsLoading, isError: subscriptionsError } = useSubscriptions(ready);
  const client = useQueryClient();
  const { toast } = useToast();
  const [changes, setChanges] = useState<Record<string, string>>({});
  const save = useMutation({
    mutationFn: () => request('/api/customer/profile', { method: 'PATCH', body: JSON.stringify(changes) }),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['customer-profile'] });
      setChanges({});
      toast({ title: 'Profile saved', type: 'success' });
    },
  });

  if (isAuthLoading || profileQuery.isLoading) return <p>Loading profile...</p>;
  if (profileQuery.error || !profileQuery.data) return <p role="alert">{profileQuery.error?.message ?? 'Profile unavailable'}</p>;

  const profile = profileQuery.data;
  const values = {
    firstName: profile.user.firstName,
    lastName: profile.user.lastName,
    companyName: profile.customer.name,
    industry: profile.customer.industry ?? '',
  };
  const currentSubscription = subscriptions.find((subscription) => subscription.status === 'ACTIVE');
  const currentPlanName = currentSubscription?.planName;
  const plans = plansQuery.data ?? [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Organization profile</h1>
      <Card>
        <CardContent className="p-6 space-y-4">
          <p>{profile.user.email} - Commercial tier: {profile.customer.tier}</p>
          <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); save.mutate(); }}>
            {Object.entries(values).map(([key, value]) => (
              <label key={key} className="block">
                <span className="block mb-1 text-sm font-medium">
                  {{ firstName: 'First name', lastName: 'Last name', companyName: 'Company', industry: 'Industry' }[key]}
                </span>
                <Input required={key !== 'industry'} value={changes[key] ?? value} onChange={(event) => setChanges({ ...changes, [key]: event.target.value })} />
              </label>
            ))}
            <Button disabled={save.isPending || !Object.keys(changes).length} type="submit">Save profile</Button>
            {save.error && <p role="alert" className="text-red-700">{save.error.message}</p>}
          </form>
        </CardContent>
      </Card>

      <Card id="subscriptions">
        <CardHeader><CardTitle>Subscription plans</CardTitle></CardHeader>
        <CardContent>
          {plansQuery.isLoading || subscriptionsLoading ? <p className="text-sm text-slate-500">Loading subscription plans...</p> : null}
          {plansQuery.error || subscriptionsError ? <p role="alert" className="text-sm text-rose-700">Unable to load subscription plans.</p> : null}
          {!plansQuery.isLoading && !subscriptionsLoading && !plansQuery.error && !subscriptionsError && plans.length === 0 ? <p className="text-sm text-slate-500">No subscription plans are currently available.</p> : null}
          <div className="grid gap-4 md:grid-cols-3">
            {plans.map((plan) => {
              const isCurrent = plan.name === currentPlanName;
              const isHigher = !isCurrent && Number(plan.price) > Number(currentSubscription?.recurringAmount ?? 0);
              return (
                <div key={plan.id} className={`rounded-lg border p-4 ${isCurrent ? 'border-teal-500 bg-teal-50' : 'border-slate-200'}`}>
                  <h3 className="font-semibold">{plan.name}</h3>
                  <p className="mt-2 text-xl font-bold">${Number(plan.price).toLocaleString()} <span className="text-xs font-normal">/{plan.billingCycle.toLowerCase()}</span></p>
                  <p className="mt-3 text-xs font-semibold text-slate-600">{isCurrent ? 'Current plan' : isHigher ? 'Upgrade available' : 'Available plan'}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
