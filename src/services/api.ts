/**
 * DealFlow360 API Service Layer
 * Clean abstraction: All TanStack Query hooks call these methods.
 * Now connected to real Next.js API routes backed by Neon PostgreSQL.
 */
import {
  Customer,
  CustomerTier,
  Product,
  Quotation,
  QuotationLineItem,
  Invoice,
  FulfillmentOrder,
  QuotationStatus,
  InvoiceStatus,
  WarehouseStock,
  CommercialSubscription,
  SubscriptionStatus,
  DiscountPolicyConfig,
  RuleAuditLogEntry,
  CustomerRequirement,
  RequirementItem,
  RequirementPriority,
  RequirementStatus,
  EmployeeUser,
} from '@/types/dealflow';
import {
  adaptCustomer,
  adaptCustomers,
  adaptProduct,
  adaptProducts,
  adaptQuotation,
  adaptQuotations,
  adaptInvoice,
  adaptInvoices,
  adaptFulfillmentOrder,
  adaptFulfillmentOrders,
  adaptWarehouseStocks,
  adaptSubscription,
  adaptSubscriptions,
  adaptRequirement,
  adaptRequirements,
  adaptDiscountRules,
  adaptRuleAuditLogs,
} from './api-adapter';

// ──────────────────────────────────────────────────────────────────────
// HTTP Client Utility
// ──────────────────────────────────────────────────────────────────────

import { request as apiFetch } from '@/lib/http/client';
export const dealflowApi = {
  // ─── Customers ───────────────────────────────────────────────────
  async getCustomers(): Promise<Customer[]> { return adaptCustomers(await apiFetch('/api/customers')); },

  async getCustomerById(id: string): Promise<Customer | null> { return (await this.getCustomers()).find(c => c.id === id) ?? null; },

  // ─── Products ────────────────────────────────────────────────────
  async getProducts(): Promise<Product[]> { return adaptProducts(await apiFetch('/api/catalog')); },

  async getProductById(id: string): Promise<Product | null> { return (await this.getProducts()).find(p => p.id === id) ?? null; },

  async saveProduct(product: Product): Promise<Product> {
    return (async () => {
        // Determine if this is a create or update
        const method = product.id ? 'PATCH' : 'POST';
        const url = product.id
          ? `/api/admin/products/${product.id}`
          : '/api/admin/products';
        return adaptProduct(
          await apiFetch(url, {
            method,
            body: JSON.stringify({
              sku: product.sku,
              name: product.name,
              description: product.description,
              baseCost: String(product.basePrice),
              isRecurring: product.isSubscription ?? false,
            }),
          })
        );
      })();
  },

  async deleteProduct(id: string): Promise<boolean> {
    return (async () => {
        await apiFetch(`/api/admin/products/${id}`, { method: 'DELETE' });
        return true;
      })();
  },

  // ─── Quotations ──────────────────────────────────────────────────
  async getQuotations(): Promise<Quotation[]> {
    return (async () => adaptQuotations(await apiFetch('/api/quotes')))();
  },

  async getQuotationById(id: string): Promise<Quotation | null> {
    return (async () => {
        try {
          return adaptQuotation(await apiFetch(`/api/quotes/${id}`));
        } catch (e) {
          throw e;
        }
      })();
  },

  async saveQuotation(quotation: Quotation): Promise<Quotation> {
  if (quotation.requirementId) {
    const requirement = await this.getRequirementById(quotation.requirementId);
    if (requirement?.status === 'NEW') await this.updateRequirementStatus(quotation.requirementId, 'IN_REVIEW');
  }
  const body = { customerId: quotation.customerId, quoteRequestId: quotation.requirementId, title: quotation.title, paymentTerms: quotation.notes,
    lines: quotation.items.map(item => ({productId: item.productId, quantity: item.quantity, discountPercentage: item.discountPercent})) };
  const saved = adaptQuotation(await apiFetch('/api/quotes', {method:'POST',body:JSON.stringify(body)}));
  if (quotation.status !== 'DRAFT') return this.updateQuotationStatus(saved.id, 'PENDING_APPROVAL');
  return saved;
},

  async updateQuotationStatus(id: string, status: QuotationStatus, note?: string, _actor?: string, meta?: {salesManagerApproved?: boolean; financeApproved?: boolean; reapprovalRequired?: boolean; reapprovalReason?: string; deliveryDate?: string; dealHealthScore?: number; items?: QuotationLineItem[]}): Promise<Quotation> {
  const current = await this.getQuotationById(id);
  if (!current) throw new Error('Quotation not found');
  if (['APPROVED', 'REJECTED', 'REVISION_REQUIRED'].includes(status) && current.status === 'PENDING_APPROVAL') {
    const approvals = await apiFetch<Array<{step:{id:string};request:{quotationId:string}}>>('/api/approvals');
    const approval = approvals.find(a => a.request.quotationId === id);
    if (!approval) throw new Error('No pending approval is assigned to your role. Earlier approval steps must finish first.');
    const action = status === 'APPROVED' ? 'approve' : status === 'REJECTED' ? 'reject' : 'revision';
    await apiFetch('/api/approvals/'+approval.step.id+'/'+action, {method:'POST', body:JSON.stringify({comment:note})});
  } else if (status === 'UNDER_NEGOTIATION') {
    const changes = (meta?.items ?? []).flatMap(item => {
      const prior = current.items.find(line => line.id === item.id);
      if (!prior) return [];
      return ([['discountPercentage', item.discountPercent, prior.discountPercent], ['quantity',item.quantity,prior.quantity]] as const)
        .filter(([,value,old])=>value!==old).map(([fieldChanged, requestedValue])=>({quotationLineId:item.id,fieldChanged,requestedValue}));
    });
    if (!changes.length) throw new Error('Change a line quantity or discount before submitting your counter-offer.');
    await apiFetch('/api/quotes/'+id+'/negotiate',{method:'POST',body:JSON.stringify({requestType:'COUNTER_OFFER',customerNotes:note??'Counter offer',changes})});
  } else {
    const action = {PENDING_APPROVAL:'submit',SENT:'send',CONFIRMED:'confirm'}[status as 'PENDING_APPROVAL'|'SENT'|'CONFIRMED'];
    if (!action) throw new Error('Use the appropriate workflow action to change this quotation.');
    await apiFetch('/api/quotes/'+id+'/'+action,{method:'POST'});
  }
  return adaptQuotation(await apiFetch('/api/quotes/'+id));
},

  // ─── Invoices ────────────────────────────────────────────────────
  async getInvoices(): Promise<Invoice[]> {
    return (async () => adaptInvoices(await apiFetch('/api/invoices')))();
  },

  async getInvoiceById(id: string): Promise<Invoice | null> {
    return (async () => {
        try {
          return adaptInvoice(await apiFetch(`/api/invoices/${id}`));
        } catch (e) {
          throw e;
        }
      })();
  },

  async updateInvoiceStatus(_id:string,_status:InvoiceStatus,_paymentMethod?:string):Promise<Invoice> {throw new Error('Record a verified payment with an amount and reference to settle this invoice.');},

  async recordInvoicePayment(
    id: string,
    amount: number,
    paymentMethod: string,
    paymentReference: string
  ): Promise<Invoice> {
    return (async () => {
        await apiFetch('/api/payments', {
          method: 'POST',
          body: JSON.stringify({
            invoiceId: id,
            amount,
            method: paymentMethod,
            reference: paymentReference,
          }),
        });
        return adaptInvoice(await apiFetch(`/api/invoices/${id}`));
      })();
  },

  // ─── Fulfillment & Warehouse Logistics ───────────────────────────
  async getFulfillmentOrders(): Promise<FulfillmentOrder[]> {
    return (async () => adaptFulfillmentOrders(await apiFetch('/api/fulfillment')))();
  },

  async getFulfillmentOrderById(id: string): Promise<FulfillmentOrder | null> {
    return (async () => {
        try {
          return adaptFulfillmentOrder(await apiFetch(`/api/fulfillment/${id}`));
        } catch (e) {
          throw e;
        }
      })();
  },

  async getWarehouseStock():Promise<WarehouseStock[]> { return adaptWarehouseStocks(await apiFetch('/api/warehouse-stock')); },

  async updateFulfillmentOrder(order:FulfillmentOrder):Promise<FulfillmentOrder> {
  if(order.status==='DELIVERED') await apiFetch('/api/fulfillment/'+order.id,{method:'PATCH',body:JSON.stringify({status:'DELIVERED'})});
  else {
    const recommendation=await apiFetch<{allocations:Array<{productId:string;warehouseId:string;allocatedQty:number}>}>('/api/fulfillment/'+order.id+'/recommend');
    await apiFetch('/api/fulfillment/'+order.id+'/confirm',{method:'POST',body:JSON.stringify({allocations:recommendation.allocations.map(({productId,warehouseId,allocatedQty})=>({productId,warehouseId,allocatedQty}))})});
  }
  return adaptFulfillmentOrder(await apiFetch('/api/fulfillment/'+order.id));
},

  async createShipment(id:string,_carrier:string,_trackingNumber:string):Promise<FulfillmentOrder> {
  await apiFetch('/api/fulfillment/'+id,{method:'PATCH',body:JSON.stringify({status:'SHIPPED'})});
  return adaptFulfillmentOrder(await apiFetch('/api/fulfillment/'+id));
},

  // ─── Subscriptions & Recurring Revenue ───────────────────────────
  async getSubscriptions(): Promise<CommercialSubscription[]> {
    return (async () => adaptSubscriptions(await apiFetch('/api/subscriptions')))();
  },

  async getSubscriptionById(id: string): Promise<CommercialSubscription | null> {
    return (async () => {
        try {
          return adaptSubscription(await apiFetch(`/api/subscriptions/${id}`));
        } catch (e) {
          throw e;
        }
      })();
  },

  async updateSubscriptionStatus(id:string,status:SubscriptionStatus):Promise<CommercialSubscription> {return adaptSubscription(await apiFetch('/api/subscriptions/'+id,{method:'PATCH',body:JSON.stringify({status:status==='CANCELLED'?'CANCELED':status})}));},

  async modifySubscription(sub:CommercialSubscription):Promise<CommercialSubscription> {return adaptSubscription(await apiFetch('/api/subscriptions/'+sub.id,{method:'PATCH',body:JSON.stringify({newQuantity:sub.seatsOrLicenses})}));},

  // ─── Discount Rules & Governance Engine ──────────────────────────
  async getDiscountRules():Promise<DiscountPolicyConfig> {return adaptDiscountRules(await apiFetch('/api/policies'));},

  async getDiscountAuditLogs():Promise<RuleAuditLogEntry[]> {return adaptRuleAuditLogs(await apiFetch('/api/policies/audit'));},

  async updateDiscountRules(config:DiscountPolicyConfig,_changedBy?:string,reason?:string):Promise<{config:DiscountPolicyConfig;audits:RuleAuditLogEntry[]}> {
 await apiFetch('/api/policies',{method:'PUT',body:JSON.stringify({tierLimits:config.tierLimits,categoryLimits:config.categoryLimits,reason})});
 return {config:await this.getDiscountRules(),audits:await this.getDiscountAuditLogs()};
},

  // ─── Customer Requirements ───────────────────────────────────────
  async getRequirements(customerId?: string): Promise<CustomerRequirement[]> {
    return (async () => {
        const url = customerId
          ? `/api/quote-requests?customerId=${customerId}`
          : '/api/quote-requests';
        return adaptRequirements(await apiFetch(url));
      })();
  },

  async getRequirementById(id: string): Promise<CustomerRequirement | null> {
    return (async () => {
        try {
          return adaptRequirement(await apiFetch(`/api/quote-requests/${id}`));
        } catch (e) {
          throw e;
        }
      })();
  },

  async createRequirement(payload: {customerId:string;customerName:string;customerTier:CustomerTier;title:string;description:string;items:RequirementItem[];priority:RequirementPriority;expectedDeliveryDays:number;additionalNotes?:string;assignedSalesExecutive?:string}): Promise<CustomerRequirement> {
  return adaptRequirement(await apiFetch('/api/quote-requests',{method:'POST',body:JSON.stringify({title:payload.title,description:payload.description,
    targetDate:new Date(Date.now()+payload.expectedDeliveryDays*86400000).toISOString(),
    metadata:{priority:payload.priority,expectedDeliveryDays:payload.expectedDeliveryDays,additionalNotes:payload.additionalNotes},
    items:payload.items.map(item=>({description:item.name,quantity:item.quantity,requirements:{category:item.category,notes:item.notes}}))})}));
},

  async updateRequirementStatus(id:string,status:RequirementStatus,_quotationId?:string):Promise<CustomerRequirement> {
  if(status==='IN_REVIEW') await apiFetch('/api/quote-requests/'+id,{method:'PATCH',body:'{}'});
  // Quotation creation and customer acceptance own the later requirement transitions.
  return adaptRequirement(await apiFetch('/api/quote-requests/'+id));
},

  // ─── Employee & User Management ───────────────────────────────
  async getEmployees(): Promise<EmployeeUser[]> {
    const raw = await apiFetch<Array<{
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: 'ADMIN' | 'SALES_MANAGER' | 'SALES_EXECUTIVE' | 'FINANCE_OFFICER' | 'CUSTOMER';
      active: boolean;
      createdAt: string;
      updatedAt?: string;
    }>>('/api/admin/users');
    return (raw ?? []).map(u => ({
      id: u.id,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      role: u.role,
      active: u.active ?? true,
      department: u.role === 'FINANCE_OFFICER' ? 'Finance & Risk' : u.role === 'ADMIN' ? 'System Operations' : u.role === 'SALES_MANAGER' ? 'Commercial Deal Desk' : u.role === 'SALES_EXECUTIVE' ? 'Enterprise Sales' : 'Client Account',
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }));
  },

  async createEmployee(payload: {
    email: string;
    firstName: string;
    lastName: string;
    role: 'ADMIN' | 'SALES_MANAGER' | 'SALES_EXECUTIVE' | 'FINANCE_OFFICER' | 'CUSTOMER';
    password?: string;
    companyName?: string;
  }): Promise<EmployeeUser> {
    const res = await apiFetch<any>('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify({
        email: payload.email,
        firstName: payload.firstName,
        lastName: payload.lastName,
        role: payload.role,
        password: payload.password || 'TemporaryPass123!',
        companyName: payload.companyName || 'DealFlow360 Internal',
        active: true,
      }),
    });
    return {
      id: res.id,
      email: res.email,
      firstName: res.firstName,
      lastName: res.lastName,
      role: res.role,
      active: res.active ?? true,
      department: res.role === 'FINANCE_OFFICER' ? 'Finance & Risk' : res.role === 'ADMIN' ? 'System Operations' : res.role === 'SALES_MANAGER' ? 'Commercial Deal Desk' : 'Enterprise Sales',
      createdAt: res.createdAt,
      updatedAt: res.updatedAt,
    };
  },

  async updateEmployee(id: string, payload: {
    role?: 'ADMIN' | 'SALES_MANAGER' | 'SALES_EXECUTIVE' | 'FINANCE_OFFICER' | 'CUSTOMER';
    firstName?: string;
    lastName?: string;
    active?: boolean;
    password?: string;
  }): Promise<EmployeeUser> {
    const res = await apiFetch<any>(`/api/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return {
      id: res.id,
      email: res.email,
      firstName: res.firstName,
      lastName: res.lastName,
      role: res.role,
      active: res.active ?? true,
      department: res.role === 'FINANCE_OFFICER' ? 'Finance & Risk' : res.role === 'ADMIN' ? 'System Operations' : res.role === 'SALES_MANAGER' ? 'Commercial Deal Desk' : 'Enterprise Sales',
      createdAt: res.createdAt,
      updatedAt: res.updatedAt,
    };
  },

  async removeEmployee(id: string): Promise<boolean> {
    await apiFetch(`/api/admin/users/${id}`, {
      method: 'DELETE',
    });
    return true;
  },

  // ─── System Utility ──────────────────────────────────────────────
  async resetDemoData():Promise<{success:boolean}> {return {success:true};},
};
