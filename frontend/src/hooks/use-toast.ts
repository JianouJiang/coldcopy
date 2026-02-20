type Toast = {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
};

let toastId = 0;
const listeners: Set<(toast: Toast) => void> = new Set();

export function useToast() {
  return {
    toast: (options: { message: string; type?: 'success' | 'error' | 'info'; duration?: number }) => {
      const toast: Toast = {
        id: String(toastId++),
        message: options.message,
        type: options.type || 'info',
        duration: options.duration || 5000,
      };

      listeners.forEach((listener) => listener(toast));

      if (toast.duration) {
        setTimeout(() => {
          // Toast will auto-dismiss
        }, toast.duration);
      }
    },
    addListener: (listener: (toast: Toast) => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
