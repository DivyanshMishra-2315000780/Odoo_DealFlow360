"use client";
import { useState } from "react";
import {
  useDiscountRules,
  useUpdateDiscountRules,
  useDiscountAuditLogs,
} from "@/hooks/use-dealflow";
import { useToast } from "@/components/providers/query-provider";
import { PageHeading } from "@/components/ui/page-heading";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CardLoadingSkeleton } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { DiscountPolicyConfig } from "@/types/dealflow";
export default function DiscountRules() {
  const { data: policy, isLoading, error } = useDiscountRules();
  const save = useUpdateDiscountRules();
  const { toast } = useToast();
  const { data: audits = [] } = useDiscountAuditLogs();
  const [editedDraft, setDraft] = useState<DiscountPolicyConfig | null>(null);
  const [reason, setReason] = useState("");

  const draft = editedDraft ?? policy;
  if (isLoading) return <CardLoadingSkeleton />;
  if (error || !draft)
    return (
      <ErrorState
        title="Policy unavailable"
        message={error?.message ?? "Could not load discount policies."}
      />
    );
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (reason.trim().length < 8) return;
    try {
      await save.mutateAsync({
        config: draft,
        changedBy: "",
        reason: reason.trim(),
      });
      setReason("");
      toast({ title: "Discount policies saved", type: "success" });
    } catch {}
  };
  return (
    <div className="space-y-7 pb-12">
      <PageHeading
        eyebrow="Commercial governance"
        title="Discount policies"
        description="Set the maximum discounts by customer tier and product category. The most restrictive applicable rule determines each line?s allowance."
      />
      <form onSubmit={submit} className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Customer tier limits</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5 sm:grid-cols-3">
              {(["Bronze", "Silver", "Gold"] as const).map((tier) => (
                <label key={tier} className="text-sm font-medium">
                  {tier} (%)
                  <Input
                    className="mt-2"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    required
                    value={draft.tierLimits[tier]}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        tierLimits: {
                          ...draft.tierLimits,
                          [tier]: Number(e.target.value),
                        },
                      })
                    }
                  />
                </label>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Product category limits</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5 sm:grid-cols-2">
              {(["Hardware", "Services"] as const).map((category) => (
                <label key={category} className="text-sm font-medium">
                  {category} (%)
                  <Input
                    className="mt-2"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    required
                    value={draft.categoryLimits[category]}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        categoryLimits: {
                          ...draft.categoryLimits,
                          [category]: Number(e.target.value),
                        },
                      })
                    }
                  />
                </label>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Reason for change</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="block text-sm text-slate-600">
                Explain the commercial reason for these changes
                <textarea
                  className="mt-2 w-full rounded-lg border border-slate-300 p-3 text-sm"
                  rows={3}
                  required
                  minLength={8}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Describe the updated policy and why it is needed."
                />
              </label>
              <p className="text-xs leading-5 text-slate-500">
                The audit log records the signed-in administrator and the
                previous and new policy values.
              </p>
              <Button type="submit" disabled={save.isPending}>
                {save.isPending ? "Saving?" : "Save policies"}
              </Button>
            </CardContent>
          </Card>
        </div>
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Approval workflow</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-6 text-slate-600">
            <ol className="list-decimal space-y-3 pl-5">
              <li>The sales executive submits the quotation.</li>
              <li>The Sales Manager reviews pricing, discounts, and margin.</li>
              <li>The Finance Officer gives the final internal approval.</li>
              <li>The customer accepts or requests changes.</li>
            </ol>
            <p>
              A counter-offer is evaluated again and follows the same approval
              sequence. Policy changes affect subsequent evaluations; previously
              accepted orders retain their agreed terms.
            </p>
          </CardContent>
        </Card>
      </form>
      <Card>
        <CardHeader>
          <CardTitle>Recent policy changes</CardTitle>
        </CardHeader>
        <CardContent>
          {audits.length ? (
            <div className="divide-y divide-slate-100">
              {audits.slice(0, 20).map((audit) => (
                <div key={audit.id} className="py-4 text-sm">
                  <p className="font-medium">{audit.changedBy}</p>
                  <p className="mt-1 text-slate-600">
                    {audit.reason || "Policy updated"}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    {new Date(audit.timestamp).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-slate-500">
              No policy changes recorded.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
