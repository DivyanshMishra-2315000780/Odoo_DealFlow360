'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Search,
  Filter,
  ArrowUpDown,
  ExternalLink,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RotateCcw,
  Sparkles,
  UserCheck,
  ChevronRight,
} from 'lucide-react';
import { useQuotations } from '@/hooks/use-dealflow';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { TierBadge } from '@/components/ui/tier-badge';
import { StatusBadge, RiskBadge } from '@/components/ui/status-badge';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { EmptyState } from '@/components/ui/empty-state';
import { TableLoadingSkeleton } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { Quotation, QuotationStatus, RiskLevel } from '@/types/dealflow';

type ApprovalTab = 'PENDING' | 'RETURNED' | 'APPROVED' | 'REJECTED' | 'ALL';

export default function ApprovalsPage() {
  const { data: quotations = [], isLoading, isError, refetch } = useQuotations();

  const [activeTab, setActiveTab] = useState<ApprovalTab>('PENDING');
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('ALL');

  // Helper to determine approval hierarchy level based on policy excess
  const getApprovalLevel = (quote: Quotation): string => {
    const maxExcess = Math.max(0, ...quote.items.map((i) => i.excessPercent));
    if (quote.riskDiagnosis.level === 'CRITICAL' || maxExcess > 10) {
      return 'Sales Manager → Finance → Executive VP';
    }
    if (quote.riskDiagnosis.requiresFinanceApproval || maxExcess > 0) {
      return 'Sales Manager → Finance';
    }
    return 'Sales Manager';
  };

  // Helper to get active step label
  const getCurrentStepLabel = (quote: Quotation): { label: string; tone: string } => {
    switch (quote.status) {
      case 'PENDING_FINANCE_APPROVAL':
        return { label: 'Finance Review', tone: 'bg-amber-100 text-amber-900 border-amber-300' };
      case 'PENDING_APPROVAL':
      case 'PENDING_DISCOUNT_APPROVAL':
        return {
          label: quote.salesManagerApproved ? 'Finance Review' : 'Sales Manager Review',
          tone: 'bg-amber-100 text-amber-900 border-amber-300',
        };
      case 'RETURNED':
        return { label: 'Returned to AE', tone: 'bg-orange-100 text-orange-900 border-orange-300' };
      case 'APPROVED':
        return { label: 'Sign-Off Cleared', tone: 'bg-emerald-100 text-emerald-900 border-emerald-300' };
      case 'REJECTED':
        return { label: 'Rejected by Policy', tone: 'bg-rose-100 text-rose-900 border-rose-300' };
      case 'CONFIRMED':
        return { label: 'Confirmed & Closed', tone: 'bg-teal-100 text-teal-900 border-teal-300' };
      case 'IN_NEGOTIATION':
        return { label: 'Client Negotiation', tone: 'bg-blue-100 text-blue-900 border-blue-300' };
      case 'DRAFT':
      default:
        return { label: 'Draft / Unsubmitted', tone: 'bg-slate-100 text-slate-800 border-slate-300' };
    }
  };

  // Filtered approval queue
  const filteredQuotations = useMemo(() => {
    return quotations.filter((q) => {
      // Tab matching
      let matchesTab = true;
      if (activeTab === 'PENDING') {
        matchesTab =
          q.status === 'PENDING_APPROVAL' ||
          q.status === 'PENDING_FINANCE_APPROVAL' ||
          q.status === 'PENDING_DISCOUNT_APPROVAL';
      } else if (activeTab === 'RETURNED') {
        matchesTab = q.status === 'RETURNED';
      } else if (activeTab === 'APPROVED') {
        matchesTab = q.status === 'APPROVED' || q.status === 'CONFIRMED';
      } else if (activeTab === 'REJECTED') {
        matchesTab = q.status === 'REJECTED';
      }

      // Risk matching
      const matchesRisk = riskFilter === 'ALL' || q.riskDiagnosis.level === riskFilter;

      // Search matching
      const matchesSearch =
        searchTerm.trim() === '' ||
        q.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (q.owner && q.owner.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchesTab && matchesRisk && matchesSearch;
    });
  }, [quotations, activeTab, riskFilter, searchTerm]);

  // Summary Metrics
  const stats = useMemo(() => {
    const pending = quotations.filter(
      (q) =>
        q.status === 'PENDING_APPROVAL' ||
        q.status === 'PENDING_FINANCE_APPROVAL' ||
        q.status === 'PENDING_DISCOUNT_APPROVAL'
    );
    const valueAtRisk = pending.reduce((sum, q) => sum + q.grandTotal, 0);
    const criticalCount = quotations.filter(
      (q) => q.riskDiagnosis.level === 'CRITICAL' || q.riskDiagnosis.level === 'HIGH'
    ).length;
    const returnedCount = quotations.filter((q) => q.status === 'RETURNED').length;

    return {
      pendingCount: pending.length,
      valueAtRisk,
      criticalCount,
      returnedCount,
    };
  }, [quotations]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 bg-slate-200 rounded-md animate-pulse w-1/3" />
        <TableLoadingSkeleton rows={6} />
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        title="Failed to load approval center"
        message="Unable to communicate with the deal governance store."
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-enterprise">
              <ShieldCheck className="w-4 h-4 text-teal-400" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Commercial Approval Center
            </h1>
            <span className="text-xs bg-amber-50 text-amber-900 font-bold px-2.5 py-0.5 rounded-full border border-amber-200">
              {stats.pendingCount} Awaiting Sign-Off
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Exception governance, margin preservation sign-offs, and multi-tier approval authority ledger.
          </p>
        </div>

        {/* Action Link to Full Quotes */}
        <Link href="/quotes">
          <Button variant="outline" size="sm" className="text-xs font-semibold gap-1.5 text-slate-700">
            <span>View All Quotations</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-3.5 rounded-lg border border-amber-200 shadow-enterprise flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-amber-800 uppercase tracking-wider">
              Pending Sign-Offs
            </p>
            <p className="text-xl font-bold text-amber-950 mt-0.5">{stats.pendingCount} Deals</p>
          </div>
          <div className="w-9 h-9 rounded-md bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-enterprise flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Exception Value at Risk
            </p>
            <p className="text-xl font-bold text-slate-900 mt-0.5 font-mono">
              {formatCurrency(stats.valueAtRisk)}
            </p>
          </div>
          <div className="w-9 h-9 rounded-md bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-rose-200 shadow-enterprise flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-rose-800 uppercase tracking-wider">
              High / Critical Breaches
            </p>
            <p className="text-xl font-bold text-rose-900 mt-0.5">{stats.criticalCount} Deals</p>
          </div>
          <div className="w-9 h-9 rounded-md bg-rose-50 text-rose-700 flex items-center justify-center border border-rose-200">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-enterprise flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Returned for Revision
            </p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{stats.returnedCount} Deals</p>
          </div>
          <div className="w-9 h-9 rounded-md bg-orange-50 text-orange-700 flex items-center justify-center border border-orange-200">
            <RotateCcw className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Command Bar */}
      <Card className="bg-white border-slate-200 shadow-enterprise">
        <CardContent className="p-4 space-y-3">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {(
                [
                  { key: 'PENDING', label: 'Pending Sign-Off', count: stats.pendingCount },
                  { key: 'RETURNED', label: 'Returned for Revision', count: stats.returnedCount },
                  { key: 'APPROVED', label: 'Approved', count: undefined },
                  { key: 'REJECTED', label: 'Rejected', count: undefined },
                  { key: 'ALL', label: 'All Decisions', count: undefined },
                ] as Array<{ key: ApprovalTab; label: string; count?: number }>
              ).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                    activeTab === tab.key
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        activeTab === tab.key
                          ? 'bg-teal-500 text-slate-950'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Risk Dropdown Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Risk Filter:</span>
              <Select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className="text-xs h-8 w-36"
              >
                <option value="ALL">All Risk Levels</option>
                <option value="CRITICAL">Critical Risk</option>
                <option value="HIGH">High Risk</option>
                <option value="MEDIUM">Medium Risk</option>
                <option value="LOW">Low Risk</option>
              </Select>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Search approval queue by quote ID, customer name, title, or account executive..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>
        </CardContent>
      </Card>

      {/* Approvals Table */}
      <Card className="bg-white border-slate-200 shadow-enterprise overflow-hidden">
        {filteredQuotations.length === 0 ? (
          <div className="py-12">
            <EmptyState
              title="No quotations in this approval queue"
              description="No active deals currently match the selected status filter or search parameters."
              actionLabel="Show Pending Approvals"
              onAction={() => {
                setActiveTab('PENDING');
                setRiskFilter('ALL');
                setSearchTerm('');
              }}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-600">
                  <TableHead className="w-40">Quotation</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="w-24 text-center">Tier</TableHead>
                  <TableHead className="w-32 text-right">Amount</TableHead>
                  <TableHead className="w-28 text-center">Risk</TableHead>
                  <TableHead className="w-48">Approval Level</TableHead>
                  <TableHead className="w-28">Submitted</TableHead>
                  <TableHead className="w-36 text-center">Current Step</TableHead>
                  <TableHead className="w-32 text-center">Status</TableHead>
                  <TableHead className="w-28 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotations.map((quote) => {
                  const stepInfo = getCurrentStepLabel(quote);
                  const approvalLevel = getApprovalLevel(quote);

                  return (
                    <TableRow
                      key={quote.id}
                      className="hover:bg-slate-50/70 border-b border-slate-100 transition group"
                    >
                      {/* Quotation ID & Title */}
                      <TableCell>
                        <Link
                          href={`/approvals/${quote.id}`}
                          className="font-bold text-slate-900 hover:text-teal-700 transition flex items-center gap-1.5"
                        >
                          <span className="font-mono text-xs text-teal-800 bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded">
                            {quote.id}
                          </span>
                        </Link>
                        <p className="text-xs text-slate-600 truncate max-w-xs mt-1 font-medium" title={quote.title}>
                          {quote.title}
                        </p>
                      </TableCell>

                      {/* Customer */}
                      <TableCell>
                        <p className="font-semibold text-slate-800 text-xs">{quote.customerName}</p>
                        <p className="text-[11px] text-slate-400">Owner: {quote.owner || 'Marcus Vance'}</p>
                      </TableCell>

                      {/* Tier */}
                      <TableCell className="text-center">
                        <TierBadge tier={quote.customerTier} />
                      </TableCell>

                      {/* Amount */}
                      <TableCell className="text-right">
                        <p className="font-bold text-slate-900 font-mono text-xs">
                          {formatCurrency(quote.grandTotal)}
                        </p>
                        {quote.totalDiscountAmount > 0 && (
                          <p className="text-[10px] text-amber-700">
                            -{formatCurrency(quote.totalDiscountAmount)} disc.
                          </p>
                        )}
                      </TableCell>

                      {/* Risk */}
                      <TableCell className="text-center">
                        <RiskBadge level={quote.riskDiagnosis.level} />
                      </TableCell>

                      {/* Approval Level */}
                      <TableCell className="text-xs text-slate-700 font-medium">
                        <div className="flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{approvalLevel}</span>
                        </div>
                      </TableCell>

                      {/* Submitted */}
                      <TableCell className="text-xs text-slate-500">
                        {new Date(quote.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </TableCell>

                      {/* Current Step */}
                      <TableCell className="text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold border ${stepInfo.tone}`}
                        >
                          {stepInfo.label}
                        </span>
                      </TableCell>

                      {/* Status */}
                      <TableCell className="text-center">
                        <StatusBadge status={quote.status} />
                      </TableCell>

                      {/* Action */}
                      <TableCell className="text-right">
                        <Link href={`/approvals/${quote.id}`}>
                          <Button
                            size="sm"
                            className="h-7 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white gap-1 shadow-2xs"
                          >
                            <span>Review</span>
                            <ChevronRight className="w-3 h-3 text-teal-400" />
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
      </Card>
    </div>
  );
}
