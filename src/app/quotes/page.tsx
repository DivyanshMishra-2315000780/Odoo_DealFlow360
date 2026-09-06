'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  FileText,
  Search,
  Filter,
  Plus,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ShieldAlert,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  Clock,
  RotateCcw,
} from 'lucide-react';
import { useQuotations, useCustomers } from '@/hooks/use-dealflow';
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

const ITEMS_PER_PAGE = 6;

type SortField = 'date' | 'amount' | 'risk' | 'status';
type SortOrder = 'asc' | 'desc';

export default function QuotesPage() {
  const { data: quotations = [], isLoading, isError, refetch } = useQuotations();
  const { data: customers = [] } = useCustomers();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [riskFilter, setRiskFilter] = useState<string>('ALL');
  const [customerFilter, setCustomerFilter] = useState<string>('ALL');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);

  // Status mapping helper for filter comparisons
  const normalizeStatus = (status: QuotationStatus): string => {
    return status;
  };

  // Filtered and Sorted Quotations
  const filteredQuotations = useMemo(() => {
    return quotations.filter((q) => {
      // Search term matching
      const matchesSearch =
        searchTerm.trim() === '' ||
        q.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (q.owner && q.owner.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (q.notes && q.notes.toLowerCase().includes(searchTerm.toLowerCase()));

      // Status filter
      const normalized = normalizeStatus(q.status);
      const matchesStatus =
        statusFilter === 'ALL' ||
        normalized === statusFilter ||
        q.status === statusFilter;

      // Risk filter
      const matchesRisk =
        riskFilter === 'ALL' || q.riskDiagnosis.level === riskFilter;

      // Customer filter
      const matchesCustomer =
        customerFilter === 'ALL' || q.customerId === customerFilter;

      return matchesSearch && matchesStatus && matchesRisk && matchesCustomer;
    });
  }, [quotations, searchTerm, statusFilter, riskFilter, customerFilter]);

  // Sorted list
  const sortedQuotations = useMemo(() => {
    return [...filteredQuotations].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'date') {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortField === 'amount') {
        comparison = a.grandTotal - b.grandTotal;
      } else if (sortField === 'risk') {
        const riskWeights: Record<RiskLevel, number> = {
          LOW: 1,
          MEDIUM: 2,
          HIGH: 3,
          CRITICAL: 4,
        };
        comparison = riskWeights[a.riskDiagnosis.level] - riskWeights[b.riskDiagnosis.level];
      } else if (sortField === 'status') {
        comparison = a.status.localeCompare(b.status);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filteredQuotations, sortField, sortOrder]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(sortedQuotations.length / ITEMS_PER_PAGE));
  const paginatedQuotations = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedQuotations.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedQuotations, currentPage]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
    setRiskFilter('ALL');
    setCustomerFilter('ALL');
    setCurrentPage(1);
  };

  // Aggregate Metrics for Header Bar
  const stats = useMemo(() => {
    const totalCount = quotations.length;
    const actionRequired = quotations.filter((q) => {
      const norm = normalizeStatus(q.status);
      return norm === 'PENDING_APPROVAL' || norm === 'REVISION_REQUIRED';
    }).length;
    const pipelineValue = quotations.reduce((acc, q) => acc + q.grandTotal, 0);
    const avgHealth = totalCount > 0
      ? Math.round(quotations.reduce((acc, q) => acc + (q.dealHealthScore || 90), 0) / totalCount)
      : 95;

    return { totalCount, actionRequired, pipelineValue, avgHealth };
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
        title="Failed to load quotations"
        message="Could not retrieve the quotations ledger from the mock service layer."
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center shadow-enterprise">
              <FileText className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Commercial Quotations
            </h1>
            <span className="text-xs bg-teal-50 text-teal-700 font-semibold px-2 py-0.5 rounded-full border border-teal-200">
              {quotations.length} Active Deals
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Enterprise deal proposals, discount variance governance, and cross-functional sign-off lifecycle.
          </p>
        </div>

        {/* CTA Button */}
        <div className="flex items-center gap-3">
          <Link href="/quotes/new">
            <Button className="bg-teal-600 hover:bg-teal-700 text-white shadow-enterprise font-semibold gap-2">
              <Plus className="w-4 h-4" />
              New Quotation
            </Button>
          </Link>
        </div>
      </div>

      {/* Metric Quick-Pills */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-enterprise flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Total Deals</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{stats.totalCount}</p>
          </div>
          <div className="w-9 h-9 rounded-md bg-slate-100 flex items-center justify-center text-slate-600">
            <FileText className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-amber-200 shadow-enterprise flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-amber-800 uppercase tracking-wider">Action Required</p>
            <p className="text-xl font-bold text-amber-900 mt-0.5">{stats.actionRequired}</p>
          </div>
          <div className="w-9 h-9 rounded-md bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-enterprise flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Total Pipeline Value</p>
            <p className="text-xl font-bold text-teal-700 mt-0.5 font-mono">
              {formatCurrency(stats.pipelineValue)}
            </p>
          </div>
          <div className="w-9 h-9 rounded-md bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-enterprise flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Avg Deal Health</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5 font-mono">{stats.avgHealth} / 100</p>
          </div>
          <div className="w-9 h-9 rounded-md bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Filter & Search Command Bar */}
      <Card className="bg-white border-slate-200 shadow-enterprise">
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Search Input */}
            <div className="md:col-span-4 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Search by quote ID, title, customer, owner..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 text-xs"
              />
            </div>

            {/* Status Filter */}
            <div className="md:col-span-3">
              <Select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="text-xs"
              >
                <option value="ALL">All Statuses (7)</option>
                <option value="DRAFT">Draft</option>
                <option value="PENDING_APPROVAL">Pending Approval</option>
                <option value="APPROVED">Approved</option>
                <option value="UNDER_NEGOTIATION">Negotiation</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="REVISION_REQUIRED">Returned</option>
                <option value="REJECTED">Rejected</option>
              </Select>
            </div>

            {/* Risk Filter */}
            <div className="md:col-span-2">
              <Select
                value={riskFilter}
                onChange={(e) => {
                  setRiskFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="text-xs"
              >
                <option value="ALL">All Risks</option>
                <option value="LOW">Low Risk</option>
                <option value="MEDIUM">Medium Risk</option>
                <option value="HIGH">High Risk</option>
                <option value="CRITICAL">Critical Risk</option>
              </Select>
            </div>

            {/* Customer Filter */}
            <div className="md:col-span-3">
              <Select
                value={customerFilter}
                onChange={(e) => {
                  setCustomerFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="text-xs"
              >
                <option value="ALL">All Enterprise Accounts</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.tier})
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {/* Active Filter Indicators & Reset */}
          {(searchTerm || statusFilter !== 'ALL' || riskFilter !== 'ALL' || customerFilter !== 'ALL') && (
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-2 text-slate-500">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  Filtering active: showing <strong>{sortedQuotations.length}</strong> of{' '}
                  <strong>{quotations.length}</strong> quotations
                </span>
              </div>
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-teal-700 hover:text-teal-900 font-semibold inline-flex items-center gap-1 cursor-pointer transition"
              >
                <RotateCcw className="w-3 h-3" />
                Clear All Filters
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Quotations Table */}
      <Card className="bg-white border-slate-200 shadow-enterprise overflow-hidden">
        {paginatedQuotations.length === 0 ? (
          <div className="py-12">
            <EmptyState
              title="No quotations match criteria"
              description="Try adjusting your search query, status filters, or customer selections."
              actionLabel="Clear Filters"
              onAction={handleClearFilters}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80 border-b border-slate-200">
                  <TableHead className="w-44">
                    <button
                      type="button"
                      onClick={() => handleSort('date')}
                      className="flex items-center gap-1 font-semibold text-slate-700 hover:text-slate-900 cursor-pointer"
                    >
                      <span>Quotation</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </button>
                  </TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="w-28 text-center">Tier</TableHead>
                  <TableHead className="w-36 text-right">
                    <button
                      type="button"
                      onClick={() => handleSort('amount')}
                      className="inline-flex items-center gap-1 font-semibold text-slate-700 hover:text-slate-900 cursor-pointer"
                    >
                      <span>Amount</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </button>
                  </TableHead>
                  <TableHead className="w-32 text-center">
                    <button
                      type="button"
                      onClick={() => handleSort('risk')}
                      className="inline-flex items-center gap-1 font-semibold text-slate-700 hover:text-slate-900 cursor-pointer"
                    >
                      <span>Risk</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </button>
                  </TableHead>
                  <TableHead className="w-40 text-center">
                    <button
                      type="button"
                      onClick={() => handleSort('status')}
                      className="inline-flex items-center gap-1 font-semibold text-slate-700 hover:text-slate-900 cursor-pointer"
                    >
                      <span>Status</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </button>
                  </TableHead>
                  <TableHead className="w-28">Created</TableHead>
                  <TableHead className="w-32">Owner</TableHead>
                  <TableHead className="w-24 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedQuotations.map((quote) => {
                  return (
                    <TableRow
                      key={quote.id}
                      className="hover:bg-slate-50/70 border-b border-slate-100 transition group"
                    >
                      {/* Quotation title & reference */}
                      <TableCell>
                        <Link
                          href={`/quotes/${quote.id}`}
                          className="font-bold text-slate-900 hover:text-teal-700 transition block"
                        >
                          <span className="text-xs">{quote.title}</span>
                        </Link>
                        <p className="font-mono text-[10px] text-teal-700 truncate max-w-xs mt-1" title={quote.id}>
                          Ref: {quote.id}
                        </p>
                      </TableCell>

                      {/* Customer */}
                      <TableCell>
                        <p className="font-semibold text-slate-800 text-xs">{quote.customerName}</p>
                        <p className="text-[11px] text-slate-400">
                          {quote.priceList || 'Standard Commercial 2026'}
                        </p>
                      </TableCell>

                      {/* Customer Tier */}
                      <TableCell className="text-center">
                        <TierBadge tier={quote.customerTier} />
                      </TableCell>

                      {/* Amount */}
                      <TableCell className="text-right">
                        <p className="font-bold text-slate-900 font-mono text-xs">
                          {formatCurrency(quote.grandTotal)}
                        </p>
                        {quote.totalDiscountAmount > 0 && (
                          <p className="text-[10px] text-amber-700 font-medium">
                            -{formatCurrency(quote.totalDiscountAmount)} disc.
                          </p>
                        )}
                      </TableCell>

                      {/* Risk */}
                      <TableCell className="text-center">
                        <RiskBadge level={quote.riskDiagnosis.level} />
                      </TableCell>

                      {/* Status */}
                      <TableCell className="text-center">
                        <StatusBadge status={quote.status} />
                      </TableCell>

                      {/* Created */}
                      <TableCell className="text-xs text-slate-500">
                        {new Date(quote.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </TableCell>

                      {/* Owner */}
                      <TableCell className="text-xs text-slate-700 font-medium">
                        {quote.owner || 'Marcus Vance'}
                      </TableCell>

                      {/* Action */}
                      <TableCell className="text-right">
                        <Link href={`/quotes/${quote.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs font-semibold hover:bg-teal-50 hover:text-teal-800 hover:border-teal-300 gap-1"
                          >
                            <span>Inspect</span>
                            <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-teal-600" />
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

        {/* Pagination Footer */}
        {sortedQuotations.length > 0 && (
          <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
            <div>
              Showing{' '}
              <span className="font-semibold text-slate-800">
                {(currentPage - 1) * ITEMS_PER_PAGE + 1}
              </span>{' '}
              to{' '}
              <span className="font-semibold text-slate-800">
                {Math.min(currentPage * ITEMS_PER_PAGE, sortedQuotations.length)}
              </span>{' '}
              of <span className="font-semibold text-slate-800">{sortedQuotations.length}</span> results
            </div>

            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-8 h-8 rounded-md text-xs font-semibold transition cursor-pointer ${
                    currentPage === pageNum
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {pageNum}
                </button>
              ))}

              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
