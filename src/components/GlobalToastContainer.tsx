import React from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Info,
  TrendingUp,
  TrendingDown,
  Sliders,
  X,
  Sparkles,
  Cloud
} from 'lucide-react';
import { ToastNotification } from '../services/toastService';

interface GlobalToastContainerProps {
  toasts: ToastNotification[];
  onDismiss: (id: string) => void;
}

export const GlobalToastContainer: React.FC<GlobalToastContainerProps> = ({
  toasts,
  onDismiss
}) => {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div
      id="global-toast-container"
      className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 sm:left-auto sm:right-6 sm:translate-x-0 z-[1000] flex flex-col-reverse gap-2.5 pointer-events-none max-w-sm sm:max-w-md w-[calc(100vw-2rem)]"
      role="region"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((toast) => {
        const isUp = toast.type === 'up';
        const isDown = toast.type === 'down';
        const isInfo = toast.type === 'info';
        const isError = toast.type === 'error';
        const isWarning = toast.type === 'warning';

        return (
          <div
            key={toast.id}
            id={`toast-item-${toast.id}`}
            className={`pointer-events-auto p-3.5 sm:p-4 rounded-2xl border shadow-2xl backdrop-blur-xl flex items-start gap-3 transition-all duration-300 transform animate-in fade-in slide-in-from-bottom-3 ${
              isUp
                ? 'bg-slate-900/95 border-emerald-500/50 shadow-emerald-950/60 text-slate-100'
                : isDown
                ? 'bg-slate-900/95 border-rose-500/50 shadow-rose-950/60 text-slate-100'
                : isError
                ? 'bg-slate-900/95 border-red-500/50 shadow-red-950/60 text-slate-100'
                : isWarning
                ? 'bg-slate-900/95 border-amber-500/50 shadow-amber-950/60 text-slate-100'
                : isInfo
                ? 'bg-slate-900/95 border-cyan-500/50 shadow-cyan-950/60 text-slate-100'
                : 'bg-slate-900/95 border-blue-500/50 shadow-blue-950/60 text-slate-100'
            }`}
          >
            {/* Status Icon */}
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border mt-0.5 ${
                isUp
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                  : isDown
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                  : isError
                  ? 'bg-red-500/20 border-red-500/40 text-red-400'
                  : isWarning
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                  : isInfo
                  ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400'
                  : 'bg-blue-500/20 border-blue-500/40 text-blue-400'
              }`}
            >
              {isUp ? (
                <TrendingUp className="w-4 h-4" />
              ) : isDown ? (
                <TrendingDown className="w-4 h-4" />
              ) : isError ? (
                <AlertCircle className="w-4 h-4" />
              ) : isWarning ? (
                <Sliders className="w-4 h-4" />
              ) : isInfo ? (
                <Info className="w-4 h-4" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              )}
            </div>

            {/* Notification Content */}
            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className="text-xs font-bold tracking-wide text-white">
                  {toast.title}
                </h4>
                <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-slate-800 border border-slate-700 text-cyan-300 font-mono flex items-center gap-0.5">
                  <Cloud className="w-2.5 h-2.5 text-cyan-400" />
                  Live
                </span>
              </div>

              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                {toast.message}
              </p>

              {toast.subMessage && (
                <p className="text-[10px] font-mono text-cyan-400/90 mt-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-cyan-400 shrink-0" />
                  <span className="truncate">{toast.subMessage}</span>
                </p>
              )}
            </div>

            {/* Dismiss Button */}
            <button
              id={`dismiss-toast-${toast.id}`}
              onClick={() => onDismiss(toast.id)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors shrink-0"
              title="Dismiss"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
