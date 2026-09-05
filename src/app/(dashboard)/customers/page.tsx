'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { customersApi } from '@/lib/api/customersApi';
import { CustomerTierBadge } from '@/components/ui/CustomerTierBadge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Building2, Filter } from 'lucide-react';
import Link from 'next/link';

export default function CustomersPage() {
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('ALL');

  const { data, isLoading } = useQuery({
    queryKey: ['customers', search, tierFilter],
    queryFn: () => customersApi.getCustomers({ search, tier: tierFilter }),
  });

  const customers = data?.data || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Customers</h1>

      <div className="flex flex-col sm:flex-row gap-4 items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input placeholder="Search customers..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
            value={tierFilter} onChange={e => setTierFilter(e.target.value)}
          >
            <option value="ALL">All Tiers</option>
            <option value="GOLD">Gold</option>
            <option value="SILVER">Silver</option>
            <option value="BRONZE">Bronze</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-slate-500">Loading customers...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customers.map((c: any) => (
            <Link key={c.id} href={`/customers/${c.id}`}>
              <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer border-slate-200 hover:border-teal-200 group">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center group-hover:bg-teal-50 transition-colors">
                    <Building2 className="w-6 h-6 text-slate-400 group-hover:text-teal-600" />
                  </div>
                  <CustomerTierBadge tier={c.tier} />
                </div>
                <div className="font-bold text-slate-900 text-lg mb-1">{c.name}</div>
                <div className="text-sm text-slate-500">{c.contactName}</div>
                <div className="text-sm text-slate-400 mt-1">{c.contactEmail}</div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
