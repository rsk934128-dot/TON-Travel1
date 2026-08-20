/**
 * Global Toast Notification Service
 * Manages an array of reactive toast notifications across the entire application.
 */

export interface ToastNotification {
  id: string;
  title: string;
  message: string;
  type?: 'success' | 'info' | 'warning' | 'error' | 'up' | 'down';
  subMessage?: string;
  duration?: number;
  createdAt: number;
}

type ToastListener = (toasts: ToastNotification[]) => void;

let toastsState: ToastNotification[] = [];
const listeners = new Set<ToastListener>();

export function getToasts(): ToastNotification[] {
  return [...toastsState];
}

export function subscribeToToasts(listener: ToastListener): () => void {
  listeners.add(listener);
  listener([...toastsState]);
  return () => {
    listeners.delete(listener);
  };
}

function notifyListeners() {
  const current = [...toastsState];
  listeners.forEach((listener) => {
    try {
      listener(current);
    } catch (e) {
      console.error('Error in toast listener:', e);
    }
  });
}

/**
 * Trigger a new global toast notification
 */
export function addToast(toast: {
  title: string;
  message: string;
  type?: 'success' | 'info' | 'warning' | 'error' | 'up' | 'down';
  subMessage?: string;
  duration?: number;
}): string {
  const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const duration = toast.duration ?? 4500;
  const newToast: ToastNotification = {
    ...toast,
    id,
    createdAt: Date.now()
  };

  // Keep a maximum of 3 concurrent toasts to prevent UI clutter
  toastsState = [newToast, ...toastsState.slice(0, 2)];
  notifyListeners();

  if (duration > 0) {
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }

  return id;
}

/**
 * Remove a toast by id
 */
export function removeToast(id: string) {
  const initialLength = toastsState.length;
  toastsState = toastsState.filter((t) => t.id !== id);
  if (toastsState.length !== initialLength) {
    notifyListeners();
  }
}

/**
 * Clear all active toasts
 */
export function clearToasts() {
  toastsState = [];
  notifyListeners();
}
