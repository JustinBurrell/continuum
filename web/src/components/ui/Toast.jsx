import { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

const ToastContext = createContext(null);

const icons = {
  success: <CheckCircle size={16} className="text-green-600" />,
  error: <AlertCircle size={16} className="text-red-500" />,
  info: <Info size={16} className="text-primary" />,
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback(({ message, type = 'info', duration = 4000 }) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div aria-live="polite" aria-atomic="false" className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'flex items-start gap-3 bg-card border border-border rounded-xl shadow-card-hover px-4 py-3 animate-in slide-in-from-bottom-2'
            )}
          >
            <div className="mt-0.5 flex-shrink-0">{icons[t.type]}</div>
            <p className="text-sm text-foreground flex-1">{t.message}</p>
            <button
              aria-label="Dismiss notification"
              onClick={() => dismiss(t.id)}
              className="text-secondary hover:text-foreground flex-shrink-0"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be inside ToastProvider');
  return ctx;
}
