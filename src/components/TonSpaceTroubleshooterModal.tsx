import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  Wallet,
  Wifi,
  Fuel,
  Clock,
  Layers,
  ArrowRight,
  HelpCircle,
  X,
  Copy,
  Check,
  Sparkles
} from 'lucide-react';
import { UserState } from '../types';

interface TonSpaceTroubleshooterModalProps {
  isOpen: boolean;
  onClose: () => void;
  userState?: UserState;
  onRetryTransaction?: () => void;
  onOpenTonApiInspector?: () => void;
}

export const TonSpaceTroubleshooterModal: React.FC<TonSpaceTroubleshooterModalProps> = ({
  isOpen,
  onClose,
  userState,
  onRetryTransaction,
  onOpenTonApiInspector
}) => {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<{
    status: 'ok' | 'warning' | 'error';
    message: string;
  } | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const runDiagnostics = () => {
    setIsVerifying(true);
    setVerificationResult(null);

    setTimeout(() => {
      setIsVerifying(false);
      const balance = userState?.tonBalance || 0;
      if (balance < 0.05) {
        setVerificationResult({
          status: 'warning',
          message: `Gas Warning: Your balance is ${balance.toFixed(2)} TON. TON Space requires at least ~0.02-0.05 TON reserved for blockchain network execution fees.`
        });
      } else {
        setVerificationResult({
          status: 'ok',
          message: `Connection & Gas Ready: Wallet has ${balance.toFixed(2)} TON. Network connection is active. You can safely retry the transaction.`
        });
      }
    }, 1200);
  };

  const steps = [
    {
      id: 1,
      title: 'Verify TON Gas Fee Balance',
      icon: Fuel,
      desc: 'Ensure you have at least 0.05 TON reserved in your TON Space wallet for smart contract gas execution.',
      solution: 'Every transaction on the TON blockchain requires a tiny gas fee (~0.005–0.02 TON). If your balance is exactly the booking amount with 0 TON left for gas, the blockchain rejects transaction creation.'
    },
    {
      id: 2,
      title: 'Check Previous Pending Transactions (Seqno Sync)',
      icon: Clock,
      desc: 'TON accounts use an incremental sequence number (seqno). If a previous transfer is stuck, new ones fail.',
      solution: 'Open Telegram @wallet -> TON Space -> check Activity history. If a previous transfer is pending, wait 30–60 seconds for it to finalize before sending a new one.'
    },
    {
      id: 3,
      title: 'Refresh Telegram TON Space Session',
      icon: RefreshCw,
      desc: 'Telegram Mini App or TON Connect sessions can expire or lose WebSocket connectivity.',
      solution: 'Close the Telegram Mini App completely, re-open @wallet in Telegram, tap TON Space settings, and reload the app session.'
    },
    {
      id: 4,
      title: 'Verify Internet & TON Blockchain Status',
      icon: Wifi,
      desc: 'Unstable connections or momentary validator lag can cause timeouts during broadcast.',
      solution: 'Switch between Wi-Fi and Mobile Data (4G/5G). You can also verify global TON block production on tonviewer.com.'
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-amber-500/40 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in text-slate-100">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-950/70 via-slate-900 to-cyan-950/70 border-b border-amber-500/30 p-4 sm:p-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                TON Space Transaction Troubleshooting
              </h2>
              <p className="text-xs text-slate-400">
                Resolution guide for "Transaction was not successfully created in blockchain"
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          
          {/* Main Error Explanation Card */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2 text-xs">
            <div className="flex items-center gap-2 font-bold text-amber-300">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Why did this error occur?</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              When TON Space returns this error, the transaction payload was prepared but rejected prior to block confirmation. 
              The most common causes are <strong>insufficient gas reserve (&lt; 0.02 TON)</strong>, a <strong>stuck wallet sequence number (seqno)</strong>, or a <strong>temporary network timeout</strong>.
            </p>
          </div>

          {/* Diagnostic Runner */}
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Quick Wallet Health Diagnostic
                </h3>
                <p className="text-[11px] text-slate-400">
                  Connected Address: <span className="font-mono text-cyan-300">{userState?.connectedWallet || 'EQB...TonSpace'}</span>
                </p>
              </div>

              <button
                onClick={runDiagnostics}
                disabled={isVerifying}
                className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
                <span>{isVerifying ? 'Checking...' : 'Run Diagnostics'}</span>
              </button>
            </div>

            {verificationResult && (
              <div
                className={`p-3 rounded-xl border text-xs font-medium flex items-start gap-2 ${
                  verificationResult.status === 'ok'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                }`}
              >
                {verificationResult.status === 'ok' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <span>{verificationResult.message}</span>
              </div>
            )}
          </div>

          {/* Step by Step Troubleshooting Guide */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Follow These Resolution Steps:
            </h3>

            <div className="space-y-2.5">
              {steps.map((step) => {
                const Icon = step.icon;
                const isSelected = activeStep === step.id;

                return (
                  <div
                    key={step.id}
                    className={`rounded-2xl border transition-all cursor-pointer overflow-hidden ${
                      isSelected
                        ? 'bg-slate-950 border-cyan-500/50 shadow-lg shadow-cyan-950/40'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                    onClick={() => setActiveStep(step.id)}
                  >
                    <div className="p-3.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                            isSelected
                              ? 'bg-cyan-500 text-slate-950'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {step.id}
                        </div>
                        <div>
                          <div className="font-bold text-white text-xs flex items-center gap-2">
                            <span>{step.title}</span>
                          </div>
                          <div className="text-[11px] text-slate-400">{step.desc}</div>
                        </div>
                      </div>

                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isSelected ? 'text-cyan-400' : 'text-slate-500'
                        }`}
                      />
                    </div>

                    {isSelected && (
                      <div className="px-4 pb-3.5 pt-1 text-xs border-t border-slate-800/80 bg-slate-900/40 space-y-2">
                        <p className="text-slate-300 leading-relaxed">
                          {step.solution}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Helpful Actions */}
          <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-center justify-between gap-2 flex-wrap text-xs">
            <div className="text-slate-400 flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Verify live TON Explorer:</span>
            </div>

            <div className="flex items-center gap-2">
              {onOpenTonApiInspector && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenTonApiInspector();
                  }}
                  className="px-3 py-1 bg-cyan-950/80 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-500/30 rounded-lg font-semibold flex items-center gap-1 text-[11px]"
                >
                  <span>TON API v2 Inspector</span>
                </button>
              )}

              <a
                href="https://tonviewer.com"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold flex items-center gap-1 text-[11px]"
              >
                <span>Tonviewer Explorer</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-950 border-t border-slate-800 p-3 sm:p-4 flex items-center justify-between gap-3 text-xs">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-all text-xs"
          >
            Dismiss
          </button>

          {onRetryTransaction && (
            <button
              onClick={() => {
                onClose();
                onRetryTransaction();
              }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold transition-all text-xs flex items-center gap-1.5 shadow-lg active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Transaction Now</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
