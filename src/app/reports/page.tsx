"use client";
import { useState } from "react";
import {
  useQuotations,
  useInvoices,
  useSubscriptions,
} from "@/hooks/use-dealflow";
import { PageHeading, MetricCard } from "@/components/ui/page-heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
export default function Reports() {
  const quotes = useQuotations(),
    billing = useInvoices(),
    subscriptions = useSubscriptions();
  const [days, setDays] = useState(0);
  const [asOf]=useState(()=>Date.now());
  const rows = (quotes.data ?? []).filter(
    (q) =>
      !days || new Date(q.createdAt).getTime() >= asOf - days * 86400000,
  );
  const stages = [...new Set(rows.map((q) => q.status))].map((status) => ({
    status,
    count: rows.filter((q) => q.status === status).length,
    value: rows
      .filter((q) => q.status === status)
      .reduce((sum, q) => sum + q.grandTotal, 0),
  }));
  const completed = rows.filter((q) => q.status === "COMPLETED");
  const mrr = (subscriptions.data ?? [])
    .filter((s) => s.status === "ACTIVE")
    .reduce(
      (sum, s) =>
        sum +
        s.recurringAmount /
          (s.billingFrequency === "ANNUAL"
            ? 12
            : s.billingFrequency === "QUARTERLY"
              ? 3
              : 1),
      0,
    );
  const error = quotes.error ?? billing.error ?? subscriptions.error;
  function download() {
    const csv = [
      "Status,Deals,Quoted value",
      ...stages.map((s) => [s.status, s.count, s.value.toFixed(2)].join(",")),
    ].join("\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8;" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "deal-pipeline.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }
  return (
    <div className="space-y-7">
      <PageHeading
        eyebrow="Reporting"
        title="Commercial performance"
        description="Calculated from the saved records you have access to. The date filter applies to quotation creation dates."
        actions={
          <>
            <select
              className="rounded-lg border border-slate-300 bg-white px-3 text-sm"
              aria-label="Reporting period"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
            >
              <option value={0}>All time</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
            <Button variant="outline" onClick={download}>
              Export CSV
            </Button>
          </>
        }
      />
      {error && (
        <p role="alert" className="rounded-lg bg-rose-50 p-4 text-rose-800">
          {error.message}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Quotations"
          value={rows.length}
          note="Created in the selected period"
        />
        <MetricCard
          label="Completed deal value"
          value={formatCurrency(
            completed.reduce((sum, q) => sum + q.grandTotal, 0),
          )}
          note={completed.length + " completed quotations in this cohort"}
        />
        <MetricCard
          label="Current MRR"
          value={formatCurrency(mrr)}
          note="All active subscriptions, normalized monthly"
        />
        <MetricCard
          label="Outstanding balance"
          value={formatCurrency(
            (billing.data ?? [])
              .filter((i) => !["DRAFT", "VOID"].includes(i.status))
              .reduce((sum, i) => sum + (i.remainingAmount ?? 0), 0),
          )}
          note="All currently issued unpaid balances"
        />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Pipeline by current status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {stages.map((s) => (
            <div key={s.status}>
              <div className="mb-2 flex flex-wrap justify-between gap-2 text-sm">
                <span className="font-medium">
                  {s.status.replaceAll("_", " ")}{" "}
                  <span className="text-slate-500">? {s.count} deals</span>
                </span>
                <span className="font-mono">{formatCurrency(s.value)}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100">
                <div
                  className="h-2 rounded-full bg-teal-600"
                  style={{
                    width: (s.count / Math.max(1, rows.length)) * 100 + "%",
                  }}
                />
              </div>
            </div>
          ))}
          {!stages.length && (
            <p className="py-8 text-center text-slate-500">
              {quotes.isLoading
                ? "Loading report..."
                : "No quotations in this period."}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
