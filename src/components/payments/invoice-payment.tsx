"use client";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CreditCard, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { request } from "@/lib/http/client";
import { Invoice } from "@/types/dealflow";
import {
  loadCheckout,
  openCheckout,
  CheckoutOrder,
  VerificationRequest,
} from "@/lib/payments/razorpay";
export function InvoicePayment({ invoice }: { invoice: Invoice }) {
  const { user } = useAuth();
  const client = useQueryClient();
  const locked = useRef(false);
  const mounted = useRef(true);
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState<VerificationRequest | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const storageKey = "dealflow-payment:" + user?.id + ":" + invoice.id;
  useEffect(() => {
    mounted.current = true;
    let saved: VerificationRequest | null = null;
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (
          typeof parsed.paymentId === "string" &&
          typeof parsed.razorpay_order_id === "string" &&
          typeof parsed.razorpay_payment_id === "string" &&
          typeof parsed.razorpay_signature === "string"
        )
          saved = parsed;
      }
    } catch {}
    // Restore a provider receipt from external browser storage after navigation/reload.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReceipt(saved);
    return () => {
      mounted.current = false;
    };
  }, [storageKey]);
  const payable =
    ["ISSUED", "PARTIALLY_PAID", "OVERDUE"].includes(invoice.status) &&
    invoice.remainingAmount > 0 &&
    invoice.isShipped;
  const checkoutMutation = useMutation({
    mutationFn: () =>
      request<CheckoutOrder>("/api/payments/checkout", {
        method: "POST",
        body: JSON.stringify({ invoiceId: invoice.id }),
      }),
  });
  const verification = useMutation({
    mutationFn: (value: VerificationRequest) =>
      request<{ status: string }>("/api/payments/verify", {
        method: "POST",
        body: JSON.stringify(value),
      }),
  });
  const finish = () => {
    locked.current = false;
    if (mounted.current) setBusy(false);
  };
  const verify = async (value: VerificationRequest) => {
    try {
      const payment = await verification.mutateAsync(value);
      if (payment.status !== "SUCCESS")
        throw new Error("Payment confirmation is still pending.");
      try {
        sessionStorage.removeItem(storageKey);
      } catch {}
      if (mounted.current) {
        setReceipt(null);
        setError(false);
        setMessage("Payment verified. Your invoice balance has been updated.");
      }
      await client.invalidateQueries();
    } catch (cause) {
      if (mounted.current) {
        setError(true);
        setMessage(
          (cause instanceof Error ? cause.message : "Verification failed.") +
            " If you were charged, do not pay again. Retry verification or contact finance with payment reference " +
            value.razorpay_payment_id +
            ".",
        );
      }
    } finally {
      finish();
    }
  };
  const pay = async () => {
    if (locked.current || !payable) return;
    locked.current = true;
    setBusy(true);
    setError(false);
    setMessage("Opening secure checkout...");
    if (receipt) {
      await verify(receipt);
      return;
    }
    try {
      await loadCheckout();
      const order = await checkoutMutation.mutateAsync();
      if (!mounted.current) {
        finish();
        return;
      }
      openCheckout(
        order,
        invoice.invoiceNumber ?? invoice.id,
        (value) => {
          try {
            sessionStorage.setItem(storageKey, JSON.stringify(value));
          } catch {}
          if (mounted.current) {
            setReceipt(value);
            setMessage("Confirming payment with the server...");
          }
          void verify(value);
        },
        () => {
          if (mounted.current)
            setMessage("Checkout closed. No payment has been confirmed.");
          finish();
          void client.invalidateQueries();
        },
        (reason) => {
          if (mounted.current) {
            setError(true);
            setMessage(reason);
          }
          finish();
          void client.invalidateQueries();
        },
      );
    } catch (cause) {
      setError(true);
      setMessage(
        cause instanceof Error ? cause.message : "Could not open checkout.",
      );
      finish();
    }
  };
  if (!payable && !message) return null;
  return (
    <div className="space-y-3 print:hidden">
      {payable && (
        <Button onClick={() => void pay()} disabled={busy} className="gap-2">
          {receipt ? <RefreshCw size={16} /> : <CreditCard size={16} />}{" "}
          {busy
            ? verification.isPending
              ? "Verifying payment..."
              : "Payment in progress..."
            : receipt
              ? "Retry verification"
              : "Pay securely"}
        </Button>
      )}
      {receipt && (
        <p className="break-all text-xs text-slate-500">
          Payment reference: {receipt.razorpay_payment_id}
        </p>
      )}
      {message && (
        <p
          role={error ? "alert" : "status"}
          className={
            "rounded-lg p-3 text-sm leading-6 " +
            (error ? "bg-rose-50 text-rose-900" : "bg-teal-50 text-teal-950")
          }
        >
          {message}
        </p>
      )}
    </div>
  );
}
