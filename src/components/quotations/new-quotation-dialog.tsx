'use client';

import React, { useState, useId } from 'react';
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { TierBadge } from '@/components/ui/tier-badge';
import { useCustomers, useProducts, useSaveQuotation } from '@/hooks/use-dealflow';
import { useToast } from '@/components/providers/query-provider';
import { formatCurrency, formatPercent } from '@/lib/utils';
import {
  Customer,
  Product,
  Quotation,
  QuotationLineItem,
} from '@/types/dealflow';
import {
  calculateEffectiveDiscountLimit,
  evaluateLineItem,
  evaluateQuotationRisk,
} from '@/lib/discount-engine';
import { AlertCircle, CheckCircle2, Plus, Sparkles } from 'lucide-react';

interface NewQuotationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (quotation: Quotation) => void;
}

export function NewQuotationDialog({
  open,
  onOpenChange,
  onSuccess,
}: NewQuotationDialogProps) {
  const { data: customers = [] } = useCustomers();
  const { data: products = [] } = useProducts();
  const saveQuotation = useSaveQuotation();
  const { toast } = useToast();

  const [customerId, setCustomerId] = useState<string>('CUST-001');
  const [title, setTitle] = useState<string>('Workstation Provisioning & Service Bundle');
  const [selectedProductId, setSelectedProductId] = useState<string>('PROD-101');
  const [quantity, setQuantity] = useState<number>(10);
  const [discountPercent, setDiscountPercent] = useState<number>(12);

  const selectedCustomer = customers.find((c) => c.id === customerId) || customers[0];
  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];

  const currentTier = selectedCustomer?.tier || 'Gold';
  const effectiveLimit = selectedProduct
    ? calculateEffectiveDiscountLimit(currentTier, selectedProduct.category)
    : 10;
  const isViolation = discountPercent > effectiveLimit;
  const excess = isViolation ? discountPercent - effectiveLimit : 0;

  const rawSubtotal = (selectedProduct?.basePrice || 0) * quantity;
  const discountAmount = rawSubtotal * (discountPercent / 100);
  const netTotal = rawSubtotal - discountAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !selectedProduct) return;

    const randomNum = Math.floor(1050 + Math.random() * 40);
    const quotationId = `Q-${randomNum}`;

    const evaluatedItem = evaluateLineItem(
      {
        id: `LI-${quotationId}-1`,
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        category: selectedProduct.category,
        unitPrice: selectedProduct.basePrice,
        quantity,
        discountPercent,
      },
      currentTier
    );

    const evaluation = evaluateQuotationRisk([evaluatedItem], currentTier);
    const status: Quotation['status'] = evaluatedItem.isViolation
      ? 'PENDING_APPROVAL'
      : 'APPROVED';

    const newQuotation: Quotation = {
      id: quotationId,
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      customerTier: selectedCustomer.tier,
      title: title.trim() || `${selectedCustomer.name} Equipment Bundle`,
      items: [evaluatedItem],
      subtotal: evaluation.subtotal,
      totalDiscountAmount: evaluation.totalDiscountAmount,
      grandTotal: evaluation.grandTotal,
      status,
      riskDiagnosis: evaluation.riskDiagnosis,
      auditTrail: [
        {
          id: `AUD-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actor: 'Marcus Vance (Account Executive)',
          action: 'Quotation Created',
          details: `Drafted ${quotationId} with ${discountPercent}% discount on ${selectedProduct.name}.`,
          badgeType: evaluatedItem.isViolation ? 'warning' : 'success',
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dealHealthScore: evaluation.dealHealthScore,
    };

    try {
      const saved = await saveQuotation.mutateAsync(newQuotation);
      toast({
        title: `Quotation ${saved.id} Created`,
        description: evaluatedItem.isViolation
          ? `Discount violates ${selectedProduct.category} limit (+${excess}% excess). Escalated to Finance Approval.`
          : `Quotation submitted for manager and finance approval.`,
        type: evaluatedItem.isViolation ? 'warning' : 'success',
      });
      onOpenChange(false);
      onSuccess?.(saved);
    } catch {
      toast({
        title: 'Failed to create quotation',
        type: 'error',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-md bg-teal-50 text-teal-700">
              <Sparkles className="w-4 h-4" />
            </span>
            <DialogTitle>Draft New Quotation</DialogTitle>
          </div>
          <DialogDescription>
            Configure deal line items with real-time customer tier discount limit enforcement.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-xs py-1">
          {/* Customer Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Customer Account
              </label>
              <Select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.tier} Tier)
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Account Tier Policy
              </label>
              <div className="h-9 px-3 flex items-center justify-between rounded-md border border-slate-200 bg-slate-50">
                {selectedCustomer && (
                  <>
                    <TierBadge tier={selectedCustomer.tier} size="sm" />
                    <span className="font-mono text-slate-500 font-semibold text-[11px]">
                      {selectedCustomer.tier === 'Gold'
                        ? '15% Max'
                        : selectedCustomer.tier === 'Silver'
                        ? '10% Max'
                        : '5% Max'}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Deal Title */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Quotation Title / Project Name
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Workstation Fleet Refresh"
              required
            />
          </div>

          {/* Line Item Configuration */}
          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/60 space-y-3">
            <div className="font-semibold text-slate-800 text-[11px] uppercase tracking-wider flex justify-between items-center">
              <span>Primary Line Item</span>
              <span className="text-teal-700 font-medium font-mono text-[10px]">
                {selectedProduct?.category}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] text-slate-600 mb-1">Product</label>
                <Select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {formatCurrency(p.basePrice)} ({p.category})
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-600 mb-1">Quantity</label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                  required
                />
              </div>
            </div>

            {/* Discount Percentage with Policy Feedback */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[11px] text-slate-700 font-semibold">
                  Requested Discount %
                </label>
                <span className="font-mono font-bold text-teal-700 text-xs">
                  {discountPercent}% (Allowed: {effectiveLimit}%)
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="25"
                step="1"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
              />
            </div>

            {/* Instant Policy Feedback Callout */}
            {isViolation ? (
              <div className="p-2.5 rounded-md bg-rose-50 border border-rose-200 text-rose-900 text-[11px] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Discount Limit Exceeded (+{excess}% excess)</p>
                  <p className="text-rose-700 text-[10px] mt-0.5">
                    {selectedProduct?.category} limit is {effectiveLimit}% for {currentTier} accounts.
                    Requires Finance Controller approval before confirmation.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-2 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Complies with {currentTier} tier policy (≤ {effectiveLimit}%). Routine auto-approval.</span>
              </div>
            )}

            {/* Line Item Math Preview */}
            <div className="pt-2 border-t border-slate-200/80 flex justify-between text-slate-600 text-[11px]">
              <span>Gross: {formatCurrency(rawSubtotal)}</span>
              <span>Discount: -{formatCurrency(discountAmount)}</span>
              <span className="font-bold text-slate-900 font-mono">
                Net: {formatCurrency(netTotal)}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="default"
            size="sm"
            loading={saveQuotation.isPending}
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Create Quotation
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
