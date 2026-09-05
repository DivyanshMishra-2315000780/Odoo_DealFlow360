'use client';

import React from 'react';
import Link from 'next/link';
import {
  FileText,
  Clock,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { StatusBadge, RiskBadge } from '@/components/ui/status-badge';
import { TierBadge } from '@/components/ui/tier-badge';
import { useQuotations } from '@/hooks/use-dealflow';
import { useAuth } from '@/lib/auth';
import { formatCurrency, formatPercent } from '@/lib/utils';

export default function CustomerQuotationsPage() {
  const { data: quotations = [], isLoading } = useQuotations();
  const { user } = useAuth();

  const customerName = user?.company || 'Acme Corporation';

  // Filter for this customer or show all deals with Acme highlighted
  const myQuotations = quotations;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            My Commercial Quotations
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review contractual proposals, line-item pricing breakdowns, and submit counter-offers.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-mono">
            {myQuotations.length} Active Deals
          </span>
        </div>
      </div>

      {/* Quotations List */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quotation ID</TableHead>
                <TableHead>Deal Scope / Title</TableHead>
                <TableHead>Account Tier</TableHead>
                <TableHead className="text-right">Total Applied Discount</TableHead>
                <TableHead className="text-right">Net Grand Total</TableHead>
                <TableHead>Commercial Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {myQuotations.map((q) => (
                <TableRow key={q.id} className="hover:bg-slate-50/80 transition">
                  <TableCell>
                    <span className="font-mono font-bold text-slate-900 text-xs">{q.id}</span>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      {new Date(q.createdAt).toLocaleDateString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold text-slate-900 block text-xs">{q.title}</span>
                    <span className="text-[11px] text-slate-500">
                      {q.customerName} • {q.items.length} line items
                    </span>
                  </TableCell>
                  <TableCell>
                    <TierBadge tier={q.customerTier} size="sm" />
                  </TableCell>
                  <TableCell className="text-right font-mono text-rose-600 font-medium">
                    -{formatCurrency(q.totalDiscountAmount)}
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-slate-900 text-sm">
                    {formatCurrency(q.grandTotal)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <StatusBadge status={q.status} />
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/portal/quotations/${q.id}`}>
                      <Button variant="outline" size="sm" className="gap-1 text-xs">
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        Review & Negotiate
                      </Button>
                    </Link>
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
