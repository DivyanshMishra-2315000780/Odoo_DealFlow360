import { QuotationLine, RiskLevel } from '@/types';
import { RiskBadge } from '@/components/ui/RiskBadge';
import { AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RiskBreakdownProps {
  lines: QuotationLine[];
  overallRisk: RiskLevel;
}

export function RiskBreakdown({ lines, overallRisk }: RiskBreakdownProps) {
  const atRiskLines = lines.filter(l => l.riskLevel !== 'LOW');
  
  if (overallRisk === 'LOW' && atRiskLines.length === 0) {
    return (
      <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-6 flex flex-col items-center justify-center text-center">
        <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
          <CheckCircle2 className="h-6 w-6 text-emerald-600" />
        </div>
        <h4 className="font-semibold text-emerald-900">Low Risk Quotation</h4>
        <p className="text-sm text-emerald-700 mt-1 max-w-sm">
          All line items are within allowed discount limits. No special approvals required.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
      <div className="border-b p-4 bg-muted/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-foreground">Risk Analysis</h3>
          <RiskBadge level={overallRisk} />
        </div>
      </div>
      
      <div className="p-0">
        {atRiskLines.map((line, index) => {
          const isOverLimit = line.discountPercentage > line.allowedDiscountPercentage;
          const overAmount = isOverLimit ? (line.discountPercentage - line.allowedDiscountPercentage).toFixed(1) : 0;
          
          return (
            <div key={line.id} className={cn("p-4 flex gap-4", index !== atRiskLines.length - 1 && "border-b")}>
              <div className="flex-shrink-0 mt-1">
                {line.riskLevel === 'HIGH' ? (
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                ) : (
                  <Info className="h-5 w-5 text-amber-500" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-foreground">{line.product?.name || 'Unknown Product'}</h4>
                  <RiskBadge level={line.riskLevel} />
                </div>
                
                <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="bg-muted/30 p-2 rounded border">
                    <span className="block text-xs text-muted-foreground mb-1">Discount Given</span>
                    <span className="font-semibold text-foreground">{line.discountPercentage}%</span>
                  </div>
                  <div className="bg-muted/30 p-2 rounded border">
                    <span className="block text-xs text-muted-foreground mb-1">Allowed Limit</span>
                    <span className="font-medium text-foreground">{line.allowedDiscountPercentage}%</span>
                  </div>
                  <div className={cn("p-2 rounded border md:col-span-2", line.riskLevel === 'HIGH' ? "bg-red-50/50 border-red-100" : "bg-amber-50/50 border-amber-100")}>
                    <span className="block text-xs text-muted-foreground mb-1">Risk Contribution</span>
                    <span className={cn("font-medium", line.riskLevel === 'HIGH' ? "text-red-700" : "text-amber-700")}>
                      {isOverLimit ? `Over limit by +${overAmount} percentage points` : 'Requires manager review due to category rules'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
