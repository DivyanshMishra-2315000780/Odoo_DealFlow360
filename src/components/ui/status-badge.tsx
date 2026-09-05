import React from 'react';
import { QuotationStatus, RiskLevel, InvoiceStatus } from '@/types/dealflow';
import { AlertTriangle, CheckCircle2, Clock, ShieldAlert, XCircle, FileText, ArrowRightCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: QuotationStatus | InvoiceStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'APPROVED':
    case 'PAID':
    case 'FULFILLED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          {status}
        </span>
      );
    case 'PENDING_APPROVAL':
    case 'PENDING_FINANCE_APPROVAL':
    case 'PENDING_DISCOUNT_APPROVAL':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-300">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          {status === 'PENDING_APPROVAL' ? 'PENDING APPROVAL' : status.replace(/_/g, ' ')}
        </span>
      );
    case 'RETURNED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-900 border border-orange-300">
          <AlertTriangle className="w-3.5 h-3.5 text-orange-600" />
          RETURNED
        </span>
      );
    case 'IN_NEGOTIATION':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
          <Clock className="w-3.5 h-3.5 text-blue-600" />
          IN NEGOTIATION
        </span>
      );
    case 'CONFIRMED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-300">
          <ArrowRightCircle className="w-3.5 h-3.5 text-teal-600" />
          CONFIRMED
        </span>
      );
    case 'REJECTED':
    case 'OVERDUE':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
          <XCircle className="w-3.5 h-3.5 text-rose-600" />
          {status}
        </span>
      );
    case 'PARTIALLY_PAID':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-800 border border-sky-300">
          <Clock className="w-3.5 h-3.5 text-sky-600" />
          PARTIALLY PAID
        </span>
      );
    case 'UNPAID':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-300">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          UNPAID
        </span>
      );
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
