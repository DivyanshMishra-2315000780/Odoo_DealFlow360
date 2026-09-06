"use client";

import {
  evaluateQuotationDiscounts,
} from "@/engines/discount.engine";
import {
  calculateLineAmounts,
  calculateQuoteTotals,
} from "@/engines/pricing.engine";
import { calculateRisk } from "@/engines/risk.engine";
import { useQuery } from "@tanstack/react-query";
import { request } from "@/lib/http/client";
import React, { useState, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
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
  Building2,
  Layers,
  TrendingUp,
  Tag,
  X,
  Inbox,
  ExternalLink,
} from "lucide-react";
import {
  useCustomers,
  useProducts,
  useSaveQuotation,
  useRequirement,
} from "@/hooks/use-dealflow";
import { useToast } from "@/components/providers/query-provider";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { TierBadge } from "@/components/ui/tier-badge";
import { RiskBadge } from "@/components/ui/status-badge";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  CustomerRequirement,
  Customer,
  Product,
  Quotation,
  QuotationLineItem,
} from "@/types/dealflow";

interface DraftLineState {
  tempId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
}

interface UpsellSuggestion {
  id: string;
  productId: string;
  title: string;
  tag: string;
  reason: string;
  marginLift: string;
  suggestedQty: number;
}

function getProductCost(prod?: Product): number {
  return prod?.baseCost ?? 0;
}

const UPSELL_SUGGESTIONS: UpsellSuggestion[] = [];

function NewQuotationForm() {
  const params = useSearchParams();
  const requirementId = params.get("requirementId");
  const customers = useCustomers();
  const products = useProducts();
  const requirement = useRequirement(requirementId ?? "");
  if (
    customers.isLoading ||
    products.isLoading ||
    (requirementId && requirement.isLoading)
  )
    return <p className="p-8 text-slate-500">Loading quotation data?</p>;
  const error = customers.error ?? products.error ?? requirement.error;
  if (error)
    return (
      <p role="alert" className="p-8 text-red-700">
        {error.message}
      </p>
    );
  return (
    <QuotationEditor
      key={requirementId ?? "new"}
      customers={customers.data ?? []}
      products={products.data ?? []}
      requirement={requirement.data ?? undefined}
      requirementId={requirementId}
    />
  );
}
function QuotationEditor({
  customers,
  products,
  requirement,
  requirementId,
}: {
  customers: Customer[];
  products: Product[];
  requirement?: CustomerRequirement;
  requirementId: string | null;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const saveMutation = useSaveQuotation();
  const [draftLines, setLines] = useState<DraftLineState[]>(() =>
    requirement?.items?.length
      ? requirement.items.map((item, index) => {
          const product = products.find((p) =>
            p.name.toLowerCase().includes(item.name.toLowerCase()),
          );
          return {
            tempId: "requirement-" + index,
            productId: product?.id ?? "",
            quantity: item.quantity,
            unitPrice: product?.basePrice ?? 0,
            discountPercent: 0,
          };
        })
      : products.length
        ? [
            {
              tempId: "initial",
              productId: products[0].id,
              quantity: 1,
              unitPrice: products[0].basePrice,
              discountPercent: 0,
            },
          ]
        : [],
  );
  // Form Fields
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    () => requirement?.customerId ?? customers[0]?.id ?? "",
  );
  const [title, setTitle] = useState<string>(() =>
    requirement ? `Quotation for ${requirement.title}` : "New quotation",
  );
  const [priceList, setPriceList] = useState<string>("");
  const { data: pricing = [] } = useQuery({
    queryKey: ["pricing"],
    queryFn: () =>
      request<
        Array<{
          id: string;
          name: string;
          currency: string;
          active: boolean;
          items: Array<{ productId: string; unitPrice: string }>;
        }>
      >("/api/pricing"),
  });
  const { data: rules = [] } = useQuery({
    queryKey: ["policies-raw"],
    queryFn: () =>
      request<Parameters<typeof evaluateQuotationDiscounts>[2]>(
        "/api/policies",
      ),
  });
  const [deliveryDate, setDeliveryDate] = useState<string>(() =>
    new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
  );
  const [notes, setNotes] = useState<string>(
    "Standard 30-day procurement payment terms. Priority hardware staging included.",
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const selectedCustomer = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId) || customers[0];
  }, [customers, selectedCustomerId]);

  // Multi-line Items State

  const selectedList =
    pricing.find(
      (list) =>
        list.active && (list.name === priceList || list.id === priceList),
    ) ?? pricing.find((list) => list.active);
  const lines = draftLines.map((line) => ({
    ...line,
    unitPrice: Number(
      selectedList?.items.find((item) => item.productId === line.productId)
        ?.unitPrice ?? line.unitPrice,
    ),
  }));
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
        title: "Minimum Line Required",
        description:
          "A quotation must contain at least one product or service line item.",
        type: "warning",
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
          : l,
      ),
    );
  };

  const handleLineFieldChange = (
    tempId: string,
    field: "quantity" | "unitPrice" | "discountPercent",
    value: number,
  ) => {
    setLines((prev) =>
      prev.map((l) =>
        l.tempId === tempId ? { ...l, [field]: Math.max(0, value) } : l,
      ),
    );
  };

  // The preview shares the pricing, discount and risk engines used by the API.
  const preview = useMemo(() => {
    const priced = lines.map((line) => {
      const product = products.find((p) => p.id === line.productId);
      return {
        id: line.tempId,
        productId: line.productId,
        categoryId: product?.categoryId,
        discountPercentage: line.discountPercent,
        ...calculateLineAmounts(
          line.quantity,
          line.unitPrice,
          product?.baseCost ?? 0,
          line.discountPercent,
        ),
      };
    });
    const tier = selectedCustomer?.tier.toUpperCase() ?? "BRONZE";
    const discount = evaluateQuotationDiscounts(
      { salesExecRole: "SALES_EXECUTIVE" },
      priced.map((line) => ({ ...line, netAmount: line.netAmount.toString() })),
      rules,
      tier,
    );
    const totals = calculateQuoteTotals(priced);
    const risk = calculateRisk(
      { customerTier: tier },
      discount,
      totals.marginPercentage,
      totals.netSubtotal,
    );
    return { priced, discount, totals, risk };
  }, [lines, products, selectedCustomer, rules]);
  const evaluatedLines: QuotationLineItem[] = lines.map((line, index) => {
    const product = products.find((p) => p.id === line.productId);
    const result = preview.discount.lineResults[index];
    return {
      id: line.tempId,
      productId: line.productId,
      productName: product?.name ?? "Select a product",
      category: product?.category ?? "Hardware",
      unitPrice: line.unitPrice,
      quantity: line.quantity,
      discountPercent: line.discountPercent,
      effectiveLimit: result.allowedDiscount.toNumber(),
      isViolation: result.status === "EXCEEDED",
      excessPercent: result.excessDiscount.toNumber(),
      lineTotal: preview.priced[index].netAmount.toNumber(),
    };
  });
  const dealEvaluation = {
    subtotal: preview.totals.subtotal.toNumber(),
    totalDiscountAmount: preview.totals.totalDiscount.toNumber(),
    grandTotal: preview.totals.netSubtotal.toNumber(),
    dealHealthScore: Math.max(0, 100 - preview.risk.riskScore),
    riskDiagnosis: {
      level: preview.risk.riskLevel as Quotation["riskDiagnosis"]["level"],
      whatHappened:
        preview.risk.riskReasons.join(" ") ||
        "Pricing and discounts are within current policy.",
      whyItMatters:
        "Margin, discount exceptions and deal value determine risk.",
      nextAction:
        "Submit for Sales Manager review, followed by Finance Officer approval.",
      requiresFinanceApproval: true,
      requiresExecutiveApproval: false,
    },
  };

  // Upsell state & handlers
  const [dismissedUpsells, setDismissedUpsells] = useState<string[]>([]);

  const handleAddUpsell = (rec: UpsellSuggestion) => {
    const prod = products.find((p) => p.id === rec.productId);
    if (!prod) return;
    setLines((prev) => [
      ...prev,
      {
        tempId: `line-upsell-${Date.now()}`,
        productId: prod.id,
        quantity: rec.suggestedQty,
        unitPrice: prod.basePrice,
        discountPercent: 0,
      },
    ]);
    toast({
      title: "Upsell Attached",
      description: `${rec.title} attached with 0% discount (${rec.marginLift}). Deal gross margin improved.`,
      type: "success",
    });
  };

  const handleDismissUpsell = (id: string) => {
    setDismissedUpsells((prev) => [...prev, id]);
  };

  // Margin calculation across all lines
  const totalCost = useMemo(() => {
    return lines.reduce((sum, l) => {
      const p = products.find((prod) => prod.id === l.productId);
      return sum + getProductCost(p) * l.quantity;
    }, 0);
  }, [lines, products]);

  const dealGrossMargin = useMemo(() => {
    if (dealEvaluation.grandTotal <= 0) return 0;
    const profit = dealEvaluation.grandTotal - totalCost;
    return Math.round((profit / dealEvaluation.grandTotal) * 100);
  }, [dealEvaluation.grandTotal, totalCost]);

  // Submission handler
  const handleSave = async (intent: "DRAFT" | "SUBMIT") => {
    if (!selectedCustomer) return;
    if (!title.trim()) {
      toast({
        title: "Title Required",
        description:
          "Please provide a descriptive title for this commercial quotation.",
        type: "error",
      });
      return;
    }

    if (
      lines.some(
        (line) =>
          !Number.isInteger(line.quantity) ||
          line.quantity < 1 ||
          line.discountPercent > 100 ||
          !selectedList?.items.some(
            (item) => item.productId === line.productId,
          ),
      )
    ) {
      toast({
        title: "Check quotation items",
        description:
          "Every item needs a positive whole quantity, a discount from 0 to 100%, and a price on the selected list.",
        type: "error",
      });
      return;
    }
    setIsSubmitting(true);
    const newQuoteId = `Q-${Math.floor(1000 + Math.random() * 9000)}`;

    const status: Quotation["status"] =
      intent === "DRAFT" ? "DRAFT" : "PENDING_APPROVAL";

    const timestamp = new Date().toISOString();

    const auditTrail = [
      {
        id: `AUD-${Date.now()}-1`,
        timestamp,
        actor: "Marcus Vance (Account Executive)",
        action:
          intent === "DRAFT" ? "Quotation Drafted" : "Quotation Submitted",
        details:
          intent === "DRAFT"
            ? `Draft created for ${selectedCustomer.name}.`
            : status === "PENDING_APPROVAL"
              ? `Submitted for approval due to policy exception (${dealEvaluation.riskDiagnosis.whatHappened}).`
              : `Submitted and cleared automatically within ${selectedCustomer.tier} margin bounds.`,
        badgeType: intent === "DRAFT" ? "default" : "warning",
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
      owner: "Marcus Vance",
      priceList,
      deliveryDate,
      requirementId: requirementId || undefined,
    };

    try {
      const saved = await saveMutation.mutateAsync(quotationPayload);
      toast({
        title: intent === "DRAFT" ? "Draft Saved" : "Quotation Submitted",
        description: `Quotation ${saved.id} has been successfully recorded in the deal pipeline.`,
        type: "success",
      });
      router.push(`/quotes/${saved.id}`);
    } catch {
      toast({
        title: "Submission Failed",
        description: "Unable to save quotation to storage.",
        type: "error",
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link
            href={requirementId ? `/requirements/${requirementId}` : "/quotes"}
          >
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs text-slate-600"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              {requirementId ? "Back to Requirement" : "Back to Quotes"}
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <FileText className="w-6 h-6 text-teal-600" />
              New Commercial Quotation
            </h1>
            <p className="text-xs text-slate-500">
              Configure multi-line hardware & services proposals with live
              policy limit checks.
            </p>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            onClick={() => handleSave("DRAFT")}
            disabled={isSubmitting}
            className="text-xs font-semibold"
          >
            Save as Draft
          </Button>
          <Button
            onClick={() => handleSave("SUBMIT")}
            disabled={isSubmitting}
            className="bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-enterprise gap-1.5"
          >
            <Sparkles className="w-4 h-4" />
            Submit for Approval
          </Button>
        </div>
      </div>

      {/* Origin Requirement Context Banner */}
      {requirement && (
        <div className="bg-gradient-to-r from-teal-50 via-blue-50 to-white border border-teal-300 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0">
              <Inbox className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800">
                  Converting Inbound Customer Requirement
                </span>
                <span className="px-2 py-0.5 text-xs font-mono font-bold bg-white text-teal-900 rounded border border-teal-300">
                  {requirement.id}
                </span>
              </div>
              <p className="text-xs text-slate-700 mt-0.5">
                Pre-populated from customer intake:{" "}
                <strong>{requirement.customerName}</strong> —{" "}
                {requirement.title} ({requirement.items.length} items
                requested).
              </p>
            </div>
          </div>
          <Link
            href={`/requirements/${requirement.id}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-900 hover:underline shrink-0"
          >
            <span>View Source Demand</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

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
                      Account Manager:{" "}
                      <strong className="text-slate-700">
                        {selectedCustomer.accountManager}
                      </strong>{" "}
                      • Credit Limit:{" "}
                      <strong className="text-slate-700">
                        {formatCurrency(selectedCustomer.creditLimit)}
                      </strong>
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
                    onChange={(e) => setPriceList(e.target.value)}
                    className="text-xs"
                  >
                    <option value="">Default active price list</option>
                    {pricing
                      .filter((list) => list.active)
                      .map((list) => list.name)
                      .map((pl) => (
                        <option key={pl} value={pl}>
                          {pl}
                        </option>
                      ))}
                  </Select>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Standard Enterprise base pricing schedule with category
                    discount boundaries.
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
                    Quotation valid until
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
                  Effective discount limit is strictly calculated as{" "}
                  <code className="bg-slate-100 px-1 py-0.5 rounded text-teal-800 font-mono">
                    min(Customer Tier Limit, Category Limit)
                  </code>
                  .
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
                      <TableHead className="w-52">Product / Service</TableHead>
                      <TableHead className="w-16 text-center">Qty</TableHead>
                      <TableHead className="w-24 text-right">
                        Unit Price
                      </TableHead>
                      <TableHead className="w-40">
                        Discount % & Allowed
                      </TableHead>
                      <TableHead className="w-24 text-center">
                        Margin %
                      </TableHead>
                      <TableHead className="w-28 text-center">
                        Policy Status
                      </TableHead>
                      <TableHead className="w-24 text-right">
                        Line Net
                      </TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lines.map((line, idx) => {
                      const evalLine = evaluatedLines[idx];
                      const selectedProd = products.find(
                        (p) => p.id === line.productId,
                      );
                      const isViolation = evalLine?.isViolation;
                      const excess = evalLine?.excessPercent || 0;
                      const cost = getProductCost(selectedProd);
                      const netUnitPrice =
                        line.unitPrice * (1 - line.discountPercent / 100);
                      const lineMargin =
                        netUnitPrice > 0
                          ? Math.round(
                              ((netUnitPrice - cost) / netUnitPrice) * 100,
                            )
                          : 0;

                      return (
                        <TableRow
                          key={line.tempId}
                          className={`hover:bg-slate-50/70 border-b border-slate-100 ${
                            isViolation ? "bg-amber-50/40" : ""
                          }`}
                        >
                          {/* Product Selection */}
                          <TableCell className="align-top py-3">
                            <Select
                              value={line.productId}
                              onChange={(e) =>
                                handleProductChange(line.tempId, e.target.value)
                              }
                              className="text-xs h-8"
                            >
                              {products.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name} ({p.category})
                                </option>
                              ))}
                            </Select>
                            <span className="text-[10px] text-slate-400 block mt-1">
                              Category: {selectedProd?.category || "Hardware"} •
                              SKU: {selectedProd?.sku}
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
                                  "quantity",
                                  parseInt(e.target.value) || 1,
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
                              readOnly
                              aria-label="Price from selected price list"
                              className="text-xs h-8 text-right font-mono"
                            />
                            <span className="text-[10px] text-slate-400 block mt-1">
                              List:{" "}
                              {formatCurrency(selectedProd?.basePrice || 0)}
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
                                    "discountPercent",
                                    parseInt(e.target.value) || 0,
                                  )
                                }
                                className="w-20 accent-teal-600 h-1.5 bg-slate-200 rounded cursor-pointer"
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
                                      "discountPercent",
                                      parseInt(e.target.value) || 0,
                                    )
                                  }
                                  className="text-xs h-8 w-12 text-right font-mono"
                                />
                                <span className="text-xs font-semibold text-slate-500">
                                  %
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-[10px] mt-1 font-medium">
                              <span className="text-slate-500">
                                Cap:{" "}
                                <strong>{evalLine?.effectiveLimit}%</strong>
                              </span>
                              {isViolation ? (
                                <span className="text-rose-700 font-bold">
                                  +{excess}% over
                                </span>
                              ) : (
                                <span className="text-emerald-700">
                                  Within Policy
                                </span>
                              )}
                            </div>
                          </TableCell>

                          {/* Line Margin % */}
                          <TableCell className="align-top py-3 text-center">
                            <div className="space-y-0.5">
                              <span
                                className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                                  lineMargin >= 35
                                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                    : lineMargin >= 25
                                      ? "bg-amber-50 text-amber-800 border border-amber-200"
                                      : "bg-rose-50 text-rose-800 border border-rose-200"
                                }`}
                              >
                                <TrendingUp className="w-2.5 h-2.5" />
                                {lineMargin}%
                              </span>
                              <span className="text-[9px] text-slate-400 block font-mono">
                                Cost: ${cost}
                              </span>
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

          {/* Smart Upsell & Cross-Sell Suggestions */}
          <Card className="bg-gradient-to-r from-teal-50/40 via-white to-slate-50 border-teal-200 shadow-enterprise">
            <CardHeader className="p-4 pb-2 border-b border-teal-100 flex flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-teal-600 text-white flex items-center justify-center shadow-2xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Smart Upsell & Cross-Sell Suggestions
                  </CardTitle>
                  <p className="text-[11px] text-slate-500">
                    Attach high-margin peripherals and service SLAs to optimize
                    deal gross margin and recurring MRR.
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-semibold bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full border border-teal-200">
                AI Deal Desk Advisor
              </span>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {UPSELL_SUGGESTIONS.filter(
                  (s) => !dismissedUpsells.includes(s.id),
                ).map((rec) => {
                  const alreadyInQuote = lines.some(
                    (l) => l.productId === rec.productId,
                  );
                  const prod = products.find((p) => p.id === rec.productId);

                  return (
                    <div
                      key={rec.id}
                      className={`p-3 rounded-lg border text-xs flex flex-col justify-between transition-all ${
                        alreadyInQuote
                          ? "bg-emerald-50/50 border-emerald-200"
                          : "bg-white border-slate-200 hover:border-teal-300 shadow-2xs"
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-start justify-between gap-1">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                            <Tag className="w-2.5 h-2.5" />
                            {rec.tag}
                          </span>
                          {!alreadyInQuote && (
                            <button
                              type="button"
                              onClick={() => handleDismissUpsell(rec.id)}
                              className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                              title="Dismiss suggestion"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        <h4 className="font-bold text-slate-900 leading-snug">
                          {rec.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                          {rec.reason}
                        </p>
                      </div>

                      <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-900 font-mono text-xs">
                            {formatCurrency(prod?.basePrice || 0)}
                          </p>
                          <span className="text-[10px] font-bold text-emerald-700">
                            {rec.marginLift}
                          </span>
                        </div>
                        {alreadyInQuote ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/60 px-2 py-1 rounded">
                            <CheckCircle2 className="w-3 h-3" /> Attached
                          </span>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleAddUpsell(rec)}
                            className="bg-teal-700 hover:bg-teal-800 text-white text-[11px] font-semibold h-7 px-2.5 gap-1 shadow-xs cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            Add (+{rec.suggestedQty})
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
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
                <span className="text-xs font-normal text-slate-500">
                  USD Net
                </span>
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
                <span className="text-sm font-bold text-slate-900">
                  Net Grand Total:
                </span>
                <span className="text-xl font-extrabold text-teal-700 font-mono">
                  {formatCurrency(dealEvaluation.grandTotal)}
                </span>
              </div>

              {/* Deal Health Meter */}
              <div className="pt-3 border-t border-slate-100">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-semibold text-slate-700">
                    Deal Health Score:
                  </span>
                  <span className="font-bold text-slate-900 font-mono">
                    {dealEvaluation.dealHealthScore} / 100
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      dealEvaluation.dealHealthScore >= 80
                        ? "bg-emerald-500"
                        : dealEvaluation.dealHealthScore >= 50
                          ? "bg-amber-500"
                          : "bg-rose-500"
                    }`}
                    style={{ width: `${dealEvaluation.dealHealthScore}%` }}
                  />
                </div>
              </div>

              {/* Deal Gross Margin Preservation Meter */}
              <div className="pt-3 border-t border-slate-100">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-semibold text-slate-700 flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-teal-600" />
                    Deal Gross Margin:
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-900 font-mono">
                      {dealGrossMargin}%
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      (
                      {formatCurrency(
                        Math.max(0, dealEvaluation.grandTotal - totalCost),
                      )}{" "}
                      Profit)
                    </span>
                  </div>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      dealGrossMargin >= 30
                        ? "bg-teal-600"
                        : dealGrossMargin >= 25
                          ? "bg-amber-500"
                          : "bg-rose-500"
                    }`}
                    style={{ width: `${Math.min(100, dealGrossMargin)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>Margin target: 30%</span>
                  <span
                    className={
                      dealGrossMargin >= 35
                        ? "text-emerald-700 font-bold"
                        : "text-amber-700 font-bold"
                    }
                  >
                    {dealGrossMargin >= 35 ? "✓ Target Met" : "⚠️ Below Target"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Governance Risk Diagnosis Card */}
          <Card
            className={`border shadow-enterprise ${
              dealEvaluation.riskDiagnosis.level === "LOW"
                ? "bg-emerald-50/40 border-emerald-200"
                : dealEvaluation.riskDiagnosis.level === "MEDIUM"
                  ? "bg-amber-50/40 border-amber-200"
                  : "bg-rose-50/40 border-rose-300"
            }`}
          >
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
                <p className="text-slate-600 mt-0.5">
                  {dealEvaluation.riskDiagnosis.whatHappened}
                </p>
              </div>

              <div>
                <p className="font-bold text-slate-900">
                  2. Why does it matter?
                </p>
                <p className="text-slate-600 mt-0.5">
                  {dealEvaluation.riskDiagnosis.whyItMatters}
                </p>
              </div>

              <div>
                <p className="font-bold text-slate-900">
                  3. What should you do next?
                </p>
                <p className="text-slate-700 font-medium mt-0.5">
                  {dealEvaluation.riskDiagnosis.nextAction}
                </p>
              </div>

              {dealEvaluation.riskDiagnosis.requiresFinanceApproval && (
                <div className="p-2.5 rounded-md bg-rose-100 border border-rose-200 text-rose-900 text-[11px] font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>
                    Submitting this quotation will automatically lock it and
                    escalate to Finance Controller for manual exception
                    approval.
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
              • Gold Tier accounts do <strong>NOT</strong> bypass Services 10%
              ceiling.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NewQuotationPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 space-y-6">
          <div className="h-8 bg-slate-200 rounded-md animate-pulse w-1/4" />
          <div className="h-64 bg-slate-100 rounded-xl border border-slate-200 animate-pulse" />
        </div>
      }
    >
      <NewQuotationForm />
    </Suspense>
  );
}
