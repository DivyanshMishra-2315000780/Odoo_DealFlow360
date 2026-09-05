'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Truck,
  Package,
  Search,
  Building,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  ExternalLink,
  RotateCcw,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import { useFulfillmentOrders, useWarehouseStock } from '@/hooks/use-dealflow';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { EmptyState } from '@/components/ui/empty-state';
import { TableLoadingSkeleton } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { FulfillmentOrder, FulfillmentStatus } from '@/types/dealflow';

export default function FulfillmentPage() {
  const { data: fulfillmentOrders = [], isLoading, isError, refetch } = useFulfillmentOrders();
  const { data: warehouseStock = [] } = useWarehouseStock();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return fulfillmentOrders.filter((order) => {
      const matchesSearch =
        searchTerm.trim() === '' ||
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.quotationId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.primaryWarehouse.toLowerCase().includes(searchTerm.toLowerCase());

      let matchesStatus = true;
      if (statusFilter === 'BACKORDER') {
        matchesStatus = order.hasBackorder;
      } else if (statusFilter !== 'ALL') {
        matchesStatus = order.status === statusFilter;
      }

      return matchesSearch && matchesStatus;
    });
  }, [fulfillmentOrders, searchTerm, statusFilter]);

  // Aggregate stats
  const stats = useMemo(() => {
    const totalOrders = fulfillmentOrders.length;
    const inTransit = fulfillmentOrders.filter((o) => orderStatusIs(o.status, 'IN_TRANSIT')).length;
    const backorderUnits = fulfillmentOrders.reduce((sum, o) => sum + (o.backorderQuantity || 0), 0);
    const totalReserved = fulfillmentOrders.reduce((sum, o) => sum + o.reservedQuantity, 0);

    return { totalOrders, inTransit, backorderUnits, totalReserved };
  }, [fulfillmentOrders]);

  function orderStatusIs(status: FulfillmentStatus, check: FulfillmentStatus) {
    return status === check;
  }

  // Group warehouse stock by facility
  const stockByWarehouse = useMemo(() => {
    const map = new Map<string, typeof warehouseStock>();
    for (const item of warehouseStock) {
      const list = map.get(item.warehouseName) || [];
      list.push(item);
      map.set(item.warehouseName, list);
    }
    return Array.from(map.entries());
  }, [warehouseStock]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 bg-slate-200 rounded-md animate-pulse w-1/3" />
        <TableLoadingSkeleton rows={6} />
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        title="Failed to load fulfillment data"
        message="Unable to retrieve warehouse logistics ledger from the mock service layer."
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center shadow-enterprise">
              <Truck className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Fulfillment & Warehouse Logistics
            </h1>
            <span className="text-xs bg-teal-50 text-teal-700 font-semibold px-2 py-0.5 rounded-full border border-teal-200">
              {fulfillmentOrders.length} Shipments Tracked
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Multi-facility inventory allocation, warehouse split logistics, carrier dispatch, and backorder tracking.
          </p>
        </div>

        {/* Quick Link to Quotes */}
        <Link href="/quotes">
          <Button variant="outline" size="sm" className="text-xs font-semibold gap-1.5 text-slate-700">
            <span>Commercial Quotes</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-enterprise flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Active Shipments</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{stats.totalOrders} Orders</p>
          </div>
          <div className="w-9 h-9 rounded-md bg-slate-100 flex items-center justify-center text-slate-600">
            <Package className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-teal-200 shadow-enterprise flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-teal-800 uppercase tracking-wider">In Transit</p>
            <p className="text-xl font-bold text-teal-900 mt-0.5">{stats.inTransit} Dispatched</p>
          </div>
          <div className="w-9 h-9 rounded-md bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200">
            <Truck className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-rose-200 shadow-enterprise flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-rose-800 uppercase tracking-wider">Backorder Deficit</p>
            <p className="text-xl font-bold text-rose-900 mt-0.5">{stats.backorderUnits} Units</p>
          </div>
          <div className="w-9 h-9 rounded-md bg-rose-50 text-rose-700 flex items-center justify-center border border-rose-200">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-enterprise flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Units Reserved</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5 font-mono">{stats.totalReserved} Units</p>
          </div>
          <div className="w-9 h-9 rounded-md bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* REALISTIC WAREHOUSE INVENTORY DATA CARDS */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
            <Building className="w-4 h-4 text-slate-500" />
            <span>Multi-Facility Live Inventory & Staging Nodes</span>
          </h2>
          <span className="text-xs text-slate-400 font-mono">Real-Time Stock Counters</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stockByWarehouse.map(([warehouseName, items]) => {
            const isMain = warehouseName === 'Main Warehouse';
            return (
              <Card
                key={warehouseName}
                className={`bg-white border-slate-200 shadow-enterprise transition hover:border-slate-300 ${
                  isMain ? 'ring-1 ring-teal-500/20' : ''
                }`}
              >
                <CardHeader className="p-4 pb-3 border-b border-slate-100 flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <Building className="w-4 h-4 text-teal-600" />
                      {warehouseName}
                    </CardTitle>
                    <p className="text-[11px] text-slate-400 mt-0.5">{items[0]?.location}</p>
                  </div>
                  {isMain && (
                    <span className="text-[10px] bg-teal-50 text-teal-700 font-bold px-1.5 py-0.5 rounded border border-teal-200">
                      Primary Hub
                    </span>
                  )}
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  {items.map((stockItem) => (
                    <div
                      key={stockItem.productId}
                      className="p-2.5 rounded-md bg-slate-50 border border-slate-200/80 text-xs space-y-1.5"
                    >
                      <div className="flex justify-between items-center font-bold text-slate-800">
                        <span>{stockItem.productName}</span>
                        <span className="font-mono text-slate-900">{stockItem.stock} Total Stock</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-200 font-mono">
                        <div className="flex justify-between text-slate-600">
                          <span>Reserved:</span>
                          <span className="font-semibold text-amber-700">{stockItem.reserved}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Available:</span>
                          <span className="font-semibold text-emerald-700">{stockItem.available}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <Card className="bg-white border-slate-200 shadow-enterprise">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-8 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Search by order ID, quotation, customer, product, or warehouse..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>

            <div className="sm:col-span-4">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs"
              >
                <option value="ALL">All Shipment Statuses</option>
                <option value="PREPARING">Preparing</option>
                <option value="IN_TRANSIT">In Transit</option>
                <option value="PENDING">Pending</option>
                <option value="DELIVERED">Delivered</option>
                <option value="BACKORDER">Backorder Flagged Only</option>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FULFILLMENT ORDERS TABLE */}
      <Card className="bg-white border-slate-200 shadow-enterprise overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="py-12">
            <EmptyState
              title="No fulfillment orders match criteria"
              description="Adjust your search keywords or shipment status filter."
              actionLabel="Reset Filters"
              onAction={() => {
                setSearchTerm('');
                setStatusFilter('ALL');
              }}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-600">
                  <TableHead className="w-28">Quotation</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="w-36">Product</TableHead>
                  <TableHead className="w-20 text-center">Ordered</TableHead>
                  <TableHead className="w-20 text-center">Reserved</TableHead>
                  <TableHead className="w-20 text-center">Available</TableHead>
                  <TableHead className="w-40">Warehouse</TableHead>
                  <TableHead className="w-32 text-center">Shipment Status</TableHead>
                  <TableHead className="w-28 text-center">Backorder</TableHead>
                  <TableHead className="w-24 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => {
                  return (
                    <TableRow
                      key={order.id}
                      className={`hover:bg-slate-50/70 border-b border-slate-100 transition group ${
                        order.hasBackorder ? 'bg-rose-50/30' : ''
                      }`}
                    >
                      {/* Quotation */}
                      <TableCell>
                        <Link
                          href={`/quotes/${order.quotationId}`}
                          className="font-bold text-slate-900 hover:text-teal-700 transition"
                        >
                          <span className="font-mono text-xs bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-slate-800">
                            {order.quotationId}
                          </span>
                        </Link>
                        <span className="text-[10px] text-slate-400 block mt-1 font-mono">{order.id}</span>
                      </TableCell>

                      {/* Customer */}
                      <TableCell>
                        <p className="font-semibold text-slate-800 text-xs">{order.customerName}</p>
                        <p className="text-[11px] text-slate-400">Est. {order.estimatedDelivery}</p>
                      </TableCell>

                      {/* Product */}
                      <TableCell className="text-xs font-medium text-slate-900">
                        {order.productName}
                      </TableCell>

                      {/* Ordered */}
                      <TableCell className="text-center font-mono font-bold text-xs text-slate-900">
                        {order.orderedQuantity}
                      </TableCell>

                      {/* Reserved */}
                      <TableCell className="text-center font-mono font-bold text-xs text-amber-700">
                        {order.reservedQuantity}
                      </TableCell>

                      {/* Available */}
                      <TableCell className="text-center font-mono font-bold text-xs text-emerald-700">
                        {order.availableQuantity}
                      </TableCell>

                      {/* Warehouse */}
                      <TableCell className="text-xs text-slate-700">
                        <div className="flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{order.primaryWarehouse}</span>
                        </div>
                        {Boolean(order.allocations && order.allocations.length > 1) && (
                          <span className="text-[10px] text-teal-700 font-semibold block mt-0.5">
                            {order.allocations?.length} Shipments (Split Allocation)
                          </span>
                        )}
                      </TableCell>

                      {/* Shipment Status */}
                      <TableCell className="text-center">
                        {order.status === 'IN_TRANSIT' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-300">
                            <Truck className="w-3.5 h-3.5 text-teal-600" />
                            IN TRANSIT
                          </span>
                        ) : order.status === 'PREPARING' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                            <Clock className="w-3.5 h-3.5 text-blue-600" />
                            PREPARING
                          </span>
                        ) : order.status === 'DELIVERED' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            DELIVERED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                            PENDING
                          </span>
                        )}
                      </TableCell>

                      {/* Backorder */}
                      <TableCell className="text-center">
                        {order.hasBackorder ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-600 text-white shadow-2xs">
                            <AlertTriangle className="w-3 h-3" />
                            {order.backorderQuantity} BACKORDER
                          </span>
                        ) : (
                          <span className="text-[11px] text-emerald-700 font-semibold flex items-center justify-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            0 Backorder
                          </span>
                        )}
                      </TableCell>

                      {/* Action */}
                      <TableCell className="text-right">
                        <Link href={`/fulfillment/${order.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs font-semibold hover:bg-teal-50 hover:text-teal-800 hover:border-teal-300 gap-1"
                          >
                            <span>Inspect</span>
                            <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-teal-600" />
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
      </Card>
    </div>
  );
}
