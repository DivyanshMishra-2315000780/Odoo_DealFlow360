import { QuotationStatus } from '@/types';
import { cn } from '@/lib/utils';

interface QuoteStatusBadgeProps {
  status: QuotationStatus;
  className?: string;
}

export function QuoteStatusBadge({ status, className }: QuoteStatusBadgeProps) {
  const getStyles = () => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'PENDING_APPROVAL':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'APPROVED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'RETURNED':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'NEGOTIATION':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'CONFIRMED':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'REJECTED':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getLabel = () => {
    return status.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        getStyles(),
        className
      )}
    >
      {getLabel()}
    </span>
  );
}
