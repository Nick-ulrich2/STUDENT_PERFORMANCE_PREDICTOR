'use client';

import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

type ToastItem = { id: number; message: string; error: boolean; leaving: boolean };
type ToastFn = (message: string, options?: { error?: boolean }) => void;

const ToastContext = createContext<ToastFn | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const toast = useCallback<ToastFn>((message, options) => {
    const id = nextId.current++;
    setItems((list) => [...list, { id, message, error: Boolean(options?.error), leaving: false }]);
    setTimeout(() => setItems((list) => list.map((t) => (t.id === id ? { ...t, leaving: true } : t))), 3800);
    setTimeout(() => setItems((list) => list.filter((t) => t.id !== id)), 4220);
  }, []);

  const value = useMemo(() => toast, [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toasts" aria-live="polite">
        {items.map((t) => (
          <div
            key={t.id}
            className={`toast${t.error ? ' err' : ''}`}
            role={t.error ? 'alert' : 'status'}
            style={t.leaving ? { opacity: 0, transform: 'translateY(10px)', transition: 'opacity .4s, transform .4s' } : undefined}
          >
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastFn {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast() must be used within <ToastProvider>.');
  return ctx;
}
