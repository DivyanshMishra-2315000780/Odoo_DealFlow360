'use client';

import { mockQuotes } from '@/lib/api/mockData';
import { QuoteStatusBadge } from '@/components/ui/QuoteStatusBadge';
import Link from 'next/link';

export default function PortalQuotationsPage() {
  const quotes = mockQuotes;

  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">My Quotations</h2>
        <p className="text-muted-foreground mt-1">Review your active and past quotations.</p>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 text-muted-foreground font-medium border-b">
            <tr>
              <th className="px-6 py-4">Quote</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Expires</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {quotes.map((quote) => (
              <tr key={quote.id} className="hover:bg-muted/20">
                <td className="px-6 py-4 font-semibold text-foreground">{quote.quoteNumber}</td>
                <td className="px-6 py-4 text-muted-foreground">{new Date(quote.createdAt).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-muted-foreground">{new Date(quote.expiresAt).toLocaleDateString()}</td>
                <td className="px-6 py-4 font-semibold text-foreground">${quote.amount.toLocaleString()}</td>
                <td className="px-6 py-4">
                  <QuoteStatusBadge status={quote.status} />
                </td>
                <td className="px-6 py-4">
                  <Link href={`/portal/quotations/${quote.id}`} className="text-sm font-medium text-primary hover:underline">
                    View →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
