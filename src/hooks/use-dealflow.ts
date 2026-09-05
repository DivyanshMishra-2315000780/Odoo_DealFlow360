import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dealflowApi } from '@/services/api';
import {
  Quotation,
  QuotationLineItem,
  QuotationStatus,
  InvoiceStatus,
  FulfillmentOrder,
  CommercialSubscription,
  SubscriptionStatus,
  Product,
  Customer,
  CustomerTier,
  DiscountPolicyConfig,
  RuleAuditLogEntry,
  CustomerRequirement,
  RequirementItem,
  RequirementPriority,
  RequirementStatus,
} from '@/types/dealflow';

// ──────────────────────────────────────────────────────────────────────
// Query Keys — centralized for cache management
// ──────────────────────────────────────────────────────────────────────

export const QUERY_KEYS = {
  CUSTOMERS: ['customers'],
  CUSTOMER: (id: string) => ['customers', id],
  PRODUCTS: ['products'],
  PRODUCT: (id: string) => ['products', id],
  QUOTATIONS: ['quotations'],
  QUOTATION: (id: string) => ['quotations', id],
  INVOICES: ['invoices'],
  INVOICE: (id: string) => ['invoices', id],
  FULFILLMENT: ['fulfillment'],
  FULFILLMENT_ORDER: (id: string) => ['fulfillment', id],
  WAREHOUSE_STOCK: ['warehouseStock'],
  SUBSCRIPTIONS: ['subscriptions'],
  SUBSCRIPTION: (id: string) => ['subscriptions', id],
  DISCOUNT_RULES: ['discount-rules'],
  DISCOUNT_AUDIT: ['discount-audit'],
  REQUIREMENTS: ['requirements'],
  REQUIREMENT: (id: string) => ['requirements', id],
  DASHBOARD: ['dashboard'],
  DEAL_HEALTH: ['deal-health'],
  DEAL_HEALTH_QUOTE: (id: string) => ['deal-health', id],
  APPROVALS: ['approvals'],
  APPROVAL: (id: string) => ['approvals', id],
  NOTIFICATIONS: ['notifications'],
};

// ──────────────────────────────────────────────────────────────────────
// Customer Queries
// ──────────────────────────────────────────────────────────────────────

export function useCustomers() {
  return useQuery({
    queryKey: QUERY_KEYS.CUSTOMERS,
    queryFn: () => dealflowApi.getCustomers(),
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.CUSTOMER(id),
    queryFn: () => dealflowApi.getCustomerById(id),
    enabled: Boolean(id),
  });
}

// ──────────────────────────────────────────────────────────────────────
// Product Queries & Mutations
// ──────────────────────────────────────────────────────────────────────

export function useProducts() {
  return useQuery({
    queryKey: QUERY_KEYS.PRODUCTS,
    queryFn: () => dealflowApi.getProducts(),
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.PRODUCT(id),
    queryFn: () => dealflowApi.getProductById(id),
    enabled: Boolean(id),
  });
}

export function useSaveProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (product: Product) => dealflowApi.saveProduct(product),
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRODUCTS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRODUCT(saved.id) });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => dealflowApi.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRODUCTS });
    },
  });
}

// ──────────────────────────────────────────────────────────────────────
// Quotation Queries & Mutations
// ──────────────────────────────────────────────────────────────────────

export function useQuotations() {
  return useQuery({
    queryKey: QUERY_KEYS.QUOTATIONS,
    queryFn: () => dealflowApi.getQuotations(),
  });
}

export function useQuotation(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.QUOTATION(id),
    queryFn: () => dealflowApi.getQuotationById(id),
    enabled: Boolean(id),
  });
}

export function useUpdateQuotationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
      note,
      actor,
      meta,
    }: {
      id: string;
      status: QuotationStatus;
      note?: string;
      actor?: string;
      meta?: {
        salesManagerApproved?: boolean;
        financeApproved?: boolean;
        reapprovalRequired?: boolean;
        reapprovalReason?: string;
        deliveryDate?: string;
        dealHealthScore?: number;
        items?: QuotationLineItem[];
      };
    }) => dealflowApi.updateQuotationStatus(id, status, note, actor, meta),
    onSuccess: (updatedQuotation) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.QUOTATIONS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.INVOICES });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FULFILLMENT });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.APPROVALS });
      queryClient.setQueryData(QUERY_KEYS.QUOTATION(updatedQuotation.id), updatedQuotation);
    },
  });
}

export function useSaveQuotation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (quotation: Quotation) => dealflowApi.saveQuotation(quotation),
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.QUOTATIONS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.REQUIREMENTS });
      queryClient.setQueryData(QUERY_KEYS.QUOTATION(saved.id), saved);
    },
  });
}

// ──────────────────────────────────────────────────────────────────────
// Invoice Queries & Mutations
// ──────────────────────────────────────────────────────────────────────

export function useInvoices() {
  return useQuery({
    queryKey: QUERY_KEYS.INVOICES,
    queryFn: () => dealflowApi.getInvoices(),
  });
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.INVOICE(id),
    queryFn: () => dealflowApi.getInvoiceById(id),
    enabled: Boolean(id),
  });
}

export function useUpdateInvoiceStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
      paymentMethod,
    }: {
      id: string;
      status: InvoiceStatus;
      paymentMethod?: string;
    }) => dealflowApi.updateInvoiceStatus(id, status, paymentMethod),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.INVOICES });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.QUOTATIONS });
      queryClient.setQueryData(QUERY_KEYS.INVOICE(updated.id), updated);
    },
  });
}

export function useRecordInvoicePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      amount,
      paymentMethod,
      paymentReference,
    }: {
      id: string;
      amount: number;
      paymentMethod: string;
      paymentReference: string;
    }) => dealflowApi.recordInvoicePayment(id, amount, paymentMethod, paymentReference),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.INVOICES });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.QUOTATIONS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DEAL_HEALTH });
      queryClient.setQueryData(QUERY_KEYS.INVOICE(updated.id), updated);
    },
  });
}

// ──────────────────────────────────────────────────────────────────────
// Fulfillment & Warehouse Queries
// ──────────────────────────────────────────────────────────────────────

export function useFulfillmentOrders() {
  return useQuery({
    queryKey: QUERY_KEYS.FULFILLMENT,
    queryFn: () => dealflowApi.getFulfillmentOrders(),
  });
}

export function useFulfillmentOrder(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.FULFILLMENT_ORDER(id),
    queryFn: () => dealflowApi.getFulfillmentOrderById(id),
    enabled: Boolean(id),
  });
}

export function useWarehouseStock() {
  return useQuery({
    queryKey: QUERY_KEYS.WAREHOUSE_STOCK,
    queryFn: () => dealflowApi.getWarehouseStock(),
  });
}

export function useUpdateFulfillmentOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (order: FulfillmentOrder) => dealflowApi.updateFulfillmentOrder(order),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FULFILLMENT });
      queryClient.setQueryData(QUERY_KEYS.FULFILLMENT_ORDER(updated.id), updated);
    },
  });
}

export function useCreateShipment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      carrier,
      trackingNumber,
    }: {
      id: string;
      carrier: string;
      trackingNumber: string;
    }) => dealflowApi.createShipment(id, carrier, trackingNumber),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FULFILLMENT });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.INVOICES });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.QUOTATIONS });
      queryClient.setQueryData(QUERY_KEYS.FULFILLMENT_ORDER(updated.id), updated);
    },
  });
}

// ──────────────────────────────────────────────────────────────────────
// Subscription Queries & Mutations
// ──────────────────────────────────────────────────────────────────────

export function useSubscriptions() {
  return useQuery({
    queryKey: QUERY_KEYS.SUBSCRIPTIONS,
    queryFn: () => dealflowApi.getSubscriptions(),
  });
}

export function useSubscription(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.SUBSCRIPTION(id),
    queryFn: () => dealflowApi.getSubscriptionById(id),
    enabled: Boolean(id),
  });
}

export function useUpdateSubscriptionStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: SubscriptionStatus }) =>
      dealflowApi.updateSubscriptionStatus(id, status),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SUBSCRIPTIONS });
      queryClient.setQueryData(QUERY_KEYS.SUBSCRIPTION(updated.id), updated);
    },
  });
}

export function useModifySubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sub: CommercialSubscription) => dealflowApi.modifySubscription(sub),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SUBSCRIPTIONS });
      queryClient.setQueryData(QUERY_KEYS.SUBSCRIPTION(updated.id), updated);
    },
  });
}

// ──────────────────────────────────────────────────────────────────────
// Discount Rules Queries & Mutations
// ──────────────────────────────────────────────────────────────────────

export function useDiscountRules() {
  return useQuery({
    queryKey: QUERY_KEYS.DISCOUNT_RULES,
    queryFn: () => dealflowApi.getDiscountRules(),
  });
}

export function useDiscountAuditLogs() {
  return useQuery({
    queryKey: QUERY_KEYS.DISCOUNT_AUDIT,
    queryFn: () => dealflowApi.getDiscountAuditLogs(),
  });
}

export function useUpdateDiscountRules() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      config,
      changedBy,
      reason,
    }: {
      config: DiscountPolicyConfig;
      changedBy?: string;
      reason?: string;
    }) => dealflowApi.updateDiscountRules(config, changedBy, reason),
    onSuccess: (result) => {
      queryClient.setQueryData(QUERY_KEYS.DISCOUNT_RULES, result.config);
      queryClient.setQueryData(QUERY_KEYS.DISCOUNT_AUDIT, result.audits);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.QUOTATIONS });
    },
  });
}

// ──────────────────────────────────────────────────────────────────────
// Customer Requirements Queries & Mutations
// ──────────────────────────────────────────────────────────────────────

export function useRequirements(customerId?: string) {
  return useQuery({
    queryKey: customerId ? ['requirements', { customerId }] : QUERY_KEYS.REQUIREMENTS,
    queryFn: () => dealflowApi.getRequirements(customerId),
  });
}

export function useRequirement(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.REQUIREMENT(id),
    queryFn: () => dealflowApi.getRequirementById(id),
    enabled: Boolean(id),
  });
}

export function useCreateRequirement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      customerId: string;
      customerName: string;
      customerTier: CustomerTier;
      title: string;
      description: string;
      items: RequirementItem[];
      priority: RequirementPriority;
      expectedDeliveryDays: number;
      additionalNotes?: string;
      assignedSalesExecutive?: string;
    }) => dealflowApi.createRequirement(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.REQUIREMENTS });
    },
  });
}

export function useUpdateRequirementStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
      quotationId,
    }: {
      id: string;
      status: RequirementStatus;
      quotationId?: string;
    }) => dealflowApi.updateRequirementStatus(id, status, quotationId),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.REQUIREMENTS });
      queryClient.setQueryData(QUERY_KEYS.REQUIREMENT(updated.id), updated);
    },
  });
}

// ──────────────────────────────────────────────────────────────────────
// System Utility
// ──────────────────────────────────────────────────────────────────────

export function useResetDemoData() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => dealflowApi.resetDemoData(),
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });
}
