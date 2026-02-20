import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

type Toast = {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
};

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const { addListener } = useToast();

  useEffect(() => {
    const unsubscribe = addListener((toast) => {
      setToasts((prev) => [...prev, toast]);

      if (toast.duration) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== toast.id));
        }, toast.duration);
      }
    });

    return unsubscribe;
  }, [addListener]);

  return (
    <div className="fixed bottom-4 right-4 space-y-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`p-4 rounded-lg text-white text-sm pointer-events-auto ${
            toast.type === 'error'
              ? 'bg-red-500'
              : toast.type === 'success'
                ? 'bg-green-500'
                : 'bg-blue-500'
          }`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
