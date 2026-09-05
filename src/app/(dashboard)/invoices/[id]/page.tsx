'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoicesApi } from '@/lib/api/invoicesApi';
import { useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/useSession';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CreditCard, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { PaymentMethod } from '@/types';

export default function InternalInvoiceDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('BANK_TRANSFER');
  const [reference, setReference] = useState('');

  const { data: invoice, isLoading } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => invoicesApi.getInvoice(id),
  });

  const payMutation = useMutation({
    mutationFn: () => invoicesApi.recordPayment(id, Number(amount), method, reference, user!.id),
    onSuccess: () => {
      toast.success('Payment recorded');
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setAmount('');
      setReference('');
    },
    onError: (err: any) => toast.error(err.message),
  });

  if (isLoading) return <div className="p-8 text-slate-500">Loading...</div>;
  if (!invoice) return <div className="p-8">Invoice not found.</div>;

  const outstanding = invoice.amount - invoice.paidAmount;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/invoices" className="hover:text-slate-900 flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to Invoices
        </Link>
        <span>/</span>
        <span className="text-slate-900 font-medium">{invoice.invoiceNumber}</span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">{invoice.invoiceNumber}</h1>
          <StatusBadge status={invoice.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Total</span><span className="font-semibold">${invoice.amount?.toLocaleString()}</span></div>
            <div className="flex justify-between text-emerald-600"><span>Paid</span><span>${invoice.paidAmount?.toLocaleString()}</span></div>
            <div className="flex justify-between border-t pt-3 font-bold"><span>Outstanding</span><span className="text-red-600">${outstanding?.toLocaleString()}</span></div>
            <div className="w-full bg-slate-100 rounded-full h-2 mt-2">
              <div className="bg-teal-500 h-2 rounded-full" style={{ width: `${Math.min(100, (invoice.paidAmount / invoice.amount) * 100)}%` }}></div>
            </div>
          </CardContent>
        </Card>

        {invoice.status !== 'PAID' && (
          <Card className="border-teal-200">
            <CardHeader><CardTitle>Record Payment</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Amount ($)</label>
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} max={outstanding}
                  className="mt-1 w-full h-10 rounded-md border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                  placeholder={`Max: $${outstanding}`} />
              </div>
              <div>
                <label className="text-sm font-medium">Method</label>
                <select value={method} onChange={e => setMethod(e.target.value as PaymentMethod)}
                  className="mt-1 w-full h-10 rounded-md border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600">
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CREDIT_CARD">Credit Card</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="CASH">Cash</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Reference</label>
                <input type="text" value={reference} onChange={e => setReference(e.target.value)}
                  className="mt-1 w-full h-10 rounded-md border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600" />
              </div>
              <Button onClick={() => payMutation.mutate()} disabled={!amount || payMutation.isPending} className="w-full bg-teal-600 hover:bg-teal-700">
                {payMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CreditCard className="w-4 h-4 mr-2" />}
                Record Payment
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader><CardTitle>Payment History</CardTitle></CardHeader>
        <CardContent>
          {invoice.payments?.length === 0 ? (
            <p className="text-sm text-slate-500">No payments recorded.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b text-slate-500 font-medium">
                <tr>
                  <th className="pb-3 text-left">Date</th>
                  <th className="pb-3 text-left">Method</th>
                  <th className="pb-3 text-left">Reference</th>
                  <th className="pb-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoice.payments?.map((p: any) => (
                  <tr key={p.id}>
                    <td className="py-3">{new Date(p.paidAt).toLocaleDateString()}</td>
                    <td className="py-3">{p.method}</td>
                    <td className="py-3 text-slate-500">{p.reference}</td>
                    <td className="py-3 text-right font-medium text-emerald-600">${p.amount?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
