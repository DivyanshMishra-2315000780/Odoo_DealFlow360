"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { request } from "@/lib/http/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/providers/query-provider";
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
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Organization profile</h1>
      <Card>
        <CardContent className="p-6 space-y-4">
          <p>
            {profile.user.email} ? Commercial tier: {profile.customer.tier}
          </p>
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
    </div>
  );
}
