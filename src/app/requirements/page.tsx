"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Inbox, 
  Search, 
  Filter, 
  ArrowRight, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  FileText,
  PlusCircle,
  Building2,
  Calendar,
  Layers,
  Sparkles
} from "lucide-react";
import { useRequirements, useCustomers } from "@/hooks/use-dealflow";
import { CustomerRequirement, RequirementPriority, RequirementStatus } from "@/types/dealflow";
import { TierBadge } from "@/components/ui/tier-badge";
import { CardLoadingSkeleton } from "@/components/ui/loading-state";

export default function RequirementsPage() {
  const { data: requirements = [], isLoading } = useRequirements();
  const { data: customers = [] } = useCustomers();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");

  const customerMap = React.useMemo(() => {
    return new Map(customers.map((c) => [c.id, c]));
  }, [customers]);

  const filteredRequirements = requirements.filter((req) => {
    const matchesSearch =
      req.id.toLowerCase().includes(search.toLowerCase()) ||
      req.customerName.toLowerCase().includes(search.toLowerCase()) ||
      req.title.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === "ALL" || req.status === statusFilter;
    const matchesPriority = priorityFilter === "ALL" || req.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const kpis = {
    total: requirements.length,
    newRequests: requirements.filter((r) => r.status === "NEW").length,
    inReview: requirements.filter((r) => r.status === "IN_REVIEW").length,
    quoted: requirements.filter((r) => r.status === "QUOTATION_CREATED").length,
    highPriority: requirements.filter((r) => r.priority === "HIGH" || r.priority === "URGENT").length,
  };

  const getPriorityBadge = (priority: RequirementPriority) => {
    switch (priority) {
      case "URGENT":
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-rose-500/10 text-rose-600 border border-rose-500/20">Urgent</span>;
      case "HIGH":
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">High Priority</span>;
      case "MEDIUM":
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-500/10 text-blue-600 border border-blue-500/20">Medium</span>;
      case "LOW":
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-500/10 text-slate-600 border border-slate-500/20">Low</span>;
    }
  };

  const getStatusBadge = (status: RequirementStatus) => {
    switch (status) {
      case "NEW":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">New Intake</span>;
      case "IN_REVIEW":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200">Under Desk Review</span>;
      case "QUOTATION_CREATED":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Quotation Created</span>;
      case "CLOSED":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700 border border-slate-200">Archived / Closed</span>;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-teal-50 text-teal-700 border border-teal-200">
              Commercial Deal Desk
            </span>
            <span className="text-xs text-slate-400 font-medium">• Commercial Intake Queue</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1 tracking-tight">Customer Intake Requirements</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Incoming buyer requests submitted through the Customer Portal awaiting quotation modeling and commercial deal structuring.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/portal/requirements/new"
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            Simulate Customer Submission
          </Link>
          <Link
            href="/quotes/new"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors shadow-sm"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Direct Quotation Builder
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Inbound Demands</span>
            <Inbox className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{kpis.total}</p>
          <p className="text-xs text-slate-500 mt-1">Across all enterprise accounts</p>
        </div>

        <div className="bg-white border border-blue-200 rounded-xl p-4 shadow-sm bg-gradient-to-br from-white to-blue-50/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-900">New / Unaddressed</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-blue-950 mt-2">{kpis.newRequests}</p>
          <p className="text-xs text-blue-700 mt-1">Require sales executive action</p>
        </div>

        <div className="bg-white border border-amber-200 rounded-xl p-4 shadow-sm bg-gradient-to-br from-white to-amber-50/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-900">High Priority SLA</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-amber-950 mt-2">{kpis.highPriority}</p>
          <p className="text-xs text-amber-700 mt-1">Expected delivery &lt; 14 days</p>
        </div>

        <div className="bg-white border border-emerald-200 rounded-xl p-4 shadow-sm bg-gradient-to-br from-white to-emerald-50/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-900">Converted to Quote</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-950 mt-2">{kpis.quoted}</p>
          <p className="text-xs text-emerald-700 mt-1">Quotation actively in governance</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by REQ ID, customer, title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Filter className="w-3.5 h-3.5" />
              <span>Status:</span>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 bg-white font-medium text-slate-700"
            >
              <option value="ALL">All Statuses</option>
              <option value="NEW">New Intake</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="QUOTATION_CREATED">Quotation Created</option>
              <option value="CLOSED">Archived / Closed</option>
            </select>

            <div className="flex items-center gap-1.5 text-xs text-slate-500 ml-2">
              <span>Priority:</span>
            </div>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 bg-white font-medium text-slate-700"
            >
              <option value="ALL">All Priorities</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High Priority</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Requirements Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-6">
            <CardLoadingSkeleton />
          </div>
        ) : filteredRequirements.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Inbox className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-900">No customer requirements found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              No demands match your current filter criteria. Reset the filters or submit a new customer intake.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Requirement ID</th>
                  <th className="py-3 px-4">Customer Account</th>
                  <th className="py-3 px-4">Demand Summary</th>
                  <th className="py-3 px-4">Delivery SLA</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRequirements.map((req) => {
                  const customer = customerMap.get(req.customerId);
                  const totalItemsCount = req.items.reduce((sum, item) => sum + item.quantity, 0);

                  return (
                    <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-900">
                        <Link 
                          href={`/requirements/${req.id}`}
                          className="text-teal-700 hover:text-teal-900 hover:underline"
                        >
                          {req.id}
                        </Link>
                        <div className="text-[10px] text-slate-400 font-sans mt-0.5">
                          {new Date(req.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{req.customerName}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {customer ? (
                            <TierBadge tier={customer.tier} />
                          ) : (
                            <span className="text-[10px] text-slate-400">{req.customerId}</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-medium text-slate-900 truncate">{req.title}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                          <Layers className="w-3 h-3 text-slate-400" />
                          <span>{req.items.length} categories • {totalItemsCount} total units</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-700">
                          {req.expectedDeliveryDays ? `Within ${req.expectedDeliveryDays} Days` : "Standard SLA"}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Target turnaround</div>
                      </td>

                      <td className="py-3.5 px-4">
                        {getPriorityBadge(req.priority)}
                      </td>

                      <td className="py-3.5 px-4">
                        {getStatusBadge(req.status)}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/requirements/${req.id}`}
                            className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors"
                          >
                            Inspect
                          </Link>

                          {req.status === "QUOTATION_CREATED" && req.quotationId ? (
                            <Link
                              href={`/quotes/${req.quotationId}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded hover:bg-emerald-100 transition-colors"
                            >
                              <FileText className="w-3 h-3" />
                              View Quote
                            </Link>
                          ) : (
                            <Link
                              href={`/quotes/new?requirementId=${req.id}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 rounded transition-colors shadow-xs"
                            >
                              <span>Create Quote</span>
                              <ArrowRight className="w-3 h-3" />
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
