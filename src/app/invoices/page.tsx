'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Truck,
  DollarSign,
  FileText,
  Filter,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/status-badge';
import { TierBadge } from '@/components/ui/tier-badge';
import { TableLoadingSkeleton } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { useInvoices } from '@/hooks/use-dealflow';
import { formatCurrency } from '@/lib/utils';
import { InvoiceStatus } from '@/types/dealflow';

export default function InvoicesListPage() {
  const { data: invoices = [], isLoading } = useInvoices();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusTab, setSelectedStatusTab] = useState<'ALL' | InvoiceStatus>('ALL');

  // Compute Counters
  const counters = useMemo(() => {
    let unpaidCount = 0;
    let unpaidAmount = 0;
    let paidCount = 0;
    let paidAmount = 0;
    let overdueCount = 0;
    let overdueAmount = 0;
    let partiallyPaidCount = 0;
    let partiallyPaidAmount = 0;

    invoices.forEach((inv) => {
      if (inv.status === 'PAID') {
        paidCount++;
        paidAmount += inv.amount;
      } else if (inv.status === 'OVERDUE') {
        overdueCount++;
        overdueAmount += inv.remainingAmount ?? inv.amount;
      } else if (inv.status === 'PARTIALLY_PAID') {
        partiallyPaidCount++;
        partiallyPaidAmount += inv.remainingAmount ?? inv.amount;
      } else if (inv.status === 'UNPAID') {
        unpaidCount++;
        unpaidAmount += inv.amount;
      }
    });

    return {
      unpaidCount,
      unpaidAmount,
      paidCount,
      paidAmount,
      overdueCount,
      overdueAmount,
      partiallyPaidCount,
      partiallyPaidAmount,
    };
  }, [invoices]);

  // Filtered Invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      // Tab filter
      if (selectedStatusTab !== 'ALL' && inv.status !== selectedStatusTab) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesId = inv.id.toLowerCase().includes(query);
        const matchesCustomer = inv.customerName.toLowerCase().includes(query);
        const matchesQuote = inv.quotationId.toLowerCase().includes(query);
        const matchesRef = inv.paymentReference?.toLowerCase().includes(query);
        if (!matchesId && !matchesCustomer && !matchesQuote && !matchesRef) {
          return false;
        }
      }

      return true;
    });
  }, [invoices, selectedStatusTab, searchQuery]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Commercial Invoices & Cashflow
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200">
              {invoices.length} Invoices
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track billed contract invoices, verified dispatch holds, partial delivery billing, and payment settlements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/quotes">
            <Button variant="outline" size="sm" className="text-xs gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              View Quotations
            </Button>
          </Link>
          <Link href="/fulfillment">
            <Button variant="outline" size="sm" className="text-xs gap-1.5">
              <Truck className="w-3.5 h-3.5 text-slate-500" />
              Warehouse Logistics
            </Button>
          </Link>
        </div>
      </div>

      {/* Counters Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Unpaid Counter */}
        <Card
          className={`cursor-pointer transition-all ${
            selectedStatusTab === 'UNPAID'
              ? 'ring-2 ring-slate-800 shadow-md'
              : 'hover:border-slate-300'
          }`}
          onClick={() => setSelectedStatusTab(selectedStatusTab === 'UNPAID' ? 'ALL' : 'UNPAID')}
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Unpaid Invoices</span>
              <div className="p-2 rounded-md bg-slate-100 text-slate-700">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <p className="text-3xl font-bold font-mono text-slate-900">
                {counters.unpaidCount}
              </p>
              <span className="text-xs font-mono font-medium text-slate-600">
                {formatCurrency(counters.unpaidAmount)}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Awaiting settlement or pre-shipment release
            </p>
          </CardContent>
        </Card>

        {/* Paid Counter */}
        <Card
          className={`cursor-pointer transition-all ${
            selectedStatusTab === 'PAID'
              ? 'ring-2 ring-emerald-600 shadow-md'
              : 'hover:border-slate-300'
          }`}
          onClick={() => setSelectedStatusTab(selectedStatusTab === 'PAID' ? 'ALL' : 'PAID')}
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Paid Invoices</span>
              <div className="p-2 rounded-md bg-emerald-50 text-emerald-700">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <p className="text-3xl font-bold font-mono text-emerald-700">
                {counters.paidCount}
              </p>
              <span className="text-xs font-mono font-medium text-emerald-700">
                {formatCurrency(counters.paidAmount)}
              </span>
            </div>
            <p className="text-xs text-emerald-700 mt-1">
              Fully collected and reconciled in ledger
            </p>
          </CardContent>
        </Card>

        {/* Overdue Counter */}
        <Card
          className={`cursor-pointer transition-all ${
            selectedStatusTab === 'OVERDUE'
              ? 'ring-2 ring-rose-600 shadow-md'
              : 'hover:border-slate-300'
          }`}
          onClick={() => setSelectedStatusTab(selectedStatusTab === 'OVERDUE' ? 'ALL' : 'OVERDUE')}
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Overdue Invoices</span>
              <div className="p-2 rounded-md bg-rose-50 text-rose-700">
                <AlertCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <p className="text-3xl font-bold font-mono text-rose-600">
                {counters.overdueCount}
              </p>
              <span className="text-xs font-mono font-medium text-rose-600">
                {formatCurrency(counters.overdueAmount)}
              </span>
            </div>
            <p className="text-xs text-rose-600 mt-1">
              Requires immediate finance collection outreach
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            {/* Search */}
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search invoice #, customer, quote ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>

            {/* Status Pills */}
            <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
              {(
                [
                  { id: 'ALL', label: 'All Invoices' },
                  { id: 'UNPAID', label: 'Unpaid' },
                  { id: 'PARTIALLY_PAID', label: 'Partially Paid' },
                  { id: 'PAID', label: 'Paid' },
                  { id: 'OVERDUE', label: 'Overdue' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedStatusTab(tab.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    selectedStatusTab === tab.id
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <TableLoadingSkeleton rows={5} />
          ) : filteredInvoices.length === 0 ? (
            <EmptyState
              title="No Invoices Found"
              description="No invoices match the selected filters or search query."
              actionLabel="Reset Filters"
              onAction={() => {
                setSelectedStatusTab('ALL');
                setSearchQuery('');
              }}
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/75 hover:bg-slate-50/75">
                    <TableHead className="font-semibold text-slate-900">Invoice Number</TableHead>
                    <TableHead className="font-semibold text-slate-900">Customer</TableHead>
                    <TableHead className="font-semibold text-slate-900">Related Quotation</TableHead>
                    <TableHead className="font-semibold text-slate-900 text-right">Amount</TableHead>
                    <TableHead className="font-semibold text-slate-900">Due Date</TableHead>
                    <TableHead className="font-semibold text-slate-900">Shipment State</TableHead>
                    <TableHead className="font-semibold text-slate-900">Status</TableHead>
                    <TableHead className="font-semibold text-slate-900">Payment Status</TableHead>
                    <TableHead className="font-semibold text-slate-900 text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => {
                    const isOverdue = invoice.status === 'OVERDUE';
                    const isPreShipment = !invoice.isShipped;

                    return (
                      <TableRow key={invoice.id} className="hover:bg-slate-50/60 transition-colors">
                        {/* Invoice Number */}
                        <TableCell className="font-mono font-semibold text-slate-900">
                          <Link
                            href={`/invoices/${invoice.id}`}
                            className="text-teal-700 hover:text-teal-900 hover:underline flex items-center gap-1.5"
                          >
                            <CreditCard className="w-3.5 h-3.5 text-teal-600" />
                            {invoice.id}
                          </Link>
                        </TableCell>

                        {/* Customer */}
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <span className="font-medium text-slate-900 text-xs">
                              {invoice.customerName}
                            </span>
                            <div className="scale-90 origin-left">
                              <TierBadge tier={invoice.customerTier} />
                            </div>
                          </div>
                        </TableCell>

                        {/* Related Quotation */}
                        <TableCell>
                          <Link
                            href={`/quotes/${invoice.quotationId}`}
                            className="font-mono text-xs font-medium text-slate-600 hover:text-slate-900 hover:underline inline-flex items-center gap-1"
                          >
                            <FileText className="w-3 h-3 text-slate-400" />
                            {invoice.quotationId}
                          </Link>
                        </TableCell>

                        {/* Amount */}
                        <TableCell className="text-right font-mono">
                          <div className="font-bold text-slate-900">
                            {formatCurrency(invoice.amount)}
                          </div>
                          {invoice.paidAmount > 0 && invoice.paidAmount < invoice.amount && (
                            <div className="text-[11px] text-emerald-600">
                              Paid: {formatCurrency(invoice.paidAmount)}
                            </div>
                          )}
                          {invoice.remainingAmount > 0 && invoice.paidAmount > 0 && (
                            <div className="text-[11px] text-amber-600">
                              Bal: {formatCurrency(invoice.remainingAmount)}
                            </div>
                          )}
                        </TableCell>

                        {/* Due Date */}
                        <TableCell className="text-xs">
                          <div className={`font-mono ${isOverdue ? 'text-rose-600 font-semibold' : 'text-slate-600'}`}>
                            {invoice.dueDate}
                          </div>
                          {isOverdue && (
                            <span className="text-[10px] uppercase font-bold text-rose-600 tracking-wider">
                              Overdue
                            </span>
                          )}
                        </TableCell>

                        {/* Shipment State (Pre-shipment vs Shipped vs Partial Delivery) */}
                        <TableCell>
                          {isPreShipment ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-900 border border-amber-200">
                              <Clock className="w-3 h-3 text-amber-600" />
                              Pre-Shipment Hold
                            </span>
                          ) : invoice.isPartialDelivery ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-sky-50 text-sky-900 border border-sky-200">
                              <Truck className="w-3 h-3 text-sky-600" />
                              Partial Delivery
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-900 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Shipped / Verified
                            </span>
                          )}
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <StatusBadge status={invoice.status} />
                        </TableCell>

                        {/* Payment Status */}
                        <TableCell>
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              invoice.paymentStatus === 'PAID'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : invoice.paymentStatus === 'PARTIALLY_PAID'
                                ? 'bg-sky-50 text-sky-800 border border-sky-200'
                                : 'bg-slate-100 text-slate-800 border border-slate-300'
                            }`}
                          >
                            {invoice.paymentStatus === 'PAID' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                            {invoice.paymentStatus === 'PARTIALLY_PAID' && <Clock className="w-3.5 h-3.5 text-sky-600" />}
                            {invoice.paymentStatus === 'UNPAID' && <Clock className="w-3.5 h-3.5 text-slate-400" />}
                            {invoice.paymentStatus === 'PAID'
                              ? 'Paid'
                              : invoice.paymentStatus === 'PARTIALLY_PAID'
                              ? 'Partially Paid'
                              : 'Unpaid'}
                          </span>
                        </TableCell>

                        {/* Action */}
                        <TableCell className="text-right">
                          <Link href={`/invoices/${invoice.id}`}>
                            <Button variant="outline" size="sm" className="text-xs gap-1">
                              Inspect
                              <ArrowRight className="w-3 h-3" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
