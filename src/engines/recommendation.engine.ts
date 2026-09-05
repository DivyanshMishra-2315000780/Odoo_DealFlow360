import Decimal from 'decimal.js';

export interface Recommendation {
  productId: string;
  productName: string;
  reason: string;
  revenueDelta: Decimal;
  marginDelta: Decimal;
  score: number;
  type: 'UPSELL' | 'CROSS_SELL';
}

interface RecommendationLine { productId: string }
interface UpsellRule {
  triggerProductId: string; targetProductId: string; targetProductName: string; reason?: string;
  estimatedRevenueDelta?: string | number; estimatedMarginDelta?: string | number;
  coPurchaseScore?: number; marginScore?: number; type: 'UPSELL' | 'CROSS_SELL';
}
interface RecommendationInventory { productId: string; availableQty: number }

export function generateRecommendations(
  quotationLines: RecommendationLine[],
  upsellRules: UpsellRule[],
  inventory: RecommendationInventory[]
): Recommendation[] {
  const recommendations: Recommendation[] = [];
  const existingProductIds = new Set(quotationLines.map(l => l.productId));

  for (const line of quotationLines) {
    const rules = upsellRules.filter(r => r.triggerProductId === line.productId);
    
    for (const rule of rules) {
      if (existingProductIds.has(rule.targetProductId)) continue;
      
      const targetInv = inventory.find(i => i.productId === rule.targetProductId);
      if (!targetInv || targetInv.availableQty <= 0) continue;

      let score = 0;
      score += rule.coPurchaseScore || 0;
      score += (rule.marginScore || 0) * 0.5;
      score += targetInv.availableQty > 100 ? 10 : (targetInv.availableQty > 0 ? 5 : 0);

      const revDelta = new Decimal(rule.estimatedRevenueDelta || 0);
      const margDelta = new Decimal(rule.estimatedMarginDelta || 0);

      recommendations.push({
        productId: rule.targetProductId,
        productName: rule.targetProductName,
        reason: rule.reason || 'Recommended based on your current selection',
        revenueDelta: revDelta,
        marginDelta: margDelta,
        score,
        type: rule.type
      });
    }
  }

  return recommendations.sort((a, b) => b.score - a.score);
}
