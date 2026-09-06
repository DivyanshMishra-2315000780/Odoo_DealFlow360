"use client";
import { use, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { request } from "@/lib/http/client";
import { useProduct, useSaveProduct } from "@/hooks/use-dealflow";
import { useAuth, normalizeRole } from "@/lib/auth";
import { useToast } from "@/components/providers/query-provider";
import { PageHeading, MetricCard } from "@/components/ui/page-heading";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ErrorState } from "@/components/ui/error-state";
import { CardLoadingSkeleton } from "@/components/ui/loading-state";
import { Product } from "@/types/dealflow";

type PriceList = {
  id: string;
  name: string;
  currency: string;
  active: boolean;
  items: Array<{ productId: string; unitPrice: string }>;
};
export default function ProductDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: product, isLoading, error } = useProduct(id);
  const { data: lists = [] } = useQuery({
    queryKey: ["pricing"],
    queryFn: () => request<PriceList[]>("/api/pricing"),
  });
  const { user } = useAuth();
  const canEdit = normalizeRole(user?.role) === "ADMIN";
  const save = useSaveProduct();
  const client = useQueryClient();
  const { toast } = useToast();
  const [stockOpen, setStockOpen] = useState(false);
  const [stock, setStock] = useState("");
  const [busy, setBusy] = useState(false);
  const [variantOpen, setVariantOpen] = useState(false);
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [color, setColor] = useState("");
  const [ram, setRam] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [adjustment, setAdjustment] = useState("0");
  const money = (
    value: number,
    currency: string = product?.currency ?? "USD",
  ) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency }).format(
      value,
    );
  if (isLoading) return <CardLoadingSkeleton />;
  if (error || !product)
    return (
      <ErrorState
        title="Product unavailable"
        message={error?.message ?? "This product is unavailable."}
      />
    );
  const changeStatus = async (status: Product["status"]) => {
    await save.mutateAsync({ ...product, status });
    toast({ title: "Product status saved", type: "success" });
  };
  const adjust = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      await request("/api/warehouse-stock", {
        method: "PATCH",
        body: JSON.stringify({
          productId: id,
          availableStock: Number(stock),
          expectedAvailableStock: product.availableStock ?? 0,
        }),
      });
      await client.invalidateQueries();
      setStockOpen(false);
      toast({ title: "Stock adjusted", type: "success" });
    } catch (error) {
      toast({
        title: "Stock adjustment failed",
        description: error instanceof Error ? error.message : "Try again.",
        type: "error",
      });
    } finally {
      setBusy(false);
    }
  };
  const addVariant = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await save.mutateAsync({
        ...product,
        variants: [
          ...(product.variants ?? []),
          {
            id: crypto.randomUUID(),
            name: name.trim(),
            sku: sku.trim(),
            color,
            ram,
            manufacturer,
            priceAdjustment: Number(adjustment),
            availableStock: 0,
          },
        ],
      });
      setVariantOpen(false);
      setName("");
      setSku("");
      toast({ title: "Variant saved", type: "success" });
    } catch {}
  };
  return (
    <div className="space-y-7 pb-12">
      <Link
        href="/products"
        className="inline-block text-sm font-medium text-teal-700"
      >
        ? Product catalog
      </Link>
      <PageHeading
        eyebrow={product.category}
        title={product.name}
        description={
          product.description ||
          "Manage product configuration, warehouse availability, and selling prices."
        }
        actions={
          canEdit ? (
            <label className="text-sm">
              Catalog status
              <select
                aria-label="Catalog status"
                className="ml-3 rounded-lg border border-slate-300 bg-white p-2"
                value={product.status}
                disabled={save.isPending}
                onChange={(e) =>
                  void changeStatus(e.target.value as Product["status"]).catch(
                    () => {},
                  )
                }
              >
                <option value="ACTIVE">Active</option>
                <option value="DRAFT">Draft</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </label>
          ) : undefined
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="List price"
          value={money(product.basePrice)}
          note="From the active price list"
        />
        <MetricCard
          label="Purchase cost"
          value={
            product.baseCost == null ? "Unavailable" : money(product.baseCost)
          }
          note="Used in quotation margin analysis"
        />
        <MetricCard
          label="Available units"
          value={
            product.category === "Hardware" && !product.isSubscription
              ? (product.availableStock ?? 0)
              : "Service"
          }
          note="Warehouse stock less reserved units"
        />
        <MetricCard
          label="Billing"
          value={
            product.isSubscription
              ? (product.billingFrequency ?? "Recurring")
              : "One time"
          }
          note={product.sku}
        />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Product details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 text-sm">
            <dl className="grid grid-cols-2 gap-4">
              <dt className="text-slate-500">SKU</dt>
              <dd className="break-all font-medium">{product.sku}</dd>
              <dt className="text-slate-500">Category</dt>
              <dd>{product.category}</dd>
              <dt className="text-slate-500">Status</dt>
              <dd>{product.status}</dd>
              <dt className="text-slate-500">Billing frequency</dt>
              <dd>
                {product.billingFrequency === "NONE"
                  ? "One time"
                  : product.billingFrequency}
              </dd>
            </dl>
            {canEdit &&
              product.category === "Hardware" &&
              !product.isSubscription && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setStock(String(product.availableStock ?? 0));
                    setStockOpen(true);
                  }}
                >
                  Adjust available stock
                </Button>
              )}
            <p className="leading-6 text-slate-500">
              Archived and draft products are hidden from new sales selections.
              Existing quotations and orders retain their history.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Price lists</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {lists
              .filter(
                (list) =>
                  list.active &&
                  list.items.some((item) => item.productId === id),
              )
              .map((list) => (
                <div
                  key={list.id}
                  className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3 text-sm"
                >
                  <span>
                    {list.name}
                    <span className="block text-xs text-slate-500">
                      {list.currency}
                    </span>
                  </span>
                  <strong>
                    {money(
                      Number(
                        list.items.find((item) => item.productId === id)!
                          .unitPrice,
                      ),
                      list.currency,
                    )}
                  </strong>
                </div>
              ))}
            <p className="text-sm leading-6 text-slate-500">
              Quotation prices use the selected price list. Discounts are
              evaluated against the customer tier and category policies.
            </p>
            {canEdit && (
              <Link
                className="inline-block text-sm font-medium text-teal-700"
                href="/price-lists"
              >
                Manage selling prices ?
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3">
          <CardTitle>Variants</CardTitle>
          {canEdit && (
            <Button variant="outline" onClick={() => setVariantOpen(true)}>
              Add variant
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <p className="mb-5 text-sm leading-6 text-slate-500">
            Variants describe catalog options. Quotations and warehouse
            reservations currently use the base product.
          </p>
          {!product.variants?.length ? (
            <p className="rounded-lg bg-slate-50 p-6 text-center text-sm text-slate-500">
              No variants configured.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {product.variants.map((variant) => (
                <div
                  key={variant.id}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <h3 className="font-semibold">{variant.name}</h3>
                  <p className="mt-1 break-all text-xs text-slate-500">
                    {variant.sku}
                  </p>
                  <p className="mt-3 text-sm text-slate-600">
                    {[variant.color, variant.ram, variant.manufacturer]
                      .filter(Boolean)
                      .join(" ? ")}
                  </p>
                  <p className="mt-2 text-sm">
                    Price adjustment: {money(variant.priceAdjustment)}
                  </p>
                  {canEdit && (
                    <Button
                      variant="ghost"
                      className="mt-3 text-red-700"
                      disabled={save.isPending}
                      onClick={() =>
                        void save
                          .mutateAsync({
                            ...product,
                            variants: product.variants?.filter(
                              (v) => v.id !== variant.id,
                            ),
                          })
                          .catch(() => {})
                      }
                    >
                      Remove variant
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <Dialog open={stockOpen} onOpenChange={setStockOpen}>
        <DialogHeader>
          <DialogTitle>Adjust available stock</DialogTitle>
          <DialogDescription>
            Set the total unreserved quantity across active warehouses. Existing
            reservations are preserved.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={adjust} className="space-y-5">
          <label className="block text-sm font-medium">
            Available units
            <Input
              type="number"
              min="0"
              step="1"
              required
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              className="mt-2"
            />
          </label>
          <Button type="submit" disabled={busy}>
            {busy ? "Saving?" : "Save stock"}
          </Button>
        </form>
      </Dialog>
      <Dialog open={variantOpen} onOpenChange={setVariantOpen}>
        <DialogHeader>
          <DialogTitle>Add catalog variant</DialogTitle>
          <DialogDescription>
            Save the configuration details for this product option.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={addVariant} className="grid gap-4 sm:grid-cols-2">
          {[
            ["Name", name, setName],
            ["SKU", sku, setSku],
            ["Color", color, setColor],
            ["RAM", ram, setRam],
            ["Manufacturer", manufacturer, setManufacturer],
          ].map(([label, value, setter]) => (
            <label key={label as string} className="text-sm font-medium">
              {label as string}
              <Input
                className="mt-2"
                required={label === "Name" || label === "SKU"}
                value={value as string}
                onChange={(e) =>
                  (setter as (v: string) => void)(e.target.value)
                }
              />
            </label>
          ))}
          <label className="text-sm font-medium">
            Price adjustment
            <Input
              className="mt-2"
              type="number"
              step="0.01"
              required
              value={adjustment}
              onChange={(e) => setAdjustment(e.target.value)}
            />
          </label>
          <Button type="submit" disabled={save.isPending}>
            Save variant
          </Button>
        </form>
      </Dialog>
    </div>
  );
}
