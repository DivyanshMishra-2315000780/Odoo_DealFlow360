'use client';

import { useParams } from 'next/navigation';
import { mockProducts, mockDiscountRules } from '@/lib/api/mockDataExtended';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';

const tabs = ['General', 'Pricing', 'Variants', 'Inventory'];

export default function ProductDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const product = mockProducts.find(p => p.id === id);
  const [activeTab, setActiveTab] = useState('General');

  if (!product) return <div className="p-8 text-red-600">Product not found</div>;

  const tierPricing = [
    { tier: 'BRONZE', discount: 5, price: product.basePrice * 0.95 },
    { tier: 'SILVER', discount: 10, price: product.basePrice * 0.90 },
    { tier: 'GOLD', discount: 15, price: product.basePrice * 0.85 },
  ];

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <Link href="/products" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Products
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{product.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">SKU: <span className="font-mono">{product.sku}</span> · {product.category}</p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-medium ${product.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
          {product.status}
        </span>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="-mb-px flex gap-6">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`border-b-2 pb-3 px-1 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'General' && (
        <div className="rounded-xl border bg-card shadow-sm divide-y">
          {[
            { label: 'Product Name', value: product.name },
            { label: 'SKU', value: product.sku },
            { label: 'Category', value: product.category },
            { label: 'Base Price', value: `$${product.basePrice}` },
            { label: 'Unit', value: `Per ${product.unit}` },
            { label: 'Subscription', value: product.isSubscription ? 'Yes — Recurring' : 'No' },
          ].map(({ label, value }) => (
            <div key={label} className="px-6 py-4 flex justify-between text-sm">
              <span className="text-muted-foreground font-medium">{label}</span>
              <span className="text-foreground font-semibold">{value}</span>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'Pricing' && (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-muted/20">
            <h3 className="font-semibold text-foreground">Tier-Based Pricing</h3>
            <p className="text-sm text-muted-foreground mt-0.5">Prices and discounts based on customer tier.</p>
          </div>
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/10 text-muted-foreground border-b">
              <tr>
                <th className="px-6 py-3">Tier</th>
                <th className="px-6 py-3 text-right">Base Price</th>
                <th className="px-6 py-3 text-right">Discount</th>
                <th className="px-6 py-3 text-right">Net Price</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {tierPricing.map((row) => (
                <tr key={row.tier} className={`hover:bg-muted/10 ${row.tier === 'GOLD' ? 'bg-amber-50/30' : ''}`}>
                  <td className="px-6 py-4">
                    <span className={`rounded-md border px-2.5 py-0.5 text-xs font-semibold ${
                      row.tier === 'GOLD' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                      row.tier === 'SILVER' ? 'bg-slate-100 text-slate-700 border-slate-200' :
                      'bg-orange-50 text-orange-800 border-orange-100'
                    }`}>
                      {row.tier}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-muted-foreground">${product.basePrice}</td>
                  <td className="px-6 py-4 text-right text-emerald-600 font-medium">{row.discount}%</td>
                  <td className="px-6 py-4 text-right font-bold text-foreground">${row.price.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'Variants' && (
        <div className="rounded-xl border bg-card shadow-sm p-6">
          <p className="text-sm text-muted-foreground">Variant configuration (Color, RAM, Manufacturer) — configurable via the admin panel.</p>
        </div>
      )}

      {activeTab === 'Inventory' && (
        <div className="rounded-xl border bg-card shadow-sm p-6">
          <p className="text-sm text-muted-foreground">Inventory tracking and warehouse allocation — managed through Fulfillment module.</p>
        </div>
      )}
    </div>
  );
}
