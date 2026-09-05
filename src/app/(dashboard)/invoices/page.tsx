'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { invoicesApi } from '@/lib/api/invoicesApi';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Filter } from 'lucide-react';
import Link from 'next/link';

export default function InvoicesPage() {
  const [statusFilter, setStatusFilter] = useState('ALL');

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', statusFilter],
    queryFn: () => invoicesApi.getInvoices({ status: statusFilter }),
  });

  const invoices = data?.data || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Invoices</h1>

      <div className="flex gap-4 items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <Filter className="w-4 h-4 text-slate-400" />
        <select
          className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="ALL">All Invoices</option>
          <option value="UNPAID">Unpaid</option>
          <option value="PARTIALLY_PAID">Partially Paid</option>
          <option value="OVERDUE">Overdue</option>
          <option value="PAID">Paid</option>
        </select>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-slate-500">Loading...</div>
      ) : invoices.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-slate-300 rounded-xl bg-slate-50">
          <CreditCard className="w-8 h-8 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600">No invoices found.</p>
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-6 py-4">Invoice #</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                  <th className="px-6 py-4 text-right">Paid</th>
                  <th className="px-6 py-4 text-right">Due Date</th>
                  <th className="px-6 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {invoices.map((inv: any) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{inv.invoiceNumber}</td>
                    <td className="px-6 py-4">{inv.customer?.name || '—'}</td>
                    <td className="px-6 py-4"><StatusBadge status={inv.status} /></td>
                    <td className="px-6 py-4 text-right">${inv.amount?.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right text-emerald-600">${inv.paidAmount?.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">{new Date(inv.dueDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-center">
                      <Link href={`/invoices/${inv.id}`} className="text-teal-600 hover:underline font-medium text-sm">
                        {inv.status !== 'PAID' ? 'Record Payment' : 'View'}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
