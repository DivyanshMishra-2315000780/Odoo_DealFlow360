import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const getStyles = () => {
    switch (status) {
      case 'DRAFT': return 'bg-slate-100 text-slate-700 border-slate-300';
      case 'PENDING_APPROVAL':
      case 'PENDING':
      case 'NEGOTIATION': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'APPROVED': 
      case 'CONFIRMED':
      case 'PAID':
      case 'COMPLETED':
      case 'ACTIVE': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'RETURNED': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'REJECTED': 
      case 'CANCELLED':
      case 'OVERDUE': return 'bg-red-100 text-red-800 border-red-300';
      case 'SHIPPED':
      case 'INVOICED': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'PARTIALLY_PAID':
      case 'PARTIALLY_SHIPPED': return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border', getStyles(), className)}>
      {status.replace('_', ' ')}
    </span>
  );
}
