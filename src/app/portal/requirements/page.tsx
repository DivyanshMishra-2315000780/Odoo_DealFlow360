'use client';

import React from 'react';
import Link from 'next/link';
import {
  ClipboardList,
  Plus,
  Clock,
  ArrowRight,
  Eye,
  CheckCircle2,
  FileText,
  Building,
  Calendar,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { TierBadge } from '@/components/ui/tier-badge';
import { useRequirements } from '@/hooks/use-dealflow';
import { useAuth } from '@/lib/auth';
import { CustomerRequirement, RequirementPriority, RequirementStatus } from '@/types/dealflow';

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
    IN_REVIEW: { label: 'IN REVIEW', className: 'bg-blue-50 text-blue-800 border-blue-200' },
    QUOTATION_CREATED: { label: 'QUOTATION READY', className: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold' },
    CLOSED: { label: 'CLOSED', className: 'bg-slate-100 text-slate-600 border-slate-200' },
  };

  const current = meta[status] || { label: status, className: 'bg-slate-100 text-slate-700 border-slate-200' };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wide border font-semibold ${current.className}`}
    >
      {current.label}
    </span>
  );
}

export default function CustomerRequirementsPage() {
  const { user, isLoading: isAuthLoading } = useAuth();

  const { data: myRequirements = [], isLoading, isError } = useRequirements(
    user?.customerId,
    !isAuthLoading && user?.role === 'CUSTOMER' && Boolean(user.customerId),
  );

  if (isAuthLoading || isLoading) {
    return <Card className="bg-white border-slate-200 shadow-enterprise"><CardContent className="p-8 text-center text-sm text-slate-500">Loading requirements...</CardContent></Card>;
  }

  if (isError) {
    return <Card className="bg-white border-slate-200 shadow-enterprise"><CardContent className="p-8 text-center text-sm text-rose-700">Unable to load your requirements. Please try again.</CardContent></Card>;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              My Commercial Requirements
            </h1>
            <span className="text-[10px] font-bold uppercase bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded">
              Procurement Intake
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Submit specifications for upcoming deployments. A dedicated Sales Executive will review your requirements and construct a formal enterprise quotation.
          </p>
        </div>

        <Link href="/portal/requirements/new">
          <Button className="bg-teal-700 hover:bg-teal-800 text-white gap-1.5 text-xs font-semibold shadow-enterprise cursor-pointer">
            <Plus className="w-4 h-4" />
            Request a Quote
          </Button>
        </Link>
      </div>

      {/* Info Callout explaining the distinction */}
      <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700 flex items-start gap-2.5">
        <Sparkles className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <p>
            <strong>How It Works:</strong> You submit a <em>Requirement</em> describing what you need. Our Deal Desk reviews your specifications and generates a formal <em>Quotation</em> with tiered discount pricing and SLA delivery commitments.
          </p>
        </div>
      </div>

      {/* Requirements List */}
      <Card className="bg-white border-slate-200 shadow-enterprise">
        <CardContent className="p-0">
          {myRequirements.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <ClipboardList className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">No Requirements Submitted Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Ready to procure hardware, setup services, or care plans? Submit a commercial requirement to receive an enterprise quote.
              </p>
              <Link href="/portal/requirements/new">
                <Button size="sm" className="bg-teal-700 hover:bg-teal-800 text-white text-xs mt-2">
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Create First Requirement
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 text-[11px] font-semibold text-slate-600">
                    <TableHead>Requirement ID</TableHead>
                    <TableHead>Title & Scope</TableHead>
                    <TableHead>Items Requested</TableHead>
                    <TableHead>Expected Delivery</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned AE</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myRequirements.map((req) => (
                    <TableRow key={req.id} className="hover:bg-slate-50/80 transition border-b border-slate-100 text-xs">
                      <TableCell>
                        <span className="font-mono font-bold text-slate-900 block">{req.id}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(req.createdAt).toLocaleDateString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-bold text-slate-900 block">{req.title}</span>
                        <span className="text-[11px] text-slate-500 line-clamp-1">{req.description}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono font-medium text-slate-800">
                          {req.items.reduce((sum, it) => sum + it.quantity, 0)} Units
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          ({req.items.length} line{req.items.length > 1 ? 's' : ''})
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-slate-700">
                        {req.expectedDeliveryDays} Days
                      </TableCell>
                      <TableCell>
                        <PriorityBadge priority={req.priority} />
                      </TableCell>
                      <TableCell>
                        <ReqStatusBadge status={req.status} />
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {req.assignedSalesExecutive}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/portal/requirements/${req.id}`}>
                            <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1">
                              <Eye className="w-3 h-3 text-slate-500" />
                              Details
                            </Button>
                          </Link>
                          {req.quotationId && (
                            <Link href={`/portal/quotations/${req.quotationId}`}>
                              <Button size="sm" className="h-7 text-[11px] bg-teal-700 hover:bg-teal-800 text-white gap-1 font-semibold">
                                <FileText className="w-3 h-3" />
                                View Quote
                              </Button>
                            </Link>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
