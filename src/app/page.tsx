"use client";
import Link from "next/link";
import { ArrowRight, Plus, Inbox, CheckCircle2 } from "lucide-react";
import { useQuotations, useInvoices } from "@/hooks/use-dealflow";
import { useAuth, getRoleMeta } from "@/lib/auth";
import { PageHeading, MetricCard } from "@/components/ui/page-heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge, RiskBadge } from "@/components/ui/status-badge";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
export default function Dashboard() {
  const quotes = useQuotations(),
    invoices = useInvoices();
  const { user } = useAuth();
  const rows = quotes.data ?? [];
  const pending = rows.filter(
    (q) => q.status === "PENDING_APPROVAL" && q.approvalRole === user?.role,
  );
  const work =
    user?.role === "SALES_EXECUTIVE"
      ? rows.filter((q) =>
          [
            "DRAFT",
            "REVISION_REQUIRED",
            "APPROVED",
            "UNDER_NEGOTIATION",
          ].includes(q.status),
        )
      : pending;
  const open = rows.filter(
    (q) => !["COMPLETED", "REJECTED", "CANCELLED"].includes(q.status),
  );
  const balance = (invoices.data ?? [])
    .filter((i) => !["DRAFT", "VOID"].includes(i.status))
    .reduce((sum, i) => sum + (i.remainingAmount ?? 0), 0);
  if (quotes.error || invoices.error)
    return (
      <div role="alert" className="rounded-xl border border-rose-200 p-6">
        {quotes.error?.message ?? invoices.error?.message}
        <Button
          className="ml-3"
          onClick={() => {
            void quotes.refetch();
            void invoices.refetch();
          }}
        >
          Retry
        </Button>
      </div>
    );
  return (
    <div className="space-y-7">
      <PageHeading
        eyebrow={getRoleMeta(user?.role).label}
        title={"Welcome back, " + (user?.name?.split(" ")[0] ?? "there")}
        description="Your live deal pipeline, pending handoffs, and billing progress in one place."
        actions={
          user?.role === "SALES_EXECUTIVE" ? (
            <>
              <Link href="/requirements">
                <Button variant="outline">
                  <Inbox size={16} />
                  Requirements
                </Button>
              </Link>
              <Link href="/quotes/new">
                <Button>
                  <Plus size={16} />
                  New quotation
                </Button>
              </Link>
            </>
          ) : (
            <Link href="/reports">
              <Button variant="outline">
                View reports
                <ArrowRight size={16} />
              </Button>
            </Link>
          )
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Open pipeline"
          value={formatCurrency(open.reduce((n, q) => n + q.grandTotal, 0))}
          note={open.length + " active quotations"}
        />
        <MetricCard
          label="Needs your attention"
          value={work.length}
          note="Actions assigned to your current role"
        />
        <MetricCard
          label="Outstanding invoices"
          value={formatCurrency(balance)}
          note="Remaining balance on issued invoices"
        />
        <MetricCard
          label="Completed deals"
          value={rows.filter((q) => q.status === "COMPLETED").length}
          note="Delivery confirmed and payment recorded"
        />
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Recent quotations</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer / quotation</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.slice(0, 8).map((q) => (
                  <TableRow key={q.id}>
                    <TableCell>
                      <Link
                        className="block max-w-40 truncate font-semibold text-teal-800 hover:underline" title={q.title}
                        href={"/quotes/" + q.id}
                      >
                        {q.title}
                      </Link>
                      <p className="mt-1 max-w-40 truncate text-xs text-slate-500" title={q.customerName}>
                        {q.customerName}
                      </p>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={q.status} />
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(q.grandTotal)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {!rows.length && (
              <p className="p-8 text-center text-sm text-slate-500">
                {quotes.isLoading
                  ? "Loading quotations..."
                  : "No quotations yet. New requirements are the first step."}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Your next actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {work.slice(0, 6).map((q) => (
              <Link
                href={
                  (q.status === "PENDING_APPROVAL"
                    ? "/approvals/"
                    : "/quotes/") + q.id
                }
                key={q.id}
                className="block rounded-lg border border-slate-200 p-3 transition hover:border-teal-300 hover:bg-teal-50/50"
              >
                <div className="flex justify-between gap-3">
                  <span className="text-sm font-semibold">
                    {q.customerName}
                  </span>
                  <ArrowRight size={16} className="text-teal-600 shrink-0" />
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {q.status.replaceAll("_", " ")}
                </p>
              </Link>
            ))}
            {!work.length && (
              <div className="py-6 text-center">
                <CheckCircle2 className="mx-auto mb-3 text-teal-600" />
                <p className="text-sm text-slate-500">
                  No quotation actions are waiting on your role.
                </p>
              </div>
            )}
            <Link
              href="/fulfillment"
              className="block text-sm font-semibold text-teal-700"
            >
              View order fulfillment ?
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
