'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Package,
  Layers,
  Search,
  Plus,
  ArrowRight,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCcw,
  Wrench,
  Laptop,
  CreditCard,
  DollarSign,
  Tag,
  ShieldCheck,
  Archive,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TableLoadingSkeleton } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { useProducts } from '@/hooks/use-dealflow';
import { formatCurrency } from '@/lib/utils';
import { Product, ProductCategory, ProductStatus } from '@/types/dealflow';

function StockBadge({ status, stock }: { status: string; stock?: number }) {
  if (status === 'IN_STOCK') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
        {stock && stock < 900 ? `${stock} in stock` : 'Available'}
      </span>
    );
  }
  if (status === 'LOW_STOCK') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300">
        <AlertCircle className="w-3 h-3 text-amber-600" />
        {stock ? `${stock} left` : 'Low Stock'}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
      <Clock className="w-3 h-3" />
      Lead Time Req.
    </span>
  );
}

function SubscriptionBadge({ isSub, freq }: { isSub?: boolean; freq?: string }) {
  if (isSub && freq && freq !== 'NONE') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-violet-50 text-violet-800 border border-violet-200">
        <RefreshCcw className="w-3 h-3 text-violet-600" />
        Recurring ({freq[0] + freq.slice(1).toLowerCase()})
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
      One-Time
    </span>
  );
}

function StatusBadge({ status = 'ACTIVE' }: { status?: ProductStatus }) {
  if (status === 'ACTIVE') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        Active
      </span>
    );
  }
  if (status === 'DRAFT') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        Draft
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
      <Archive className="w-3 h-3" /> Archived
    </span>
  );
}

export default function ProductsListPage() {
  const { data: products = [], isLoading } = useProducts();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | ProductCategory>('ALL');
  const [selectedType, setSelectedType] = useState<'ALL' | 'ONE_TIME' | 'SUBSCRIPTION'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | ProductStatus>('ALL');

  // KPI Metrics
  const kpis = useMemo(() => {
    let hardware = 0;
    let services = 0;
    let subscriptions = 0;
    products.forEach((p) => {
      if (p.category === 'Hardware') hardware++;
      if (p.category === 'Services') services++;
      if (p.isSubscription) subscriptions++;
    });
    return { total: products.length, hardware, services, subscriptions };
  }, [products]);

  // Filtered list
  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (selectedCategory !== 'ALL' && p.category !== selectedCategory) return false;
      if (selectedStatus !== 'ALL' && (p.status || 'ACTIVE') !== selectedStatus) return false;
      if (selectedType === 'SUBSCRIPTION' && !p.isSubscription) return false;
      if (selectedType === 'ONE_TIME' && p.isSubscription) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (
          !p.name.toLowerCase().includes(q) &&
          !p.sku.toLowerCase().includes(q) &&
          !p.description.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [products, selectedCategory, selectedType, selectedStatus, searchQuery]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Product Catalog & Price Lists
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200">
              {products.length} Products
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Enterprise hardware inventory, professional services, recurring subscriptions, and multi-tier pricing schedules.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/price-lists">
            <Button variant="outline" size="sm" className="text-xs gap-1.5 border-teal-200 text-teal-800 hover:bg-teal-50">
              <Tag className="w-3.5 h-3.5" />
              View Tier Price Lists
            </Button>
          </Link>
          <Link href="/products/new">
            <Button size="sm" className="text-xs gap-1.5 bg-teal-600 hover:bg-teal-700 text-white">
              <Plus className="w-3.5 h-3.5" />
              New Product
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:border-slate-300 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Products</span>
              <div className="p-1.5 rounded-md bg-slate-100 text-slate-700">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold font-mono text-slate-900 mt-1">{kpis.total}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Catalog SKUs</p>
          </CardContent>
        </Card>

        <Card className="hover:border-teal-300 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Hardware Systems</span>
              <div className="p-1.5 rounded-md bg-sky-50 text-sky-700">
                <Laptop className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold font-mono text-sky-700 mt-1">{kpis.hardware}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">15% Max discount ceiling</p>
          </CardContent>
        </Card>

        <Card className="hover:border-teal-300 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Services & SLAs</span>
              <div className="p-1.5 rounded-md bg-teal-50 text-teal-700">
                <Wrench className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold font-mono text-teal-700 mt-1">{kpis.services}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">10% Max discount ceiling</p>
          </CardContent>
        </Card>

        <Card className="hover:border-violet-300 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Subscriptions / MRR</span>
              <div className="p-1.5 rounded-md bg-violet-50 text-violet-700">
                <RefreshCcw className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold font-mono text-violet-700 mt-1">{kpis.subscriptions}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Recurring SLA & Care Plans</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-3 items-center justify-between">
            <div className="relative w-full lg:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search products by name, SKU, description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-1.5 flex-wrap w-full lg:w-auto">
              {/* Category */}
              {(['ALL', 'Hardware', 'Services'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    selectedCategory === cat
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat === 'ALL' ? 'All Categories' : cat}
                </button>
              ))}

              <div className="w-px h-5 bg-slate-200 mx-1 hidden sm:block" />

              {/* Type */}
              {[
                { label: 'All Types', value: 'ALL' },
                { label: 'One-Time', value: 'ONE_TIME' },
                { label: 'Subscription', value: 'SUBSCRIPTION' },
              ].map((t) => (
                <button
                  key={t.value}
                  onClick={() => setSelectedType(t.value as typeof selectedType)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    selectedType === t.value
                      ? 'bg-teal-700 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}

              <div className="w-px h-5 bg-slate-200 mx-1 hidden sm:block" />

              {/* Status */}
              {(['ALL', 'ACTIVE', 'DRAFT'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setSelectedStatus(st)}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    selectedStatus === st
                      ? 'bg-emerald-700 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st === 'ALL' ? 'All' : st[0] + st.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <TableLoadingSkeleton rows={5} />
          ) : filtered.length === 0 ? (
            <EmptyState
              title="No Products Found"
              description="No catalog items matched your query or filters."
              actionLabel="Reset Filters"
              onAction={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
                setSelectedType('ALL');
                setSelectedStatus('ALL');
              }}
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/75 hover:bg-slate-50/75">
                    <TableHead className="font-semibold text-slate-900">Product</TableHead>
                    <TableHead className="font-semibold text-slate-900">Category</TableHead>
                    <TableHead className="font-semibold text-slate-900">SKU</TableHead>
                    <TableHead className="font-semibold text-slate-900 text-right">Base Price</TableHead>
                    <TableHead className="font-semibold text-slate-900">Available Stock</TableHead>
                    <TableHead className="font-semibold text-slate-900">Subscription</TableHead>
                    <TableHead className="font-semibold text-slate-900">Status</TableHead>
                    <TableHead className="font-semibold text-slate-900 text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((prod) => {
                    const isHardware = prod.category === 'Hardware';

                    return (
                      <TableRow key={prod.id} className="hover:bg-slate-50/60 transition-colors">
                        {/* Product Name & Details */}
                        <TableCell>
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${isHardware ? 'bg-sky-50 text-sky-700' : 'bg-teal-50 text-teal-700'}`}>
                              {isHardware ? <Laptop className="w-4 h-4" /> : <Wrench className="w-4 h-4" />}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-900 text-xs">{prod.name}</span>
                              <span className="text-[11px] text-slate-500 line-clamp-1 max-w-xs">{prod.description}</span>
                              {prod.variants && prod.variants.length > 0 && (
                                <span className="text-[10px] text-slate-400 mt-0.5 font-mono">
                                  {prod.variants.length} variants available
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        {/* Category */}
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                            isHardware ? 'bg-sky-50 text-sky-800 border border-sky-200' : 'bg-teal-50 text-teal-800 border border-teal-200'
                          }`}>
                            {prod.category}
                          </span>
                        </TableCell>

                        {/* SKU */}
                        <TableCell>
                          <span className="font-mono text-xs font-medium text-slate-700">{prod.sku}</span>
                        </TableCell>

                        {/* Base Price */}
                        <TableCell className="text-right font-mono">
                          <div className="font-bold text-slate-900">{formatCurrency(prod.basePrice)}</div>
                          {prod.tierPricing && (
                            <div className="text-[10px] text-teal-700">Gold: {formatCurrency(prod.tierPricing.Gold.usd)}</div>
                          )}
                        </TableCell>

                        {/* Available Stock */}
                        <TableCell>
                          <StockBadge status={prod.stockStatus} stock={prod.availableStock} />
                        </TableCell>

                        {/* Subscription */}
                        <TableCell>
                          <SubscriptionBadge isSub={prod.isSubscription} freq={prod.billingFrequency} />
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <StatusBadge status={prod.status} />
                        </TableCell>

                        {/* Action */}
                        <TableCell className="text-right">
                          <Link href={`/products/${prod.id}`}>
                            <Button variant="outline" size="sm" className="text-xs gap-1">
                              Manage
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
