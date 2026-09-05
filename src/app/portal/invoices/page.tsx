'use client';

import { mockInvoices } from '@/lib/api/mockDataExtended';
import Link from 'next/link';
import { Download } from 'lucide-react';

export default function PortalInvoicesPage() {
  const invoices = mockInvoices;

  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">My Invoices</h2>
        <p className="text-muted-foreground mt-1">View and download your invoices.</p>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 text-muted-foreground font-medium border-b">
            <tr>
              <th className="px-6 py-4">Invoice</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Due Date</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Download</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {invoices.map(invoice => (
              <tr key={invoice.id} className="hover:bg-muted/20">
                <td className="px-6 py-4 font-semibold text-foreground">{invoice.invoiceNumber}</td>
                <td className="px-6 py-4 text-muted-foreground">{new Date(invoice.createdAt).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-muted-foreground">{new Date(invoice.dueDate).toLocaleDateString()}</td>
                <td className="px-6 py-4 font-semibold text-foreground">${invoice.amount.toLocaleString()}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                    invoice.status === 'PAID' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    invoice.status === 'OVERDUE' ? 'bg-red-50 text-red-700 border-red-200' :
                    'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {invoice.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button className="text-muted-foreground hover:text-foreground transition-colors">
                    <Download className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
