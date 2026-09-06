"use client";
import React, {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
} from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}
const DialogLabel = createContext<string | undefined>(undefined);
export function Dialog({ open, onOpenChange, children }: DialogProps) {
  const panel = useRef<HTMLDivElement>(null);
  const close = useRef(onOpenChange);
  const titleId = useId();
  useEffect(() => {
    close.current = onOpenChange;
  }, [onOpenChange]);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.focus();
    const keydown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close.current(false);
      }
      if (e.key === "Tab") {
        const elements = Array.from(
          panel.current?.querySelectorAll<HTMLElement>(
            'button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]',
          ) ?? [],
        ).filter((el) => el.getClientRects().length);
        const first = elements[0],
          last = elements[elements.length - 1];
        if (!first) {
          e.preventDefault();
          return;
        }
        if (
          e.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === panel.current)
        ) {
          e.preventDefault();
          last.focus();
        } else if (
          !e.shiftKey &&
          (document.activeElement === last ||
            document.activeElement === panel.current)
        ) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", keydown);
    return () => {
      document.removeEventListener("keydown", keydown);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [open]);
  if (!open) return null;
  return (
    <DialogLabel.Provider value={titleId}>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          aria-hidden="true"
          className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm"
          onClick={() => onOpenChange(false)}
        />
        <div
          ref={panel}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
          className="relative z-50 max-h-[calc(100dvh-2rem)] w-full max-w-xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-5 shadow-xl sm:p-6"
        >
          <button
            type="button"
            aria-label="Close dialog"
            onClick={() => onOpenChange(false)}
            className="absolute right-3 top-3 rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            <X size={18} />
          </button>
          {children}
        </div>
      </div>
    </DialogLabel.Provider>
  );
}
export function DialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mb-5 flex flex-col space-y-2 pr-8", className)}
      {...props}
    />
  );
}
export function DialogTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  const id = useContext(DialogLabel);
  return (
    <h2
      id={id}
      className={cn(
        "text-lg font-semibold tracking-tight text-slate-950",
        className,
      )}
      {...props}
    />
  );
}
export function DialogDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-sm leading-6 text-slate-500", className)}
      {...props}
    />
  );
}
export function DialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "mt-5 flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end",
        className,
      )}
      {...props}
    />
  );
}
