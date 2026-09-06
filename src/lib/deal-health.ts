import { Quotation, FulfillmentOrder, CustomerTier } from '@/types/dealflow';

export interface StalledDeal {
  quotationId: string;
  customerName: string;
  customerId: string;
  customerTier: CustomerTier;
  title: string;
  amount: number;
  daysIdle: number;
  lastActivityDate: string;
  lastActor: string;
  status: string;
  stage: string;
  recommendedAction: string;
  velocityScore: number; // 0 - 100
  stalenessReason: string;
}

export interface DiscountAnomaly {
  id: string;
  quotationId: string;
  customerName: string;
  customerTier: CustomerTier;
  productName: string;
  requestedDiscount: number;
  typicalDiscount: number;
  categoryLimit: number;
  variancePoints: number; // e.g. +14
  excessPoints: number; // e.g. +12
  status: 'ESCALATED' | 'UNDER_REVIEW' | 'FLAGGED';
  marginErosionAmount: number;
  ruleTriggered: string;
  explanation: string;
  recommendedAction: string;
}

export interface DeliveryRiskItem {
  id: string;
  fulfillmentId: string;
  quotationId: string;
  customerName: string;
  productName: string;
  orderedQty: number;
  reservedQty: number;
  availableQty: number;
  backorderQty: number;
  riskType: 'INSUFFICIENT_INVENTORY' | 'BACKORDER' | 'DELAYED_FULFILLMENT' | 'FACILITY_BOTTLENECK';
  warehouse: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  estimatedDelivery: string;
  daysUntilSlaBreach: number;
  suggestedAction: string;
  impactSummary: string;
}

export interface RecommendedActionItem {
  id: string;
  title: string;
  dealReference: string;
  customerName: string;
  category: 'STALLED_DEAL' | 'DISCOUNT_ANOMALY' | 'DELIVERY_RISK';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  summary: string;
  whyItMatters: string;
  actionLabel: string;
  dialogType: 'NUDGE_ZENITH' | 'REVIEW_DELTA' | 'RESOLVE_STOCK';
}

export interface HealthTimelineEvent {
  id: string;
  timestamp: string;
  quotationId: string;
  customerName: string;
  eventType: 'ANOMALY_DETECTED' | 'VELOCITY_STALLED' | 'INVENTORY_SHORTAGE' | 'POLICY_ESCALATION' | 'TERMS_OFFERED';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'INFO';
  headline: string;
  ruleTriggered: string;
  details: string;
  recommendedNextStep: string;
}

export const SEEDED_STALLED_DEALS: StalledDeal[] = [
  {
    quotationId: 'Q-1028',
    customerName: 'Zenith Industries',
    customerId: 'CUST-004',
    customerTier: 'Gold',
    title: 'Automated Manufacturing Telemetry Workstations',
    amount: 15100,
    daysIdle: 9,
    lastActivityDate: '2026-08-27',
    lastActor: 'Elena Rostova (Account Manager)',
    status: 'UNDER_NEGOTIATION',
    stage: 'Customer Proposal Review',
    recommendedAction: 'Nudge customer',
    velocityScore: 32,
    stalenessReason: 'Quotation sent to procurement team 9 days ago with zero view or signature events recorded.',
  },
  {
    quotationId: 'Q-1045',
    customerName: 'Zenith Industries',
    customerId: 'CUST-004',
    customerTier: 'Gold',
    title: 'Robotics R&D High-Performance Terminal Suite',
    amount: 32000,
    daysIdle: 4,
    lastActivityDate: '2026-09-01',
    lastActor: 'Marcus Vance (AE)',
    status: 'UNDER_NEGOTIATION',
    stage: 'Counter-Offer Terms Deliberation',
    recommendedAction: 'Finalize Care Plan concessions',
    velocityScore: 58,
    stalenessReason: 'Client requested 2 additional Care Plan months; pending sales manager concession approval.',
  },
];

export const SEEDED_DISCOUNT_ANOMALIES: DiscountAnomaly[] = [
  {
    id: 'ANO-01',
    quotationId: 'Q-1052',
    customerName: 'Delta Solutions',
    customerTier: 'Silver',
    productName: 'Laptop Pro 14 (14 Units)',
    requestedDiscount: 22,
    typicalDiscount: 8,
    categoryLimit: 10,
    variancePoints: 14,
    excessPoints: 12,
    status: 'ESCALATED',
    marginErosionAmount: 4180,
    ruleTriggered: 'ANOMALY RULE #AD-14: Variance > 10 pts from historical account median (8%)',
    explanation: 'Requested 22% discount drastically deviates from Delta Solutions 12-month typical historical concession benchmark (8%). Also breaches Silver tier category ceiling (10%) by +12 percentage points.',
    recommendedAction: 'Review Delta discount & enforce 10% ceiling',
  },
  {
    id: 'ANO-02',
    quotationId: 'Q-1042',
    customerName: 'Acme Corporation',
    customerTier: 'Gold',
    productName: 'Onsite Setup & Migration (4 Packages)',
    requestedDiscount: 18,
    typicalDiscount: 10,
    categoryLimit: 10,
    variancePoints: 8,
    excessPoints: 8,
    status: 'UNDER_REVIEW',
    marginErosionAmount: 1200,
    ruleTriggered: 'GOVERNANCE RULE #GR-02: Services discount capped at 10% regardless of Gold tier standing',
    explanation: 'Gold Tier allows 15% on Hardware, but Services ceiling strictly limits Onsite Setup to 10%. Line item is +8 points over policy limit.',
    recommendedAction: 'Finance Controller Sarah Sterling sign-off required',
  },
  {
    id: 'ANO-03',
    quotationId: 'Q-1050',
    customerName: 'Acme Corporation',
    customerTier: 'Gold',
    productName: 'Laptop Pro 14 (6 Units)',
    requestedDiscount: 18,
    typicalDiscount: 12,
    categoryLimit: 15,
    variancePoints: 6,
    excessPoints: 3,
    status: 'FLAGGED',
    marginErosionAmount: 900,
    ruleTriggered: 'ANOMALY RULE #AD-08: Excess > 2 pts above Gold hardware ceiling (15%)',
    explanation: 'Returned to account manager Elena Rostova for restructuring into bundled warranty package.',
    recommendedAction: 'Restructure deal to bundled warranty margin credit',
  },
];

export const SEEDED_DELIVERY_RISKS: DeliveryRiskItem[] = [
  {
    id: 'DEL-01',
    fulfillmentId: 'FUL-803',
    quotationId: 'Q-1045',
    customerName: 'Zenith Industries',
    productName: 'Laptop Pro 14',
    orderedQty: 30,
    reservedQty: 22,
    availableQty: 0,
    backorderQty: 8,
    riskType: 'BACKORDER',
    warehouse: 'East Depot / Newark Regional Hub',
    severity: 'CRITICAL',
    estimatedDelivery: '2026-09-22',
    daysUntilSlaBreach: 5,
    suggestedAction: 'Resolve East Depot stock shortage via West Logistics Hub transfer',
    impactSummary: '8 units backordered. Scheduled SLA delivery commitment at risk of 6-day postponement unless inventory is expedited from West Logistics Hub.',
  },
  {
    id: 'DEL-02',
    fulfillmentId: 'FUL-802',
    quotationId: 'Q-1039',
    customerName: 'Beta Technologies',
    productName: 'Laptop Pro 14',
    orderedQty: 24,
    reservedQty: 24,
    availableQty: 4,
    backorderQty: 0,
    riskType: 'FACILITY_BOTTLENECK',
    warehouse: 'East Depot Terminal',
    severity: 'HIGH',
    estimatedDelivery: '2026-09-12',
    daysUntilSlaBreach: 7,
    suggestedAction: 'Accept Suggested Split (18 Chicago / 6 Newark)',
    impactSummary: 'East Depot depot buffer depleted down to 4 units after 6-unit reservation. Secondary orders from East Depot will incur immediate backorders.',
  },
  {
    id: 'DEL-03',
    fulfillmentId: 'FUL-804',
    quotationId: 'Q-1039',
    customerName: 'Beta Technologies',
    productName: 'Docking Station',
    orderedQty: 12,
    reservedQty: 12,
    availableQty: 35,
    backorderQty: 0,
    riskType: 'DELAYED_FULFILLMENT',
    warehouse: 'Main Warehouse (Chicago Hub)',
    severity: 'MEDIUM',
    estimatedDelivery: '2026-09-14',
    daysUntilSlaBreach: 9,
    suggestedAction: 'Confirm carrier pickup window with DHL Express',
    impactSummary: 'Carrier dispatch scheduled for Sep 10. Awaiting Bill of Lading clearance.',
  },
];

export const SEEDED_RECOMMENDED_ACTIONS: RecommendedActionItem[] = [
  {
    id: 'ACT-01',
    title: 'Follow up with Zenith',
    dealReference: 'Q-1028',
    customerName: 'Zenith Industries',
    category: 'STALLED_DEAL',
    severity: 'HIGH',
    summary: 'Quotation Q-1028 has been idle for 9 days in customer proposal review.',
    whyItMatters: '$15,100 pipeline revenue at risk of slippage into Q4. Velocity score dropped to 32/100.',
    actionLabel: 'Nudge Customer',
    dialogType: 'NUDGE_ZENITH',
  },
  {
    id: 'ACT-02',
    title: 'Review Delta discount',
    dealReference: 'Q-1052',
    customerName: 'Delta Solutions',
    category: 'DISCOUNT_ANOMALY',
    severity: 'CRITICAL',
    summary: 'Quotation Q-1052 requested 22% discount (+14 pts above typical 8% median benchmark).',
    whyItMatters: 'Gross margin erosion of $4,180. Silver tier category ceiling is strictly 10%.',
    actionLabel: 'Review Delta Discount',
    dialogType: 'REVIEW_DELTA',
  },
  {
    id: 'ACT-03',
    title: 'Resolve East Depot stock shortage',
    dealReference: 'FUL-803 (Q-1045)',
    customerName: 'Zenith Industries',
    category: 'DELIVERY_RISK',
    severity: 'CRITICAL',
    summary: '8 workstations backordered at East Depot; customer deployment deadline in 5 days.',
    whyItMatters: 'Potential SLA breach penalty and client escalation for 30-unit hardware refresh.',
    actionLabel: 'Resolve Stock Shortage',
    dialogType: 'RESOLVE_STOCK',
  },
];

export const SEEDED_HEALTH_TIMELINE: HealthTimelineEvent[] = [
  {
    id: 'HTL-01',
    timestamp: '2026-09-05T09:15:00Z',
    quotationId: 'Q-1052',
    customerName: 'Delta Solutions',
    eventType: 'POLICY_ESCALATION',
    severity: 'CRITICAL',
    headline: 'Discount Anomaly Escalation Triggered',
    ruleTriggered: 'ANOMALY RULE #AD-14',
    details: 'Requested discount (22%) is +14 points above typical 8% median and exceeds 10% category cap. Escalated to Finance Controller.',
    recommendedNextStep: 'Enforce 10% policy ceiling or require CFO sign-off.',
  },
  {
    id: 'HTL-02',
    timestamp: '2026-09-04T16:30:00Z',
    quotationId: 'FUL-803',
    customerName: 'Zenith Industries',
    eventType: 'INVENTORY_SHORTAGE',
    severity: 'CRITICAL',
    headline: 'Backorder Deficit Flagged at East Depot',
    ruleTriggered: 'FULFILLMENT DEFICIT RULE #FD-03',
    details: '8 units of Laptop Pro 14 unavailable at East Depot. Projected delivery slippage: 6 days.',
    recommendedNextStep: 'Authorize emergency warehouse transfer from West Logistics Hub.',
  },
  {
    id: 'HTL-03',
    timestamp: '2026-09-03T14:00:00Z',
    quotationId: 'Q-1028',
    customerName: 'Zenith Industries',
    eventType: 'VELOCITY_STALLED',
    severity: 'HIGH',
    headline: 'Deal Stalled Alert: 9 Days Without Engagement',
    ruleTriggered: 'VELOCITY BENCHMARK #VB-09',
    details: 'Zenith procurement team inactive for 9 business days. Average enterprise closing window is 4 days.',
    recommendedNextStep: 'Dispatch automated commercial nudge with refreshed 14-day price lock guarantee.',
  },
  {
    id: 'HTL-04',
    timestamp: '2026-09-02T10:35:00Z',
    quotationId: 'Q-1042',
    customerName: 'Acme Corporation',
    eventType: 'ANOMALY_DETECTED',
    severity: 'HIGH',
    headline: 'Services Category Ceiling Breach Flagged',
    ruleTriggered: 'GOVERNANCE RULE #GR-02',
    details: 'Onsite Setup discount (18%) violates Services limit (10%). Customer Gold Tier does not bypass approval rules.',
    recommendedNextStep: 'Awaiting formal Finance Controller sign-off in Commercial Approval Center.',
  },
  {
    id: 'HTL-05',
    timestamp: '2026-08-28T15:00:00Z',
    quotationId: 'Q-1039',
    customerName: 'Beta Technologies',
    eventType: 'TERMS_OFFERED',
    severity: 'INFO',
    headline: 'Clean Margin Policy Pass — Approved',
    ruleTriggered: 'POLICY ENGINE CHECK #PE-01',
    details: 'All discount lines within Silver Tier and Hardware category limits (8% - 10%). Auto-approved.',
    recommendedNextStep: 'Ready for client acceptance and fulfillment routing.',
  },
];
