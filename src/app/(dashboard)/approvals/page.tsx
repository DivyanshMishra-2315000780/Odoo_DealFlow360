'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { approvalsApi } from '@/lib/api/approvalsApi';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Filter, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { ApprovalRecord } from '@/types';
import { Input } from '@/components/ui/input';

export default function ApprovalsPage() {
  const [statusFilter, setStatusFilter] = useState('PENDING');

  const { data, isLoading } = useQuery({
    queryKey: ['approvals', statusFilter],
    queryFn: () => approvalsApi.getApprovals({ status: statusFilter }),
  });

  const approvals = data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Approvals</h1>
      </div>

      <div className="flex gap-4 items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select 
            className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending Action</option>
            <option value="APPROVED">Approved</option>
            <option value="RETURNED">Returned</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-slate-500">Loading approvals...</div>
      ) : approvals.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-slate-300 rounded-xl bg-slate-50">
          <ShieldAlert className="w-8 h-8 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-1">No approvals found</h3>
          <p className="text-slate-500">You're all caught up!</p>
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-6 py-4">Quote Ref</th>
                  <th className="px-6 py-4">Current Stage</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Requested By</th>
                  <th className="px-6 py-4 text-right">Date</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {approvals.map((approval: ApprovalRecord) => (
                  <tr key={approval.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium">
                      <Link href={`/quotes/${approval.quotationId}`} className="text-teal-600 hover:underline">
                        Quote Detail
                      </Link>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {approval.currentStage.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4"><StatusBadge status={approval.status} /></td>
                    <td className="px-6 py-4">{approval.requestedByName}</td>
                    <td className="px-6 py-4 text-right text-slate-500">{new Date(approval.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                       <Link href={`/approvals/${approval.id}`} className="text-sm font-medium text-teal-600 hover:underline">
                         Review
                       </Link>
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
