'use client';

import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Truck,
  ArrowLeft,
  Building,
  Package,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Send,
  Edit3,
  Calendar,
  Sparkles,
  Info,
  RotateCcw,
  Check,
  ExternalLink,
} from 'lucide-react';
import {
  useFulfillmentOrder,
  useUpdateFulfillmentOrder,
  useCreateShipment,
  useWarehouseStock,
} from '@/hooks/use-dealflow';
import { useToast } from '@/components/providers/query-provider';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Dialog, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { CardLoadingSkeleton } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { FulfillmentOrder, WarehouseAllocation } from '@/types/dealflow';

export default function FulfillmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);
  const { toast } = useToast();

  const { data: order, isLoading, isError, refetch } = useFulfillmentOrder(orderId);
  const { data: warehouseStock = [] } = useWarehouseStock();
  const updateMutation = useUpdateFulfillmentOrder();
  const createShipmentMutation = useCreateShipment();

  // Dialog States
  const [isOverrideOpen, setIsOverrideOpen] = useState(false);
  const [isShipmentOpen, setIsShipmentOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Manual Override Form State
  const [wh1Units, setWh1Units] = useState<number>(18);
  const [wh2Units, setWh2Units] = useState<number>(6);

  // Shipment Creation Form State
  const [carrier, setCarrier] = useState('FedEx Freight Priority');
  const [trackingNumber, setTrackingNumber] = useState('1Z-CHI-9982104');

  // Initialize override inputs when order loads
  React.useEffect(() => {
    const allocations = order?.allocations || [];
    if (allocations.length >= 2) {
      setWh1Units(allocations[0].units);
      setWh2Units(allocations[1].units);
    } else if (allocations.length === 1) {
      setWh1Units(allocations[0].units);
      setWh2Units(0);
    }
  }, [order]);

  // Handle Accept Suggested Split
  const handleAcceptSuggestedSplit = async () => {
    if (!order) return;
    setIsProcessing(true);
    try {
      const updatedAllocations: WarehouseAllocation[] = [
        {
          warehouseId: 'WH-01',
          warehouseName: 'Main Warehouse',
          units: 18,
          shipmentNumber: 1,
          status: 'SCHEDULED',
          carrier: 'FedEx Priority Overnight',
        },
        {
          warehouseId: 'WH-02',
          warehouseName: 'East Depot',
          units: 6,
          shipmentNumber: 2,
          status: 'SCHEDULED',
          carrier: 'UPS Express Freight',
        },
      ];

      const updatedOrder: FulfillmentOrder = {
        ...order,
        primaryWarehouse: 'Multi-Facility Split (Optimized)',
        allocations: updatedAllocations,
        status: 'PREPARING',
        notes: 'Accepted automated split optimization: 18 units (Main Warehouse) + 6 units (East Depot).',
      };

      await updateMutation.mutateAsync(updatedOrder);
      toast({
        title: 'Suggested Split Accepted',
        description: 'Multi-facility staged allocation has been locked for warehouse fulfillment.',
        type: 'success',
      });
    } catch {
      toast({
        title: 'Action Failed',
        description: 'Unable to commit warehouse allocation.',
        type: 'error',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Manual Override
  const handleSaveOverride = async () => {
    if (!order) return;
    const totalAssigned = wh1Units + wh2Units;
    if (totalAssigned > order.orderedQuantity) {
      toast({
        title: 'Allocation Exceeds Order',
        description: `Total allocated (${totalAssigned}) cannot exceed ordered quantity (${order.orderedQuantity}).`,
        type: 'warning',
      });
      return;
    }

    setIsProcessing(true);
    try {
      const newAllocations: WarehouseAllocation[] = [
        {
          warehouseId: 'WH-01',
          warehouseName: 'Main Warehouse',
          units: wh1Units,
          shipmentNumber: 1,
          status: 'SCHEDULED',
        },
      ];

      if (wh2Units > 0) {
        newAllocations.push({
          warehouseId: 'WH-02',
          warehouseName: 'East Depot',
          units: wh2Units,
          shipmentNumber: 2,
          status: 'SCHEDULED',
        });
      }

      const hasBackorder = totalAssigned < order.orderedQuantity;
      const backorderQuantity = order.orderedQuantity - totalAssigned;

      const updated: FulfillmentOrder = {
        ...order,
        allocations: newAllocations,
        reservedQuantity: totalAssigned,
        hasBackorder,
        backorderQuantity,
        suggestedAction: hasBackorder ? 'Consolidate remaining backorder after restock' : undefined,
        notes: `Manual allocation override applied: ${wh1Units} Main WH, ${wh2Units} East Depot.`,
      };

      await updateMutation.mutateAsync(updated);
      toast({
        title: 'Allocation Overridden',
        description: 'Custom warehouse unit quantities have been saved.',
        type: 'success',
      });
      setIsOverrideOpen(false);
    } catch {
      toast({
        title: 'Override Failed',
        description: 'Unable to update allocations.',
        type: 'error',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Create Shipment
  const handleCreateShipment = async () => {
    if (!order) return;
    if (!trackingNumber.trim()) {
      toast({
        title: 'Tracking Number Required',
        description: 'Please input carrier tracking barcode reference.',
        type: 'warning',
      });
      return;
    }

    setIsProcessing(true);
    try {
      await createShipmentMutation.mutateAsync({
        id: order.id,
        carrier,
        trackingNumber: trackingNumber.trim(),
      });
      toast({
        title: 'Shipment Dispatched',
        description: `Shipment marked IN TRANSIT via ${carrier}. Tracking: ${trackingNumber}.`,
        type: 'success',
      });
      setIsShipmentOpen(false);
    } catch {
      toast({
        title: 'Dispatch Failed',
        description: 'Unable to generate carrier shipment.',
        type: 'error',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 bg-slate-200 rounded-md animate-pulse w-1/3" />
        <CardLoadingSkeleton />
        <CardLoadingSkeleton />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <ErrorState
        title="Fulfillment Order Not Found"
        message={`Unable to locate fulfillment order "${orderId}" in the logistics system.`}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link href="/fulfillment">
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs text-slate-600">
              <ArrowLeft className="w-3.5 h-3.5" />
              All Shipments
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-sm font-bold bg-slate-900 text-white px-2 py-0.5 rounded">
                {order.id}
              </span>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                {order.customerName}
              </h1>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-semibold text-slate-600 font-mono">
                Quote Ref: {order.quotationId}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Product: <strong>{order.productName}</strong> • Ordered Quantity:{' '}
              <strong>{order.orderedQuantity} units</strong> • Delivery SLA:{' '}
              <strong>{order.estimatedDelivery}</strong>
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {order.status === 'IN_TRANSIT' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-300">
              <Truck className="w-4 h-4 text-teal-600" />
              IN TRANSIT
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
              <Clock className="w-4 h-4 text-blue-600" />
              {order.status}
            </span>
          )}

          {order.hasBackorder && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-600 text-white shadow-2xs">
              <AlertTriangle className="w-4 h-4" />
              BACKORDER ({order.backorderQuantity})
            </span>
          )}
        </div>
      </div>

      {/* BACKORDER WARNING CALLOUT (IF INSUFFICIENT STOCK) */}
      {order.hasBackorder && (
        <Card className="bg-rose-50/80 border-rose-300 shadow-enterprise p-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-rose-950 uppercase tracking-wide">
                  BACKORDER DETECTED — INSUFFICIENT NETWORK STOCK
                </span>
                <span className="font-mono text-xs font-extrabold text-rose-900 bg-rose-200 px-2 py-0.5 rounded">
                  Deficit: {order.backorderQuantity} Units
                </span>
              </div>
              <p className="text-rose-800 leading-relaxed">
                Total ordered quantity ({order.orderedQuantity}) exceeds immediate available warehouse capacity ({order.availableQuantity} units available).
              </p>
              <div className="p-2.5 rounded bg-rose-100/70 border border-rose-200 text-rose-950 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-rose-700" />
                  <span className="font-semibold">Suggested Fulfillment Action:</span>
                  <span className="font-bold underline">{order.suggestedAction || 'Consolidate remaining backorder after restock'}</span>
                </div>
                <span className="text-[11px] text-rose-800 font-mono">Replenishment ETA: 2026-09-24</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* ACTION COMMAND CONTROLS */}
      <div className="bg-slate-900 text-white p-4 rounded-lg shadow-enterprise flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-slate-400 font-medium">Logistics Action Required</p>
          <p className="text-sm font-bold text-white flex items-center gap-2 mt-0.5">
            {order.status === 'IN_TRANSIT'
              ? '✓ Shipments Dispatched with Assigned Freight Carriers'
              : 'Multi-Warehouse Allocation & Staged Carrier Dispatch'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Accept Suggested Split */}
          <Button
            onClick={handleAcceptSuggestedSplit}
            disabled={isProcessing || order.status === 'IN_TRANSIT'}
            className="bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs gap-1.5 shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Accept Suggested Split
          </Button>

          {/* Manual Override */}
          <Button
            onClick={() => setIsOverrideOpen(true)}
            disabled={isProcessing || order.status === 'IN_TRANSIT'}
            variant="outline"
            className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs font-semibold gap-1.5"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Manual Override
          </Button>

          {/* Create Shipment */}
          <Button
            onClick={() => setIsShipmentOpen(true)}
            disabled={isProcessing || order.status === 'IN_TRANSIT'}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs gap-1.5 shadow-xs"
          >
            <Truck className="w-3.5 h-3.5" />
            Create Shipment
          </Button>
        </div>
      </div>

      {/* WAREHOUSE ALLOCATION BREAKDOWN (EXAMPLE FROM TASK: MAIN WAREHOUSE 18 UNITS, EAST DEPOT 6 UNITS) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-teal-600" />
            <span>Warehouse Staging Allocation & Split Shipments</span>
          </h2>
          <span className="text-xs text-slate-500 font-mono">
            Total Allocated: {order.reservedQuantity} / {order.orderedQuantity} Units
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(order.allocations || []).map((alloc) => {
            const isDispatched = alloc.status === 'DISPATCHED' || order.status === 'IN_TRANSIT';

            return (
              <Card
                key={alloc.warehouseId}
                className={`bg-white border-slate-200 shadow-enterprise p-4 transition ${
                  isDispatched ? 'border-teal-300' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-md bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center font-bold text-xs">
                      #{alloc.shipmentNumber}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{alloc.warehouseName}</h3>
                      <p className="text-[11px] text-slate-500">
                        Shipment #{alloc.shipmentNumber} • {order.productName}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      isDispatched
                        ? 'bg-teal-100 text-teal-800 border border-teal-300'
                        : 'bg-amber-100 text-amber-900 border border-amber-200'
                    }`}
                  >
                    {isDispatched ? 'Dispatched' : 'Scheduled'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4 p-3 bg-slate-50 rounded-md border border-slate-100 text-center font-mono text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-sans">Allocated Units:</span>
                    <span className="text-base font-extrabold text-slate-900">
                      {alloc.units} units
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-sans">Carrier:</span>
                    <span className="text-xs font-bold text-slate-700 truncate block mt-0.5">
                      {alloc.carrier || order.carrier || 'Pending'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-sans">Tracking:</span>
                    <span className="text-xs font-bold text-teal-800 truncate block mt-0.5">
                      {alloc.trackingNumber || order.trackingNumber || 'Unassigned'}
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Warehouse Stock Node:</span>
                  <span className="font-semibold text-slate-700">
                    {alloc.warehouseId === 'WH-01' ? 'Stock: 40 | Avail: 22' : 'Stock: 10 | Avail: 4'}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* STOCK AVAILABILITY & RESERVED QUANTITY SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white border-slate-200 shadow-enterprise p-4">
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            Stock Availability (Network)
          </p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-slate-900 font-mono">
              {order.availableQuantity} Units
            </span>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Unallocated
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Free inventory across Chicago Hub, Newark Depot, and Reno Hub.
          </p>
        </Card>

        <Card className="bg-white border-slate-200 shadow-enterprise p-4">
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            Reserved for this Quotation
          </p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-amber-800 font-mono">
              {order.reservedQuantity} Units
            </span>
            <span className="text-xs font-semibold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              Staged
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Units hard-locked and staged for packaging and freight pickup.
          </p>
        </Card>

        <Card className="bg-white border-slate-200 shadow-enterprise p-4">
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            Backorder & Deficit Status
          </p>
          <div className="flex items-baseline justify-between mt-1">
            <span
              className={`text-2xl font-black font-mono ${
                order.hasBackorder ? 'text-rose-600' : 'text-slate-900'
              }`}
            >
              {order.hasBackorder ? `${order.backorderQuantity} Units` : '0 Units'}
            </span>
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded border ${
                order.hasBackorder
                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}
            >
              {order.hasBackorder ? 'Deficit' : 'Fulfilled 100%'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {order.hasBackorder
              ? 'Replenishment batch in manufacturing queue.'
              : 'All units covered by immediate warehouse stock.'}
          </p>
        </Card>
      </div>

      {/* MANUAL OVERRIDE DIALOG */}
      {isOverrideOpen && (
        <Dialog open={isOverrideOpen} onOpenChange={setIsOverrideOpen}>
          <DialogHeader>
            <DialogTitle>Manual Warehouse Allocation Override</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-xs">
            <p className="text-slate-600">
              Adjust the specific unit quantities staged from each regional node for{' '}
              <strong>{order.customerName}</strong> (Total Ordered:{' '}
              <strong>{order.orderedQuantity} units</strong>).
            </p>

            <div className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-md border border-slate-200 space-y-1">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-slate-900">Main Warehouse (Chicago Hub)</label>
                  <span className="text-[11px] text-slate-500">Max Avail: 22</span>
                </div>
                <Input
                  type="number"
                  min="0"
                  max="40"
                  value={wh1Units}
                  onChange={(e) => setWh1Units(parseInt(e.target.value) || 0)}
                  className="text-xs h-8"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-md border border-slate-200 space-y-1">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-slate-900">East Depot (Newark Terminal)</label>
                  <span className="text-[11px] text-slate-500">Max Avail: 4</span>
                </div>
                <Input
                  type="number"
                  min="0"
                  max="10"
                  value={wh2Units}
                  onChange={(e) => setWh2Units(parseInt(e.target.value) || 0)}
                  className="text-xs h-8"
                />
              </div>
            </div>

            <div className="p-2.5 bg-amber-50 rounded border border-amber-200 text-amber-900 flex justify-between">
              <span>Total Allocated:</span>
              <strong className="font-mono">{wh1Units + wh2Units} / {order.orderedQuantity} Units</strong>
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOverrideOpen(false)}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSaveOverride}
                loading={isProcessing}
                className="bg-teal-600 hover:bg-teal-700 text-white font-semibold"
              >
                Apply Allocation
              </Button>
            </div>
          </div>
        </Dialog>
      )}

      {/* CREATE SHIPMENT DIALOG */}
      {isShipmentOpen && (
        <Dialog open={isShipmentOpen} onOpenChange={setIsShipmentOpen}>
          <DialogHeader>
            <DialogTitle>Create Carrier Shipment & Dispatch</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-xs">
            <p className="text-slate-600">
              Generate freight labels and assign carrier tracking for order{' '}
              <strong>{order.id}</strong>.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Freight Carrier Service
              </label>
              <Select
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                className="text-xs"
              >
                <option value="FedEx Freight Priority">FedEx Freight Priority</option>
                <option value="UPS Express Freight">UPS Express Freight</option>
                <option value="DHL Global Forwarding">DHL Global Forwarding</option>
                <option value="Dedicated Dedicated Fleet">Dedicated Direct Truckload</option>
              </Select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Master Tracking Barcode Reference
              </label>
              <Input
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="e.g. 1Z-CHI-9948123"
                className="text-xs font-mono"
              />
            </div>

            <div className="p-2.5 bg-slate-50 rounded border border-slate-200 space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>Total Units Dispatched:</span>
                <span className="font-bold text-slate-900 font-mono">{order.reservedQuantity} Units</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Destination:</span>
                <span className="font-semibold text-slate-800">{order.customerName} Enterprise Staging</span>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsShipmentOpen(false)}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleCreateShipment}
                loading={isProcessing}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                Confirm Dispatch
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
