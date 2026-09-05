'use client';

import { useState, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { quotesApi } from '@/lib/api/quotesApi';
import { customersApi } from '@/lib/api/customersApi';
import { productsApi } from '@/lib/api/productsApi';
import { useAuth } from '@/lib/auth/useSession';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

const quoteLineSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  discountPercentage: z.number().min(0).max(100).default(0),
});

const quoteSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  validUntil: z.string().min(1, 'Valid date is required'),
  notes: z.string().optional(),
  lines: z.array(quoteLineSchema).min(1, 'At least one line item is required'),
});

type QuoteFormData = z.infer<typeof quoteSchema>;

export default function NewQuotePage() {
  const router = useRouter();
  const { user } = useAuth();

  const { data: customersResponse, isLoading: loadingCustomers } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customersApi.getCustomers(),
  });
  const customers = customersResponse?.data || [];

  const { data: productsResponse, isLoading: loadingProducts } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.getProducts(),
  });
  const products = productsResponse?.data || [];

  const { register, control, handleSubmit, watch, formState: { errors } } = useForm<QuoteFormData>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      customerId: '',
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
      notes: '',
      lines: [{ productId: '', quantity: 1, discountPercentage: 0 }],
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lines',
  });

  const watchedLines = watch('lines');
  const watchedCustomerId = watch('customerId');

  // Calculate totals on the fly
  const totals = useMemo(() => {
    let subtotal = 0;
    let totalDiscountAmount = 0;
    const selectedCustomer = customers.find(c => c.id === watchedCustomerId);

    watchedLines.forEach(line => {
      if (line.productId && line.quantity > 0) {
        const product = products.find(p => p.id === line.productId);
        if (product) {
          // Get tier price if applicable
          const tierPriceObj = product.tierPrices?.find(tp => tp.tier === selectedCustomer?.tier);
          const basePrice = tierPriceObj?.price || product.basePrice;
          
          const lineGross = basePrice * line.quantity;
          const lineDiscount = lineGross * ((line.discountPercentage || 0) / 100);
          
          subtotal += lineGross;
          totalDiscountAmount += lineDiscount;
        }
      }
    });

    const netAmount = subtotal - totalDiscountAmount;
    const taxAmount = netAmount * 0.10; // Simple 10% tax for demo
    const total = netAmount + taxAmount;

    return { subtotal, totalDiscountAmount, taxAmount, total };
  }, [watchedLines, watchedCustomerId, customers, products]);

  const createMutation = useMutation({
    mutationFn: (data: any) => quotesApi.createQuote(data),
    onSuccess: (data) => {
      toast.success('Quotation drafted successfully');
      router.push(`/quotes/${data.id}`);
    },
    onError: (err: any) => toast.error(err.message)
  });

  const onSubmit = (data: QuoteFormData) => {
    // We need to map the form data to what the API expects (full line item objects for mock)
    // In a real API we might just send productId, qty, discount, but the mock DB logic is mostly inside the handlers.
    // However, the `quotesApi.createQuote` mock handler expects partial quote payload and lines payload.
    const selectedCustomer = customers.find(c => c.id === data.customerId);
    
    const enrichedLines = data.lines.map(line => {
      const p = products.find(prod => prod.id === line.productId)!;
      const tierPrice = p.tierPrices?.find(tp => tp.tier === selectedCustomer?.tier)?.price || p.basePrice;
      const gross = tierPrice * line.quantity;
      const discount = gross * ((line.discountPercentage || 0) / 100);
      return {
        productId: p.id,
        productName: p.name,
        quantity: line.quantity,
        unitPrice: tierPrice,
        discountPercentage: line.discountPercentage,
        totalPrice: gross - discount
      };
    });

    createMutation.mutate({
      customerId: data.customerId,
      salesExecutiveId: user?.id, // Assumes a sales exec is creating this
      notes: data.notes,
      validUntil: data.validUntil,
      lines: enrichedLines,
      subtotal: totals.subtotal,
      totalDiscount: totals.totalDiscountAmount,
      taxAmount: totals.taxAmount,
      amount: totals.total,
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
        <Link href="/quotes" className="hover:text-slate-900 flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to Quotes
        </Link>
        <span>/</span>
        <span className="text-slate-900 font-medium">New Quotation</span>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Build New Quotation</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Line Items</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex gap-4 items-start p-4 border border-slate-200 rounded-lg bg-slate-50 relative group">
                    <div className="flex-1 space-y-4">
                      <div className="grid grid-cols-4 gap-4">
                        <div className="col-span-2 space-y-2">
                          <Label>Product</Label>
                          <select 
                            {...register(`lines.${index}.productId`)}
                            className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                            disabled={loadingProducts}
                          >
                            <option value="">Select product...</option>
                            {products.map(p => (
                              <option key={p.id} value={p.id}>{p.name} - ${p.basePrice}</option>
                            ))}
                          </select>
                          {errors.lines?.[index]?.productId && <p className="text-xs text-red-500">{errors.lines[index]?.productId?.message}</p>}
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Quantity</Label>
                          <Input type="number" min="1" {...register(`lines.${index}.quantity`, { valueAsNumber: true })} />
                          {errors.lines?.[index]?.quantity && <p className="text-xs text-red-500">{errors.lines[index]?.quantity?.message}</p>}
                        </div>

                        <div className="space-y-2">
                          <Label>Discount (%)</Label>
                          <Input type="number" min="0" max="100" {...register(`lines.${index}.discountPercentage`, { valueAsNumber: true })} />
                          {errors.lines?.[index]?.discountPercentage && <p className="text-xs text-red-500">{errors.lines[index]?.discountPercentage?.message}</p>}
                        </div>
                      </div>
                    </div>
                    {fields.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => remove(index)}
                        className="p-2 text-slate-400 hover:text-red-500 transition-colors absolute -right-2 -top-2 bg-white rounded-full border border-slate-200 shadow-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}

                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full border-dashed border-2 text-teal-600 hover:text-teal-700 hover:border-teal-600"
                  onClick={() => append({ productId: '', quantity: 1, discountPercentage: 0 })}
                >
                  <Plus className="w-4 h-4 mr-2" /> Add Item
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Additional Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="space-y-2">
                    <Label htmlFor="validUntil">Valid Until</Label>
                    <Input id="validUntil" type="date" {...register('validUntil')} />
                    {errors.validUntil && <p className="text-xs text-red-500">{errors.validUntil.message}</p>}
                 </div>
                 <div className="space-y-2">
                    <Label htmlFor="notes">Notes / Terms</Label>
                    <textarea 
                      id="notes" 
                      {...register('notes')}
                      className="w-full min-h-[100px] rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                      placeholder="Special terms, delivery notes..."
                    />
                 </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Customer</Label>
                  <select 
                    {...register('customerId')}
                    className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                    disabled={loadingCustomers}
                  >
                    <option value="">Select customer...</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.tier})</option>
                    ))}
                  </select>
                  {errors.customerId && <p className="text-xs text-red-500">{errors.customerId.message}</p>}
                </div>

                {watchedCustomerId && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm">
                    {(() => {
                       const c = customers.find(c => c.id === watchedCustomerId);
                       return c ? (
                         <>
                           <div className="font-semibold text-slate-900">{c.name}</div>
                           <div className="text-slate-500">{c.contactName}</div>
                           <div className="mt-2 text-xs font-medium px-2 py-1 bg-white border border-slate-200 rounded inline-block">
                             Tier: {c.tier}
                           </div>
                         </>
                       ) : null;
                    })()}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Subtotal</span>
                    <span className="font-medium">${totals.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  {totals.totalDiscountAmount > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Discount</span>
                      <span className="font-medium">-${totals.totalDiscountAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tax (10%)</span>
                    <span className="font-medium">${totals.taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="pt-3 border-t border-slate-200 flex justify-between font-bold text-lg text-slate-900">
                    <span>Total</span>
                    <span className="text-teal-700">${totals.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>

                <div className="mt-6">
                  <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700" disabled={createMutation.isPending}>
                    {createMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : null}
                    Save Draft Quote
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
