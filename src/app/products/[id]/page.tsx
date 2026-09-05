'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import {
  Package,
  ArrowLeft,
  Layers,
  DollarSign,
  RefreshCcw,
  Tag,
  CheckCircle2,
  AlertCircle,
  Clock,
  Laptop,
  Wrench,
  Edit3,
  Sliders,
  Calendar,
  Building,
  Shield,
  Plus,
  ArrowUpRight,
  Info,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { CardLoadingSkeleton } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { useProduct, useSaveProduct } from '@/hooks/use-dealflow';
import { useToast } from '@/components/providers/query-provider';
import { formatCurrency } from '@/lib/utils';
import { Product, ProductVariant } from '@/types/dealflow';

interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  const resolvedParams = use(params);
  const productId = resolvedParams.id;

  const { data: product, isLoading, error } = useProduct(productId);
  const saveProductMutation = useSaveProduct();
  const { toast } = useToast();

  // Active section tab
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'VARIANTS' | 'PRICING' | 'SUBSCRIPTION'>('GENERAL');

  // Currency toggle: USD or EUR
  const [selectedCurrency, setSelectedCurrency] = useState<'USD' | 'EUR'>('USD');

  // Stock adjustment dialog
  const [stockDialogOpen, setStockDialogOpen] = useState(false);
  const [adjustedStock, setAdjustedStock] = useState<string>('');

  // Add variant dialog
  const [addVariantDialogOpen, setAddVariantDialogOpen] = useState(false);
  const [newVariantName, setNewVariantName] = useState('');
  const [newVariantColor, setNewVariantColor] = useState('');
  const [newVariantRam, setNewVariantRam] = useState('');
  const [newVariantManufacturer, setNewVariantManufacturer] = useState('');
  const [newVariantPriceAdj, setNewVariantPriceAdj] = useState('0');
  const [newVariantStock, setNewVariantStock] = useState('10');

  if (isLoading) {
    return (
      <div className="space-y-6 pb-12">
        <div className="h-8 w-64 bg-slate-200 animate-pulse rounded" />
        <CardLoadingSkeleton />
        <CardLoadingSkeleton />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="py-12">
        <ErrorState title="Product Not Found" message={`Could not locate catalog product ${productId}.`} />
        <div className="mt-4 text-center">
          <Link href="/products">
            <Button variant="outline">Return to Catalog</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isHardware = product.category === 'Hardware';
  const eurRate = 0.92;

  // Format currency helper
  const formatPrice = (amountInUsd: number) => {
    if (selectedCurrency === 'EUR') {
      return `€${Math.round(amountInUsd * eurRate).toLocaleString()}`;
    }
    return formatCurrency(amountInUsd);
  };

  // Handle stock update
  const handleStockUpdate = async () => {
    const stockNum = parseInt(adjustedStock, 10);
    if (isNaN(stockNum) || stockNum < 0) {
      toast({ title: 'Invalid Stock Count', description: 'Enter a valid non-negative integer.', type: 'error' });
      return;
    }

    const updated: Product = {
      ...product,
      availableStock: stockNum,
      stockStatus: stockNum === 0 ? 'LEAD_TIME_REQUIRED' : stockNum < 15 ? 'LOW_STOCK' : 'IN_STOCK',
    };

    try {
      await saveProductMutation.mutateAsync(updated);
      setStockDialogOpen(false);
      toast({ title: 'Stock Updated', description: `Available stock set to ${stockNum} units.`, type: 'success' });
    } catch {
      toast({ title: 'Update Failed', type: 'error' });
    }
  };

  // Handle add variant
  const handleAddVariant = async () => {
    if (!newVariantName.trim()) {
      toast({ title: 'Name Required', description: 'Please enter a variant name.', type: 'error' });
      return;
    }

    const newVariant: ProductVariant = {
      id: `VAR-${product.id}-${Date.now().toString().slice(-4)}`,
      name: newVariantName,
      sku: `${product.sku}-${(product.variants?.length || 0) + 1}`,
      color: newVariantColor || 'Standard',
      ram: newVariantRam || 'N/A',
      manufacturer: newVariantManufacturer || 'OEM',
      priceAdjustment: parseFloat(newVariantPriceAdj) || 0,
      availableStock: parseInt(newVariantStock, 10) || 0,
    };

    const updated: Product = {
      ...product,
      variants: [...(product.variants || []), newVariant],
    };

    try {
      await saveProductMutation.mutateAsync(updated);
      setAddVariantDialogOpen(false);
      toast({ title: 'Variant Added', description: `${newVariant.name} created.`, type: 'success' });
      setNewVariantName('');
      setNewVariantColor('');
      setNewVariantRam('');
      setNewVariantManufacturer('');
      setNewVariantPriceAdj('0');
      setNewVariantStock('10');
    } catch {
      toast({ title: 'Failed to Add Variant', type: 'error' });
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <Link href="/products">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                {product.sku}
              </span>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">{product.name}</h1>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                  isHardware
                    ? 'bg-sky-50 text-sky-800 border border-sky-200'
                    : 'bg-teal-50 text-teal-800 border border-teal-200'
                }`}
              >
                {product.category}
              </span>
              {product.isSubscription && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-violet-50 text-violet-800 border border-violet-200">
                  <RefreshCcw className="w-3 h-3" /> Recurring ({product.billingFrequency})
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">{product.description}</p>
          </div>
        </div>

        {/* Currency Switcher & Quick Actions */}
        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          {/* Currency Toggle */}
          <div className="flex items-center border border-slate-200 rounded-lg p-0.5 bg-white text-xs">
            <button
              onClick={() => setSelectedCurrency('USD')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                selectedCurrency === 'USD' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              USD ($)
            </button>
            <button
              onClick={() => setSelectedCurrency('EUR')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                selectedCurrency === 'EUR' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              EUR (€)
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="text-xs gap-1.5"
            onClick={() => {
              setAdjustedStock(product.availableStock?.toString() || '0');
              setStockDialogOpen(true);
            }}
          >
            <Sliders className="w-3.5 h-3.5 text-slate-500" />
            Adjust Stock
          </Button>

          <Link href="/price-lists">
            <Button variant="outline" size="sm" className="text-xs gap-1.5 border-teal-200 text-teal-800 hover:bg-teal-50">
              <Tag className="w-3.5 h-3.5" />
              Price Lists
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { id: 'GENERAL', label: 'General Information', icon: Info },
          { id: 'VARIANTS', label: `Variants (${product.variants?.length || 0})`, icon: Layers },
          { id: 'PRICING', label: 'Tier Pricing (Bronze/Silver/Gold)', icon: DollarSign },
          { id: 'SUBSCRIPTION', label: 'Subscription Terms', icon: RefreshCcw },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                isActive ? 'bg-teal-700 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: GENERAL INFORMATION */}
      {activeTab === 'GENERAL' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <Info className="w-4 h-4 text-teal-600" />
                  Product Specifications & Attributes
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
                  <div>
                    <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Product Name</span>
                    <p className="text-sm font-semibold text-slate-900 mt-0.5">{product.name}</p>
                  </div>
                  <div>
                    <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">SKU</span>
                    <p className="text-sm font-mono font-semibold text-slate-900 mt-0.5">{product.sku}</p>
                  </div>
                  <div>
                    <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Category</span>
                    <p className="text-sm font-semibold text-slate-900 mt-0.5">{product.category}</p>
                  </div>
                  <div>
                    <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Base Price ({selectedCurrency})</span>
                    <p className="text-base font-bold font-mono text-teal-700 mt-0.5">{formatPrice(product.basePrice)}</p>
                  </div>
                  <div>
                    <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Stock Status</span>
                    <p className="text-sm font-semibold text-slate-900 mt-0.5">{product.stockStatus.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Available Stock</span>
                    <p className="text-sm font-mono font-bold text-slate-900 mt-0.5">
                      {product.availableStock && product.availableStock < 900 ? `${product.availableStock} Units` : 'Unlimited Capacity'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Catalog Status</span>
                    <p className="text-sm font-semibold text-emerald-700 mt-0.5">{product.status || 'ACTIVE'}</p>
                  </div>
                  <div>
                    <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Commercial Model</span>
                    <p className="text-sm font-semibold text-slate-900 mt-0.5">
                      {product.isSubscription ? `Subscription (${product.billingFrequency})` : 'One-Time Outright Purchase'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Category Ceiling</span>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">
                      {product.category === 'Hardware' ? '15% Discount Cap' : '10% Discount Cap'}
                    </p>
                  </div>
                </div>

                <div className="mt-5 p-3.5 bg-slate-50 rounded-md border border-slate-200">
                  <span className="text-[11px] uppercase font-bold text-slate-500 tracking-wider">Description & Enterprise Scope</span>
                  <p className="text-xs text-slate-700 mt-1 leading-relaxed">{product.description}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Metrics Sidebar */}
          <div className="space-y-4">
            <Card className="border-teal-200 bg-teal-50/20">
              <CardContent className="p-5 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-800">Commercial Catalog Overview</span>
                <div>
                  <div className="text-3xl font-bold font-mono text-slate-900">{formatPrice(product.basePrice)}</div>
                  <p className="text-xs text-slate-500 mt-0.5">Base list price ({selectedCurrency})</p>
                </div>
                <div className="border-t border-teal-200 pt-3 space-y-1 text-xs font-mono text-slate-600">
                  <div className="flex justify-between">
                    <span>Gold Tier Target</span>
                    <span className="font-bold text-teal-800">
                      {product.tierPricing ? formatPrice(product.tierPricing.Gold.usd) : formatPrice(product.basePrice * 0.85)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Silver Tier Target</span>
                    <span className="font-bold text-slate-700">
                      {product.tierPricing ? formatPrice(product.tierPricing.Silver.usd) : formatPrice(product.basePrice * 0.92)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: VARIANTS */}
      {activeTab === 'VARIANTS' && (
        <Card>
          <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-teal-600" />
                Product Variants & Specifications
              </CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Configurable combinations of Color, RAM, and Manufacturer specifications with custom pricing deltas.
              </p>
            </div>
            <Button size="sm" className="text-xs gap-1.5 bg-teal-600 hover:bg-teal-700 text-white" onClick={() => setAddVariantDialogOpen(true)}>
              <Plus className="w-3.5 h-3.5" />
              Add Variant
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {!product.variants || product.variants.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No variants configured for this product. Click &quot;Add Variant&quot; to configure Color, RAM, or Manufacturer options.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/75 hover:bg-slate-50/75">
                      <TableHead className="font-semibold text-slate-900">Variant Name</TableHead>
                      <TableHead className="font-semibold text-slate-900">Variant SKU</TableHead>
                      <TableHead className="font-semibold text-slate-900">Color</TableHead>
                      <TableHead className="font-semibold text-slate-900">RAM / Spec</TableHead>
                      <TableHead className="font-semibold text-slate-900">Manufacturer</TableHead>
                      <TableHead className="font-semibold text-slate-900 text-right">Price Adjustment</TableHead>
                      <TableHead className="font-semibold text-slate-900 text-right">Stock</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {product.variants.map((v) => (
                      <TableRow key={v.id} className="hover:bg-slate-50/60 transition-colors">
                        <TableCell className="font-semibold text-xs text-slate-900">{v.name}</TableCell>
                        <TableCell className="font-mono text-xs text-slate-600">{v.sku}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700 border border-slate-200">
                            {v.color || 'Standard'}
                          </span>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-slate-700">{v.ram || 'N/A'}</TableCell>
                        <TableCell className="text-xs text-slate-700 font-medium">{v.manufacturer || 'OEM'}</TableCell>
                        <TableCell className="text-right font-mono font-bold text-xs">
                          {v.priceAdjustment > 0 ? (
                            <span className="text-teal-700">+{formatPrice(v.priceAdjustment)}</span>
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold text-xs text-slate-800">
                          {v.availableStock} units
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB 3: PRICING (Multi-tier Price Lists) */}
      {activeTab === 'PRICING' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-teal-50/50 p-4 rounded-lg border border-teal-200">
            <div>
              <h3 className="text-sm font-bold text-teal-950">Multi-Tier Commercial Price Lists</h3>
              <p className="text-xs text-teal-800 mt-0.5">
                Standardized pricing schedules automatically evaluated against customer tier limits (Bronze 5%, Silver 10%, Gold 15%).
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">Currency Display:</span>
              <div className="flex items-center border border-slate-300 rounded-md p-0.5 bg-white text-xs">
                <button
                  onClick={() => setSelectedCurrency('USD')}
                  className={`px-2 py-0.5 rounded font-semibold ${selectedCurrency === 'USD' ? 'bg-teal-700 text-white' : 'text-slate-600'}`}
                >
                  USD ($)
                </button>
                <button
                  onClick={() => setSelectedCurrency('EUR')}
                  className={`px-2 py-0.5 rounded font-semibold ${selectedCurrency === 'EUR' ? 'bg-teal-700 text-white' : 'text-slate-600'}`}
                >
                  EUR (€)
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Bronze */}
            <Card className="border-t-4 border-t-amber-600 hover:shadow-md transition-shadow">
              <CardContent className="p-5 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-800">Bronze Price List</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
                    Introductory
                  </span>
                </div>
                <div>
                  <div className="text-3xl font-bold font-mono text-slate-900">
                    {product.tierPricing ? formatPrice(product.tierPricing.Bronze.usd) : formatPrice(product.basePrice)}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Standard list catalog price</p>
                </div>
                <div className="border-t border-slate-100 pt-3 text-xs space-y-1.5">
                  <div className="flex justify-between text-slate-600">
                    <span>Discount Schedule</span>
                    <span className="font-semibold text-slate-900">0% Concession</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Max Allowed Limit</span>
                    <span className="font-semibold text-slate-900">5% Ceiling</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Silver */}
            <Card className="border-t-4 border-t-slate-400 hover:shadow-md transition-shadow">
              <CardContent className="p-5 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Silver Price List</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-300">
                    Growth Volume
                  </span>
                </div>
                <div>
                  <div className="text-3xl font-bold font-mono text-slate-900">
                    {product.tierPricing ? formatPrice(product.tierPricing.Silver.usd) : formatPrice(product.basePrice * 0.92)}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Automated volume concession</p>
                </div>
                <div className="border-t border-slate-100 pt-3 text-xs space-y-1.5">
                  <div className="flex justify-between text-slate-600">
                    <span>Discount Schedule</span>
                    <span className="font-semibold text-slate-900">{isHardware ? '8% Concession' : '5% Concession'}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Max Allowed Limit</span>
                    <span className="font-semibold text-slate-900">10% Ceiling</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Gold */}
            <Card className="border-t-4 border-t-teal-600 bg-teal-50/15 hover:shadow-md transition-shadow">
              <CardContent className="p-5 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-800">Gold Price List</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-900 border border-teal-300">
                    Strategic Partner
                  </span>
                </div>
                <div>
                  <div className="text-3xl font-bold font-mono text-teal-800">
                    {product.tierPricing ? formatPrice(product.tierPricing.Gold.usd) : formatPrice(product.basePrice * 0.85)}
                  </div>
                  <p className="text-[11px] text-teal-600 mt-0.5">Maximum category concession</p>
                </div>
                <div className="border-t border-teal-200 pt-3 text-xs space-y-1.5">
                  <div className="flex justify-between text-slate-600">
                    <span>Discount Schedule</span>
                    <span className="font-bold text-teal-800">{isHardware ? '15% Concession' : '10% Concession'}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Max Allowed Limit</span>
                    <span className="font-bold text-teal-900">{isHardware ? '15% Ceiling' : '10% Ceiling'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 4: SUBSCRIPTION */}
      {activeTab === 'SUBSCRIPTION' && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <RefreshCcw className="w-4 h-4 text-violet-600" />
                Subscription & Recurring Billing Parameters
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Subscription Product</span>
                  <p className="text-sm font-semibold text-slate-900 mt-0.5">
                    {product.isSubscription ? 'Yes (Recurring Billing)' : 'No (One-Time Outright Purchase)'}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Billing Frequency</span>
                  <p className="text-sm font-semibold text-slate-900 mt-0.5">{product.billingFrequency || 'NONE'}</p>
                </div>
                <div>
                  <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Recurring Amount</span>
                  <p className="text-base font-bold font-mono text-violet-700 mt-0.5">
                    {product.isSubscription
                      ? `${formatPrice(product.recurringPrice || product.basePrice)} / ${product.billingFrequency?.toLowerCase()}`
                      : 'N/A'}
                  </p>
                </div>
              </div>

              {product.isSubscription ? (
                <div className="p-4 bg-violet-50/50 rounded-lg border border-violet-200 text-xs text-violet-900 space-y-2">
                  <h4 className="font-bold text-violet-950">Active Recurring Terms:</h4>
                  <p className="leading-relaxed">
                    This SKU automatically populates recurring line items in commercial invoices and is eligible for linking with Master Service Agreements under the Subscriptions module.
                  </p>
                  <div className="flex items-center gap-3 pt-2">
                    <Link href="/subscriptions">
                      <Button size="sm" variant="outline" className="text-xs h-7 border-violet-300 text-violet-900 hover:bg-violet-100">
                        View Active Agreements
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600">
                  This product is billed as a one-time capital expenditure or hardware deployment line item.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ADJUST STOCK DIALOG */}
      <Dialog open={stockDialogOpen} onOpenChange={setStockDialogOpen}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900">
            <Sliders className="w-5 h-5 text-teal-600" />
            Adjust Inventory Stock — {product.name}
          </DialogTitle>
          <DialogDescription>
            Update the catalog available stock count across all warehouses.
          </DialogDescription>
        </DialogHeader>
        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Available Stock (Units)</label>
            <Input
              type="number"
              min="0"
              value={adjustedStock}
              onChange={(e) => setAdjustedStock(e.target.value)}
              className="font-mono text-sm"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setStockDialogOpen(false)}>
            Cancel
          </Button>
          <Button className="bg-teal-600 hover:bg-teal-700 text-white text-xs" onClick={handleStockUpdate}>
            Save Stock
          </Button>
        </DialogFooter>
      </Dialog>

      {/* ADD VARIANT DIALOG */}
      <Dialog open={addVariantDialogOpen} onOpenChange={setAddVariantDialogOpen}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900">
            <Layers className="w-5 h-5 text-teal-600" />
            Add Product Variant — {product.name}
          </DialogTitle>
          <DialogDescription>
            Configure Color, RAM, Manufacturer, and price delta for this new variant.
          </DialogDescription>
        </DialogHeader>
        <div className="p-6 space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Variant Name *</label>
            <Input
              placeholder="e.g. Space Gray / 64GB / Dell OEM"
              value={newVariantName}
              onChange={(e) => setNewVariantName(e.target.value)}
              className="text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Color</label>
              <Input
                placeholder="e.g. Space Gray"
                value={newVariantColor}
                onChange={(e) => setNewVariantColor(e.target.value)}
                className="text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">RAM / Spec</label>
              <Input
                placeholder="e.g. 64GB Unified"
                value={newVariantRam}
                onChange={(e) => setNewVariantRam(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Manufacturer</label>
              <Input
                placeholder="e.g. Dell Enterprise"
                value={newVariantManufacturer}
                onChange={(e) => setNewVariantManufacturer(e.target.value)}
                className="text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Price Adj. ($)</label>
              <Input
                type="number"
                placeholder="0"
                value={newVariantPriceAdj}
                onChange={(e) => setNewVariantPriceAdj(e.target.value)}
                className="text-xs font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Stock (Units)</label>
              <Input
                type="number"
                placeholder="10"
                value={newVariantStock}
                onChange={(e) => setNewVariantStock(e.target.value)}
                className="text-xs font-mono"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setAddVariantDialogOpen(false)}>
            Cancel
          </Button>
          <Button className="bg-teal-600 hover:bg-teal-700 text-white text-xs" onClick={handleAddVariant}>
            Add Variant
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
