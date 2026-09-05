'use client';

import { useParams } from 'next/navigation';
import { mockFulfillmentOrders } from '@/lib/api/mockDataExtended';
import { CustomerTierBadge } from '@/components/ui/CustomerTierBadge';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, Settings } from 'lucide-react';
import { useState } from 'react';

export default function FulfillmentDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const order = mockFulfillmentOrders.find(o => o.id === id);
  const [accepted, setAccepted] = useState(false);

  if (!order) return <div className="p-8 text-red-600">Order not found</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <Link href="/fulfillment" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Fulfillment
      </Link>

      {/* Header */}
      <div className="rounded-xl border bg-card shadow-sm p-6">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{order.id.toUpperCase()}</h1>
              <span className="rounded-full bg-blue-50 text-blue-700 border border-blue-200 px-3 py-0.5 text-xs font-medium">
                {accepted ? 'SPLIT ACCEPTED' : order.status}
              </span>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <span className="text-lg font-semibold">{order.customer.name}</span>
              <CustomerTierBadge tier={order.customer.tier} showPriorityText />
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {order.items} total items · Expected: {new Date(order.expectedShipment).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Warehouse Allocations */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-muted/20">
          <h3 className="font-semibold text-foreground">Suggested Warehouse Split</h3>
          <p className="text-sm text-muted-foreground mt-0.5">Review and accept the suggested allocation across warehouses.</p>
        </div>
        <div className="divide-y">
          {order.warehouseAllocations.map((alloc) => {
            const pct = Math.round((alloc.quantityAllocated / alloc.quantityAvailable) * 100);
            return (
              <div key={alloc.warehouseId} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-foreground">{alloc.warehouseName}</h4>
                  <span className="text-sm font-medium text-primary">${alloc.cost} shipping</span>
                </div>
                <div className="grid grid-cols-3 gap-6 text-sm mb-4">
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Available</div>
                    <div className="text-xl font-bold text-foreground">{alloc.quantityAvailable}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Allocated</div>
                    <div className="text-xl font-bold text-primary">{alloc.quantityAllocated}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Est. Shipment</div>
                    <div className="text-xl font-bold text-foreground">{alloc.estimatedShipmentDays}d</div>
                  </div>
                </div>
                {/* Allocation bar */}
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>0</span>
                  <span>{alloc.quantityAllocated} allocated ({pct}%)</span>
                  <span>{alloc.quantityAvailable}</span>
                </div>
              </div>
            );
          })}

          {order.backorderUnits > 0 && (
            <div className="p-4 bg-amber-50/50 border-t border-amber-100">
              <p className="text-sm text-amber-700 font-medium">
                ⚠ {order.backorderUnits} units awaiting stock
              </p>
              <button className="mt-2 text-sm text-primary font-medium hover:underline">
                Consolidate Remaining Backorder
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      {!accepted ? (
        <div className="flex gap-3">
          <button
            onClick={() => setAccepted(true)}
            className="flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-6 py-2.5 text-sm font-medium hover:bg-primary/90"
          >
            <CheckCircle className="h-4 w-4" /> Accept Suggested Split
          </button>
          <button className="flex items-center gap-2 rounded-md border px-6 py-2.5 text-sm font-medium hover:bg-muted">
            <Settings className="h-4 w-4" /> Manual Override
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 flex items-center gap-3">
          <CheckCircle className="h-6 w-6 text-emerald-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-emerald-900">Warehouse split accepted.</p>
            <p className="text-sm text-emerald-700">Shipments will be dispatched per the suggested allocation.</p>
          </div>
        </div>
      )}
    </div>
  );
}
