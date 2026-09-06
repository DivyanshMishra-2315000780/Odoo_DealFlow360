"use client";
import { InvoicePayment } from "@/components/payments/invoice-payment";
import { useInvoices } from "@/hooks/use-dealflow";
import { PageHeading, MetricCard } from "@/components/ui/page-heading";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
const money = (amount: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency }).format(
    amount,
  );
export default function CustomerInvoices() {
  const query = useInvoices();

  const rows = query.data ?? [];
  const summary = (field: "remainingAmount" | "paidAmount") => {
    const amounts = new Map<string, number>();
    for (const invoice of rows) {
      if (["DRAFT", "VOID"].includes(invoice.status)) continue;
      const currency = invoice.currency ?? "USD";
      amounts.set(
        currency,
        (amounts.get(currency) ?? 0) + (invoice[field] ?? 0),
      );
    }
    return amounts.size
      ? [...amounts]
          .map(([currency, amount]) => money(amount, currency))
          .join(" / ")
      : money(0);
  };
  return (
    <div className="space-y-7">
      <PageHeading
        eyebrow="Billing"
        title="Your invoices"
        description="Review issued invoices, recorded payments, and the remaining amount due."
        actions={
          <Button variant="outline" onClick={() => window.print()}>
            Print invoices
          </Button>
        }
      />
      {query.error && (
        <p role="alert" className="rounded-lg bg-rose-50 p-4">
          {query.error.message}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <MetricCard
          label="Outstanding"
          value={summary("remainingAmount")}
          note="Remaining balance after recorded payments"
        />
        <MetricCard
          label="Payments recorded"
          value={summary("paidAmount")}
          note="Includes partial settlements"
        />
      </div>
      {rows.map((invoice) => (
        <Card key={invoice.id}>
          <CardContent className="p-5 space-y-4">
            <div className="flex flex-wrap justify-between gap-3">
              <div>
                <p className="font-semibold break-all">
                  Invoice {invoice.invoiceNumber ?? invoice.id}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Due {new Date(invoice.dueDate).toLocaleDateString()}
                </p>
              </div>
              <StatusBadge status={invoice.status} />
            </div>
            <div className="space-y-2">
              {invoice.items?.map((item) => (
                <div
                  className="flex justify-between gap-3 text-sm"
                  key={item.id}
                >
                  <span>{item.description}</span>
                  <span className="shrink-0 font-mono">
                    {money(item.total, invoice.currency)}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap justify-between gap-3 border-t pt-4">
              <p>
                Total {money(invoice.amount, invoice.currency)} | Due{" "}
                <strong>
                  {money(invoice.remainingAmount ?? 0, invoice.currency)}
                </strong>
              </p>
            </div>
            {invoice.paidAmount > 0 && (
              <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                <p>
                  Paid: {money(invoice.paidAmount, invoice.currency)}
                  {invoice.paymentMethod ? " via " + invoice.paymentMethod : ""}
                </p>
                {invoice.paymentReference && (
                  <p className="mt-1 break-all text-xs">
                    Reference: {invoice.paymentReference}
                  </p>
                )}
              </div>
            )}
            <InvoicePayment invoice={invoice} />
          </CardContent>
        </Card>
      ))}
      {!rows.length && (
        <p className="py-8 text-center text-slate-500">
          {query.isLoading
            ? "Loading invoices..."
            : "Invoices appear after delivery is confirmed."}
        </p>
      )}
    </div>
  );
}
