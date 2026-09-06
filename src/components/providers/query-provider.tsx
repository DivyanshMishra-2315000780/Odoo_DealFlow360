'use client';

import React, { createContext, useContext, useState, useId } from 'react';
import { MutationCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

interface ToastItem {
  id: string;
  title: string;
  description?: string;
  type?: 'success' | 'warning' | 'error' | 'info';
}

interface ToastContextValue {
  toast: (options: { title: string; description?: string; type?: ToastItem['type'] }) => void;
}

const ToastContext = createContext<ToastContextValue>({
  toast: () => {},
});

export const useToast = () => useContext(ToastContext);

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        mutationCache: new MutationCache({ onSuccess: () => { void queryClient.invalidateQueries(); } }),
        defaultOptions: {
          queries: {
            staleTime: 1000 * 30, // 30 seconds
            refetchOnWindowFocus: true,
          },
        },
      })
  );

  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = ({
    title,
    description,
    type = 'info',
  }: {
    title: string;
    description?: string;
    type?: ToastItem['type'];
  }) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, description, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ToastContext.Provider value={{ toast }}>
        {children}

        {/* Global Toast Container */}
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none px-4">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-lg shadow-lg border text-sm transition-all duration-200 bg-white ${
                t.type === 'success'
                  ? 'border-emerald-200 text-emerald-950 shadow-emerald-50'
                  : t.type === 'warning'
                  ? 'border-amber-200 text-amber-950 shadow-amber-50'
                  : t.type === 'error'
                  ? 'border-rose-200 text-rose-950 shadow-rose-50'
                  : 'border-slate-200 text-slate-900 shadow-slate-50'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {t.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                {t.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-600" />}
                {t.type === 'error' && <XCircle className="w-5 h-5 text-rose-600" />}
                {t.type === 'info' && <Info className="w-5 h-5 text-teal-600" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold">{t.title}</p>
                {t.description && (
                  <p className="mt-1 text-xs opacity-90 leading-relaxed">{t.description}</p>
                )}
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="shrink-0 p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </ToastContext.Provider>
    </QueryClientProvider>
  );
}
