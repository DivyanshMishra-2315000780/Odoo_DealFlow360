import React from 'react';
import { CustomerTier } from '@/types/dealflow';
import { Crown, Shield, Award } from 'lucide-react';

interface TierBadgeProps {
  tier: CustomerTier;
  size?: 'sm' | 'md' | 'lg';
  showLimitNotice?: boolean;
}

export const TierBadge: React.FC<TierBadgeProps> = ({
  tier,
  size = 'md',
  showLimitNotice = false,
}) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3 py-1.5 gap-2 font-semibold',
  };

  const config = {
    Gold: {
      bg: 'bg-amber-50 border-amber-300 text-amber-900',
      icon: <Crown className="w-3.5 h-3.5 text-amber-600 shrink-0" />,
      maxLimit: '15% Tier Max',
    },
    Silver: {
      bg: 'bg-slate-100 border-slate-300 text-slate-800',
      icon: <Award className="w-3.5 h-3.5 text-slate-600 shrink-0" />,
      maxLimit: '10% Tier Max',
    },
    Bronze: {
      bg: 'bg-orange-50 border-orange-200 text-orange-900',
      icon: <Shield className="w-3.5 h-3.5 text-orange-600 shrink-0" />,
      maxLimit: '5% Tier Max',
    },
  }[tier];

  return (
    <div className="inline-flex items-center gap-1.5">
      <span
        className={`inline-flex items-center rounded-full border shadow-xs ${config.bg} ${sizeClasses[size]}`}
      >
        {config.icon}
        <span>{tier} Tier</span>
      </span>
      {showLimitNotice && (
        <span className="text-[11px] text-slate-500 font-mono">({config.maxLimit})</span>
      )}
    </div>
  );
};
