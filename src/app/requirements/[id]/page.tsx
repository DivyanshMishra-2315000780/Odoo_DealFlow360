"use client";

import React, { use } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Building2, 
  Calendar, 
  FileText, 
  ArrowRight,
  ShieldCheck,
  CreditCard,
  UserCheck,
  Package,
  Layers,
  Inbox
} from "lucide-react";
import { useRequirement, useCustomer, useUpdateRequirementStatus, useProducts } from "@/hooks/use-dealflow";
import { TierBadge } from "@/components/ui/tier-badge";
import { CardLoadingSkeleton } from "@/components/ui/loading-state";
import { RequirementPriority, RequirementStatus } from "@/types/dealflow";

export default function RequirementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const requirementId = resolvedParams.id;

  const { data: requirement, isLoading: reqLoading } = useRequirement(requirementId);
  const { data: customer, isLoading: custLoading } = useCustomer(requirement?.customerId || "");
  const { data: products = [] } = useProducts();
  const updateStatusMutation = useUpdateRequirementStatus();

  if (reqLoading || custLoading) {
    return (
      <div className="max-w-5xl mx-auto py-8 space-y-6">
        <CardLoadingSkeleton />
        <CardLoadingSkeleton />
      </div>
    );
  }

  if (!requirement) {
    return (
      <div className="max-w-xl mx-auto text-center py-16">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-900">Requirement Not Found</h2>
        <p className="text-sm text-slate-500 mt-2">
          The requirement identifier <span className="font-mono font-semibold">{requirementId}</span> could not be retrieved from the deal desk repository.
        </p>
        <Link
          href="/requirements"
          className="inline-flex items-center gap-2 mt-6 px-4 py-2 text-xs font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Requirements Queue
        </Link>
      </div>
    );
  }

  const handleMarkInReview = () => {
    updateStatusMutation.mutate({ id: requirement.id, status: "IN_REVIEW" });
  };

  const getPriorityBadge = (priority: RequirementPriority) => {
    switch (priority) {
      case "URGENT":
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-rose-50 text-rose-700 border border-rose-200">Urgent SLA</span>;
      case "HIGH":
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-50 text-amber-700 border border-amber-200">High Priority</span>;
      case "MEDIUM":
        return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700 border border-blue-200">Medium</span>;
      case "LOW":
        return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-700 border border-slate-200">Low</span>;
    }
  };

  const getStatusBadge = (status: RequirementStatus) => {
    switch (status) {
      case "NEW":
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">New Intake</span>;
      case "IN_REVIEW":
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200">Under Desk Review</span>;
      case "QUOTATION_CREATED":
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Quotation Created</span>;
      case "CLOSED":
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700 border border-slate-200">Closed / Completed</span>;
    }
  };

  const steps = [
    { title: "Intake Submitted", desc: "Logged via customer portal", done: true },
    { 
      title: "Commercial Desk Review", 
      desc: "Sales Exec review & sizing", 
      done: requirement.status === "IN_REVIEW" || requirement.status === "QUOTATION_CREATED" || requirement.status === "CLOSED",
      active: requirement.status === "NEW" || requirement.status === "IN_REVIEW"
    },
    { 
      title: "Quotation Generated", 
      desc: "Contract & pricing modeled", 
      done: requirement.status === "QUOTATION_CREATED" || requirement.status === "CLOSED",
      active: requirement.status === "QUOTATION_CREATED"
    },
    { 
      title: "Commercial Sign-Off", 
      desc: "Quote approved & issued", 
      done: requirement.status === "CLOSED" 
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Top Breadcrumb / Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/requirements"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Customer Intake Queue
        </Link>

        <div className="flex items-center gap-2">
          {requirement.status === "NEW" && (
            <button
              onClick={handleMarkInReview}
              disabled={updateStatusMutation.isPending}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Mark Under Review
            </button>
          )}

          {requirement.status === "QUOTATION_CREATED" && requirement.quotationId ? (
            <Link
              href={`/quotes/${requirement.quotationId}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-lg transition-colors shadow-xs"
            >
              <FileText className="w-4 h-4" />
              View Commercial Quotation ({requirement.quotationId})
            </Link>
          ) : (
            <Link
              href={`/quotes/new?requirementId=${requirement.id}`}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors shadow-sm"
            >
              <span>Create Quotation from Requirement</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>

      {/* Main Header Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-sm font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded border border-teal-200">
                {requirement.id}
              </span>
              {getStatusBadge(requirement.status)}
              {getPriorityBadge(requirement.priority)}
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-2">{requirement.title}</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Received on {new Date(requirement.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </p>
          </div>

          <div className="text-left md:text-right bg-slate-50 md:bg-transparent p-3 md:p-0 rounded-lg border md:border-0 border-slate-200">
            <span className="text-xs text-slate-400 block font-medium">Customer Account</span>
            <span className="text-sm font-bold text-slate-900 block mt-0.5">{requirement.customerName}</span>
            {customer && (
              <div className="mt-1 flex items-center md:justify-end gap-1.5">
                <TierBadge tier={customer.tier} />
                <span className="text-[11px] text-slate-500">{customer.industry}</span>
              </div>
            )}
          </div>
        </div>

        {/* 4-Stage Stepper */}
        <div className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {steps.map((step, idx) => (
              <div key={idx} className="relative">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    step.done 
                      ? "bg-teal-600 text-white" 
                      : step.active 
                      ? "bg-amber-500 text-white ring-4 ring-amber-100" 
                      : "bg-slate-200 text-slate-500"
                  }`}>
                    {step.done ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                  </div>
                  <span className={`text-xs font-semibold ${step.done || step.active ? "text-slate-900" : "text-slate-400"}`}>
                    {step.title}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 pl-8">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Generated Quotation Spotlight Banner (If active) */}
      {requirement.quotationId && (
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-white border border-emerald-300 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Commercial Quotation Active</span>
                <span className="px-2 py-0.5 text-[11px] font-mono font-bold bg-white text-emerald-800 rounded border border-emerald-300">
                  {requirement.quotationId}
                </span>
              </div>
              <p className="text-xs text-emerald-900 mt-0.5">
                This requirement has been converted into a structured commercial quotation governed by price-book and customer tier policies.
              </p>
            </div>
          </div>
          <Link
            href={`/quotes/${requirement.quotationId}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors whitespace-nowrap"
          >
            Review Quotation & Policy Variance
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Two Column Layout: Customer Profile & Demand Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Demand Items & Specifications */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Package className="w-4 h-4 text-teal-600" />
              Requested Products & Scope of Services
            </h2>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Item / Service Name</th>
                    <th className="py-2.5 px-3 text-center">Quantity</th>
                    <th className="py-2.5 px-3">Warehouse Stock Availability</th>
                    <th className="py-2.5 px-3">Technical Specification / Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {requirement.items.map((item, idx) => {
                    const matched = products.find(
                      (p) => (item.productId && p.id === item.productId) || p.name.toLowerCase() === item.name.toLowerCase()
                    );
                    const isHw = item.category === "Hardware" || matched?.category === "Hardware";
                    const stock = matched?.availableStock ?? 0;
                    const isOutOfStock = isHw && matched && stock <= 0;
                    const isExceeding = isHw && matched && stock > 0 && item.quantity > stock;

                    return (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 text-[10px] font-semibold rounded uppercase tracking-wider ${
                            item.category === "Hardware" 
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : item.category === "Services"
                              ? "bg-purple-50 text-purple-700 border border-purple-200"
                              : "bg-teal-50 text-teal-700 border border-teal-200"
                          }`}>
                            {item.category || "Hardware"}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-900">
                          {item.name}
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-slate-800">
                          {item.quantity}
                        </td>
                        <td className="py-3 px-3">
                          {matched ? (
                            isHw ? (
                              isOutOfStock ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                  <AlertTriangle className="w-3 h-3 text-rose-600" />
                                  Out of Stock (0 avail)
                                </span>
                              ) : isExceeding ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                                  Exceeds Stock ({stock} in warehouse)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  In Stock ({stock} avail)
                                </span>
                              )
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                                <CheckCircle2 className="w-3 h-3 text-teal-600" />
                                Active Service SLA
                              </span>
                            )
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Custom item specification</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          {item.notes || <span className="text-slate-400 italic">Standard enterprise specification</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Additional Buyer Notes */}
            {(requirement.additionalNotes || requirement.description) && (
              <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-xs font-bold text-slate-700 block mb-1">Customer Delivery & Implementation Notes:</span>
                <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed">
                  {requirement.additionalNotes || requirement.description}
                </p>
              </div>
            )}
          </div>

          {/* Quick Workflow Action Card */}
          <div className="bg-slate-900 text-white rounded-xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-400">Sales Executive Workflow</span>
                <h3 className="text-base font-bold text-white mt-1">Ready to draft commercial terms?</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-lg">
                  Opening the Quotation Builder will import these {requirement.items.length} line items, calculate customer discount ceilings, and generate the formal proposal.
                </p>
              </div>
              <Link
                href={`/quotes/new?requirementId=${requirement.id}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-900 bg-teal-400 hover:bg-teal-300 rounded-lg transition-colors whitespace-nowrap"
              >
                <span>Launch Quotation Builder</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Customer Context & Governance Preview */}
        <div className="space-y-6">
          {/* Customer Commercial Profile */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 border-b border-slate-100 pb-3">
              <Building2 className="w-4 h-4 text-teal-600" />
              Account Commercial Standing
            </h3>

            {customer ? (
              <div className="space-y-3.5 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Assigned Tier & Max Allowable Cap</span>
                  <div className="mt-1 flex items-center justify-between">
                    <TierBadge tier={customer.tier} />
                    <span className="font-semibold text-slate-800">
                      {customer.tier === "Gold" ? "15% Cap" : customer.tier === "Silver" ? "10% Cap" : "5% Cap"}
                    </span>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-2.5">
                  <span className="text-slate-400 block text-[11px]">Credit Limit & Rating</span>
                  <div className="mt-1 flex items-center justify-between font-medium">
                    <span className="text-slate-900">${customer.creditLimit.toLocaleString()}</span>
                    <span className="text-slate-600">{customer.creditRating || "Net 30"}</span>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-2.5">
                  <span className="text-slate-400 block text-[11px]">Primary Procurement Contact</span>
                  <div className="mt-1 font-medium text-slate-900">{customer.contactPerson}</div>
                  <div className="text-[11px] text-slate-500">{customer.contactEmail}</div>
                </div>

                <div className="border-t border-slate-100 pt-2.5">
                  <span className="text-slate-400 block text-[11px]">Assigned Account Executive</span>
                  <div className="mt-1 flex items-center gap-1.5 font-medium text-slate-900">
                    <UserCheck className="w-3.5 h-3.5 text-teal-600" />
                    <span>{customer.accountManager}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic">Customer details not available.</div>
            )}
          </div>

          {/* Delivery SLA Requirements */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 border-b border-slate-100 pb-3">
              <Clock className="w-4 h-4 text-teal-600" />
              Turnaround & SLA Requirements
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Requested Delivery SLA:</span>
                <span className="font-bold text-slate-900">
                  {requirement.expectedDeliveryDays ? `${requirement.expectedDeliveryDays} Calendar Days` : "Standard (30 Days)"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Logistics Feasibility:</span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Standard Stock Available
                </span>
              </div>
            </div>
          </div>

          {/* Policy Governance Callout */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-amber-900">
              <ShieldCheck className="w-4 h-4 text-amber-700" />
              Governance & Ceilings
            </div>
            <p className="text-amber-800 text-[11px] leading-relaxed">
              When modeling discounts for this requirement in Quotation Builder, remember that category ceilings apply:
              Hardware discounts are capped at <strong>15%</strong> and Services at <strong>10%</strong>, regardless of customer tier standing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
