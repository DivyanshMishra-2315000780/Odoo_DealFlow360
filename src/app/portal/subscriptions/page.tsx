"use client";
import { useSubscriptions } from "@/hooks/use-dealflow";
import { PageHeading } from "@/components/ui/page-heading";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
export default function CustomerSubscriptions() {
  const query = useSubscriptions();
  return (
    <div className="space-y-6">
      <PageHeading
        title="Your subscriptions"
        description="Recurring services and the next scheduled billing date. Contact finance to adjust quantities or cancel future renewals."
      />
      {query.error && <p role="alert">{query.error.message}</p>}
      {query.data?.map((sub) => (
        <Card key={sub.id}>
          <CardContent className="p-5 space-y-2">
            <h2 className="font-semibold">{sub.planName}</h2>
            <p className="text-sm text-slate-500">
              {sub.status} ? {sub.seatsOrLicenses} units
            </p>
            <p>
              {formatCurrency(sub.recurringAmount)} /{" "}
              {sub.billingFrequency.toLowerCase()}
            </p>
            <p className="text-sm">
              Next invoice: {new Date(sub.nextBillingDate).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
      ))}
      {!query.data?.length && (
        <p className="text-slate-500">
          {query.isLoading
            ? "Loading subscriptions..."
            : "No recurring services have been activated yet."}
        </p>
      )}
    </div>
  );
}
