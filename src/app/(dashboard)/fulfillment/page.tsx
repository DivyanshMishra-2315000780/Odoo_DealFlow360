'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fulfillmentApi } from '@/lib/api/fulfillmentApi';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, Filter, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function FulfillmentPage() {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['fulfillment', statusFilter],
    queryFn: () => fulfillmentApi.getOrders({ status: statusFilter }),
  });

  const orders = data?.data || [];

  const acceptMutation = useMutation({
    mutationFn: (id: string) => fulfillmentApi.acceptSplit(id),
    onSuccess: () => {
      toast.success('Fulfillment accepted — marked as shipped');
      queryClient.invalidateQueries({ queryKey: ['fulfillment'] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Fulfillment Orders</h1>

      <div className="flex gap-4 items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <Filter className="w-4 h-4 text-slate-400" />
        <select
          className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="ALL">All Orders</option>
          <option value="PENDING">Pending</option>
          <option value="SHIPPED">Shipped</option>
          <option value="PARTIALLY_SHIPPED">Partially Shipped</option>
          <option value="DELIVERED">Delivered</option>
        </select>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-slate-500">Loading...</div>
      ) : orders.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-slate-300 rounded-xl bg-slate-50">
          <Package className="w-8 h-8 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600">No fulfillment orders found.</p>
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Quote Ref</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Items</th>
                  <th className="px-6 py-4">Expected Ship</th>
                  <th className="px-6 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {orders.map((order: any) => (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{order.id}</td>
                    <td className="px-6 py-4">
                      <Link href={`/quotes/${order.quotationId}`} className="text-teal-600 hover:underline">
                        {order.quotationId}
                      </Link>
                    </td>
                    <td className="px-6 py-4"><StatusBadge status={order.status} /></td>
                    <td className="px-6 py-4">{order.totalItems} units</td>
                    <td className="px-6 py-4">{new Date(order.expectedShipment).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-center">
                      {order.status === 'PENDING' && (
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-xs"
                          onClick={() => acceptMutation.mutate(order.id)}
                          disabled={acceptMutation.isPending}
                        >
                          <CheckCircle className="w-3 h-3 mr-1" /> Accept & Ship
                        </Button>
                      )}
                      {order.status !== 'PENDING' && (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
