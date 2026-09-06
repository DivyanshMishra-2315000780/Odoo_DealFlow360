import React from 'react';
import { QuotationStatus, RiskLevel, InvoiceStatus, FulfillmentStatus } from '@/types/dealflow';
import {
  AlertTriangle, CheckCircle2, Clock, ShieldAlert, XCircle, FileText,
  ArrowRightCircle, Truck, Receipt, Package, Ban, RotateCcw, Send
} from 'lucide-react';

interface StatusBadgeProps {
  status: QuotationStatus | InvoiceStatus | FulfillmentStatus | string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  switch (status) {
    // ── Success / Completed states ──
    case 'APPROVED':
    case 'PAID':
    case 'COMPLETED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          {status === 'COMPLETED' ? 'COMPLETED' : status}
        </span>
      );

    // ── Pending Approval states ──
    case 'PENDING_APPROVAL':
    case 'PENDING_APPROVAL':
    case 'PENDING_APPROVAL':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-300">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          PENDING APPROVAL
        </span>
      );

    // ── Re-Approval Required (after negotiation) ──
    case 'RE_APPROVAL_REQUIRED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-900 border border-orange-300">
          <RotateCcw className="w-3.5 h-3.5 text-orange-600" />
          RE-APPROVAL REQUIRED
        </span>
      );

    // ── Revision Required (returned for fixes) ──
    case 'REVISION_REQUIRED':
    case 'REVISION_REQUIRED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-900 border border-orange-300">
          <AlertTriangle className="w-3.5 h-3.5 text-orange-600" />
          REVISION REQUIRED
        </span>
      );

    // ── Sent to Customer ──
    case 'SENT':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200">
          <Send className="w-3.5 h-3.5 text-indigo-600" />
          SENT TO CUSTOMER
        </span>
      );

    // ── Negotiation states ──
    case 'UNDER_NEGOTIATION':
    case 'UNDER_NEGOTIATION':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
          <Clock className="w-3.5 h-3.5 text-blue-600" />
          IN NEGOTIATION
        </span>
      );

    // ── Confirmed (order bound) ──
    case 'CONFIRMED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-300">
          <ArrowRightCircle className="w-3.5 h-3.5 text-teal-600" />
          CONFIRMED
        </span>
      );

    // ── Fulfillment (warehouse & shipping) ──
    case 'FULFILLMENT':
    case 'FULFILLMENT':
    case 'SHIPPED':
    case 'ALLOCATED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-50 text-cyan-800 border border-cyan-200">
          <Truck className="w-3.5 h-3.5 text-cyan-600" />
          {status === 'SHIPPED' ? 'SHIPPED' : status === 'ALLOCATED' ? 'ALLOCATED' : 'FULFILLMENT'}
        </span>
      );

    // ── Billing (invoice generated) ──
    case 'BILLING':
    case 'ISSUED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-50 text-violet-800 border border-violet-200">
          <Receipt className="w-3.5 h-3.5 text-violet-600" />
          {status === 'ISSUED' ? 'ISSUED' : 'BILLING'}
        </span>
      );

    // ── Rejection / Error states ──
    case 'REJECTED':
    case 'OVERDUE':
    case 'VOID':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
          <XCircle className="w-3.5 h-3.5 text-rose-600" />
          {status}
        </span>
      );

    // ── Cancelled ──
    case 'CANCELLED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-300">
          <Ban className="w-3.5 h-3.5 text-gray-500" />
          CANCELLED
        </span>
      );

    // ── Partial Payment ──
    case 'PARTIALLY_PAID':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-800 border border-sky-300">
          <Clock className="w-3.5 h-3.5 text-sky-600" />
          PARTIALLY PAID
        </span>
      );

    // ── Pending Fulfillment states ──
    case 'PENDING':
    case 'PARTIAL':
    case 'BACKORDERED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-300">
          <Package className="w-3.5 h-3.5 text-slate-500" />
          {status === 'BACKORDERED' ? 'BACKORDERED' : status === 'PARTIAL' ? 'PARTIAL' : 'PENDING'}
        </span>
      );

    // ── Delivered ──
    case 'DELIVERED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          DELIVERED
        </span>
      );

    // ── Unpaid (legacy) ──
    case 'ISSUED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-300">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          UNPAID
        </span>
      );

    // ── Draft / default ──
    case 'DRAFT':
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200">
          <FileText className="w-3.5 h-3.5 text-slate-500" />
          {status}
        </span>
      );
  }
};

interface RiskBadgeProps {
  level: RiskLevel;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level }) => {
  switch (level) {
    case 'CRITICAL':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold tracking-wide uppercase bg-rose-600 text-white shadow-xs">
          <ShieldAlert className="w-3.5 h-3.5" />
          CRITICAL RISK
        </span>
      );
    case 'HIGH':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold tracking-wide uppercase bg-rose-100 text-rose-800 border border-rose-300">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
          HIGH RISK
        </span>
      );
    case 'MEDIUM':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold tracking-wide uppercase bg-amber-100 text-amber-900 border border-amber-300">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
          MEDIUM RISK
        </span>
      );
    case 'LOW':
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold tracking-wide uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          LOW RISK
        </span>
      );
  }
};
