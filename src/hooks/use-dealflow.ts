import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dealflowApi } from '@/services/api';
import {
  Quotation,
  QuotationStatus,
  InvoiceStatus,
  FulfillmentOrder,
  CommercialSubscription,
  SubscriptionStatus,
} from '@/types/dealflow';

export const QUERY_KEYS = {
  CUSTOMERS: ['customers'],
  CUSTOMER: (id: string) => ['customers', id],
  PRODUCTS: ['products'],
  QUOTATIONS: ['quotations'],
  QUOTATION: (id: string) => ['quotations', id],
  INVOICES: ['invoices'],
  INVOICE: (id: string) => ['invoices', id],
  FULFILLMENT: ['fulfillment'],
  SUBSCRIPTIONS: ['subscriptions'],
  SUBSCRIPTION: (id: string) => ['subscriptions', id],
};

export function useCustomers() {
  return useQuery({
    queryKey: QUERY_KEYS.CUSTOMERS,
    queryFn: () => dealflowApi.getCustomers(),
  });
}

export function useProducts() {
  return useQuery({
    queryKey: QUERY_KEYS.PRODUCTS,
    queryFn: () => dealflowApi.getProducts(),
  });
}

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

export function useFulfillmentOrders() {
  return useQuery({
    queryKey: QUERY_KEYS.FULFILLMENT,
    queryFn: () => dealflowApi.getFulfillmentOrders(),
  });
}

export function useFulfillmentOrder(id: string) {
  return useQuery({
    queryKey: ['fulfillment', id],
    queryFn: () => dealflowApi.getFulfillmentOrderById(id),
    enabled: Boolean(id),
  });
}

export function useWarehouseStock() {
  return useQuery({
    queryKey: ['warehouseStock'],
    queryFn: () => dealflowApi.getWarehouseStock(),
  });
}

export function useUpdateFulfillmentOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (order: FulfillmentOrder) => dealflowApi.updateFulfillmentOrder(order),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FULFILLMENT });
      queryClient.setQueryData(['fulfillment', updated.id], updated);
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
      queryClient.setQueryData(['fulfillment', updated.id], updated);
    },
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
    }: {
      id: string;
      status: QuotationStatus;
      note?: string;
      actor?: string;
    }) => dealflowApi.updateQuotationStatus(id, status, note, actor),
    onSuccess: (updatedQuotation) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.QUOTATIONS });
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
      queryClient.setQueryData(QUERY_KEYS.QUOTATION(saved.id), saved);
    },
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
      queryClient.setQueryData(QUERY_KEYS.INVOICE(updated.id), updated);
    },
  });
}

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

export function useResetDemoData() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => dealflowApi.resetDemoData(),
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });
}
