'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ClipboardList,
  ArrowLeft,
  Calendar,
  Building,
  CheckCircle2,
  Clock,
  Sparkles,
  FileText,
  AlertTriangle,
  User,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { TierBadge } from '@/components/ui/tier-badge';
import { useRequirement, useQuotations } from '@/hooks/use-dealflow';
import { CardLoadingSkeleton } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { RequirementPriority, RequirementStatus } from '@/types/dealflow';

function PriorityBadge({ priority }: { priority: RequirementPriority }) {
  const styles: Record<RequirementPriority, string> = {
    LOW: 'bg-slate-100 text-slate-700 border-slate-200',
    MEDIUM: 'bg-blue-50 text-blue-700 border-blue-200',
    HIGH: 'bg-amber-50 text-amber-800 border-amber-300 font-bold',
    URGENT: 'bg-rose-50 text-rose-800 border-rose-300 font-extrabold animate-pulse',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] uppercase tracking-wide border font-mono ${styles[priority]}`}
    >
      {priority}
    </span>
  );
}

function ReqStatusBadge({ status }: { status: RequirementStatus }) {
  const meta: Record<RequirementStatus, { label: string; className: string }> = {
    NEW: { label: 'NEW INTAKE', className: 'bg-teal-50 text-teal-800 border-teal-200 font-bold' },
    IN_REVIEW: { label: 'UNDER AE REVIEW', className: 'bg-blue-50 text-blue-800 border-blue-200' },
    QUOTATION_CREATED: { label: 'QUOTATION ISSUED', className: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold' },
    CLOSED: { label: 'CLOSED', className: 'bg-slate-100 text-slate-600 border-slate-200' },
  };

  const current = meta[status] || { label: status, className: 'bg-slate-100 text-slate-700 border-slate-200' };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs uppercase tracking-wide border font-semibold ${current.className}`}
    >
      {current.label}
    </span>
  );
}

export default function CustomerRequirementDetailPage() {
  const params = useParams();
  const reqId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);

  const { data: req, isLoading, isError, refetch } = useRequirement(reqId);
  const { data: quotations = [] } = useQuotations();

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto py-4">
        <CardLoadingSkeleton />
      </div>
    );
  }

  if (isError || !req) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <ErrorState
          title="Requirement Not Found"
          message={`Unable to locate commercial requirement ${reqId}.`}
          onRetry={refetch}
        />
      </div>
    );
  }

  const linkedQuotation = req.quotationId ? quotations.find((q) => q.id === req.quotationId) : null;

  // Workflow steps
  const steps = [
    { label: '1. Requirement Submitted', done: true, current: req.status === 'NEW' },
    { label: '2. Assigned to AE', done: true, current: req.status === 'NEW' },
    {
      label: '3. Under Deal Desk Review',
      done: req.status === 'IN_REVIEW' || req.status === 'QUOTATION_CREATED',
      current: req.status === 'IN_REVIEW',
    },
    {
      label: '4. Quotation Issued',
      done: req.status === 'QUOTATION_CREATED',
      current: req.status === 'QUOTATION_CREATED',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Top Breadcrumb & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <Link href="/portal/requirements">
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs text-slate-600">
              <ArrowLeft className="w-3.5 h-3.5" />
              All Requirements
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold bg-slate-900 text-white px-2 py-0.5 rounded">
                {req.id}
              </span>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                {req.title}
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Organization: <strong>{req.customerName}</strong> • Submitted:{' '}
              <strong>{new Date(req.createdAt).toLocaleDateString()}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <PriorityBadge priority={req.priority} />
          <ReqStatusBadge status={req.status} />
        </div>
      </div>

      {/* Workflow Stepper */}
      <Card className="p-4 bg-slate-50 border-slate-200 shadow-2xs">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className={`p-2.5 rounded-md border flex items-center gap-2 ${
                step.current
                  ? 'bg-teal-50 border-teal-300 text-teal-900 font-bold'
                  : step.done
                  ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900 font-semibold'
                  : 'bg-white border-slate-200 text-slate-400'
              }`}
            >
              {step.done ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
              )}
              <span className="truncate">{step.label}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* If Quotation has been created, spotlight card */}
      {req.quotationId && (
        <Card className="bg-gradient-to-r from-emerald-50 via-teal-50 to-white border-teal-300 shadow-enterprise p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <FileText className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider bg-teal-100 text-teal-800 px-2 py-0.5 rounded">
                    Official Quotation Ready
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-900">
                    Ref: {req.quotationId}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  Sales Executive {req.assignedSalesExecutive} has prepared your commercial offer
                </h3>
                <p className="text-xs text-slate-600">
                  Line items priced, discounts calculated, and commercial SLA terms attached.
                </p>
              </div>
            </div>

            <Link href={`/portal/quotations/${req.quotationId}`}>
              <Button className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold gap-1.5 shadow-enterprise shrink-0 cursor-pointer">
                Review Quotation in Portal
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Two Column Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Scope & Requested Items */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-white border-slate-200 shadow-enterprise">
            <CardHeader className="p-4 border-b border-slate-100">
              <CardTitle className="text-xs uppercase tracking-wider font-bold text-slate-800 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-teal-600" />
                Requirement Scope & Description
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4 text-xs">
              <div>
                <span className="font-semibold text-slate-500 block mb-1">Business Description:</span>
                <p className="text-slate-800 leading-relaxed bg-slate-50 p-3 rounded border border-slate-200/70">
                  {req.description || 'No detailed scope description provided.'}
                </p>
              </div>

              {req.additionalNotes && (
                <div>
                  <span className="font-semibold text-slate-500 block mb-1">
                    Site Notes & Deployment Instructions:
                  </span>
                  <p className="text-slate-800 leading-relaxed bg-amber-50/50 p-3 rounded border border-amber-200/70 text-amber-950">
                    {req.additionalNotes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Requested Items Table */}
          <Card className="bg-white border-slate-200 shadow-enterprise">
            <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs uppercase tracking-wider font-bold text-slate-800 flex items-center gap-2">
                <Layers className="w-4 h-4 text-teal-600" />
                Requested Specifications ({req.items.length} Lines)
              </CardTitle>
              <span className="text-xs font-mono text-slate-500">
                Total Qty: {req.items.reduce((sum, it) => sum + it.quantity, 0)}
              </span>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 text-[11px] font-semibold text-slate-600">
                    <TableHead className="w-12 text-center">#</TableHead>
                    <TableHead>Requested Item</TableHead>
                    <TableHead className="w-24">Category</TableHead>
                    <TableHead className="w-20 text-center">Quantity</TableHead>
                    <TableHead>Item Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {req.items.map((it, idx) => (
                    <TableRow key={it.id} className="text-xs border-b border-slate-100">
                      <TableCell className="text-center font-mono text-slate-400">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="font-semibold text-slate-900">
                        {it.name}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                          {it.category || 'Hardware'}
                        </span>
                      </TableCell>
                      <TableCell className="text-center font-mono font-bold text-slate-900">
                        {it.quantity}
                      </TableCell>
                      <TableCell className="text-slate-500 text-[11px]">
                        {it.notes || '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Col: Commercial Metadata & AE Assignment */}
        <div className="space-y-6">
          <Card className="bg-white border-slate-200 shadow-enterprise">
            <CardHeader className="p-4 border-b border-slate-100">
              <CardTitle className="text-xs uppercase tracking-wider font-bold text-slate-800">
                Logistics & Timeline SLA
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3.5 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <span className="text-slate-500">Expected Delivery:</span>
                <span className="font-bold text-slate-900 font-mono">
                  {req.expectedDeliveryDays} Days
                </span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <span className="text-slate-500">Priority Level:</span>
                <PriorityBadge priority={req.priority} />
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <span className="text-slate-500">Account Standing:</span>
                <TierBadge tier={req.customerTier} size="sm" />
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <span className="text-slate-500">Assigned Sales Executive:</span>
                <span className="font-bold text-slate-900">
                  {req.assignedSalesExecutive}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500">Commercial Status:</span>
                <ReqStatusBadge status={req.status} />
              </div>
            </CardContent>
          </Card>

          {/* Policy Guidance Card */}
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>Deal Governance Notice</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              When a quotation is created from your requirement, discounts will be computed according to your account tier ({req.customerTier}) with category ceilings: Hardware capped at 15%, Services capped at 10%.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
