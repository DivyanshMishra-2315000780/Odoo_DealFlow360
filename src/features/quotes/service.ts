import { v4 as uuid } from 'uuid';
import { determineApprovalChain } from '@/engines/approval.engine';
import { calculateLineAmounts, calculateQuoteTotals } from '@/engines/pricing.engine';
import { calculateRisk } from '@/engines/risk.engine';
import { evaluateQuotationDiscounts } from '@/engines/discount.engine';
import { generateRecommendations } from '@/engines/recommendation.engine';
import { recordAudit } from '@/features/audit/service';
import { requireAuth, requirePermission } from '@/lib/auth/rbac';
import { AuthorizationError, BusinessError } from '@/lib/errors';
import { closeQuoteRequest, findQuoteRequest, markQuoteRequestQuoted } from '@/features/quote-requests/repository';
import {
  closeNegotiation, createApprovalChain, createNegotiation, createOrderForQuote, findCustomer, findDefaultPriceList,
  findOpenNegotiation, findPricedProducts, findProductsByIds, findQuote, findQuoteDetails, insertQuote, insertQuoteLines,
  insertRecommendations, listActiveApprovalRules, listActiveDiscountRules, listInventoryForProducts, listQuoteLines,
  listQuotesFor, listRecommendations, listUpsellRulesFor, saveQuoteVersion, setQuoteStatus, updateQuote, updateQuoteLine,
} from './repository';
import { createQuoteInput, negotiationInput, negotiationReviewInput, updateQuoteInput, type QuoteStatus } from './types';

function mustExist<T>(value: T | null, message = 'Quote not found'): T {
  if (!value) throw new BusinessError(message, 'NOT_FOUND', 404);
  return value;
}

async function audit(user: Awaited<ReturnType<typeof requireAuth>>, id: string, action: string, previousValue?: unknown, newValue?: unknown) {
  await recordAudit({ actorId: user.userId, actorRole: user.role, entity: 'Quotation', entityId: id, action, previousValue, newValue });
}

function assertVisible(user: Awaited<ReturnType<typeof requireAuth>>, quote: { customerId: string; salesExecId: string }) {
  if (user.role === 'CUSTOMER' && quote.customerId !== user.customerId) throw new AuthorizationError();
  if (user.role === 'SALES_EXECUTIVE' && quote.salesExecId !== user.userId) throw new AuthorizationError();
}

export async function listQuotes() {
  const user = await requireAuth();
  const rows=await listQuotesFor(user.role === 'CUSTOMER' ? user.customerId ?? '' : user.userId,user.role);
  const visible=rows.filter(q=>user.role!=='CUSTOMER'||['SENT','UNDER_NEGOTIATION','PENDING_APPROVAL','FULFILLMENT','BILLING','COMPLETED'].includes(q.status));
  const details=await Promise.all(visible.map(q=>getQuote(q.id).catch(error=>{if(error instanceof AuthorizationError)return null;throw error;})));
  return details.filter(Boolean);
}

export async function getQuote(id: string) {
  const user = await requireAuth();
  const quote = mustExist(await findQuoteDetails(id));
  assertVisible(user, quote);
  if (user.role !== 'CUSTOMER') return quote;
  if (!['SENT','UNDER_NEGOTIATION','FULFILLMENT','BILLING','COMPLETED'].includes(quote.status) && !(quote.reapprovalRequired)) throw new AuthorizationError('Quotation is not yet shared with the customer');
  const {totalCost,totalProfit,marginPercentage,riskReasons,riskScore,riskLevel,auditTrail,lines,negotiation,...safe}=quote;
  void totalCost;void totalProfit;void marginPercentage;void riskReasons;void riskScore;void riskLevel;void auditTrail;
  return {...safe,negotiation:negotiation?{customerNotes:negotiation.customerNotes,changes:negotiation.changes}:null,lines:lines.map(line=>({id:line.id,productId:line.productId,productName:line.productName,categoryName:line.categoryName,quantity:line.quantity,unitPrice:line.unitPrice,discountPercentage:line.discountPercentage,netAmount:line.netAmount,isRecurring:line.isRecurring}))};
}

export async function createQuote(input: unknown) {
  const user = await requirePermission('QUOTE_CREATE');
  if (user.role !== 'SALES_EXECUTIVE') throw new AuthorizationError('A sales executive must create the quotation');
  const parsed = createQuoteInput.parse(input);
  const quoteRequest = parsed.quoteRequestId ? await findQuoteRequest(parsed.quoteRequestId) : null;
  if (parsed.quoteRequestId && !quoteRequest) throw new BusinessError('Quote request not found', 'NOT_FOUND', 404);
  if (quoteRequest && quoteRequest.status !== 'ASSIGNED') throw new BusinessError('Quote request must be assigned before quotation creation', 'INVALID_STATE', 409);
  if (quoteRequest && user.role === 'SALES_EXECUTIVE' && quoteRequest.assignedSalesExecId !== user.userId) throw new AuthorizationError();
  const customerId = quoteRequest?.customerId ?? parsed.customerId;
  if (!customerId) throw new BusinessError('Customer is required', 'VALIDATION_ERROR', 400);
  const defaultPriceList = parsed.priceListId ? null : await findDefaultPriceList();
  const priceListId = parsed.priceListId ?? defaultPriceList?.id;
  if (!priceListId) throw new BusinessError('An active price list is required', 'PRICE_LIST_REQUIRED', 400);
  const customer = await findCustomer(customerId);
  if (!customer) throw new BusinessError('Customer not found', 'NOT_FOUND', 404);
  const pricedProducts = await findPricedProducts(priceListId, parsed.lines.map((line) => line.productId));
  const priceByProduct = new Map(pricedProducts.map((record) => [record.product.id, record]));
  if (priceByProduct.size !== new Set(parsed.lines.map((line) => line.productId)).size) {
    throw new BusinessError('One or more products are not available on the selected price list', 'PRICE_NOT_FOUND', 400);
  }
  const id = uuid();
  const date = new Date();
  const calculatedLines = parsed.lines.map((input) => {
    const priced = priceByProduct.get(input.productId)!;
    if (priced.product.isRecurring && !priced.product.subscriptionPlanId) {
      throw new BusinessError(`Recurring product ${priced.product.name} has no subscription plan`, 'SUBSCRIPTION_PLAN_REQUIRED', 400);
    }
    const amounts = calculateLineAmounts(input.quantity, priced.price.unitPrice, priced.product.baseCost, input.discountPercentage);
    return {
      id: uuid(), quotationId: id, productId: input.productId, quantity: input.quantity,
      unitPrice: priced.price.unitPrice, unitCost: priced.product.baseCost,
      discountPercentage: String(input.discountPercentage), discountAmount: amounts.discountAmount.toString(),
      grossAmount: amounts.grossAmount.toString(), netAmount: amounts.netAmount.toString(),
      lineCost: amounts.lineCost.toString(), lineProfit: amounts.lineProfit.toString(),
      lineMarginPercentage: amounts.lineMarginPercentage.toString(), isRecurring: priced.product.isRecurring,
      subscriptionPlanId: priced.product.subscriptionPlanId, categoryId: priced.product.categoryId,
    };
  });
  const discountResult = evaluateQuotationDiscounts(
    { salesExecRole: user.role }, calculatedLines, await listActiveDiscountRules(), customer.tier,
  );
  const discountByLine = new Map(discountResult.lineResults.map((result) => [result.lineId, result]));
  const storedLines = calculatedLines.map(({ categoryId, ...line }) => {
    void categoryId;
    const discount = discountByLine.get(line.id);
    return {
      ...line, discountStatus: discount?.status as 'COMPLIANT' | 'EXCEEDED',
      excessDiscountPct: discount?.excessDiscount.toString() ?? '0',
    };
  });
  const totals = calculateQuoteTotals(storedLines);
  const risk = calculateRisk({ customerTier: customer.tier }, discountResult, totals.marginPercentage, totals.netSubtotal);
  const quote = await insertQuote({
    id, quoteNumber: `QT-${date.toISOString().slice(0, 10).replaceAll('-', '')}-${id.slice(0, 8).toUpperCase()}`,
    quoteRequestId: quoteRequest?.id, customerId, salesExecId: user.userId, priceListId,
    currency: (parsed.currency ?? defaultPriceList?.currency ?? 'USD').toUpperCase(),
    validityDate: parsed.validityDate ?? new Date(date.getTime() + 30 * 86400000), paymentTerms: parsed.paymentTerms,
    subtotal: totals.subtotal.toString(), totalDiscount: totals.totalDiscount.toString(),
    totalAmount: totals.netSubtotal.toString(), totalCost: totals.totalCost.toString(), totalProfit: totals.totalProfit.toString(),
    marginPercentage: totals.marginPercentage.toString(), riskScore: Math.round(risk.riskScore),
    riskLevel: risk.riskLevel as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL', riskReasons: risk.riskReasons,
  });
  await insertQuoteLines(storedLines);
  const upsellRules = await listUpsellRulesFor(storedLines.map((line) => line.productId));
  const targetIds = [...new Set(upsellRules.map((rule) => rule.targetProductId))];
  const [targetProducts, targetInventory] = targetIds.length
    ? await Promise.all([findProductsByIds(targetIds), listInventoryForProducts(targetIds)])
    : [[], []];
  const targetById = new Map(targetProducts.map((product) => [product.id, product]));
  const availableByProduct = new Map<string, number>();
  for (const item of targetInventory) {
    availableByProduct.set(item.productId, (availableByProduct.get(item.productId) ?? 0) + item.quantityAvailable - item.quantityReserved);
  }
  const recommendations = generateRecommendations(storedLines, upsellRules.flatMap((rule) => {
    const product = targetById.get(rule.targetProductId);
    return product ? [{
      ...rule, targetProductName: product.name, type: rule.type as 'UPSELL' | 'CROSS_SELL',
      reason: rule.reason ?? undefined,
    }] : [];
  }), targetIds.map((productId) => ({ productId, availableQty: availableByProduct.get(productId) ?? 0 })));
  await insertRecommendations(recommendations.map((recommendation) => ({
    id: uuid(), quotationId: id, productId: recommendation.productId, reason: recommendation.reason,
    score: recommendation.score, marginDelta: recommendation.marginDelta.toString(), revenueDelta: recommendation.revenueDelta.toString(),
  })));
  if (quoteRequest) await markQuoteRequestQuoted(quoteRequest.id);
  await audit(user, id, 'CREATE_QUOTE', null, quote);
  return findQuoteDetails(id);
}

export async function editQuote(id:string,input:unknown){
  const user=await requirePermission('QUOTE_EDIT');
  const current=mustExist(await findQuoteDetails(id));assertVisible(user,current);
  if(!['DRAFT','REVISION_REQUIRED','REJECTED'].includes(current.status))throw new BusinessError('Only a draft or returned quote may be revised','INVALID_STATE',409);
  const values=updateQuoteInput.parse(input);
  await saveQuoteVersion(id,current.version,current,'Sales revision',user.userId);
  if(values.lines){
    if(new Set(values.lines.map(l=>l.productId)).size!==values.lines.length)throw new BusinessError('Combine duplicate products into one line','INVALID_LINES',400);
    if(current.lines.some(l=>!values.lines!.some(v=>v.productId===l.productId)))throw new BusinessError('Existing lines must be retained for the negotiation audit trail','INVALID_LINES',400);
    const priced=await findPricedProducts(current.priceListId,values.lines.map(l=>l.productId));
    const calculated=values.lines.map(input=>{
      const match=priced.find(p=>p.product.id===input.productId);if(!match)throw new BusinessError('Product is not on this price list','PRICE_NOT_FOUND',400);
      const old=current.lines.find(l=>l.productId===input.productId);
      const amounts=calculateLineAmounts(input.quantity,match.price.unitPrice,match.product.baseCost,input.discountPercentage);
      return {id:old?.id??uuid(),quotationId:id,productId:input.productId,quantity:input.quantity,unitPrice:match.price.unitPrice,unitCost:match.product.baseCost,
        discountPercentage:String(input.discountPercentage),discountAmount:amounts.discountAmount.toString(),grossAmount:amounts.grossAmount.toString(),netAmount:amounts.netAmount.toString(),lineCost:amounts.lineCost.toString(),lineProfit:amounts.lineProfit.toString(),lineMarginPercentage:amounts.lineMarginPercentage.toString(),isRecurring:match.product.isRecurring,subscriptionPlanId:match.product.subscriptionPlanId,categoryId:match.product.categoryId};
    });
    const discounts=evaluateQuotationDiscounts({salesExecRole:'SALES_EXECUTIVE'},calculated,await listActiveDiscountRules(),current.customer!.tier);
    for(const {categoryId,...line} of calculated){void categoryId;const result=discounts.lineResults.find(r=>r.lineId===line.id)!;const stored={...line,discountStatus:result.status as 'COMPLIANT'|'EXCEEDED',excessDiscountPct:result.excessDiscount.toString()};if(current.lines.some(l=>l.id===line.id))await updateQuoteLine(line.id,stored);else await insertQuoteLines([stored]);}
    const totals=calculateQuoteTotals(calculated);const risk=calculateRisk({customerTier:current.customer!.tier},discounts,totals.marginPercentage,totals.netSubtotal);
    await updateQuote(id,{subtotal:totals.subtotal.toString(),totalDiscount:totals.totalDiscount.toString(),totalAmount:totals.netSubtotal.toString(),totalCost:totals.totalCost.toString(),totalProfit:totals.totalProfit.toString(),marginPercentage:totals.marginPercentage.toString(),riskScore:Math.round(risk.riskScore),riskLevel:risk.riskLevel as typeof current.riskLevel,riskReasons:risk.riskReasons});
  }
  await updateQuote(id,{validityDate:values.validityDate,paymentTerms:values.paymentTerms,version:current.version+1,status:'DRAFT'});
  await audit(user,id,'REVISE_QUOTE',current,{version:current.version+1});return findQuoteDetails(id);
}

async function transitionQuote(id: string, allowed: QuoteStatus[], target: QuoteStatus, action: string, permission?: string) {
  const user = permission ? await requirePermission(permission) : await requireAuth();
  const current = mustExist(await findQuote(id));
  assertVisible(user, current);
  if (!allowed.includes(current.status)) throw new BusinessError(`Cannot transition ${current.status} to ${target}`, 'INVALID_STATE', 409);
  const updated = mustExist(await setQuoteStatus(id, target));
  await audit(user, id, action, { status: current.status }, { status: target });
  return updated;
}

export const sendQuote = (id: string) => transitionQuote(id, ['APPROVED'], 'SENT', 'SEND_QUOTE', 'QUOTE_SEND');
export async function confirmQuote(id: string) {
  const user = await requirePermission('QUOTE_CONFIRM');
  const quote = mustExist(await findQuote(id));
  assertVisible(user, quote);
  if (quote.status !== 'SENT') throw new BusinessError('Only a reviewed SENT quote can be accepted', 'INVALID_STATE', 409);
  if (quote.validityDate < new Date()) throw new BusinessError('Quotation has expired', 'QUOTE_EXPIRED', 409);
  const result = await createOrderForQuote(quote);
  await setQuoteStatus(id, 'FULFILLMENT');
  if (quote.quoteRequestId) await closeQuoteRequest(quote.quoteRequestId);
  await audit(user, id, 'ACCEPT_QUOTE', { status: quote.status }, { status: 'FULFILLMENT', orderId: result.order.id });
  return result;
}

export async function submitQuote(id: string) {
  const user = await requirePermission('QUOTE_EDIT');
  const quote = mustExist(await findQuote(id));
  assertVisible(user, quote);
  if (!['DRAFT','REVISION_REQUIRED','REJECTED'].includes(quote.status)) throw new BusinessError('Only draft or revised quotes can be submitted', 'INVALID_STATE', 409);
  const rules = await listActiveApprovalRules();
  const chain = determineApprovalChain(quote, { riskScore: quote.riskScore }, rules);
  const target: QuoteStatus = chain.required ? 'PENDING_APPROVAL' : 'APPROVED';
  if (chain.required) await createApprovalChain(id, chain.steps);
  const updated = mustExist(await setQuoteStatus(id, target));
  await audit(user, id, 'SUBMIT_QUOTE', { status: quote.status }, { status: target });
  return updated;
}

export async function startNegotiation(id: string, input: unknown) {
  const user = await requirePermission('NEGOTIATION_CREATE');
  const quote = mustExist(await findQuote(id));
  assertVisible(user, quote);
  if (quote.status !== 'SENT') throw new BusinessError('Only SENT quotes can be negotiated', 'INVALID_STATE', 409);
  const values = negotiationInput.parse(input);
  const existing = await findOpenNegotiation(id);
  if (existing) throw new BusinessError('An active negotiation already exists', 'NEGOTIATION_EXISTS', 409);
  const lines = await listQuoteLines(id);
  const byId = new Map(lines.map((line) => [line.id, line]));
  const changes = values.changes.map((change) => {
    const line = byId.get(change.quotationLineId);
    if (!line) throw new BusinessError('Quotation line not found', 'NOT_FOUND', 404);
    if (change.fieldChanged === 'quantity' && (!Number.isInteger(change.requestedValue) || change.requestedValue <= 0)) {
      throw new BusinessError('Quantity must be a positive integer', 'INVALID_CHANGE', 400);
    }
    if (change.fieldChanged === 'discountPercentage' && change.requestedValue > 100) throw new BusinessError('Discount cannot exceed 100%', 'INVALID_CHANGE',400);
    if (change.requestedValue < 0) throw new BusinessError('Requested value cannot be negative', 'INVALID_CHANGE', 400);
    return {
      quotationLineId: line.id, fieldChanged: change.fieldChanged,
      originalValue: String(line[change.fieldChanged]), requestedValue: String(change.requestedValue),
    };
  });
  const negotiation = await createNegotiation({
    quotationId: id, customerId: quote.customerId, submittedById: user.userId,
    requestType: values.requestType, customerNotes: values.customerNotes, changes,
  });
  await setQuoteStatus(id, 'UNDER_NEGOTIATION');
  await audit(user, id, values.requestType, null, changes);
  return negotiation;
}

export async function reviewNegotiation(id: string, input: unknown) {
  const user = await requirePermission('NEGOTIATION_REVIEW');
  const values = negotiationReviewInput.parse(input);
  const quote = mustExist(await findQuoteDetails(id));
  assertVisible(user, quote);
  if (quote.status !== 'UNDER_NEGOTIATION') throw new BusinessError('Quotation is not under negotiation','INVALID_STATE',409);
  const negotiation = await findOpenNegotiation(id);
  if (!negotiation) throw new BusinessError('Active negotiation not found', 'NOT_FOUND', 404);
  if (values.action === 'REJECT') {
    await closeNegotiation(negotiation.id, 'REJECTED');
    const updated = await setQuoteStatus(id, 'SENT');
    await audit(user, id, 'REJECT_NEGOTIATION', negotiation, values);
    return { quote: updated, negotiationStatus: 'REJECTED' };
  }
  await saveQuoteVersion(id, quote.version, quote, values.comment ?? 'Negotiation accepted', user.userId);
  const lineMap = new Map(quote.lines.map((line) => [line.id, line]));
  for (const change of negotiation.changes) {
    const line = lineMap.get(change.quotationLineId);
    if (!line) throw new BusinessError('Quotation line not found', 'NOT_FOUND', 404);
    const quantity = change.fieldChanged === 'quantity' ? Number(change.requestedValue) : line.quantity;
    const unitPrice = change.fieldChanged === 'unitPrice' ? change.requestedValue : line.unitPrice;
    const discountPercentage = change.fieldChanged === 'discountPercentage' ? change.requestedValue : line.discountPercentage;
    const amounts = calculateLineAmounts(quantity, unitPrice, line.unitCost, discountPercentage);
    const updatedLine = await updateQuoteLine(line.id, {
      quantity, unitPrice: String(unitPrice), discountPercentage: String(discountPercentage),
      grossAmount: amounts.grossAmount.toString(), discountAmount: amounts.discountAmount.toString(),
      netAmount: amounts.netAmount.toString(), lineCost: amounts.lineCost.toString(),
      lineProfit: amounts.lineProfit.toString(), lineMarginPercentage: amounts.lineMarginPercentage.toString(),
    });
    lineMap.set(line.id, {...line,...updatedLine});
  }
  const totals = calculateQuoteTotals([...lineMap.values()]);
  const productRows=await findProductsByIds([...lineMap.values()].map(line=>line.productId));
  const discounts=evaluateQuotationDiscounts({salesExecRole:'SALES_EXECUTIVE'},[...lineMap.values()].map(line=>({...line,categoryId:productRows.find(p=>p.id===line.productId)?.categoryId})),await listActiveDiscountRules(),quote.customer!.tier);
  for(const result of discounts.lineResults)await updateQuoteLine(result.lineId!,{discountStatus:result.status as 'COMPLIANT'|'EXCEEDED',excessDiscountPct:result.excessDiscount.toString()});
  const risk = calculateRisk({customerTier:quote.customer!.tier}, discounts, totals.marginPercentage, totals.netSubtotal);
  const nextVersion = quote.version + 1;
  const reevaluated = mustExist(await updateQuote(id, {
    version: nextVersion, subtotal: totals.subtotal.toString(), totalDiscount: totals.totalDiscount.toString(),
    totalAmount: totals.netSubtotal.toString(), totalCost: totals.totalCost.toString(), totalProfit: totals.totalProfit.toString(),
    marginPercentage: totals.marginPercentage.toString(), riskScore: Math.round(risk.riskScore),
    riskLevel: risk.riskLevel as typeof quote.riskLevel, riskReasons: risk.riskReasons,
  }));
  const chain = determineApprovalChain(reevaluated, risk, await listActiveApprovalRules());
  const target: QuoteStatus = chain.required ? 'PENDING_APPROVAL' : 'SENT';
  if (chain.required) await createApprovalChain(id, chain.steps, 'NEGOTIATION');
  await setQuoteStatus(id, target);
  await closeNegotiation(negotiation.id, 'APPROVED');
  await audit(user, id, 'APPROVE_NEGOTIATION', quote, { ...reevaluated, status: target });
  return { quote: { ...reevaluated, status: target }, approvalRequired: chain.required };
}

export async function getQuoteRisk(id: string) {
  const quote = mustExist(await findQuote(id));
  const user = await requirePermission('VIEW_RISK');
  assertVisible(user, quote);
  return { riskScore: quote.riskScore, riskLevel: quote.riskLevel, riskReasons: quote.riskReasons };
}

export async function getRecommendations(id: string) {
  const user = await requireAuth();
  const quote = mustExist(await findQuote(id));
  assertVisible(user, quote);
  if(user.role==='CUSTOMER') throw new AuthorizationError();
  return listRecommendations(id);
}

export async function simulateQuote(id: string) {
  const user = await requireAuth();
  const quote = mustExist(await findQuote(id));
  assertVisible(user, quote);
  const totals = calculateQuoteTotals(await listQuoteLines(id));
  return Object.fromEntries(Object.entries(totals).map(([key, value]) => [key, value.toString()]));
}
