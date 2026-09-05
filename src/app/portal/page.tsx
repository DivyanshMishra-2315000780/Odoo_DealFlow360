'use client';

import React from 'react';
import Link from 'next/link';
import {
  FileText,
  CreditCard,
  Sparkles,
  AlertCircle,
  Clock,
  CheckCircle2,
  ArrowRight,
  Shield,
  Truck,
  MessageSquare,
  Building,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge, RiskBadge } from '@/components/ui/status-badge';
import { TierBadge } from '@/components/ui/tier-badge';
import { useQuotations, useInvoices, useFulfillmentOrders } from '@/hooks/use-dealflow';
import { useAuth } from '@/lib/auth';
import { formatCurrency } from '@/lib/utils';

export default function CustomerPortalOverview() {
  const { data: quotations = [] } = useQuotations();
  const { data: invoices = [] } = useInvoices();
  const { data: fulfillment = [] } = useFulfillmentOrders();
  const { user } = useAuth();

  const customerName = user?.company || 'Acme Corporation';

  // Filter deals for this customer (or Acme Corporation by default)
  const myQuotations = quotations.filter((q) =>
    q.customerName.toLowerCase().includes('acme') || q.customerName === customerName
  );

  const pendingActionDeals = myQuotations.filter(
    (q) => q.status === 'PENDING_FINANCE_APPROVAL' || q.status === 'IN_NEGOTIATION'
  );

  const myInvoices = invoices.filter((inv) =>
    inv.customerName.toLowerCase().includes('acme') || inv.customerName === customerName
  );

  const outstandingInvoices = myInvoices.filter((i) => i.status === 'UNPAID');

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Banner */}
      <div className="p-6 rounded-lg bg-white border border-slate-200 shadow-enterprise flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
              Procurement Center
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-medium">Acme Corporation Commercial Desk</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1.5">
            Welcome, Sarah Jenkins
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed">
            Review active hardware and service quotations, negotiate pricing within your Gold Tier limits, and track enterprise shipments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/portal/quotations">
            <Button variant="default" size="sm" className="gap-1.5 shadow-enterprise">
              <FileText className="w-3.5 h-3.5" />
              View My Quotations
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Quotations */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Active Quotations</span>
              <div className="p-2 rounded-md bg-teal-50 text-teal-700 shadow-2xs">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-bold font-mono text-slate-900 mt-2">
              {myQuotations.length || 1}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Active commercial deals in procurement pipeline
            </p>
          </CardContent>
        </Card>

        {/* Pending Customer Action */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Pending Action</span>
              <div className="p-2 rounded-md bg-amber-50 text-amber-700 shadow-2xs">
                <AlertCircle className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-bold font-mono text-slate-900 mt-2">
              {pendingActionDeals.length || 1}
            </p>
            <p className="text-xs text-amber-700 font-medium mt-1">
              Quotations requiring feedback or review
            </p>
          </CardContent>
        </Card>

        {/* Active Subscription */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Active Plan</span>
              <div className="p-2 rounded-md bg-slate-100 text-slate-700 shadow-2xs">
                <Sparkles className="w-4 h-4 text-teal-600" />
              </div>
            </div>
            <p className="text-xl font-bold text-slate-900 mt-2">
              Enterprise Suite
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Dedicated AE Marcus Vance • 1h SLA
            </p>
          </CardContent>
        </Card>

        {/* Outstanding Invoices */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Outstanding Invoices</span>
              <div className="p-2 rounded-md bg-slate-100 text-slate-700 shadow-2xs">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold font-mono text-slate-900 mt-2">
              {formatCurrency(outstandingInvoices.reduce((a, b) => a + b.amount, 0))}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {outstandingInvoices.length} invoices pending payment
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Active Quotation Highlight & Recent Messages */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Quotation Highlight */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-teal-600" />
              Primary Deal Awaiting Review
            </h2>
            <Link href="/portal/quotations" className="text-xs font-semibold text-teal-700 hover:underline">
              View All Deals →
            </Link>
          </div>

          {/* Highlight Card for Q-1042 */}
          <Card className="border-teal-200 bg-white shadow-enterprise">
            <CardHeader className="p-5 pb-3 flex-row items-center justify-between space-y-0 bg-teal-50/20 border-b border-teal-100">
              <div className="flex items-center gap-2.5">
                <span className="font-mono font-bold text-sm text-slate-900">Q-1042</span>
                <StatusBadge status="PENDING_FINANCE_APPROVAL" />
                <RiskBadge level="HIGH" />
              </div>
              <span className="text-xs text-slate-500 font-mono">Issued: Sept 2, 2026</span>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Workstation Fleet Refresh & Onsite Deployment
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  15 Enterprise Laptop Pro 14 workstations, 15 Thunderbolt 4 Docking Stations, and 4 Onsite Setup integration packages.
                </p>
              </div>

              {/* Status Notice */}
              <div className="p-3 rounded-md bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Special Discount Approval in Progress</span>
                </div>
                <p className="text-slate-700 text-[11px] leading-relaxed">
                  Your proposed 18% discount on Onsite Setup exceeds standard category limits (10%). Account Executive Marcus Vance has escalated this to Finance Controller Sarah Sterling for commercial override sign-off.
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div>
                  <span className="text-[11px] text-slate-400">Total Net Amount:</span>
                  <p className="text-lg font-bold font-mono text-teal-700">$25,699.00</p>
                </div>

                <div className="flex gap-2">
                  <Link href="/portal/quotations/Q-1042">
                    <Button variant="default" size="sm" className="gap-1.5">
                      Review Deal & Negotiate
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Messages & Account Director */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-teal-600" />
            Recent Messages & Deal Desk
          </h2>

          <Card className="h-full">
            <CardHeader className="p-4 pb-2 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800">Assigned Deal Desk</span>
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-medium border border-emerald-200">
                  Online
                </span>
              </div>
              <p className="text-xs font-bold text-slate-900 mt-1">Marcus Vance</p>
              <p className="text-[11px] text-slate-500">Commercial Account Executive</p>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 text-xs space-y-1">
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span className="font-semibold text-slate-700">Marcus Vance</span>
                  <span>Today, 11:15 AM</span>
                </div>
                <p className="text-slate-700 leading-relaxed text-[11px]">
                  &ldquo;Sarah, I have submitted the 18% onsite setup discount exception to our Finance Controller. We expect sign-off by 4 PM today.&rdquo;
                </p>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 text-xs space-y-1">
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span className="font-semibold text-slate-700">System Notification</span>
                  <span>Sept 2, 2026</span>
                </div>
                <p className="text-slate-700 leading-relaxed text-[11px]">
                  Quotation Q-1042 generated and sent to Acme Corporation procurement team.
                </p>
              </div>

              <div className="pt-2">
                <Link href="/portal/quotations/Q-1042">
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    Send Reply / Counter-Offer
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
