import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
}

interface ToastContextType {
  addToast: (type: ToastType, message: string, title?: string) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((type: ToastType, message: string, title?: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, type, message, title }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const success = useCallback((message: string, title?: string) => addToast('success', message, title), [addToast]);
  const error = useCallback((message: string, title?: string) => addToast('error', message, title), [addToast]);
  const info = useCallback((message: string, title?: string) => addToast('info', message, title), [addToast]);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast, success, error, info }}>
      {children}
      <div className="fixed top-20 right-4 md:right-8 z-[9999] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => {
            const isSuccess = toast.type === 'success';
            const isError = toast.type === 'error';
            const Icon = isSuccess ? CheckCircle2 : isError ? XCircle : Info;
            const bgClass = isSuccess ? 'bg-emerald-50 border-emerald-200' : isError ? 'bg-rose-50 border-rose-200' : 'bg-blue-50 border-blue-200';
            const iconClass = isSuccess ? 'text-emerald-500' : isError ? 'text-rose-500' : 'text-blue-500';
            const titleClass = isSuccess ? 'text-emerald-900' : isError ? 'text-rose-900' : 'text-blue-900';
            const msgClass = isSuccess ? 'text-emerald-700' : isError ? 'text-rose-700' : 'text-blue-700';

            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg shadow-black/5 w-80 backdrop-blur-md ${bgClass}`}
              >
                <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconClass}`} />
                <div className="flex-1 min-w-0">
                  {toast.title && <p className={`text-sm font-bold ${titleClass}`}>{toast.title}</p>}
                  <p className={`text-xs mt-0.5 ${msgClass}`}>{toast.message}</p>
                </div>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="shrink-0 p-1 rounded-md hover:bg-black/5 transition-colors"
                >
                  <X className={`w-4 h-4 ${iconClass}`} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}
