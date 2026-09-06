'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Tag,
  DollarSign,
  Layers,
  ArrowRight,
  ShieldCheck,
  RefreshCcw,
  CheckCircle2,
  Package,
  Wrench,
  Laptop,
  Search,
  Filter,
  Percent,
  Sparkles,
  Info,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TierBadge } from '@/components/ui/tier-badge';
import { TableLoadingSkeleton } from '@/components/ui/loading-state';
import { useProducts } from '@/hooks/use-dealflow';
import { formatCurrency } from '@/lib/utils';
import { CustomerTier, Product } from '@/types/dealflow';

export default function PriceListsPage() {
  const { data: products = [], isLoading } = useProducts();

  const [selectedTier, setSelectedTier] = useState<CustomerTier>('Bronze');
  const [selectedCurrency, setSelectedCurrency] = useState<'USD' | 'EUR'>('USD');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'Hardware' | 'Services'>('ALL');

  const eurRate = 0.92;

  const formatPrice = (amountInUsd: number) => {
    if (selectedCurrency === 'EUR') {
      return `€${Math.round(amountInUsd * eurRate).toLocaleString()}`;
    }
    return formatCurrency(amountInUsd);
  };

  // Tier parameters
  const tierConfig = useMemo(() => {
    switch (selectedTier) {
      case 'Bronze':
        return {
          title: 'Bronze Commercial Price List',
          code: 'PL-BRONZE-2026',
          target: 'Introductory & Standard Accounts',
          maxDiscount: '5% Max Ceiling',
          description: 'Standard baseline enterprise commercial price list with 0% automated concession.',
          accentColor: 'border-amber-600',
          badgeBg: 'bg-amber-50 text-amber-900 border-amber-300',
        };
      case 'Silver':
        return {
          title: 'Silver Growth Volume Price List',
          code: 'PL-SILVER-VOL',
          target: 'Mid-Market & Expanding Fleet Accounts',
          maxDiscount: '10% Max Ceiling',
          description: 'Automated 5% - 8% volume concession schedule for qualified Silver accounts.',
          accentColor: 'border-slate-400',
          badgeBg: 'bg-slate-100 text-slate-800 border-slate-300',
        };
      case 'Gold':
        return {
          title: 'Gold Enterprise Strategic Price List',
          code: 'PL-GOLD-STRAT',
          target: 'Tier 1 Enterprise & Strategic Partners',
          maxDiscount: '15% Max Ceiling',
          description: 'Maximum permitted category concession schedule (HW: 15%, Services: 10%).',
          accentColor: 'border-teal-600',
          badgeBg: 'bg-teal-50 text-teal-900 border-teal-300',
        };
    }
  }, [selectedTier]);

  // Compute price list items
  const priceListItems = useMemo(() => {
    return products
      .filter((p) => {
        if (categoryFilter !== 'ALL' && p.category !== categoryFilter) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          if (!p.name.toLowerCase().includes(q) && !p.sku.toLowerCase().includes(q)) return false;
        }
        return true;
      })
      .map((p) => {
        const isHw = p.category === 'Hardware';
        let discountPercent = 0;

        if (selectedTier === 'Bronze') {
          discountPercent = 0;
        } else if (selectedTier === 'Silver') {
          discountPercent = isHw ? 8 : 5;
        } else if (selectedTier === 'Gold') {
          discountPercent = isHw ? 15 : 10;
        }

        const basePrice = p.basePrice;
        const tierPriceUsd = p.tierPricing?.[selectedTier]?.usd ?? Math.round(basePrice * (1 - discountPercent / 100));
        const savingsUsd = basePrice - tierPriceUsd;

        return {
          ...p,
          discountPercent,
          tierPriceUsd,
          savingsUsd,
        };
      });
  }, [products, selectedTier, categoryFilter, searchQuery]);

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Enterprise Price Lists
            </h1>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${tierConfig.badgeBg}`}>
              {selectedTier} Tier Schedule
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Standardized commercial pricing schedules systematically governed by customer qualification limits and category ceilings.
          </p>
        </div>

        {/* Currency Switcher & Catalog Link */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center border border-slate-200 rounded-lg p-0.5 bg-white text-xs">
            <button
              onClick={() => setSelectedCurrency('USD')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                selectedCurrency === 'USD' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              USD ($)
            </button>
            <button
              onClick={() => setSelectedCurrency('EUR')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                selectedCurrency === 'EUR' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              EUR (€)
            </button>
          </div>

          <Link href="/products">
            <Button variant="outline" size="sm" className="text-xs gap-1.5">
              <Package className="w-3.5 h-3.5" />
              Manage Catalog
            </Button>
          </Link>
        </div>
      </div>

      {/* Tier Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {(['Bronze', 'Silver', 'Gold'] as const).map((tier) => {
          const isSelected = selectedTier === tier;
          return (
            <button
              key={tier}
              onClick={() => setSelectedTier(tier)}
              className={`p-4 rounded-lg text-left transition-all border-2 ${
                isSelected
                  ? tier === 'Gold'
                    ? 'border-teal-600 bg-teal-50/50 shadow-sm'
                    : tier === 'Silver'
                    ? 'border-slate-700 bg-slate-50 shadow-sm'
                    : 'border-amber-600 bg-amber-50/40 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900">{tier} Price List</span>
                <TierBadge tier={tier} />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {tier === 'Bronze'
                  ? 'Base Catalog (0% default)'
                  : tier === 'Silver'
                  ? 'Volume Concession (5-8%)'
                  : 'Strategic Partner (10-15%)'}
              </p>
            </button>
          );
        })}
      </div>

      {/* Tier Overview Banner */}
      <div className={`p-4 rounded-lg border-2 ${tierConfig.accentColor} bg-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4`}>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-teal-700" />
            <h2 className="text-sm font-bold text-slate-900">{tierConfig.title}</h2>
            <span className="font-mono text-xs text-slate-500 font-semibold">[{tierConfig.code}]</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
            {tierConfig.description} Target Audience: <strong>{tierConfig.target}</strong>.
          </p>
        </div>
        <div className="flex items-center gap-4 shrink-0 font-mono text-right">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Cap Rule</span>
            <span className="text-sm font-bold text-teal-800">{tierConfig.maxDiscount}</span>
          </div>
          <div className="w-px h-8 bg-slate-200" />
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Currency</span>
            <span className="text-sm font-bold text-slate-900">{selectedCurrency} ({selectedCurrency === 'EUR' ? '€' : '$'})</span>
          </div>
        </div>
      </div>

      {/* Mandatory Governance Warning Callout */}
      <div className="p-3.5 bg-amber-50 rounded-lg border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900">
        <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong>Mandatory Commercial Governance Policy:</strong> Customer tier price lists never bypass product category discount ceilings. Hardware items are strictly capped at 15%; Services and Support Retainers are strictly capped at 10%, regardless of Gold account standing.
        </div>
      </div>

      {/* Filters Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search catalog items in price list..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {(['ALL', 'Hardware', 'Services'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    categoryFilter === cat ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat === 'ALL' ? 'All Categories' : cat}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Price List Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <TableLoadingSkeleton rows={6} />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/75 hover:bg-slate-50/75">
                    <TableHead className="font-semibold text-slate-900">Product / SKU</TableHead>
                    <TableHead className="font-semibold text-slate-900">Category</TableHead>
                    <TableHead className="font-semibold text-slate-900">Commercial Billing</TableHead>
                    <TableHead className="font-semibold text-slate-900 text-right">Base List Price</TableHead>
                    <TableHead className="font-semibold text-slate-900 text-right">Schedule Discount</TableHead>
                    <TableHead className="font-semibold text-slate-900 text-right font-bold text-teal-900">
                      {selectedTier} Tier Price
                    </TableHead>
                    <TableHead className="font-semibold text-slate-900 text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {priceListItems.map((item) => {
                    const isHardware = item.category === 'Hardware';

                    return (
                      <TableRow key={item.id} className="hover:bg-slate-50/60 transition-colors">
                        {/* Product & SKU */}
                        <TableCell>
                          <div className="flex items-start gap-2.5">
                            <div className={`p-1.5 rounded mt-0.5 ${isHardware ? 'bg-sky-50 text-sky-700' : 'bg-teal-50 text-teal-700'}`}>
                              {isHardware ? <Laptop className="w-3.5 h-3.5" /> : <Wrench className="w-3.5 h-3.5" />}
                            </div>
                            <div>
                              <div className="font-semibold text-xs text-slate-900">{item.name}</div>
                              <div className="font-mono text-[10px] text-slate-400">{item.sku}</div>
                            </div>
                          </div>
                        </TableCell>

                        {/* Category */}
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                            isHardware ? 'bg-sky-50 text-sky-800 border border-sky-200' : 'bg-teal-50 text-teal-800 border border-teal-200'
                          }`}>
                            {item.category}
                          </span>
                        </TableCell>

                        {/* Commercial Billing (Recurring vs One-time) */}
                        <TableCell>
                          {item.isSubscription ? (
                            <div className="flex flex-col">
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-violet-800">
                                <RefreshCcw className="w-3 h-3 text-violet-600" />
                                Recurring
                              </span>
                              <span className="text-[11px] text-slate-500">
                                Billed {item.billingFrequency?.toLowerCase()}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-600">One-Time Outright</span>
                          )}
                        </TableCell>

                        {/* Base List Price */}
                        <TableCell className="text-right font-mono text-xs text-slate-500">
                          {formatPrice(item.basePrice)}
                        </TableCell>

                        {/* Schedule Discount */}
                        <TableCell className="text-right font-mono text-xs">
                          {item.discountPercent > 0 ? (
                            <span className="font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                              -{item.discountPercent}%
                            </span>
                          ) : (
                            <span className="text-slate-400">0%</span>
                          )}
                        </TableCell>

                        {/* Tier Price */}
                        <TableCell className="text-right font-mono">
                          <div className="font-bold text-slate-900 text-sm">{formatPrice(item.tierPriceUsd)}</div>
                          {item.savingsUsd > 0 && (
                            <div className="text-[10px] text-teal-700">Save {formatPrice(item.savingsUsd)}</div>
                          )}
                        </TableCell>

                        {/* Action */}
                        <TableCell className="text-right">
                          <Link href={`/products/${item.id}`}>
                            <Button variant="ghost" size="sm" className="text-xs h-7 gap-1 text-slate-600 hover:text-slate-900">
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
