import { cn } from '@/lib/utils';
import { RiskLevel } from '@/types';
import { ShieldAlert, ShieldCheck, Shield } from 'lucide-react';

interface RiskBadgeProps {
  level: RiskLevel;
  className?: string;
}

export function RiskBadge({ level, className }: RiskBadgeProps) {
  const styles = {
    HIGH: 'bg-red-100 text-red-800 border-red-300',
    MEDIUM: 'bg-amber-100 text-amber-800 border-amber-300',
    LOW: 'bg-emerald-100 text-emerald-800 border-emerald-300'
  };

  const icons = {
    HIGH: <ShieldAlert className="w-3 h-3 mr-1" />,
    MEDIUM: <Shield className="w-3 h-3 mr-1" />,
    LOW: <ShieldCheck className="w-3 h-3 mr-1" />
  };

  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border', styles[level], className)}>
      {icons[level]}
      {level}
    </span>
  );
}
