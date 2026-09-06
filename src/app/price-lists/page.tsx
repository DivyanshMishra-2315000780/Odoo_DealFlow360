"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { request } from "@/lib/http/client";
import { useAuth } from "@/lib/auth";
import { PageHeading } from "@/components/ui/page-heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
type List = {
  id: string;
  name: string;
  currency: string;
  active: boolean;
  items: Array<{
    id: string;
    productName: string;
    sku: string;
    unitPrice: string;
  }>;
};
export default function PriceLists() {
  const { user } = useAuth();
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ["pricing"],
    queryFn: () => request<List[]>("/api/pricing"),
  });
  const [edits, setEdits] = useState<Record<string, string>>({});
  const save = useMutation({
    mutationFn: (id: string) =>
      request("/api/pricing", {
        method: "PATCH",
        body: JSON.stringify({ id, unitPrice: Number(edits[id]) }),
      }),
    onSuccess: () => {
      setEdits({});
      void client.invalidateQueries();
    },
  });
  return (
    <div className="space-y-7">
      <PageHeading
        eyebrow="Catalog"
        title="Price lists"
        description="Saved selling prices by currency. Approved quotations retain their recorded prices when the catalog changes."
      />
      {(query.error || save.error) && (
        <p role="alert" className="rounded-lg bg-rose-50 p-4 text-rose-800">
          {query.error?.message ?? save.error?.message}
        </p>
      )}
      {query.isLoading && <p>Loading price lists...</p>}
      {query.data?.map((list) => (
        <Card key={list.id}>
          <CardHeader>
            <CardTitle>{list.name}</CardTitle>
            <p className="text-sm text-slate-500">
              {list.currency} ? {list.active ? "Active" : "Inactive"} ?{" "}
              {list.items.length} products
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {list.items.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-3 border-b border-slate-100 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold">{item.productName}</p>
                  <p className="text-xs text-slate-500">{item.sku}</p>
                </div>
                {user?.role === "ADMIN" ? (
                  <div className="flex gap-2">
                    <Input
                      className="w-36 font-mono"
                      aria-label={"Price for " + item.productName}
                      type="number"
                      min={0.01}
                      step="0.01"
                      value={edits[item.id] ?? item.unitPrice}
                      onChange={(e) =>
                        setEdits({ ...edits, [item.id]: e.target.value })
                      }
                    />
                    <Button
                      variant="outline"
                      disabled={edits[item.id] === undefined || save.isPending}
                      onClick={() => save.mutate(item.id)}
                    >
                      Save
                    </Button>
                  </div>
                ) : (
                  <span className="font-mono">
                    {new Intl.NumberFormat("en", {
                      style: "currency",
                      currency: list.currency,
                    }).format(Number(item.unitPrice))}
                  </span>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
