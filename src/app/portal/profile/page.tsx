"use client";
import { useState } from "react";
import { useAuth } from '@/lib/auth';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { request } from "@/lib/http/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/providers/query-provider";
import { ManageSubscriptionDialog } from "@/components/subscriptions/manage-subscription-dialog";
type Profile = {
  user: { firstName: string; lastName: string; email: string };
  customer: { name: string; tier: string; industry: string | null };
};
export default function CustomerProfilePage() {
  const query = useQuery({
    queryKey: ["customer-profile"],
    queryFn: () => request<Profile>("/api/customer/profile"),
  });
  const client = useQueryClient();
  const {refreshUser}=useAuth();
  const { toast } = useToast();
  const [changes, setChanges] = useState<Record<string, string>>({});
  const save = useMutation({
    mutationFn: () =>
      request("/api/customer/profile", {
        method: "PATCH",
        body: JSON.stringify(changes),
      }),
    onSuccess: () => {
      void client.invalidateQueries();
      void refreshUser();
      setChanges({});
      toast({ title: "Profile saved", type: "success" });
    },
  });
  if (query.isLoading) return <p>Loading profile...</p>;
  if (query.error || !query.data)
    return <p role="alert">{query.error?.message ?? "Profile unavailable"}</p>;
  const profile = query.data;
  const values = {
    firstName: profile.user.firstName,
    lastName: profile.user.lastName,
    companyName: profile.customer.name,
    industry: profile.customer.industry ?? "",
  };
  const [subModalOpen, setSubModalOpen] = useState(false);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Organization & Account Profile</h1>

      {/* Commercial Customer Tier vs SaaS Plan Separation Card */}
      <Card className="border-teal-100 bg-gradient-to-br from-teal-50/50 to-white">
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] text-teal-800 uppercase tracking-wider font-bold">
                System-Assigned Commercial Tier
              </span>
              <h2 className="text-lg font-bold text-slate-950 flex items-center gap-2">
                Tier: {profile.customer.tier}
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Evaluated systematically based on lifetime spend, credit health, and transaction frequency.
              </p>
            </div>
            <Button
              onClick={() => setSubModalOpen(true)}
              className="bg-teal-600 hover:bg-teal-700 text-white text-xs shrink-0 self-start sm:self-auto"
            >
              Upgrade / Change Subscription Plan (Prorated)
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-semibold text-slate-900">User & Contact Details</h3>
            <p className="text-xs text-slate-500">{profile.user.email}</p>
          </div>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate();
            }}
          >
            {Object.entries(values).map(([key, value]) => (
              <label key={key} className="block">
                {
                  {
                    firstName: "First name",
                    lastName: "Last name",
                    companyName: "Company",
                    industry: "Industry",
                  }[key]
                }
                <Input
                  required={key !== "industry"}
                  value={changes[key] ?? value}
                  onChange={(e) =>
                    setChanges({ ...changes, [key]: e.target.value })
                  }
                />
              </label>
            ))}
            <Button
              disabled={save.isPending || !Object.keys(changes).length}
              type="submit"
            >
              Save profile
            </Button>
            {save.error && (
              <p role="alert" className="text-red-700">
                {save.error.message}
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      <ManageSubscriptionDialog
        open={subModalOpen}
        onOpenChange={setSubModalOpen}
        currentPlan="STARTER"
        onPlanChange={() => {
          client.invalidateQueries();
        }}
      />
    </div>
  );
}
