'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FileText,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  ArrowLeft,
  ShieldAlert,
  Sparkles,
  Info,
  Calendar,
  Building2,
  DollarSign,
  Layers,
} from 'lucide-react';
import { useCustomers, useProducts, useSaveQuotation } from '@/hooks/use-dealflow';
import { useToast } from '@/components/providers/query-provider';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { evaluateLineItem, evaluateQuotationRisk, calculateEffectiveDiscountLimit } from '@/lib/discount-engine';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { TierBadge } from '@/components/ui/tier-badge';
import { RiskBadge } from '@/components/ui/status-badge';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Customer, Product, Quotation, QuotationLineItem, PRICE_LISTS, PriceList } from '@/types/dealflow';

interface DraftLineState {
  tempId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
}

export default function NewQuotationPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { data: customers = [] } = useCustomers();
  const { data: products = [] } = useProducts();
  const saveMutation = useSaveQuotation();

  // Form Fields
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [title, setTitle] = useState<string>('Enterprise System Deployment Proposal');
  const [priceList, setPriceList] = useState<PriceList>('Standard Commercial 2026');
  const [deliveryDate, setDeliveryDate] = useState<string>('2026-10-25');
  const [notes, setNotes] = useState<string>('Standard 30-day procurement payment terms. Priority hardware staging included.');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Default initial customer
  React.useEffect(() => {
    if (customers.length > 0 && !selectedCustomerId) {
      setSelectedCustomerId(customers[0].id);
    }
  }, [customers, selectedCustomerId]);

  const selectedCustomer = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId) || customers[0];
  }, [customers, selectedCustomerId]);

  // Multi-line Items State
  const [lines, setLines] = useState<DraftLineState[]>([
    {
      tempId: 'line-1',
      productId: 'PROD-101', // Laptop Pro 14
      quantity: 10,
      unitPrice: 1499,
      discountPercent: 12,
    },
    {
      tempId: 'line-2',
      productId: 'PROD-103', // Onsite Setup (Services)
      quantity: 2,
      unitPrice: 750,
      discountPercent: 10,
    },
  ]);

  // Ensure default lines have valid product IDs once products load
  React.useEffect(() => {
    if (products.length > 0 && lines.length === 0) {
      setLines([
        {
          tempId: `line-${Date.now()}`,
          productId: products[0].id,
          quantity: 5,
          unitPrice: products[0].basePrice,
          discountPercent: 5,
        },
      ]);
    }
  }, [products, lines.length]);

  // Line modification helpers
  const handleAddLine = () => {
    const fallbackProd = products[0];
    if (!fallbackProd) return;
    setLines((prev) => [
      ...prev,
      {
        tempId: `line-${Date.now()}-${Math.random()}`,
        productId: fallbackProd.id,
        quantity: 1,
        unitPrice: fallbackProd.basePrice,
        discountPercent: 0,
      },
    ]);
  };

  const handleRemoveLine = (tempId: string) => {
    if (lines.length <= 1) {
      toast({
        title: 'Minimum Line Required',
        description: 'A quotation must contain at least one product or service line item.',
        type: 'warning',
      });
      return;
    }
    setLines((prev) => prev.filter((l) => l.tempId !== tempId));
  };

  const handleProductChange = (tempId: string, newProductId: string) => {
    const prod = products.find((p) => p.id === newProductId);
    if (!prod) return;
    setLines((prev) =>
      prev.map((l) =>
        l.tempId === tempId
          ? {
              ...l,
              productId: prod.id,
              unitPrice: prod.basePrice,
            }
          : l
      )
    );
  };

  const handleLineFieldChange = (
    tempId: string,
    field: 'quantity' | 'unitPrice' | 'discountPercent',
    value: number
  ) => {
    setLines((prev) =>
      prev.map((l) => (l.tempId === tempId ? { ...l, [field]: Math.max(0, value) } : l))
    );
  };

  // Real-Time Evaluation Engine for all lines
  const evaluatedLines: QuotationLineItem[] = useMemo(() => {
    if (!selectedCustomer) return [];

    return lines.map((l, idx) => {
      const prod = products.find((p) => p.id === l.productId) || products[0];
      const category = prod ? prod.category : 'Hardware';
      const productName = prod ? prod.name : 'Selected Product';

      return evaluateLineItem(
        {
          id: `LI-NEW-${idx + 1}`,
          productId: l.productId,
          productName,
          category,
          unitPrice: l.unitPrice,
          quantity: l.quantity,
          discountPercent: l.discountPercent,
        },
        selectedCustomer.tier
      );
    });
  }, [lines, products, selectedCustomer]);

  // Aggregate Deal Evaluation
  const dealEvaluation = useMemo(() => {
    if (!selectedCustomer) {
      return {
        subtotal: 0,
        totalDiscountAmount: 0,
        grandTotal: 0,
        dealHealthScore: 100,
        riskDiagnosis: {
          level: 'LOW' as const,
          whatHappened: '',
          whyItMatters: '',
          nextAction: '',
          requiresFinanceApproval: false,
          requiresExecutiveApproval: false,
        },
      };
    }
    return evaluateQuotationRisk(evaluatedLines, selectedCustomer.tier);
  }, [evaluatedLines, selectedCustomer]);

  // Submission handler
  const handleSave = async (intent: 'DRAFT' | 'SUBMIT') => {
    if (!selectedCustomer) return;
    if (!title.trim()) {
      toast({
        title: 'Title Required',
        description: 'Please provide a descriptive title for this commercial quotation.',
        type: 'error',
      });
      return;
    }

    setIsSubmitting(true);
    const newQuoteId = `Q-${Math.floor(1000 + Math.random() * 9000)}`;

    let status: Quotation['status'] = 'DRAFT';
    if (intent === 'SUBMIT') {
      if (dealEvaluation.riskDiagnosis.requiresFinanceApproval) {
        status = 'PENDING_FINANCE_APPROVAL';
      } else {
        status = 'APPROVED';
      }
    }

    const timestamp = new Date().toISOString();

    const auditTrail = [
      {
        id: `AUD-${Date.now()}-1`,
        timestamp,
        actor: 'Marcus Vance (Account Executive)',
        action: intent === 'DRAFT' ? 'Quotation Drafted' : 'Quotation Submitted',
        details:
          intent === 'DRAFT'
            ? `Draft created for ${selectedCustomer.name}.`
            : status === 'PENDING_FINANCE_APPROVAL'
            ? `Submitted for Finance approval due to policy exception (${dealEvaluation.riskDiagnosis.whatHappened}).`
            : `Submitted and cleared automatically within ${selectedCustomer.tier} margin bounds.`,
        badgeType: intent === 'DRAFT' ? 'default' : status === 'APPROVED' ? 'success' : 'warning',
      } as const,
    ];

    const quotationPayload: Quotation = {
      id: newQuoteId,
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      customerTier: selectedCustomer.tier,
      title: title.trim(),
      items: evaluatedLines,
      subtotal: dealEvaluation.subtotal,
      totalDiscountAmount: dealEvaluation.totalDiscountAmount,
      grandTotal: dealEvaluation.grandTotal,
      status,
      riskDiagnosis: dealEvaluation.riskDiagnosis,
      auditTrail: [...auditTrail],
      createdAt: timestamp,
      updatedAt: timestamp,
      dealHealthScore: dealEvaluation.dealHealthScore,
      notes: notes.trim(),
      owner: 'Marcus Vance',
      priceList,
      deliveryDate,
    };

    try {
      await saveMutation.mutateAsync(quotationPayload);
      toast({
        title: intent === 'DRAFT' ? 'Draft Saved' : 'Quotation Submitted',
        description: `Quotation ${newQuoteId} has been successfully recorded in the deal pipeline.`,
        type: 'success',
      });
      router.push(`/quotes/${newQuoteId}`);
    } catch {
      toast({
        title: 'Submission Failed',
        description: 'Unable to save quotation to storage.',
        type: 'error',
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link href="/quotes">
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs text-slate-600">
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Quotes
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <FileText className="w-6 h-6 text-teal-600" />
              New Commercial Quotation
            </h1>
            <p className="text-xs text-slate-500">
              Configure multi-line hardware & services proposals with live policy limit checks.
            </p>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            onClick={() => handleSave('DRAFT')}
            disabled={isSubmitting}
            className="text-xs font-semibold"
          >
            Save as Draft
          </Button>
          <Button
            onClick={() => handleSave('SUBMIT')}
            disabled={isSubmitting}
            className="bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-enterprise gap-1.5"
          >
            <Sparkles className="w-4 h-4" />
            Submit for Approval
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Details & Multi-line Editor */}
        <div className="lg:col-span-8 space-y-6">
          {/* Account Context & Price List Card */}
          <Card className="bg-white border-slate-200 shadow-enterprise">
            <CardHeader className="p-4 border-b border-slate-100 flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-teal-600" />
                Commercial Account & Pricing Schedule
              </CardTitle>
              {selectedCustomer && <TierBadge tier={selectedCustomer.tier} />}
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Customer Picker */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Select Customer Account *
                  </label>
                  <Select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="text-xs"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.tier} Tier — {c.industry})
                      </option>
                    ))}
                  </Select>
                  {selectedCustomer && (
                    <p className="text-[11px] text-slate-500 mt-1">
                      Account Manager: <strong className="text-slate-700">{selectedCustomer.accountManager}</strong> • Credit Limit: <strong className="text-slate-700">{formatCurrency(selectedCustomer.creditLimit)}</strong>
                    </p>
                  )}
                </div>

                {/* Price List Picker */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Price List & Commercial Schedule *
                  </label>
                  <Select
                    value={priceList}
                    onChange={(e) => setPriceList(e.target.value as PriceList)}
                    className="text-xs"
                  >
                    {PRICE_LISTS.map((pl) => (
                      <option key={pl} value={pl}>
                        {pl}
                      </option>
                    ))}
                  </Select>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Standard Enterprise base pricing schedule with category discount boundaries.
                  </p>
                </div>
              </div>

              {/* Quotation Title & Delivery Target */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Quotation Title / Scope of Work *
                  </label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Workstation Fleet Refresh & Onsite Deployment"
                    className="text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Target Delivery SLA
                  </label>
                  <Input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quotation Lines Card */}
          <Card className="bg-white border-slate-200 shadow-enterprise">
            <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-teal-600" />
                  Quotation Line Items & Policy Limits
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Effective discount limit is strictly calculated as <code className="bg-slate-100 px-1 py-0.5 rounded text-teal-800 font-mono">min(Customer Tier Limit, Category Limit)</code>.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddLine}
                className="h-8 text-xs font-semibold gap-1 text-teal-700 border-teal-200 hover:bg-teal-50"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Line
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 text-[11px] font-semibold text-slate-600">
                      <TableHead className="w-56">Product / Service</TableHead>
                      <TableHead className="w-20 text-center">Qty</TableHead>
                      <TableHead className="w-28 text-right">Unit Price</TableHead>
                      <TableHead className="w-44">Discount % & Allowed</TableHead>
                      <TableHead className="w-32 text-center">Policy Status</TableHead>
                      <TableHead className="w-28 text-right">Line Net</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lines.map((line, idx) => {
                      const evalLine = evaluatedLines[idx];
                      const selectedProd = products.find((p) => p.id === line.productId);
                      const isViolation = evalLine?.isViolation;
                      const excess = evalLine?.excessPercent || 0;

                      return (
                        <TableRow
                          key={line.tempId}
                          className={`hover:bg-slate-50/70 border-b border-slate-100 ${
                            isViolation ? 'bg-amber-50/40' : ''
                          }`}
                        >
                          {/* Product Selection */}
                          <TableCell className="align-top py-3">
                            <Select
                              value={line.productId}
                              onChange={(e) => handleProductChange(line.tempId, e.target.value)}
                              className="text-xs h-8"
                            >
                              {products.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name} ({p.category})
                                </option>
                              ))}
                            </Select>
                            <span className="text-[10px] text-slate-400 block mt-1">
                              Category: {selectedProd?.category || 'Hardware'} • SKU: {selectedProd?.sku}
                            </span>
                          </TableCell>

                          {/* Quantity */}
                          <TableCell className="align-top py-3">
                            <Input
                              type="number"
                              min="1"
                              value={line.quantity}
                              onChange={(e) =>
                                handleLineFieldChange(
                                  line.tempId,
                                  'quantity',
                                  parseInt(e.target.value) || 1
                                )
                              }
                              className="text-xs h-8 text-center"
                            />
                          </TableCell>

                          {/* Unit Price */}
                          <TableCell className="align-top py-3 text-right">
                            <Input
                              type="number"
                              min="0"
                              value={line.unitPrice}
                              onChange={(e) =>
                                handleLineFieldChange(
                                  line.tempId,
                                  'unitPrice',
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="text-xs h-8 text-right font-mono"
                            />
                            <span className="text-[10px] text-slate-400 block mt-1">
                              List: {formatCurrency(selectedProd?.basePrice || 0)}
                            </span>
                          </TableCell>

                          {/* Discount % Slider & Input */}
                          <TableCell className="align-top py-3">
                            <div className="flex items-center gap-2">
                              <input
                                type="range"
                                min="0"
                                max="30"
                                step="1"
                                value={line.discountPercent}
                                onChange={(e) =>
                                  handleLineFieldChange(
                                    line.tempId,
                                    'discountPercent',
                                    parseInt(e.target.value) || 0
                                  )
                                }
                                className="w-24 accent-teal-600 h-1.5 bg-slate-200 rounded cursor-pointer"
                              />
                              <div className="flex items-center gap-1">
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={line.discountPercent}
                                  onChange={(e) =>
                                    handleLineFieldChange(
                                      line.tempId,
                                      'discountPercent',
                                      parseInt(e.target.value) || 0
                                    )
                                  }
                                  className="text-xs h-8 w-14 text-right font-mono"
                                />
                                <span className="text-xs font-semibold text-slate-500">%</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-[10px] mt-1 font-medium">
                              <span className="text-slate-500">
                                Allowed Limit: <strong>{evalLine?.effectiveLimit}%</strong>
                              </span>
                              {isViolation ? (
                                <span className="text-rose-700 font-bold">
                                  +{excess}% over limit
                                </span>
                              ) : (
                                <span className="text-emerald-700">Within Policy</span>
                              )}
                            </div>
                          </TableCell>

                          {/* Policy Status Badge */}
                          <TableCell className="align-top py-3 text-center">
                            {isViolation ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                                <AlertTriangle className="w-3 h-3 text-rose-600" />
                                OVER LIMIT
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                WITHIN POLICY
                              </span>
                            )}
                          </TableCell>

                          {/* Line Total */}
                          <TableCell className="align-top py-3 text-right">
                            <p className="font-bold text-slate-900 font-mono text-xs">
                              {formatCurrency(evalLine?.lineTotal || 0)}
                            </p>
                            {line.discountPercent > 0 && (
                              <p className="text-[10px] text-amber-700">
                                -{formatPercent(line.discountPercent)}
                              </p>
                            )}
                          </TableCell>

                          {/* Remove button */}
                          <TableCell className="align-top py-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveLine(line.tempId)}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded transition cursor-pointer"
                              title="Delete line"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Notes & Special Terms */}
              <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Procurement Notes & Commercial Exceptions
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="State any volume justification or delivery concessions..."
                  className="w-full text-xs p-2 rounded-md border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Financial Summary & Governance Risk Radar */}
        <div className="lg:col-span-4 space-y-6">
          {/* Financial Breakdown Card */}
          <Card className="bg-white border-slate-200 shadow-enterprise">
            <CardHeader className="p-4 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center justify-between">
                <span>Financial Summary</span>
                <span className="text-xs font-normal text-slate-500">USD Net</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between text-xs text-slate-600">
                <span>Gross List Subtotal:</span>
                <span className="font-semibold text-slate-900 font-mono">
                  {formatCurrency(dealEvaluation.subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-xs text-amber-700">
                <span>Total Discount Given:</span>
                <span className="font-semibold font-mono">
                  -{formatCurrency(dealEvaluation.totalDiscountAmount)}
                </span>
              </div>
              <div className="h-px bg-slate-200 my-2" />
              <div className="flex justify-between items-baseline">
                <span className="text-sm font-bold text-slate-900">Net Grand Total:</span>
                <span className="text-xl font-extrabold text-teal-700 font-mono">
                  {formatCurrency(dealEvaluation.grandTotal)}
                </span>
              </div>

              {/* Deal Health Meter */}
              <div className="pt-3 border-t border-slate-100">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-semibold text-slate-700">Deal Health Score:</span>
                  <span className="font-bold text-slate-900 font-mono">
                    {dealEvaluation.dealHealthScore} / 100
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      dealEvaluation.dealHealthScore >= 80
                        ? 'bg-emerald-500'
                        : dealEvaluation.dealHealthScore >= 50
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${dealEvaluation.dealHealthScore}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Governance Risk Diagnosis Card */}
          <Card className={`border shadow-enterprise ${
            dealEvaluation.riskDiagnosis.level === 'LOW'
              ? 'bg-emerald-50/40 border-emerald-200'
              : dealEvaluation.riskDiagnosis.level === 'MEDIUM'
              ? 'bg-amber-50/40 border-amber-200'
              : 'bg-rose-50/40 border-rose-300'
          }`}>
            <CardHeader className="p-4 pb-2 border-b border-slate-200/60 flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                <ShieldAlert className="w-4 h-4 text-slate-700" />
                Policy Risk Radar
              </CardTitle>
              <RiskBadge level={dealEvaluation.riskDiagnosis.level} />
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              <div>
                <p className="font-bold text-slate-900">1. What happened?</p>
                <p className="text-slate-600 mt-0.5">{dealEvaluation.riskDiagnosis.whatHappened}</p>
              </div>

              <div>
                <p className="font-bold text-slate-900">2. Why does it matter?</p>
                <p className="text-slate-600 mt-0.5">{dealEvaluation.riskDiagnosis.whyItMatters}</p>
              </div>

              <div>
                <p className="font-bold text-slate-900">3. What should you do next?</p>
                <p className="text-slate-700 font-medium mt-0.5">
                  {dealEvaluation.riskDiagnosis.nextAction}
                </p>
              </div>

              {dealEvaluation.riskDiagnosis.requiresFinanceApproval && (
                <div className="p-2.5 rounded-md bg-rose-100 border border-rose-200 text-rose-900 text-[11px] font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>
                    Submitting this quotation will automatically lock it and escalate to Finance Controller for manual exception approval.
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Policy Guidelines Reminder */}
          <div className="bg-slate-100 p-3.5 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <Info className="w-3.5 h-3.5 text-teal-600" />
              <span>Deal Governance Rules</span>
            </div>
            <p className="text-[11px]">
              • Hardware category discount ceiling: <strong>15% max</strong>.
            </p>
            <p className="text-[11px]">
              • Services category discount ceiling: <strong>10% max</strong>.
            </p>
            <p className="text-[11px]">
              • Gold Tier accounts do <strong>NOT</strong> bypass Services 10% ceiling.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
