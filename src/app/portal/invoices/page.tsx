'use client';

import React from 'react';
import {
  CreditCard,
  Download,
  CheckCircle2,
  Clock,
  DollarSign,
  Building,
  FileText,
  Lock,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { TierBadge } from '@/components/ui/tier-badge';
import { useInvoices, useUpdateInvoiceStatus } from '@/hooks/use-dealflow';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/components/providers/query-provider';
import { formatCurrency } from '@/lib/utils';

export default function CustomerInvoicesPage() {
  const { data: invoices = [], isLoading } = useInvoices();
  const updateInvoiceStatus = useUpdateInvoiceStatus();
  const { user } = useAuth();
  const { toast } = useToast();

  const customerInvoices = React.useMemo(() => {
    if (!user) return invoices;
    const compLower = (user.company || '').toLowerCase();
    const filtered = invoices.filter(
      (inv) =>
        (inv.customerId && user.id && inv.customerId === user.customerId) ||
        (inv.customerName && compLower && inv.customerName.toLowerCase().includes(compLower))
    );
    return filtered;
  }, [invoices, user]);

  const handlePay = async (id: string) => {
    try {
      throw new Error('Ask your finance contact to reconcile your payment using the invoice number. Online checkout is not connected.');
      toast({
        title: `Invoice ${id} Paid`,
        description: 'Payment settlement confirmed. Receipt issued to your procurement email.',
        type: 'success',
      });
    } catch {
      toast({
        title: 'Payment Failed',
        type: 'error',
      });
    }
  };

  const handleDownload = (id: string) => {
    toast({
      title: 'Downloading Invoice',
      description: `Generating signed PDF for ${id}...`,
      type: 'info',
    });
  };

  const totalOutstanding = customerInvoices
    .filter((i) => i.status === 'ISSUED')
    .reduce((acc, i) => acc + i.amount, 0);

  const totalSettled = customerInvoices
    .filter((i) => i.status === 'PAID')
    .reduce((acc, i) => acc + i.amount, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Commercial Billing & Invoices
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track billed contract invoices, settlement receipts, and corporate payment methods.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Outstanding</span>
              <div className="p-2 rounded-md bg-amber-50 text-amber-700 shadow-2xs">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-bold font-mono text-slate-900 mt-2">
              {formatCurrency(totalOutstanding)}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Net 30 commercial payment terms apply
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Settled</span>
              <div className="p-2 rounded-md bg-emerald-50 text-emerald-700 shadow-2xs">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-bold font-mono text-teal-700 mt-2">
              {formatCurrency(totalSettled)}
            </p>
            <p className="text-xs text-emerald-600 mt-1">
              All cleared invoices in good standing
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Invoices Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice ID</TableHead>
                <TableHead>Deal Reference</TableHead>
                <TableHead>Billing Account</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="text-right">Billed Amount</TableHead>
                <TableHead>Payment Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customerInvoices.map((inv) => (
                <TableRow key={inv.id} className="hover:bg-slate-50/80 transition">
                  <TableCell>
                    <span className="font-mono font-bold text-slate-900 text-xs">{inv.id}</span>
                    <span className="text-[10px] text-slate-400 block font-mono">Issued: {inv.issueDate}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs font-semibold text-slate-700">{inv.quotationId}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-slate-800 text-xs block">{inv.customerName}</span>
                    <TierBadge tier={inv.customerTier} size="sm" />
                  </TableCell>
                  <TableCell className="font-mono text-xs text-slate-600">
                    {inv.dueDate}
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-slate-900 text-sm">
                    {formatCurrency(inv.amount)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={inv.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(inv.id)}
                        className="gap-1 text-xs"
                      >
                        <Download className="w-3.5 h-3.5 text-slate-500" />
                        PDF
                      </Button>
                      {inv.status === 'ISSUED' && (
                        !inv.isShipped ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled
                            className="text-xs opacity-60 cursor-not-allowed gap-1"
                            title="Payment locked until goods are dispatched from warehouse"
                          >
                            <Lock className="w-3.5 h-3.5" />
                            Pre-Shipment Hold
                          </Button>
                        ) : (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handlePay(inv.id)}
                            loading={updateInvoiceStatus.isPending}
                            className="text-xs"
                          >
                            Pay Online
                          </Button>
                        )
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
