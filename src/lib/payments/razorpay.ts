export interface CheckoutOrder {
  paymentId: string;
  keyId: string;
  orderId: string;
  amount: number;
  currency: string;
}
export interface CheckoutReceipt {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}
export interface VerificationRequest extends CheckoutReceipt {
  paymentId: string;
}
interface CheckoutOptions {
  key: string;
  order_id: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  theme: { color: string };
  handler: (receipt: CheckoutReceipt) => void;
  modal: { ondismiss: () => void };
  retry: { enabled: boolean };
}
interface CheckoutInstance {
  open: () => void;
  close: () => void;
  on: (
    event: "payment.failed",
    callback: (event: { error?: { description?: string } }) => void,
  ) => void;
}
declare global {
  interface Window {
    Razorpay?: new (options: CheckoutOptions) => CheckoutInstance;
  }
}
let loading: Promise<void> | undefined;
export function loadCheckout(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  if (loading) return loading;
  loading = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    const timer = window.setTimeout(() => fail(), 20000);
    const fail = () => {
      window.clearTimeout(timer);
      script.remove();
      loading = undefined;
      reject(
        new Error(
          "Payment checkout could not load. Check your connection and try again.",
        ),
      );
    };
    script.onload = () => {
      window.clearTimeout(timer);
      if (window.Razorpay) resolve();
      else fail();
    };
    script.onerror = fail;
    document.head.appendChild(script);
  });
  return loading;
}
export function openCheckout(
  order: CheckoutOrder,
  invoiceNumber: string,
  onSuccess: (receipt: VerificationRequest) => void,
  onDismiss: () => void,
  onFailure: (message: string) => void,
) {
  if (!window.Razorpay) throw new Error("Payment checkout is unavailable.");
  let succeeded = false;
  let failed = false;
  const checkout = new window.Razorpay({
    key: order.keyId,
    order_id: order.orderId,
    amount: order.amount,
    currency: order.currency,
    name: "DealFlow360",
    description: "Invoice " + invoiceNumber,
    theme: { color: "#0d9488" },
    retry: { enabled: false },
    handler: (receipt) => {
      if (succeeded) return;
      succeeded = true;
      onSuccess({ ...receipt, paymentId: order.paymentId });
    },
    modal: {
      ondismiss: () => {
        if (!succeeded && !failed) onDismiss();
      },
    },
  });
  checkout.on("payment.failed", (event) => {
    if (succeeded || failed) return;
    failed = true;
    checkout.close();
    onFailure(
      event.error?.description ??
        "The payment was unsuccessful. You can try again.",
    );
  });
  checkout.open();
  return checkout;
}
