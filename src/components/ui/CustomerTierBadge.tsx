import { cn } from '@/lib/utils';
import { CustomerTier } from '@/types';
import { Crown, Star, Shield } from 'lucide-react';

interface CustomerTierBadgeProps {
  tier: CustomerTier;
  className?: string;
  showIcon?: boolean;
}

export function CustomerTierBadge({ tier, className, showIcon = true }: CustomerTierBadgeProps) {
  const styles = {
    GOLD: 'bg-amber-100 text-amber-800 border-amber-300',
    SILVER: 'bg-slate-100 text-slate-700 border-slate-300',
    BRONZE: 'bg-orange-50 text-orange-800 border-orange-200'
  };

  const icons = {
    GOLD: <Crown className="w-3 h-3 mr-1" />,
    SILVER: <Star className="w-3 h-3 mr-1" />,
    BRONZE: <Shield className="w-3 h-3 mr-1" />
  };

  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border', styles[tier], className)}>
      {showIcon && icons[tier]}
      {tier}
    </span>
  );
}
