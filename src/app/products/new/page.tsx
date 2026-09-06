'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Package,
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Tag,
  Laptop,
  Wrench,
  DollarSign,
  Layers,
  RefreshCcw,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useSaveProduct } from '@/hooks/use-dealflow';
import { useToast } from '@/components/providers/query-provider';
import { formatCurrency } from '@/lib/utils';
import { Product, ProductCategory, ProductStatus, ProductBillingFrequency } from '@/types/dealflow';

const productSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters'),
  sku: z
    .string()
    .min(3, 'SKU must be at least 3 characters')
    .regex(/^[A-Z0-9-_]+$/, 'SKU must be uppercase letters, numbers, hyphens, or underscores'),
  category: z.enum(['Hardware', 'Services']),
  basePrice: z.coerce.number().positive('Base price must be greater than 0'),
  currency: z.enum(['USD', 'EUR']),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  availableStock: z.coerce.number().min(0, 'Available stock cannot be negative'),
  stockStatus: z.enum(['IN_STOCK', 'LOW_STOCK', 'LEAD_TIME_REQUIRED']),
  status: z.enum(['ACTIVE', 'DRAFT', 'ARCHIVED']),
  isSubscription: z.boolean(),
  billingFrequency: z.enum(['NONE', 'MONTHLY', 'QUARTERLY', 'ANNUAL']),
  recurringPrice: z.coerce.number().min(0).optional(),
  variants: z
    .array(
      z.object({
        name: z.string().min(2, 'Variant name required'),
        sku: z.string().min(3, 'Variant SKU required'),
        color: z.string().optional(),
        ram: z.string().optional(),
        manufacturer: z.string().optional(),
        priceAdjustment: z.coerce.number(),
        availableStock: z.coerce.number().min(0),
      })
    )
    .optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

export default function NewProductPage() {
  const router = useRouter();
  const saveProductMutation = useSaveProduct();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    watch,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      name: '',
      sku: '',
      category: 'Hardware',
      basePrice: 999,
      currency: 'USD',
      description: '',
      availableStock: 25,
      stockStatus: 'IN_STOCK',
      status: 'ACTIVE',
      isSubscription: false,
      billingFrequency: 'NONE',
      recurringPrice: 0,
      variants: [
        {
          name: 'Standard Base Configuration',
          sku: 'VAR-BASE-01',
          color: 'Space Gray',
          ram: '16GB',
          manufacturer: 'Dell Enterprise',
          priceAdjustment: 0,
          availableStock: 25,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'variants',
  });

  const isSubscription = watch('isSubscription');
  const selectedCategory = watch('category');
  const basePrice = watch('basePrice') || 0;

  // Real-time calculated tier previews (based on category ceilings: HW 15%, Services 10%)
  const maxCeiling = selectedCategory === 'Hardware' ? 15 : 10;
  const bronzePrice = basePrice;
  const silverPrice = Math.round(basePrice * (1 - (selectedCategory === 'Hardware' ? 0.08 : 0.05)));
  const goldPrice = Math.round(basePrice * (1 - maxCeiling / 100));

  const onSubmit = async (data: ProductFormValues) => {
    const newId = `PROD-${Date.now().toString().slice(-4)}`;

    const product: Product = {
      id: newId,
      sku: data.sku,
      name: data.name,
      category: data.category as ProductCategory,
      basePrice: data.basePrice,
      currency: data.currency,
      description: data.description,
      stockStatus: data.stockStatus,
      availableStock: data.availableStock,
      status: data.status as ProductStatus,
      isSubscription: data.isSubscription,
      billingFrequency: data.isSubscription ? data.billingFrequency : 'NONE',
      recurringPrice: data.isSubscription ? (data.recurringPrice || data.basePrice) : undefined,
      variants: (data.variants || []).map((v, idx) => ({
        id: `VAR-${newId}-${idx + 1}`,
        name: v.name,
        sku: v.sku,
        color: v.color || 'Standard',
        ram: v.ram || 'N/A',
        manufacturer: v.manufacturer || 'OEM',
        priceAdjustment: v.priceAdjustment,
        availableStock: v.availableStock,
      })),
      tierPricing: {
        Bronze: { usd: bronzePrice, eur: Math.round(bronzePrice * 0.92), discountPercent: 0 },
        Silver: {
          usd: silverPrice,
          eur: Math.round(silverPrice * 0.92),
          discountPercent: selectedCategory === 'Hardware' ? 8 : 5,
        },
        Gold: {
          usd: goldPrice,
          eur: Math.round(goldPrice * 0.92),
          discountPercent: maxCeiling,
        },
      },
    };

    try {
      await saveProductMutation.mutateAsync(product);
      toast({
        title: 'Product Created Successfully',
        description: `${product.name} (${product.sku}) saved to catalog.`,
        type: 'success',
      });
      router.push(`/products/${product.id}`);
    } catch (err) {
      toast({
        title: 'Save Failed',
        description: 'Unable to save product to catalog.',
        type: 'error',
      });
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
        <Link href="/products">
          <Button variant="outline" size="sm" className="h-8 w-8 p-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Package className="w-5 h-5 text-teal-600" />
            Add New Product or Service
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Create catalog SKU with pricing schedules, variants, and subscription parameters.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form (2 columns) */}
          <div className="lg:col-span-2 space-y-6">
            {/* General Information Card */}
            <Card>
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <Info className="w-4 h-4 text-teal-600" />
                  General Information
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Product Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Product / Service Name <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      placeholder="e.g. UltraBook Enterprise 15"
                      {...register('name')}
                      className={errors.name ? 'border-rose-400' : ''}
                    />
                    {errors.name && <p className="text-[11px] text-rose-600">{errors.name.message}</p>}
                  </div>

                  {/* SKU */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Stock Keeping Unit (SKU) <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      placeholder="e.g. HW-UB15-PRO"
                      {...register('sku')}
                      className={`font-mono text-xs ${errors.sku ? 'border-rose-400' : ''}`}
                    />
                    {errors.sku && <p className="text-[11px] text-rose-600">{errors.sku.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Category */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Category</label>
                    <Select {...register('category')}>
                      <option value="Hardware">Hardware (15% Cap)</option>
                      <option value="Services">Services (10% Cap)</option>
                    </Select>
                  </div>

                  {/* Status */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Catalog Status</label>
                    <Select {...register('status')}>
                      <option value="ACTIVE">Active (Available for quoting)</option>
                      <option value="DRAFT">Draft (In Review)</option>
                      <option value="ARCHIVED">Archived (Deprecated)</option>
                    </Select>
                  </div>

                  {/* Stock Status */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Inventory Status</label>
                    <Select {...register('stockStatus')}>
                      <option value="IN_STOCK">In Stock</option>
                      <option value="LOW_STOCK">Low Stock</option>
                      <option value="LEAD_TIME_REQUIRED">Lead Time Required</option>
                    </Select>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Product Description <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Provide enterprise technical specification, warranty coverage, and hardware specs..."
                    {...register('description')}
                    className={`w-full text-xs border rounded-md p-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                      errors.description ? 'border-rose-400' : 'border-slate-300'
                    }`}
                  />
                  {errors.description && <p className="text-[11px] text-rose-600">{errors.description.message}</p>}
                </div>
              </CardContent>
            </Card>

            {/* Pricing & Commercial Terms Card */}
            <Card>
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-teal-600" />
                  Base Pricing & Currency
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Base Price */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Base Catalog Price <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="999.00"
                      {...register('basePrice')}
                      className={`font-mono ${errors.basePrice ? 'border-rose-400' : ''}`}
                    />
                    {errors.basePrice && <p className="text-[11px] text-rose-600">{errors.basePrice.message}</p>}
                  </div>

                  {/* Currency */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Primary Currency</label>
                    <Select {...register('currency')}>
                      <option value="USD">USD ($ - US Dollar)</option>
                      <option value="EUR">EUR (€ - Euro)</option>
                    </Select>
                  </div>

                  {/* Available Stock */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Available Stock (Units)</label>
                    <Input
                      type="number"
                      placeholder="50"
                      {...register('availableStock')}
                      className={`font-mono ${errors.availableStock ? 'border-rose-400' : ''}`}
                    />
                    {errors.availableStock && (
                      <p className="text-[11px] text-rose-600">{errors.availableStock.message}</p>
                    )}
                  </div>
                </div>

                {/* Subscription / Recurring Pricing Toggle */}
                <div className="p-4 rounded-lg bg-violet-50/50 border border-violet-200 space-y-3">
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      id="isSubscription"
                      {...register('isSubscription')}
                      className="w-4 h-4 accent-violet-600 rounded"
                    />
                    <label htmlFor="isSubscription" className="text-xs font-bold text-slate-900 cursor-pointer">
                      This is a Recurring Subscription or Service Retainer
                    </label>
                  </div>

                  {isSubscription && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-violet-200">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">Billing Frequency</label>
                        <Select {...register('billingFrequency')}>
                          <option value="MONTHLY">Monthly</option>
                          <option value="QUARTERLY">Quarterly</option>
                          <option value="ANNUAL">Annual</option>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">Recurring Price per Cycle ($)</label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="e.g. 350.00"
                          {...register('recurringPrice')}
                          className="font-mono text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Product Variants Card */}
            <Card>
              <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-teal-600" />
                  Product Variants (Color, RAM, Manufacturer)
                </CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs gap-1 h-7 border-teal-200 text-teal-700 hover:bg-teal-50"
                  onClick={() =>
                    append({
                      name: `Variant ${fields.length + 1}`,
                      sku: `VAR-${Date.now().toString().slice(-4)}`,
                      color: 'Matte Black',
                      ram: '32GB',
                      manufacturer: 'Dell OEM',
                      priceAdjustment: 150,
                      availableStock: 15,
                    })
                  }
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Variant
                </Button>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                {fields.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">No variants added. Base product SKU will be used.</p>
                ) : (
                  fields.map((field, index) => (
                    <div key={field.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">Variant #{index + 1}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-slate-600">Variant Name</label>
                          <Input
                            placeholder="e.g. Space Gray / 32GB"
                            {...register(`variants.${index}.name` as const)}
                            className="text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-slate-600">Variant SKU</label>
                          <Input
                            placeholder="e.g. HW-VAR-32"
                            {...register(`variants.${index}.sku` as const)}
                            className="text-xs font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-slate-600">Color</label>
                          <Input
                            placeholder="e.g. Space Gray"
                            {...register(`variants.${index}.color` as const)}
                            className="text-xs"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-slate-600">RAM / Spec</label>
                          <Input
                            placeholder="e.g. 32GB High-Performance"
                            {...register(`variants.${index}.ram` as const)}
                            className="text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-slate-600">Manufacturer</label>
                          <Input
                            placeholder="e.g. Dell Enterprise"
                            {...register(`variants.${index}.manufacturer` as const)}
                            className="text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-slate-600">Price Adj. ($)</label>
                          <Input
                            type="number"
                            placeholder="0"
                            {...register(`variants.${index}.priceAdjustment` as const)}
                            className="text-xs font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Live Tier Price Schedule Preview & Submit */}
          <div className="space-y-6">
            {/* Live Tier Schedule Preview */}
            <Card className="border-teal-200 bg-teal-50/20">
              <CardHeader className="pb-3 border-b border-teal-200">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-teal-800 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" />
                  Live Policy Tier Price Schedule
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed">
                  DealFlow360 automatically computes compliant tier price lists based on category ceilings (
                  <span className="font-semibold text-teal-800">
                    {selectedCategory === 'Hardware' ? 'Hardware: 15% Cap' : 'Services: 10% Cap'}
                  </span>
                  ).
                </p>

                {/* Bronze */}
                <div className="p-3 bg-white rounded-md border border-slate-200 space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-amber-800">Bronze Price List (0% Concession)</span>
                    <span className="font-mono font-bold text-slate-900">{formatCurrency(bronzePrice)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-slate-500 font-mono">
                    <span>EUR Equivalent: €{Math.round(bronzePrice * 0.92)}</span>
                    <span className="text-amber-700 font-semibold">Introductory Tier</span>
                  </div>
                </div>

                {/* Silver */}
                <div className="p-3 bg-white rounded-md border border-slate-200 space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700">
                      Silver Price List ({selectedCategory === 'Hardware' ? '8%' : '5%'} Concession)
                    </span>
                    <span className="font-mono font-bold text-slate-900">{formatCurrency(silverPrice)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-slate-500 font-mono">
                    <span>EUR Equivalent: €{Math.round(silverPrice * 0.92)}</span>
                    <span className="text-teal-700 font-semibold">Growth Volume</span>
                  </div>
                </div>

                {/* Gold */}
                <div className="p-3 bg-white rounded-md border border-teal-200 space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-teal-900">
                      Gold Price List ({maxCeiling}% Max Concession)
                    </span>
                    <span className="font-mono font-bold text-teal-700">{formatCurrency(goldPrice)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-slate-500 font-mono">
                    <span>EUR Equivalent: €{Math.round(goldPrice * 0.92)}</span>
                    <span className="text-teal-800 font-semibold">Strategic Partner</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions Card */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <Button
                  type="submit"
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white gap-1.5"
                  disabled={isSubmitting}
                >
                  <Save className="w-4 h-4" />
                  {isSubmitting ? 'Saving to Catalog...' : 'Save Product to Catalog'}
                </Button>

                <Link href="/products" className="block">
                  <Button type="button" variant="outline" className="w-full text-xs">
                    Cancel & Return to Catalog
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
