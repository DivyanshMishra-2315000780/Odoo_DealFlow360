'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { quotesApi } from '@/lib/api/quotesApi';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { CustomerTierBadge } from '@/components/ui/CustomerTierBadge';
import { RiskBadge } from '@/components/ui/RiskBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Plus, Filter, LayoutGrid, List } from 'lucide-react';
import Link from 'next/link';
import { Quotation } from '@/types';

export default function QuotesPage() {
  const [view, setView] = useState<'TABLE' | 'KANBAN'>('TABLE');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const { data, isLoading } = useQuery({
    queryKey: ['quotes', searchTerm, statusFilter],
    queryFn: () => quotesApi.getQuotes({ search: searchTerm, status: statusFilter }),
  });

  const quotes = data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Quotations</h1>
        <Link href="/quotes/new">
          <Button className="bg-teal-600 hover:bg-teal-700">
            <Plus className="w-4 h-4 mr-2" /> New Quotation
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input 
              placeholder="Search quotes..." 
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select 
              className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="PENDING_APPROVAL">Pending Approval</option>
              <option value="NEGOTIATION">Negotiation</option>
              <option value="APPROVED">Approved</option>
              <option value="CONFIRMED">Confirmed</option>
            </select>
          </div>
        </div>

        <div className="flex bg-slate-100 rounded-lg p-1">
          <button 
            className={`p-2 rounded-md transition-colors ${view === 'TABLE' ? 'bg-white shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            onClick={() => setView('TABLE')}
          >
            <List className="w-4 h-4" />
          </button>
          <button 
            className={`p-2 rounded-md transition-colors ${view === 'KANBAN' ? 'bg-white shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            onClick={() => setView('KANBAN')}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-slate-500">Loading quotations...</div>
      ) : quotes.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-slate-300 rounded-xl bg-slate-50">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-6 h-6 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-1">No quotations found</h3>
          <p className="text-slate-500">Try adjusting your filters or create a new quote.</p>
        </div>
      ) : view === 'TABLE' ? (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-6 py-4">Quote Number</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Risk</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                  <th className="px-6 py-4 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {quotes.map((quote: Quotation) => (
                  <tr key={quote.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium">
                      <Link href={`/quotes/${quote.id}`} className="text-teal-600 hover:underline">
                        {quote.quoteNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{quote.customer?.name}</div>
                      <div className="mt-1"><CustomerTierBadge tier={quote.customer?.tier!} /></div>
                    </td>
                    <td className="px-6 py-4"><StatusBadge status={quote.status} /></td>
                    <td className="px-6 py-4"><RiskBadge level={quote.riskLevel} /></td>
                    <td className="px-6 py-4 text-right font-medium">${quote.amount.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right text-slate-500">{new Date(quote.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-start">
          {/* Simple Kanban implementation for demo */}
          {['DRAFT', 'PENDING_APPROVAL', 'NEGOTIATION', 'APPROVED', 'CONFIRMED'].map((colStatus) => {
            const colQuotes = quotes.filter((q: Quotation) => q.status === colStatus);
            return (
              <div key={colStatus} className="bg-slate-100/50 rounded-xl p-3">
                <div className="font-semibold text-xs text-slate-500 uppercase tracking-wider mb-3 px-2 flex justify-between">
                  {colStatus.replace('_', ' ')}
                  <span className="bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full">{colQuotes.length}</span>
                </div>
                <div className="space-y-3">
                  {colQuotes.map((quote: Quotation) => (
                    <Card key={quote.id} className="shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <Link href={`/quotes/${quote.id}`} className="font-medium text-sm text-teal-600 hover:underline">
                            {quote.quoteNumber}
                          </Link>
                          <RiskBadge level={quote.riskLevel} />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-900 truncate">{quote.customer?.name}</div>
                          <div className="mt-1"><CustomerTierBadge tier={quote.customer?.tier!} /></div>
                        </div>
                        <div className="font-semibold text-slate-900 text-right text-sm">
                          ${quote.amount.toLocaleString()}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Need to import FileText for empty state
import { FileText } from 'lucide-react';
