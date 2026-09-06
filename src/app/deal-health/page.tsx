"use client";
import { useState } from "react";
import Link from "next/link";
import { useQuotations } from "@/hooks/use-dealflow";
import { PageHeading, MetricCard } from "@/components/ui/page-heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RiskBadge, StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
export default function DealHealth() {
  const query = useQuotations();
  const [atRisk, setAtRisk] = useState(false);
  const rows = query.data ?? [];
  const risks = rows.filter((q) =>
    ["HIGH", "CRITICAL"].includes(q.riskDiagnosis.level),
  );
  const filtered = atRisk ? risks : rows;
  const events = rows
    .flatMap((q) =>
      q.auditTrail.map((event) => ({
        ...event,
        quoteId: q.id,
        title: q.title,
      })),
    )
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )
    .slice(0, 12);
  return (
    <div className="space-y-7">
      <PageHeading
        eyebrow="Governance"
        title="Deal health & audit"
        description="Review calculated deal health, policy exceptions, and the recorded history of each handoff."
        actions={
          <Button
            variant={atRisk ? "default" : "outline"}
            onClick={() => setAtRisk(!atRisk)}
          >
            {atRisk ? "Show all deals" : "Show high-risk deals"}
          </Button>
        }
      />
      {query.error && (
        <p role="alert" className="rounded-lg bg-rose-50 p-4">
          {query.error.message}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="Deals reviewed"
          value={rows.length}
          note="Quotations visible to your role"
        />
        <MetricCard
          label="High / critical risk"
          value={risks.length}
          note="Flagged by the backend risk evaluation"
        />
        <MetricCard
          label="Average health"
          value={
            rows.length
              ? Math.round(
                  rows.reduce((n, q) => n + q.dealHealthScore, 0) / rows.length,
                ) + "/100"
              : "?"
          }
          note="Current saved or calculated health scores"
        />
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Deal review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {filtered.map((q) => (
              <Link
                href={"/quotes/" + q.id}
                key={q.id}
                className="block rounded-lg border border-slate-200 p-4 hover:border-teal-300"
              >
                <div className="flex flex-wrap justify-between gap-3">
                  <div>
                    <p className="font-semibold">{q.customerName}</p>
                    <p className="mt-1 text-sm text-slate-500">{q.title}</p>
                  </div>
                  <RiskBadge level={q.riskDiagnosis.level} />
                </div>
                <p className="my-3 text-sm leading-6 text-slate-600">
                  {q.riskDiagnosis.whatHappened}
                </p>
                <div className="flex flex-wrap justify-between gap-2">
                  <StatusBadge status={q.status} />
                  <span className="text-sm font-semibold text-teal-700">
                    Health {q.dealHealthScore}/100
                  </span>
                </div>
              </Link>
            ))}
            {!filtered.length && (
              <p className="py-8 text-center text-slate-500">
                {query.isLoading
                  ? "Loading deals..."
                  : "No deals match this view."}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent audit history</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-5">
              {events.map((event, i) => (
                <li
                  key={event.id + "-" + i}
                  className="border-l-2 border-teal-200 pl-4"
                >
                  <Link
                    className="text-sm font-semibold text-teal-800"
                    href={"/quotes/" + event.quoteId}
                  >
                    {event.action.replaceAll("_", " ")}
                  </Link>
                  <p className="mt-1 text-xs text-slate-500">{event.title}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {new Date(event.timestamp).toLocaleString()}
                  </p>
                </li>
              ))}
            </ol>
            {!events.length && (
              <p className="py-6 text-sm text-slate-500">
                Recorded workflow actions will appear here.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
