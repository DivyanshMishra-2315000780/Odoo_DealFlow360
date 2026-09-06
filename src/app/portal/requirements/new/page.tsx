'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ClipboardList,
  Plus,
  Trash2,
  CheckCircle2,
  ArrowLeft,
  Building,
  AlertTriangle,
  Info,
  Layers,
  Send,
  Boxes,
  Tag,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { TierBadge } from '@/components/ui/tier-badge';
import { useCreateRequirement, useCustomers, useProducts } from '@/hooks/use-dealflow';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/components/providers/query-provider';
import { CustomerTier, ProductCategory, RequirementPriority } from '@/types/dealflow';

interface FormItem {
  id: string;
  productId?: string;
  name: string;
  quantity: number;
  category: ProductCategory;
  notes: string;
}

interface RequirementTopic {
  id: string;
  label: string;
  badge: string;
  suggestedTitle: string;
  suggestedDescription: string;
  suggestedPriority: RequirementPriority;
  defaultDeliveryDays: number;
}

const REQUIREMENT_TOPICS: RequirementTopic[] = [
  {
    id: 'it-workstations',
    label: '🖥️ IT Hardware Refresh & Engineering Workstations',
    badge: 'Hardware Refresh',
    suggestedTitle: 'Engineering Workstations & Hardware Refresh',
    suggestedDescription: 'Bulk acquisition of enterprise workstations, developer laptops, and high-performance peripherals for engineering teams.',
    suggestedPriority: 'HIGH',
    defaultDeliveryDays: 14,
  },
  {
    id: 'office-docking',
    label: '🔌 Workspace Connectivity & Docking Stations Setup',
    badge: 'Workspace Setup',
    suggestedTitle: 'Workspace Connectivity & Thunderbolt Docking Deployment',
    suggestedDescription: 'Procuring Thunderbolt multi-port docking stations and workspace connectivity solutions for hot-desking expansion.',
    suggestedPriority: 'MEDIUM',
    defaultDeliveryDays: 10,
  },
  {
    id: 'security-gateway',
    label: '🛡️ Enterprise Perimeter Security & Gateway Appliances',
    badge: 'Security Infrastructure',
    suggestedTitle: 'Enterprise Perimeter Security Gateway & Firewall Rollout',
    suggestedDescription: 'Deployment of dedicated enterprise security appliances for high-throughput perimeter encryption and network defense.',
    suggestedPriority: 'URGENT',
    defaultDeliveryDays: 7,
  },
  {
    id: 'onsite-deployment',
    label: '🛠️ Professional Onsite Commissioning & Deployment',
    badge: 'Professional Services',
    suggestedTitle: 'Professional Onsite System Staging & Commissioning',
    suggestedDescription: 'End-to-end onsite configuration, OS rollouts, network commissioning, and physical staging handover at corporate facility.',
    suggestedPriority: 'MEDIUM',
    defaultDeliveryDays: 15,
  },
  {
    id: 'care-plan-renewal',
    label: '📜 24/7 Support SLA & Annual Care Plan Renewal',
    badge: 'Annual Support',
    suggestedTitle: 'Annual Enterprise Support & Care Plan 24/7 Renewal',
    suggestedDescription: 'Renewal of mission-critical hardware coverage, 24/7 technical incident SLA, and warranty maintenance.',
    suggestedPriority: 'MEDIUM',
    defaultDeliveryDays: 30,
  },
  {
    id: 'custom',
    label: '✍️ Custom Enterprise Requirement (Self-Defined Scope)',
    badge: 'Custom Scope',
    suggestedTitle: '',
    suggestedDescription: '',
    suggestedPriority: 'MEDIUM',
    defaultDeliveryDays: 15,
  },
];

export default function NewCustomerRequirementPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: customers = [] } = useCustomers();
  const { data: products = [] } = useProducts();
  const createMutation = useCreateRequirement();

  // Active customer context from authenticated user
  const customerName = user?.company || 'ABC Manufacturing';
  const matchedCustomer = customers.find(
    (c) => c.id === user?.customerId
  ) || {
    id: user?.customerId ?? '',
    name: customerName,
    tier: (user?.tier as CustomerTier) || 'Silver',
  };

  // Form State
  const [selectedTopicId, setSelectedTopicId] = useState<string>('it-workstations');
  const [title, setTitle] = useState('Engineering Workstations & Hardware Refresh');
  const [description, setDescription] = useState(
    'Bulk acquisition of enterprise workstations, developer laptops, and high-performance peripherals for engineering teams.'
  );
  const [expectedDeliveryDays, setExpectedDeliveryDays] = useState<number>(14);
  const [priority, setPriority] = useState<RequirementPriority>('HIGH');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [items, setItems] = useState<FormItem[]>([
    {
      id: 'item-1',
      productId: 'prod-001',
      name: 'Laptop Pro 14',
      quantity: 10,
      category: 'Hardware',
      notes: 'Engineering workstations',
    },
    {
      id: 'item-2',
      productId: 'prod-003',
      name: 'Onsite Setup & Installation',
      quantity: 1,
      category: 'Services',
      notes: 'Network provisioning & OS rollout',
    },
    {
      id: 'item-3',
      productId: 'prod-005',
      name: 'Care Plan 24/7',
      quantity: 1,
      category: 'Services',
      notes: 'Mission-critical hardware SLA',
    },
  ]);

  // Submission / Confirmation state
  const [submittedReq, setSubmittedReq] = useState<{
    id: string;
    customerName: string;
    status: string;
    assignedSalesExecutive: string;
  } | null>(null);

  // Requirement Topic Change Handler
  const handleTopicChange = (topicId: string) => {
    setSelectedTopicId(topicId);
    const topic = REQUIREMENT_TOPICS.find((t) => t.id === topicId);
    if (!topic) return;

    if (topic.id !== 'custom') {
      setTitle(topic.suggestedTitle);
      setDescription(topic.suggestedDescription);
      setPriority(topic.suggestedPriority);
      setExpectedDeliveryDays(topic.defaultDeliveryDays);
    }
  };

  // Item helpers
  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: 'item-' + Date.now(),
        productId: '',
        name: '',
        quantity: 1,
        category: 'Hardware',
        notes: '',
      },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) {
      toast({
        title: 'At Least One Item Required',
        description: 'Please specify at least one requested product or service line.',
        type: 'warning',
      });
      return;
    }
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleItemChange = (id: string, field: keyof FormItem, value: string | number) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: value } : it))
    );
  };

  // Product Selection from Warehouse Catalog
  const handleProductSelect = (itemId: string, selectedVal: string) => {
    if (selectedVal === 'custom') {
      setItems((prev) =>
        prev.map((it) =>
          it.id === itemId
            ? { ...it, productId: 'custom', name: '', category: 'Hardware' }
            : it
        )
      );
      return;
    }

    const matched = products.find((p) => p.id === selectedVal);
    if (matched) {
      setItems((prev) =>
        prev.map((it) =>
          it.id === itemId
            ? {
                ...it,
                productId: matched.id,
                name: matched.name,
                category: matched.category,
                notes: it.notes || (matched.category === 'Hardware' ? (matched.sku + ' standard specification') : 'Enterprise SLA coverage'),
              }
            : it
        )
      );
    }
  };

  // Warehouse Stock Checker Helper
  const getItemStockStatus = (item: FormItem) => {
    const matched = products.find(
      (p) => p.id === item.productId || p.name.toLowerCase() === item.name.toLowerCase()
    );

    if (!matched) {
      return {
        matchedProduct: null,
        isHardware: item.category === 'Hardware',
        availableStock: null,
        isOutOfStock: false,
        isExceeding: false,
        isCompliant: true,
      };
    }

    const isHardware = matched.category === 'Hardware';
    const availableStock = matched.availableStock ?? 0;
    const isOutOfStock = isHardware && availableStock <= 0;
    const isExceeding = isHardware && availableStock > 0 && item.quantity > availableStock;
    const isCompliant = isHardware && availableStock > 0 && item.quantity <= availableStock;

    return {
      matchedProduct: matched,
      isHardware,
      availableStock,
      isOutOfStock,
      isExceeding,
      isCompliant,
    };
  };

  // Check how many items currently breach warehouse stock
  const outOfStockItems = items.filter((it) => {
    const status = getItemStockStatus(it);
    return status.isOutOfStock || status.isExceeding;
  });

  // 1-Click Demo Fill: ABC Manufacturing
  const handleQuickFillDemo = () => {
    setSelectedTopicId('it-workstations');
    setTitle('10 Laptops + Installation + 1 Year Support');
    setDescription(
      'Workstation deployment for Ahmedabad technical engineering division requiring professional onsite setup and 1-year care plan coverage.'
    );
    setExpectedDeliveryDays(15);
    setPriority('HIGH');
    setAdditionalNotes('Installation at Ahmedabad office. Required before quarterly onboarding.');

    const laptop = products.find((p) => p.name.toLowerCase().includes('laptop'));
    const setup = products.find((p) => p.name.toLowerCase().includes('setup'));
    const care = products.find((p) => p.name.toLowerCase().includes('care'));

    setItems([
      {
        id: 'item-1',
        productId: laptop?.id || 'prod-001',
        name: laptop?.name || 'Laptop Pro 14',
        quantity: 10,
        category: 'Hardware',
        notes: 'High-performance developer unified RAM',
      },
      {
        id: 'item-2',
        productId: setup?.id || 'prod-003',
        name: setup?.name || 'Onsite Setup & Installation',
        quantity: 1,
        category: 'Services',
        notes: 'Physical staging & network setup at Ahmedabad facility',
      },
      {
        id: 'item-3',
        productId: care?.id || 'prod-005',
        name: care?.name || 'Care Plan 24/7',
        quantity: 1,
        category: 'Services',
        notes: '1-Year 24/7 replacement response SLA',
      },
    ]);

    toast({
      title: 'Demo Specifications Loaded',
      description: 'Pre-filled ABC Manufacturing 10 Laptops + Installation requirement with warehouse SKUs.',
      type: 'info',
    });
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast({
        title: 'Title Required',
        description: 'Please provide a descriptive title for your requirement.',
        type: 'error',
      });
      return;
    }

    const invalidItems = items.some((it) => !it.name.trim() || it.quantity <= 0);
    if (invalidItems) {
      toast({
        title: 'Invalid Items',
        description: 'Please ensure all requested items have a name selected and positive quantity.',
        type: 'warning',
      });
      return;
    }

    try {
      const created = await createMutation.mutateAsync({
        customerId: matchedCustomer.id,
        customerName: matchedCustomer.name,
        customerTier: matchedCustomer.tier,
        title: title.trim(),
        description: description.trim(),
        items: items.map((it, idx) => ({
          id: 'RI-' + Date.now() + '-' + (idx + 1),
          productId: it.productId && it.productId !== 'custom' ? it.productId : undefined,
          name: it.name.trim(),
          quantity: it.quantity,
          category: it.category,
          notes: it.notes.trim() || undefined,
        })),
        priority,
        expectedDeliveryDays,
        additionalNotes: additionalNotes.trim() || undefined,
        assignedSalesExecutive: 'Marcus Vance',
      });

      setSubmittedReq({
        id: created.id,
        customerName: created.customerName,
        status: created.status,
        assignedSalesExecutive: created.assignedSalesExecutive,
      });

      toast({
        title: 'Requirement Submitted ✓',
        description: created.id + ' submitted for review by Marcus Vance.',
        type: 'success',
      });
    } catch (err) {
      toast({
        title: 'Submission Failed',
        description: 'Unable to commit requirement. Please try again.',
        type: 'error',
      });
    }
  };

  // SUCCESS CONFIRMATION VIEW
  if (submittedReq) {
    return (
      <div className="max-w-2xl mx-auto py-8 space-y-6">
        <Card className="bg-white border-emerald-200 shadow-enterprise p-6 text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <span className="font-mono text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              Requirement Submitted ✓
            </span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Requirement Reference: {submittedReq.id}
            </h1>
            <p className="text-sm text-slate-600 font-medium">
              {submittedReq.customerName}
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-left text-xs space-y-2.5">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200/80">
              <span className="text-slate-500">Status:</span>
              <span className="font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 font-mono">
                {submittedReq.status}
              </span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-200/80">
              <span className="text-slate-500">Assigned Sales Executive:</span>
              <span className="font-bold text-slate-800">
                {submittedReq.assignedSalesExecutive}
              </span>
            </div>
            <p className="text-slate-600 leading-relaxed pt-1">
              <strong>What Happens Next:</strong> Your requirement has been routed to your assigned Sales Executive. They will evaluate warehouse inventory availability, apply eligible commercial discounts under your commercial standing, and construct a formal Quotation.
            </p>
          </div>

          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-[11px] text-amber-900 text-left flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <span>
              <strong>Note:</strong> A quotation has <em>NOT</em> been generated yet. You will be notified in the portal as soon as Marcus Vance issues the commercial offer for your review and negotiation.
            </span>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <Link href={'/portal/requirements/' + submittedReq.id}>
              <Button className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold">
                View Submitted Requirement
              </Button>
            </Link>
            <Link href="/portal/requirements">
              <Button variant="outline" className="text-xs">
                My Requirements Ledger
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/portal/requirements"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-teal-700 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Requirements
        </Link>
        <span className="text-xs text-slate-400 font-mono">Stage: Customer Intake</span>
      </div>

      {/* Header & Demo Quick-Fill */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Request a Commercial Quote
            </h1>
            <span className="text-[10px] font-bold uppercase bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded">
              Requirement Creator
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Specify products from our warehouse or custom needs. Real-time warehouse inventory availability is verified instantly.
          </p>
        </div>

        <Button
          type="button"
          size="sm"
          onClick={handleQuickFillDemo}
          className="bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200 text-xs font-semibold shrink-0 cursor-pointer"
        >
          ⚡ 1-Click Demo Fill (ABC Mfg)
        </Button>
      </div>

      {/* Important Clarification Banner */}
      <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700 flex items-start gap-3 shadow-2xs">
        <div className="w-8 h-8 rounded-md bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
          <ClipboardList className="w-4 h-4" />
        </div>
        <div className="leading-relaxed space-y-1">
          <p className="font-bold text-slate-900">
            Enterprise Procurement Policy Notice
          </p>
          <p className="text-slate-600">
            Customers create <strong>Requirements</strong> (&quot;What you need&quot;). Sales Executives review warehouse allocation and produce <strong>Quotations</strong> (&quot;Official prices, applied discounts, and commercial terms&quot;).
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Customer Organization Details (Read-only / Authenticated Context) */}
        <Card className="bg-white border-slate-200 shadow-enterprise">
          <CardHeader className="p-4 border-b border-slate-100">
            <CardTitle className="text-xs uppercase tracking-wider font-bold text-slate-800 flex items-center gap-2">
              <Building className="w-4 h-4 text-teal-600" />
              1. Procurement Organization Credentials
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Customer Organization (Derived from Session)
                </label>
                <div className="p-2 bg-slate-50 border border-slate-200 rounded-md text-xs font-bold text-slate-900">
                  {matchedCustomer.name}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Account Standing
                </label>
                <div className="p-1.5 bg-slate-50 border border-slate-200 rounded-md flex items-center gap-2">
                  <TierBadge tier={matchedCustomer.tier} size="sm" />
                  <span className="text-[11px] text-slate-500 font-mono">System-Assigned</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assigned Account Executive
                </label>
                <div className="p-2 bg-slate-50 border border-slate-200 rounded-md text-xs font-semibold text-slate-700">
                  Marcus Vance (Enterprise Sales Desk)
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Requirement Topic & Expected Timeline */}
        <Card className="bg-white border-slate-200 shadow-enterprise">
          <CardHeader className="p-4 border-b border-slate-100">
            <CardTitle className="text-xs uppercase tracking-wider font-bold text-slate-800 flex items-center gap-2">
              <Tag className="w-4 h-4 text-teal-600" />
              2. Requirement Topic & Business Objective
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {/* Requirement Topic Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Requirement Topic / Scope Domain *
              </label>
              <Select
                value={selectedTopicId}
                onChange={(e) => handleTopicChange(e.target.value)}
                className="text-xs font-semibold bg-white"
              >
                {REQUIREMENT_TOPICS.map((topic) => (
                  <option key={topic.id} value={topic.id}>
                    {topic.label}
                  </option>
                ))}
              </Select>
              <p className="text-[11px] text-slate-500 mt-1">
                Selecting a topic pre-structures standard specifications, expected delivery windows, and recommended warehouse SKUs.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Requirement Title / Short Summary *
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. 10 Laptops + Installation + 1 Year Support"
                className="text-xs font-semibold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Project Scope & Business Need Description
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe deployment objectives, department specifications, or software compatibility..."
                className="w-full text-xs p-2.5 rounded-md border border-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Expected Delivery Timeline (Days)
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="1"
                    max="180"
                    value={expectedDeliveryDays}
                    onChange={(e) => setExpectedDeliveryDays(parseInt(e.target.value) || 15)}
                    className="text-xs font-mono w-28"
                  />
                  <span className="text-xs text-slate-500 font-medium">Days from quotation confirmation</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Procurement Priority
                </label>
                <Select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as RequirementPriority)}
                  className="text-xs"
                >
                  <option value="LOW">Low (Standard SLA)</option>
                  <option value="MEDIUM">Medium (Next sprint rollout)</option>
                  <option value="HIGH">High (Immediate executive priority)</option>
                  <option value="URGENT">Urgent (Critical production requirement)</option>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Requested Products with Warehouse Stock Dropdown & Out of Stock Warnings */}
        <Card className="bg-white border-slate-200 shadow-enterprise">
          <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-xs uppercase tracking-wider font-bold text-slate-800 flex items-center gap-2">
                <Boxes className="w-4 h-4 text-teal-600" />
                3. Requested Items & Warehouse Inventory Selection
              </CardTitle>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Select items from our warehouse catalog or specify custom requirements. Current warehouse stock levels are evaluated in real-time.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddItem}
              className="h-7 text-xs font-semibold gap-1 text-teal-700 border-teal-200 hover:bg-teal-50"
            >
              <Plus className="w-3 h-3" />
              Add Item
            </Button>
          </CardHeader>

          <CardContent className="p-4 space-y-4">
            {/* Global Stock Advisory Alert if any item is out of stock */}
            {outOfStockItems.length > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-900">
                    Warehouse Stock Notice ({outOfStockItems.length} item{outOfStockItems.length > 1 ? 's' : ''} exceed current stock):
                  </p>
                  <p className="text-amber-800 text-[11px] mt-0.5">
                    Items marked below exceed current warehouse inventory. You can still submit this requirement — Marcus Vance will coordinate supplier lead times and warehouse replenishment when preparing your quotation.
                  </p>
                </div>
              </div>
            )}

            {items.map((item, idx) => {
              const stockStatus = getItemStockStatus(item);
              const isCustom = item.productId === 'custom' || (!item.productId && !stockStatus.matchedProduct);

              return (
                <div
                  key={item.id}
                  className={'p-3 rounded-lg border transition-all ' + (
                    stockStatus.isOutOfStock
                      ? 'bg-rose-50/50 border-rose-300 ring-1 ring-rose-200'
                      : stockStatus.isExceeding
                      ? 'bg-amber-50/50 border-amber-300 ring-1 ring-amber-200'
                      : 'bg-slate-50/60 border-slate-200'
                  ) + ' text-xs space-y-2.5'}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
                    {/* Index */}
                    <div className="sm:col-span-1 text-center font-mono font-bold text-slate-400 pt-2">
                      #{idx + 1}
                    </div>

                    {/* Warehouse Product Dropdown */}
                    <div className="sm:col-span-5 space-y-1">
                      <label className="block text-[10px] font-semibold text-slate-600">
                        Select Item from Warehouse Catalog *
                      </label>
                      <Select
                        value={
                          item.productId
                            ? item.productId
                            : stockStatus.matchedProduct
                            ? stockStatus.matchedProduct.id
                            : 'custom'
                        }
                        onChange={(e) => handleProductSelect(item.id, e.target.value)}
                        className="text-xs h-8 bg-white"
                      >
                        <option value="">-- Choose Warehouse Item --</option>
                        <optgroup label="📦 Warehouse Hardware Inventory">
                          {products
                            .filter((p) => p.category === 'Hardware')
                            .map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({p.sku}) — {(p.availableStock ?? 0) > 0 ? (p.availableStock + ' in stock') : 'Out of Stock'}
                              </option>
                            ))}
                        </optgroup>
                        <optgroup label="💼 Enterprise Services & Subscriptions">
                          {products
                            .filter((p) => p.category === 'Services')
                            .map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({p.sku}) — Continuous Service
                              </option>
                            ))}
                        </optgroup>
                        <option value="custom">✍️ Custom Item / Other Specification...</option>
                      </Select>

                      {/* Custom Item Name input if custom is chosen */}
                      {isCustom && (
                        <div className="pt-1">
                          <Input
                            value={item.name}
                            onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                            placeholder="Enter custom product or service capability name..."
                            className="text-xs h-7 bg-white font-medium"
                            required
                          />
                        </div>
                      )}
                    </div>

                    {/* Quantity Input */}
                    <div className="sm:col-span-2 space-y-1">
                      <label className="block text-[10px] font-semibold text-slate-600">
                        Quantity
                      </label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(item.id, 'quantity', parseInt(e.target.value) || 1)
                        }
                        className={'text-xs h-8 text-center font-mono bg-white font-bold ' + (
                          stockStatus.isOutOfStock
                            ? 'border-rose-400 text-rose-700'
                            : stockStatus.isExceeding
                            ? 'border-amber-400 text-amber-800'
                            : ''
                        )}
                      />
                    </div>

                    {/* Category Selector */}
                    <div className="sm:col-span-3 space-y-1">
                      <label className="block text-[10px] font-semibold text-slate-600">
                        Category
                      </label>
                      <Select
                        value={item.category}
                        onChange={(e) =>
                          handleItemChange(item.id, 'category', e.target.value as ProductCategory)
                        }
                        disabled={!isCustom}
                        className="text-xs h-8 bg-white disabled:opacity-75 disabled:bg-slate-100"
                      >
                        <option value="Hardware">Hardware (15% Max Policy)</option>
                        <option value="Services">Services (10% Max Policy)</option>
                      </Select>
                    </div>

                    {/* Remove Action */}
                    <div className="sm:col-span-1 flex items-center justify-end pt-2 sm:pt-6">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded transition cursor-pointer"
                        title="Remove Item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Stock Availability Status Pill & Warnings */}
                  <div className="pt-1 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/60">
                    <div className="flex-1">
                      {stockStatus.matchedProduct ? (
                        stockStatus.isHardware ? (
                          stockStatus.isOutOfStock ? (
                            <div className="flex items-center gap-1.5 text-[11px] text-rose-700 font-semibold">
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                              <span>
                                🚨 <strong>OUT OF STOCK:</strong> 0 units available in warehouse. Vendor lead time will be required.
                              </span>
                            </div>
                          ) : stockStatus.isExceeding ? (
                            <div className="flex items-center gap-1.5 text-[11px] text-amber-800 font-semibold">
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                              <span>
                                ⚠️ <strong>EXCEEDS WAREHOUSE STOCK:</strong> Only {stockStatus.availableStock} units available (Requested: {item.quantity}). Excess {item.quantity - (stockStatus.availableStock ?? 0)} units will be placed on backorder.
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                              <span>
                                ✓ <strong>In Stock:</strong> {stockStatus.availableStock} units available across warehouses.
                              </span>
                            </div>
                          )
                        ) : (
                          <div className="flex items-center gap-1.5 text-[11px] text-teal-700 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-teal-600" />
                            <span>
                              ✓ <strong>Available:</strong> Professional enterprise service / subscription capacity.
                            </span>
                          </div>
                        )
                      ) : (
                        <div className="text-[11px] text-slate-500 italic">
                          Custom specification — Sales Executive will source pricing and availability.
                        </div>
                      )}
                    </div>

                    {/* Optional Item Notes */}
                    <div className="w-full sm:w-1/2">
                      <Input
                        value={item.notes}
                        onChange={(e) => handleItemChange(item.id, 'notes', e.target.value)}
                        placeholder="Deployment notes (e.g. 32GB RAM variant, Ahmedabad site staging)..."
                        className="text-[11px] h-6 bg-white text-slate-600"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Section 4: Site Notes & Delivery Instructions */}
        <Card className="bg-white border-slate-200 shadow-enterprise">
          <CardHeader className="p-4 border-b border-slate-100">
            <CardTitle className="text-xs uppercase tracking-wider font-bold text-slate-800">
              4. Additional Notes & Site Delivery Instructions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <textarea
              rows={2}
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="e.g. Installation at Ahmedabad office. Receiving dock operates between 9am - 4pm..."
              className="w-full text-xs p-2.5 rounded-md border border-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </CardContent>
          <CardFooter className="p-4 bg-slate-50/70 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[11px] text-slate-500">
              Submitting registers this requirement under status <strong>NEW</strong>. Assigned to Marcus Vance.
            </p>
            <div className="flex items-center gap-2">
              <Link href="/portal/requirements">
                <Button type="button" variant="outline" size="sm" className="text-xs">
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold gap-1.5 shadow-enterprise cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                {createMutation.isPending ? 'Submitting...' : 'Submit Requirement'}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
