"use client";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import {
  useQuotations,
  useInvoices,
  useRequirements,
} from "@/hooks/use-dealflow";
import { PageHeading, MetricCard } from "@/components/ui/page-heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency } from "@/lib/utils";
export default function PortalOverview() {
  const { user } = useAuth();
  const quotes = useQuotations(),
    invoices = useInvoices(),
    requirements = useRequirements(user?.customerId);
  const rows = quotes.data ?? [];
  const offers = rows.filter((q) => ["SENT", "APPROVED"].includes(q.status));
  const error = quotes.error ?? invoices.error ?? requirements.error;
  return (
    <div className="space-y-7">
      <PageHeading
        eyebrow={user?.company}
        title={"Welcome, " + (user?.name?.split(" ")[0] ?? "there")}
        description="Request a quote, review your offers, and follow your orders through delivery and billing."
        actions={
          <Link href="/portal/requirements/new">
            <Button>Request a quote</Button>
          </Link>
        }
      />
      {error && (
        <p role="alert" className="rounded-lg bg-rose-50 p-4">
          {error.message}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="Requirements"
          value={requirements.data?.length ?? 0}
          note="Submitted procurement requests"
        />
        <MetricCard
          label="Offers ready for review"
          value={offers.length}
          note="Accept current terms or submit a counter-offer"
        />
        <MetricCard
          label="Outstanding balance"
          value={formatCurrency(
            (invoices.data ?? [])
              .filter((i) => !["DRAFT", "VOID"].includes(i.status))
              .reduce((n, i) => n + (i.remainingAmount ?? 0), 0),
          )}
          note="Issued invoice balances"
        />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Your quotations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {rows.map((q) => (
            <Link
              key={q.id}
              href={"/portal/quotations/" + q.id}
              className="flex flex-col gap-3 rounded-lg border border-slate-200 p-4 hover:border-teal-300 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-semibold">{q.title}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {formatCurrency(q.grandTotal)}
                </p>
              </div>
              <StatusBadge status={q.status} />
            </Link>
          ))}
          {!rows.length && (
            <p className="py-8 text-center text-slate-500">
              {quotes.isLoading
                ? "Loading offers..."
                : "Your approved offers will appear here when they are ready."}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
