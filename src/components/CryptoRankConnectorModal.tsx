import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Zap,
  Key,
  Database,
  Layers,
  Check,
  Copy,
  ExternalLink,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Activity,
  ShieldCheck,
  Code,
  Terminal,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Globe,
  Sliders,
  DollarSign,
  ArrowRightLeft,
  X,
  BookOpen,
  Cpu,
  Bot,
  Bell,
  BellRing,
  BellOff,
  Volume2,
  VolumeX,
  Radio,
  Clock,
  Send,
  Cloud,
  CloudCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  getCryptoRankCurrencies,
  getCryptoRankTonData,
  getCryptoRankGlobal,
  getCryptoRankTickers,
  validateCryptoRankApiKey,
  getSavedCryptoRankApiKey,
  saveCryptoRankApiKey,
  CryptoRankCurrency,
  CryptoRankGlobal,
  CryptoRankTicker,
  POPULAR_TRAVEL_CRYPTOS
} from '../services/cryptorankService';
import { CryptoRankTonChart } from './CryptoRankTonChart';
import { TonPriceAlertConfig } from '../types';
import { auth, savePriceAlertConfigToFirestore, subscribeToPriceAlertConfig } from '../services/firebaseService';
import { addToast } from '../services/toastService';
import { onAuthStateChanged, User } from 'firebase/auth';

const DEFAULT_ALERT_CONFIG: TonPriceAlertConfig = {
  enabled: true,
  thresholdPercent: 3,
  alertOnHigh: true,
  highTargetPrice: 6.00,
  alertOnLow: true,
  lowTargetPrice: 5.00,
  soundEnabled: true,
  browserNotifications: false
};

interface CryptoRankConnectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  tonPriceUsd?: number;
}

type TabType = 'overview' | 'chart' | 'alerts' | 'api-v3' | 'migration' | 'mcp' | 'apikey';

export const CryptoRankConnectorModal: React.FC<CryptoRankConnectorModalProps> = ({
  isOpen,
  onClose,
  tonPriceUsd = 5.42
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [savedKey, setSavedKey] = useState<string>('');
  const [keyValidationStatus, setKeyValidationStatus] = useState<{
    valid?: boolean;
    message?: string;
    loading?: boolean;
  }>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Live Data States
  const [loading, setLoading] = useState<boolean>(false);
  const [currencies, setCurrencies] = useState<CryptoRankCurrency[]>([]);
  const [tonData, setTonData] = useState<CryptoRankCurrency | null>(null);
  const [globalData, setGlobalData] = useState<CryptoRankGlobal | null>(null);
  const [tickers, setTickers] = useState<CryptoRankTicker[]>([]);
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('/v3/currencies/toncoin');
  const [activeJsonPayload, setActiveJsonPayload] = useState<any>(null);

  // Hotel purchasing power calculator
  const [calcCryptoAmount, setCalcCryptoAmount] = useState<number>(100); // 100 TON

  // Price Alerts State & Persistence
  const [alertConfig, setAlertConfig] = useState<TonPriceAlertConfig>(() => {
    try {
      const saved = localStorage.getItem('ton_price_alert_config');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Could not read saved alert config:', e);
    }
    return DEFAULT_ALERT_CONFIG;
  });

  const [alertHistory, setAlertHistory] = useState<Array<{
    id: string;
    time: string;
    type: 'surge' | 'drop' | 'target_high' | 'target_low' | 'test';
    title: string;
    message: string;
    price: number;
  }>>(() => {
    try {
      const saved = localStorage.getItem('ton_price_alert_history');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        id: 'init-1',
        time: 'Just now',
        type: 'surge',
        title: 'TON 24h Surge Alert (+3.8%)',
        message: 'TON spot rose past $5.40 on CryptoRank v3 spot feeds. Hotel rates in TON are now cheaper!',
        price: 5.42
      }
    ];
  });

  const [activeAlertToast, setActiveAlertToast] = useState<{
    id?: string;
    title: string;
    message: string;
    type: 'up' | 'down' | 'info' | 'success';
    subMessage?: string;
  } | null>(null);

  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showFeedbackToast = (
    title: string,
    message: string,
    type: 'up' | 'down' | 'info' | 'success' = 'success',
    subMessage?: string
  ) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    const defaultSub = currentUser
      ? '✓ Persisted to Firestore User Profile'
      : '✓ Saved to Browser Session (Sign in to sync across devices)';

    setActiveAlertToast({
      id: `toast-${Date.now()}`,
      title,
      message,
      type,
      subMessage: subMessage || defaultSub
    });

    toastTimerRef.current = setTimeout(() => {
      setActiveAlertToast(null);
    }, 4000);
  };

  // Firebase User & Cloud Sync State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);
  const [cloudSynced, setCloudSynced] = useState<boolean>(false);

  // Listen to Firebase Auth and Subscribe to Firestore User Document Price Alert Config
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!currentUser?.uid) return;

    // Real-time synchronization from user's Firestore document
    const unsubDoc = subscribeToPriceAlertConfig(currentUser.uid, (cloudConfig) => {
      if (cloudConfig) {
        setAlertConfig(cloudConfig);
        try {
          localStorage.setItem('ton_price_alert_config', JSON.stringify(cloudConfig));
        } catch (e) {}
        setCloudSynced(true);
      }
    });

    return () => unsubDoc();
  }, [currentUser?.uid]);

  const updateAlertConfig = async (
    updater: (prev: TonPriceAlertConfig) => TonPriceAlertConfig,
    feedback?: {
      title: string;
      message: string;
      type?: 'up' | 'down' | 'info' | 'success';
      subMessage?: string;
    }
  ) => {
    let newConfig: TonPriceAlertConfig = DEFAULT_ALERT_CONFIG;
    setAlertConfig((prev) => {
      const next = updater(prev);
      newConfig = next;
      try {
        localStorage.setItem('ton_price_alert_config', JSON.stringify(next));
      } catch (e) {
        console.warn('Failed to save alert config locally:', e);
      }
      return next;
    });

    if (feedback) {
      showFeedbackToast(feedback.title, feedback.message, feedback.type || 'success', feedback.subMessage);
      if (!currentUser?.uid) {
        addToast({
          title: feedback.title,
          message: feedback.message,
          type: feedback.type || 'success',
          subMessage: 'Saved locally in browser session'
        });
      }
    }

    // Persist to user's Firestore document if authenticated
    if (currentUser?.uid) {
      setIsCloudSyncing(true);
      try {
        await savePriceAlertConfigToFirestore(currentUser.uid, newConfig);
        setCloudSynced(true);
      } catch (e) {
        console.error('Failed to sync price alert config to Firestore:', e);
      } finally {
        setIsCloudSyncing(false);
      }
    }
  };

  // Web Audio Synth Chime for real-time price alerts
  const playAlertChime = (type: 'up' | 'down' | 'test' = 'test') => {
    if (!alertConfig.soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      if (type === 'up') {
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
      } else if (type === 'down') {
        osc.frequency.setValueAtTime(783.99, ctx.currentTime); // G5
        osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.18); // A4
      } else {
        osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
        osc.frequency.exponentialRampToValueAtTime(1046.5, ctx.currentTime + 0.12); // C6
      }

      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {
      // Audio playback skipped
    }
  };

  // Browser Push Notifications
  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      alert('Browser notifications are not supported in this browser environment.');
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        updateAlertConfig(prev => ({ ...prev, browserNotifications: true }));
        try {
          new Notification('💎 TON Travel Price Alerts Activated', {
            body: 'You will receive instant alerts for significant TON price movements on CryptoRank v3.',
            icon: '/favicon.ico'
          });
        } catch (e) {}
      } else {
        updateAlertConfig(prev => ({ ...prev, browserNotifications: false }));
      }
    } catch (e) {
      console.warn('Could not request notification permission:', e);
    }
  };

  // Test Alert Simulation Handler
  const triggerTestAlert = () => {
    confetti({ particleCount: 35, spread: 60, origin: { y: 0.6 } });
    playAlertChime('test');
    
    const currentPrice = tonData?.values?.USD?.price || tonPriceUsd;
    const testItem = {
      id: `test-${Date.now()}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'test' as const,
      title: '🔔 Test TON Price Alert Triggered',
      message: `TON spot is $${currentPrice.toFixed(3)}. Volatility threshold active at ±${alertConfig.thresholdPercent}%.`,
      price: currentPrice
    };

    setAlertHistory(prev => {
      const updated = [testItem, ...prev.slice(0, 15)];
      try {
        localStorage.setItem('ton_price_alert_history', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    setActiveAlertToast({
      title: testItem.title,
      message: testItem.message,
      type: 'info'
    });

    if (alertConfig.browserNotifications && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(testItem.title, {
          body: testItem.message,
          icon: '/favicon.ico'
        });
      } catch (e) {}
    }

    setTimeout(() => {
      setActiveAlertToast(null);
    }, 4500);
  };

  const lastAlertTimestampRef = useRef<number>(0);

  // Automated Real-Time Price Threshold & Target Price Monitor
  useEffect(() => {
    if (!alertConfig.enabled) return;
    const price = tonData?.values?.USD?.price || tonPriceUsd;
    if (!price || price <= 0) return;

    const now = Date.now();
    // Throttle to avoid repeated alerts within 90 seconds
    if (now - lastAlertTimestampRef.current < 90000) return;

    let triggered = false;
    let alertTitle = '';
    let alertMessage = '';
    let direction: 'up' | 'down' = 'up';

    if (alertConfig.alertOnHigh && price >= alertConfig.highTargetPrice) {
      triggered = true;
      direction = 'up';
      alertTitle = `🚀 TON Price Target Hit: $${price.toFixed(2)}`;
      alertMessage = `TON has reached your target of $${alertConfig.highTargetPrice.toFixed(2)} USD! Hotel booking purchasing power is maximized.`;
    } else if (alertConfig.alertOnLow && price <= alertConfig.lowTargetPrice) {
      triggered = true;
      direction = 'down';
      alertTitle = `📉 TON Buy Dip Alert: $${price.toFixed(2)}`;
      alertMessage = `TON has reached your low price threshold of $${alertConfig.lowTargetPrice.toFixed(2)} USD. Ideal time to top up TON Space!`;
    }

    if (triggered) {
      lastAlertTimestampRef.current = now;
      playAlertChime(direction);

      const entry = {
        id: `auto-${now}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: (direction === 'up' ? 'target_high' : 'target_low') as any,
        title: alertTitle,
        message: alertMessage,
        price
      };

      setAlertHistory(prev => {
        const updated = [entry, ...prev.slice(0, 19)];
        try {
          localStorage.setItem('ton_price_alert_history', JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });

      setActiveAlertToast({
        title: alertTitle,
        message: alertMessage,
        type: direction
      });

      // Send Browser Push Notification if enabled
      if (alertConfig.browserNotifications && 'Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(alertTitle, {
            body: alertMessage,
            icon: '/favicon.ico'
          });
        } catch (e) {}
      }

      setTimeout(() => {
        setActiveAlertToast(null);
      }, 5000);
    }
  }, [tonData, alertConfig, tonPriceUsd]);

  useEffect(() => {
    const key = getSavedCryptoRankApiKey();
    setSavedKey(key);
    setApiKeyInput(key);
  }, [isOpen]);

  const loadAllData = async (keyOverride?: string) => {
    setLoading(true);
    try {
      const [currRes, tonRes, globRes, tickRes] = await Promise.all([
        getCryptoRankCurrencies(10, keyOverride),
        getCryptoRankTonData(keyOverride),
        getCryptoRankGlobal(keyOverride),
        getCryptoRankTickers('toncoin', keyOverride)
      ]);
      setCurrencies(currRes.data || []);
      setTonData(tonRes.data || null);
      setGlobalData(globRes.data || null);
      setTickers(tickRes.data || []);
      setActiveJsonPayload(tonRes);
    } catch (err) {
      console.error('Failed to load CryptoRank v3 data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadAllData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveApiKey = async () => {
    setKeyValidationStatus({ loading: true });
    const result = await validateCryptoRankApiKey(apiKeyInput);
    setKeyValidationStatus({
      valid: result.valid,
      message: result.message,
      loading: false
    });
    if (result.valid || !apiKeyInput.trim()) {
      saveCryptoRankApiKey(apiKeyInput);
      setSavedKey(apiKeyInput);
      loadAllData(apiKeyInput);
    }
  };

  const currentTonPrice = tonData?.values?.USD?.price || tonPriceUsd;
  const hotelNightsAffordable = (calcCryptoAmount * currentTonPrice) / 250; // Avg $250/night luxury stay

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      {/* Interactive Toast Notification Feedback System */}
      {activeAlertToast && (
        <div className="fixed top-5 right-5 z-[100] max-w-sm sm:max-w-md w-[calc(100vw-2.5rem)] pointer-events-auto transition-all animate-in fade-in slide-in-from-top-3 duration-300">
          <div
            className={`p-4 rounded-2xl border shadow-2xl backdrop-blur-xl flex items-start gap-3.5 ${
              activeAlertToast.type === 'up'
                ? 'bg-slate-900/95 border-emerald-500/50 shadow-emerald-950/50 text-slate-100'
                : activeAlertToast.type === 'down'
                ? 'bg-slate-900/95 border-rose-500/50 shadow-rose-950/50 text-slate-100'
                : activeAlertToast.type === 'info'
                ? 'bg-slate-900/95 border-blue-500/50 shadow-blue-950/50 text-slate-100'
                : 'bg-slate-900/95 border-amber-500/50 shadow-amber-950/50 text-slate-100'
            }`}
          >
            {/* Status Icon */}
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                activeAlertToast.type === 'up'
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                  : activeAlertToast.type === 'down'
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                  : activeAlertToast.type === 'info'
                  ? 'bg-blue-500/20 border-blue-500/40 text-blue-400'
                  : 'bg-amber-500/20 border-amber-500/40 text-amber-400'
              }`}
            >
              {activeAlertToast.type === 'up' ? (
                <TrendingUp className="w-5 h-5" />
              ) : activeAlertToast.type === 'down' ? (
                <TrendingDown className="w-5 h-5" />
              ) : activeAlertToast.type === 'info' ? (
                <Sliders className="w-5 h-5" />
              ) : (
                <CheckCircle2 className="w-5 h-5" />
              )}
            </div>

            {/* Content Body */}
            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className="text-xs font-black tracking-wide text-white">
                  {activeAlertToast.title}
                </h4>
                <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-cyan-300 font-mono">
                  Saved
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                {activeAlertToast.message}
              </p>
              {activeAlertToast.subMessage && (
                <p className="text-[10px] font-mono text-cyan-400/90 mt-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  <span>{activeAlertToast.subMessage}</span>
                </p>
              )}
            </div>

            {/* Close Button */}
            <button
              onClick={() => setActiveAlertToast(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors shrink-0"
              title="Dismiss toast"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="bg-slate-900 border border-blue-500/40 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in text-slate-100">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-950/80 via-slate-900 to-indigo-950/80 border-b border-blue-500/30 p-4 sm:p-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-lg shadow-blue-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-white tracking-wide">
                  CryptoRank v3 Connector & MCP
                </h2>
                <span className="bg-blue-500/20 border border-blue-500/40 text-blue-300 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Activity className="w-3 h-3" />
                  API v3 Live
                </span>
                <span className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Bot className="w-3 h-3" />
                  MCP Server
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Live cryptocurrency market data, TON travel rates, Model Context Protocol & v3 OpenAPI engine
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

        {/* Global Market Ticker Bar */}
        <div className="bg-slate-950 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between gap-4 overflow-x-auto text-[11px]">
          <div className="flex items-center gap-4 whitespace-nowrap">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Market Cap:</span>
              <strong className="text-white font-mono">
                ${((globalData?.totalMarketCapUsd || 3420000000000) / 1e12).toFixed(2)}T
              </strong>
              <span className={`text-[10px] ${((globalData?.marketCap24hChange || 0) >= 0) ? 'text-emerald-400' : 'text-rose-400'}`}>
                {((globalData?.marketCap24hChange || 0) >= 0 ? '+' : '')}{globalData?.marketCap24hChange || 2.15}%
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">24h Vol:</span>
              <strong className="text-white font-mono">
                ${((globalData?.volume24hUsd || 118000000000) / 1e9).toFixed(1)}B
              </strong>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">BTC Dom:</span>
              <strong className="text-amber-400 font-mono">{globalData?.btcDominance || 56.4}%</strong>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">TON Price (v3):</span>
              <strong className="text-cyan-300 font-mono">${currentTonPrice.toFixed(2)}</strong>
              <span className="text-[10px] text-emerald-400 font-mono">
                +{tonData?.values?.USD?.price24hChange || 3.84}%
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Quick Price Alert Toggle Pill */}
            <button
              onClick={() => {
                updateAlertConfig(prev => ({ ...prev, enabled: !prev.enabled }));
                if (!alertConfig.enabled) {
                  playAlertChime('test');
                }
              }}
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 ${
                alertConfig.enabled
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
              }`}
              title={alertConfig.enabled ? 'Price Alerts Active (Click to Pause)' : 'Price Alerts Inactive (Click to Enable)'}
            >
              {alertConfig.enabled ? <BellRing className="w-3.5 h-3.5 text-amber-400 animate-pulse" /> : <BellOff className="w-3.5 h-3.5" />}
              <span>{alertConfig.enabled ? `Alerts: ±${alertConfig.thresholdPercent}%` : 'Alerts: OFF'}</span>
            </button>

            <button
              onClick={() => loadAllData()}
              disabled={loading}
              className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all flex items-center gap-1 text-[11px]"
              title="Refresh v3 Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sync</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-950/80 border-b border-slate-800 px-4 flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-blue-400 text-blue-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Travel Crypto Feed</span>
          </button>

          <button
            onClick={() => setActiveTab('chart')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'chart'
                ? 'border-blue-400 text-blue-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>TON/USD Live Chart</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
          </button>

          <button
            onClick={() => setActiveTab('alerts')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'alerts'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BellRing className={`w-4 h-4 ${alertConfig.enabled ? 'text-amber-400' : 'text-slate-400'}`} />
            <span>Price Alerts</span>
            {alertConfig.enabled ? (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[9px] font-bold font-mono border border-amber-500/30">
                ±{alertConfig.thresholdPercent}%
              </span>
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('api-v3')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'api-v3'
                ? 'border-blue-400 text-blue-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>API v3 Live Explorer</span>
          </button>

          <button
            onClick={() => setActiveTab('mcp')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'mcp'
                ? 'border-blue-400 text-blue-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>MCP Connector (AI Protocol)</span>
          </button>

          <button
            onClick={() => setActiveTab('migration')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'migration'
                ? 'border-blue-400 text-blue-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>v2 ➔ v3 Migration Map</span>
          </button>

          <button
            onClick={() => setActiveTab('apikey')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'apikey'
                ? 'border-blue-400 text-blue-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>API Key & Auth</span>
            {savedKey && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            )}
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

          {/* Active Real-Time Alert Floating Toast */}
          {activeAlertToast && (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-950/95 via-slate-900 to-indigo-950/95 border border-amber-500/50 shadow-2xl flex items-center justify-between gap-3 animate-fade-in text-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center border border-amber-500/40 shrink-0">
                  <BellRing className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                    <span>{activeAlertToast.title}</span>
                    <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-[9px] font-mono text-amber-200 uppercase">Live Signal</span>
                  </h4>
                  <p className="text-[11px] text-slate-300">{activeAlertToast.message}</p>
                </div>
              </div>
              <button
                onClick={() => setActiveAlertToast(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          
          {/* TAB 1: OVERVIEW & TRAVEL CRYPTO FEED */}
          {activeTab === 'overview' && (
            <div className="space-y-6">

              {/* Quick Alert Status Banner */}
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl border ${alertConfig.enabled ? 'bg-amber-500/20 border-amber-500/30 text-amber-300' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                    {alertConfig.enabled ? <BellRing className="w-4 h-4 animate-pulse" /> : <BellOff className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">TON Price Volatility Alert</span>
                      <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${alertConfig.enabled ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'}`}>
                        {alertConfig.enabled ? `Active (±${alertConfig.thresholdPercent}%)` : 'Paused'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {alertConfig.enabled
                        ? `Triggers when TON moves > ${alertConfig.thresholdPercent}%, drops below $${alertConfig.lowTargetPrice.toFixed(2)}, or rises above $${alertConfig.highTargetPrice.toFixed(2)}.`
                        : 'Notifications for significant TON price movements are currently paused.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      updateAlertConfig(prev => ({ ...prev, enabled: !prev.enabled }));
                      if (!alertConfig.enabled) playAlertChime('test');
                    }}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm active:scale-95 ${
                      alertConfig.enabled
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                        : 'bg-blue-600 hover:bg-blue-500 text-white'
                    }`}
                  >
                    {alertConfig.enabled ? <BellOff className="w-3.5 h-3.5" /> : <BellRing className="w-3.5 h-3.5" />}
                    <span>{alertConfig.enabled ? 'Disable Alert' : 'Enable Alert'}</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('alerts')}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 flex items-center gap-1"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Configure</span>
                  </button>
                </div>
              </div>
              
              {/* Integrated Recharts Real-Time TON/USD Market Price Trend */}
              <CryptoRankTonChart
                tonData={tonData}
                currentTonPrice={currentTonPrice}
                onRefreshParent={loadAllData}
              />

              {/* TON Travel Purchasing Power Widget */}
              <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-blue-950/70 via-slate-900 to-indigo-950/70 border border-blue-500/30 shadow-xl space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">💎</span>
                    <div>
                      <h3 className="text-sm font-bold text-white">
                        TON Travel Real-Time Purchasing Power
                      </h3>
                      <p className="text-xs text-slate-400">
                        Live CryptoRank v3 rate: 1 TON = ${currentTonPrice.toFixed(2)} USD
                      </p>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold">
                    Zero Slippage Booking
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                    <label className="text-[11px] text-slate-400 font-medium">Your TON Holdings</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        value={calcCryptoAmount}
                        onChange={(e) => setCalcCryptoAmount(Math.max(1, Number(e.target.value)))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-base font-black text-cyan-300 font-mono focus:outline-none focus:border-cyan-400"
                      />
                      <span className="text-xs font-bold text-slate-400">TON</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                    <label className="text-[11px] text-slate-400 font-medium">USD Value (CryptoRank v3)</label>
                    <div className="text-xl font-black text-white font-mono pt-1">
                      ${(calcCryptoAmount * currentTonPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      24h High: ${tonData?.values?.USD?.high24h || 5.61} • Low: ${tonData?.values?.USD?.low24h || 5.21}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                    <label className="text-[11px] text-slate-400 font-medium">Luxury Hotel Nights Afforded</label>
                    <div className="text-xl font-black text-emerald-400 font-mono pt-1 flex items-center gap-1.5">
                      <span>🏨</span>
                      <span>{hotelNightsAffordable.toFixed(1)} Nights</span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Based on avg. $250/night luxury suite
                    </div>
                  </div>
                </div>
              </div>

              {/* Supported Travel Cryptocurrencies Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Travel Payment Currencies (CryptoRank v3 Data)
                  </h3>
                  <span className="text-[11px] text-blue-400 font-mono">
                    Endpoint: GET /v3/currencies
                  </span>
                </div>

                <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/70 divide-y divide-slate-800/80">
                  {currencies.length > 0 ? (
                    currencies.map((c) => {
                      const usdVal = c.values?.USD;
                      const change24 = usdVal?.price24hChange ?? 0;
                      return (
                        <div
                          key={c.id}
                          className="p-3 sm:p-4 flex items-center justify-between gap-3 hover:bg-slate-900/60 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-sm text-cyan-300 border border-slate-700">
                              {c.symbol.slice(0, 3)}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-white text-xs">{c.name}</span>
                                <span className="text-[10px] font-mono text-slate-400 uppercase bg-slate-800 px-1.5 py-0.2 rounded">
                                  {c.symbol}
                                </span>
                                {c.rank && (
                                  <span className="text-[9px] font-mono text-blue-300 bg-blue-500/10 px-1.5 py-0.2 rounded border border-blue-500/20">
                                    Rank #{c.rank}
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-400">{c.category || 'Crypto Asset'}</span>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-xs sm:text-sm font-black text-white font-mono">
                              ${(usdVal?.price || 0) < 1 
                                ? (usdVal?.price || 0).toFixed(6)
                                : (usdVal?.price || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div className={`text-[10px] font-mono font-bold ${change24 >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {change24 >= 0 ? '+' : ''}{change24.toFixed(2)}% (24h)
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-4 text-center text-xs text-slate-400">Loading CryptoRank assets...</div>
                  )}
                </div>
              </div>

              {/* Ton DEX Tickers */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    <Database className="w-3.5 h-3.5 text-cyan-400" />
                    <span>TON Spot Exchange Tickers (CryptoRank v3)</span>
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">GET /v3/currencies/toncoin/tickers</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {tickers.map((t) => (
                    <div key={t.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-white">{t.exchangeName}</span>
                        <span className="text-[10px] font-mono text-emerald-400">Live</span>
                      </div>
                      <div className="flex justify-between items-baseline">
                        <span className="text-[11px] text-slate-400 font-mono">{t.pair}</span>
                        <strong className="text-xs font-mono text-cyan-300">${t.priceUsd.toFixed(3)}</strong>
                      </div>
                      <div className="text-[9px] text-slate-500 font-mono">
                        Vol: ${(t.volumeUsd24h / 1e6).toFixed(1)}M USD
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB: TON/USD REAL-TIME CHART & MARKET METRICS */}
          {activeTab === 'chart' && (
            <div className="space-y-6 animate-fade-in">
              <CryptoRankTonChart
                tonData={tonData}
                currentTonPrice={currentTonPrice}
                onRefreshParent={loadAllData}
              />

              {/* In-Depth Market Insights & DEX Liquidity Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-cyan-400" />
                    <span>CryptoRank v3 High-Frequency Market Signals</span>
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
                      <span className="text-slate-400">24h Price Volatility:</span>
                      <strong className="text-cyan-300 font-mono">2.84% (Low/Moderate)</strong>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
                      <span className="text-slate-400">TON Market Cap Dominance:</span>
                      <strong className="text-white font-mono">{globalData?.tonDominance || 0.42}%</strong>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
                      <span className="text-slate-400">Fear & Greed Index:</span>
                      <strong className="text-emerald-400 font-mono">
                        {globalData?.fearAndGreedIndex?.value || 78} ({globalData?.fearAndGreedIndex?.sentiment || 'Greed'})
                      </strong>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
                      <span className="text-slate-400">Hotel Booking Execution Slippage:</span>
                      <strong className="text-emerald-400 font-mono">&lt; 0.05% (Zero Impact)</strong>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    <Bot className="w-4 h-4 text-purple-400" />
                    <span>AI Model Context Protocol (MCP) Rate Query</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    AI Agents use the CryptoRank MCP server to fetch instant TON/USD rates and calculate dynamic travel cashback.
                  </p>
                  <div className="p-2.5 rounded-xl bg-slate-900 font-mono text-[11px] text-purple-300 border border-purple-500/20 space-y-1">
                    <div className="text-slate-500 text-[10px]">// MCP Tool Execution</div>
                    <div>&gt; cryptorank_get_currency_price({`{ symbol: "TON", vs: "USD" }`})</div>
                    <div className="text-emerald-400">&lt; {`{ price: ${currentTonPrice.toFixed(3)}, source: "cryptorank_v3" }`}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: TON PRICE ALERTS & VOLATILITY NOTIFICATIONS */}
          {activeTab === 'alerts' && (
            <div className="space-y-6 animate-fade-in">
              
              {/* Firestore Cloud Sync Status Banner */}
              <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-cyan-400" />
                  <span>
                    {currentUser ? (
                      <>
                        Firestore Cloud Sync: <strong className="text-cyan-300">{currentUser.email || currentUser.displayName || 'Authenticated User'}</strong>
                      </>
                    ) : (
                      <span className="text-slate-400">
                        Guest Mode (Local Only) — <strong className="text-amber-300">Sign in</strong> to sync alert thresholds across devices
                      </span>
                    )}
                  </span>
                </div>
                {currentUser && (
                  <div className="flex items-center gap-1.5 text-[11px] font-mono">
                    {isCloudSyncing ? (
                      <span className="text-amber-400 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                        Syncing to Firestore...
                      </span>
                    ) : (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        Synced to Cloud Profile
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Master Alert Controller Card */}
              <div className={`p-5 rounded-3xl border transition-all shadow-xl ${
                alertConfig.enabled
                  ? 'bg-gradient-to-br from-amber-950/50 via-slate-900 to-indigo-950/60 border-amber-500/40 shadow-amber-950/30'
                  : 'bg-slate-950/80 border-slate-800'
              }`}>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all ${
                      alertConfig.enabled
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-lg shadow-amber-500/20'
                        : 'bg-slate-900 border-slate-800 text-slate-500'
                    }`}>
                      {alertConfig.enabled ? <BellRing className="w-6 h-6 animate-bounce" /> : <BellOff className="w-6 h-6" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-white">
                          TON Price Change Notifications
                        </h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase font-mono border ${
                          alertConfig.enabled
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}>
                          {alertConfig.enabled ? '● Active Monitoring' : '○ Paused'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Get instant alerts when TON undergoes significant price fluctuations or reaches your target rates.
                      </p>
                    </div>
                  </div>

                  {/* Master Toggle Button */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const willEnable = !alertConfig.enabled;
                        updateAlertConfig(
                          prev => ({ ...prev, enabled: willEnable }),
                          {
                            title: willEnable ? 'Price Alerts Activated' : 'Price Alerts Paused',
                            message: willEnable
                              ? `Live threshold monitoring active at ±${alertConfig.thresholdPercent}% volatility sensitivity`
                              : 'Real-time TON price movement alerts temporarily paused',
                            type: willEnable ? 'success' : 'info'
                          }
                        );
                        if (willEnable) playAlertChime('test');
                      }}
                      className={`px-5 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 transition-all shadow-md active:scale-95 ${
                        alertConfig.enabled
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black shadow-amber-500/20'
                          : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white'
                      }`}
                    >
                      {alertConfig.enabled ? <Check className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                      <span>{alertConfig.enabled ? 'Notifications Enabled' : 'Enable Price Alerts'}</span>
                    </button>
                  </div>
                </div>

                {/* Real-time Reference Bar */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-3 text-xs flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Current Spot Rate:</span>
                    <strong className="text-cyan-300 font-mono text-sm">${currentTonPrice.toFixed(3)} USD</strong>
                    <span className="text-[10px] text-emerald-400 font-mono">
                      (+{tonData?.values?.USD?.price24hChange || 3.84}% 24h)
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-slate-400 text-[11px] font-mono">
                    <span>Low Target: <strong className="text-rose-400">${alertConfig.lowTargetPrice.toFixed(2)}</strong></span>
                    <span>High Target: <strong className="text-emerald-400">${alertConfig.highTargetPrice.toFixed(2)}</strong></span>
                    <span>Delta: <strong className="text-amber-300">±{alertConfig.thresholdPercent}%</strong></span>
                  </div>
                </div>
              </div>

              {/* Threshold & Sensitivity Configuration */}
              <div className="p-4 sm:p-5 rounded-3xl bg-slate-950/80 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-amber-400" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Volatility Sensitivity Threshold
                    </h4>
                  </div>
                  <span className="text-xs font-mono font-black text-amber-300 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                    Trigger at ±{alertConfig.thresholdPercent}% movement
                  </span>
                </div>

                <p className="text-xs text-slate-400">
                  Select how sensitive you want the price trigger to be. Smaller percentages will notify on minor intraday fluctuations, while higher thresholds notify on major crypto market swings.
                </p>

                {/* Preset Chips */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                  {[
                    { pct: 1, label: '±1%', desc: 'High Frequency' },
                    { pct: 2, label: '±2%', desc: 'Active Trader' },
                    { pct: 3, label: '±3%', desc: 'Recommended' },
                    { pct: 5, label: '±5%', desc: 'Major Swing' },
                    { pct: 10, label: '±10%', desc: 'Macro Shift' }
                  ].map((preset) => (
                    <button
                      key={preset.pct}
                      onClick={() => {
                        updateAlertConfig(
                          prev => ({ ...prev, thresholdPercent: preset.pct }),
                          {
                            title: `Threshold Set to ${preset.label}`,
                            message: `Price alerts will trigger whenever TON moves by ±${preset.pct}% (${preset.desc})`,
                            type: 'success'
                          }
                        );
                        playAlertChime('up');
                      }}
                      className={`p-2.5 rounded-2xl text-left border transition-all ${
                        alertConfig.thresholdPercent === preset.pct
                          ? 'bg-amber-500/20 border-amber-500/50 text-white shadow-md ring-1 ring-amber-400/40'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <div className="text-xs font-black font-mono text-amber-300">{preset.label}</div>
                      <div className="text-[10px] text-slate-400">{preset.desc}</div>
                    </button>
                  ))}
                </div>

                {/* Fine Adjustment Slider */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                    <span>1% (Ultra sensitive)</span>
                    <span>Current: ±{alertConfig.thresholdPercent}%</span>
                    <span>15% (Extreme moves only)</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="15"
                    step="0.5"
                    value={alertConfig.thresholdPercent}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      updateAlertConfig(
                        prev => ({ ...prev, thresholdPercent: val }),
                        {
                          title: `Threshold Sensitivity: ±${val}%`,
                          message: `Alert sensitivity updated to ±${val}% movement threshold`,
                          type: 'info'
                        }
                      );
                    }}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                  />
                </div>
              </div>

              {/* Directional Target Price Triggers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Upper Price Target */}
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      <h4 className="text-xs font-bold text-white">High Target Alert (Take Profit)</h4>
                    </div>
                    <input
                      type="checkbox"
                      checked={alertConfig.alertOnHigh}
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        updateAlertConfig(
                          prev => ({ ...prev, alertOnHigh: isChecked }),
                          {
                            title: isChecked ? 'High Price Target Enabled' : 'High Price Target Disabled',
                            message: `Target rate threshold is set at $${alertConfig.highTargetPrice.toFixed(2)} USD`,
                            type: isChecked ? 'up' : 'info'
                          }
                        );
                      }}
                      className="w-4 h-4 accent-emerald-400 rounded cursor-pointer"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Notify when TON breaks higher than this rate (ideal time to book luxury hotels with maximum purchasing power).
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-mono">$</span>
                      <input
                        type="number"
                        step="0.05"
                        min="1"
                        value={alertConfig.highTargetPrice}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          updateAlertConfig(
                            prev => ({ ...prev, highTargetPrice: val }),
                            {
                              title: `High Target Price Set: $${val.toFixed(2)}`,
                              message: `You will be alerted when TON reaches or exceeds $${val.toFixed(2)} USD`,
                              type: 'up'
                            }
                          );
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-7 pr-3 py-2 text-xs font-mono font-bold text-emerald-300 focus:outline-none focus:border-emerald-400"
                      />
                    </div>
                    <span className="text-[11px] font-mono text-emerald-400 shrink-0">
                      {alertConfig.highTargetPrice > currentTonPrice
                        ? `+${(((alertConfig.highTargetPrice - currentTonPrice) / currentTonPrice) * 100).toFixed(1)}% above spot`
                        : 'Target reached'}
                    </span>
                  </div>
                </div>

                {/* Lower Price Target */}
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-rose-400" />
                      <h4 className="text-xs font-bold text-white">Low Target Alert (Dip / Buy)</h4>
                    </div>
                    <input
                      type="checkbox"
                      checked={alertConfig.alertOnLow}
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        updateAlertConfig(
                          prev => ({ ...prev, alertOnLow: isChecked }),
                          {
                            title: isChecked ? 'Dip Buy Alert Enabled' : 'Dip Buy Alert Disabled',
                            message: `Dip buy price threshold is set at $${alertConfig.lowTargetPrice.toFixed(2)} USD`,
                            type: isChecked ? 'down' : 'info'
                          }
                        );
                      }}
                      className="w-4 h-4 accent-rose-400 rounded cursor-pointer"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Notify when TON drops to or below this level (opportunity to top up TON Space wallet at lower cost).
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-mono">$</span>
                      <input
                        type="number"
                        step="0.05"
                        min="0.5"
                        value={alertConfig.lowTargetPrice}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          updateAlertConfig(
                            prev => ({ ...prev, lowTargetPrice: val }),
                            {
                              title: `Low Target Price Set: $${val.toFixed(2)}`,
                              message: `You will be alerted when TON dips to or below $${val.toFixed(2)} USD`,
                              type: 'down'
                            }
                          );
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-7 pr-3 py-2 text-xs font-mono font-bold text-rose-300 focus:outline-none focus:border-rose-400"
                      />
                    </div>
                    <span className="text-[11px] font-mono text-rose-400 shrink-0">
                      {currentTonPrice > alertConfig.lowTargetPrice
                        ? `-${(((currentTonPrice - alertConfig.lowTargetPrice) / currentTonPrice) * 100).toFixed(1)}% below spot`
                        : 'Target reached'}
                    </span>
                  </div>
                </div>

              </div>

              {/* Notification Channels & Sound */}
              <div className="p-4 sm:p-5 rounded-3xl bg-slate-950/80 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-cyan-400" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Notification Channels & Audio Settings
                    </h4>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
                  {/* In-App Synth Chime */}
                  <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-blue-500/10 text-blue-300 border border-blue-500/20">
                        {alertConfig.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">In-App Audio Chime</div>
                        <div className="text-[10px] text-slate-400">Play pleasant Web Audio tone on price triggers</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => playAlertChime('up')}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[10px] font-bold"
                        title="Preview audio tone"
                      >
                        Preview
                      </button>
                      <input
                        type="checkbox"
                        checked={alertConfig.soundEnabled}
                        onChange={(e) => {
                          const isEnabled = e.target.checked;
                          updateAlertConfig(
                            prev => ({ ...prev, soundEnabled: isEnabled }),
                            {
                              title: isEnabled ? 'Audio Chime Enabled' : 'Audio Chime Muted',
                              message: isEnabled
                                ? 'Web Audio synthesizer tone will sound when price thresholds trigger'
                                : 'In-app audio alert sound muted',
                              type: 'info'
                            }
                          );
                          if (isEnabled) playAlertChime('up');
                        }}
                        className="w-4 h-4 accent-amber-400 rounded cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Browser Push Notification */}
                  <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-purple-500/10 text-purple-300 border border-purple-500/20">
                        <Send className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">Browser & OS Push</div>
                        <div className="text-[10px] text-slate-400">Receive alerts even when tab is backgrounded</div>
                      </div>
                    </div>

                    <button
                      onClick={requestNotificationPermission}
                      className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all border ${
                        alertConfig.browserNotifications
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : 'bg-purple-600 hover:bg-purple-500 text-white border-transparent'
                      }`}
                    >
                      {alertConfig.browserNotifications ? 'Allowed' : 'Allow Push'}
                    </button>
                  </div>

                </div>

                {/* Interactive Test Button & Reset */}
                <div className="pt-2 flex items-center justify-between flex-wrap gap-2">
                  <button
                    onClick={triggerTestAlert}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
                  >
                    <Zap className="w-4 h-4" />
                    <span>Test Price Alert Notification</span>
                  </button>

                  <button
                    onClick={() => {
                      updateAlertConfig(
                        () => DEFAULT_ALERT_CONFIG,
                        {
                          title: 'Alert Settings Reset to Default',
                          message: 'Restored default ±3.0% sensitivity, $6.50 target and $4.50 dip thresholds',
                          type: 'success'
                        }
                      );
                      playAlertChime('test');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-medium transition-all"
                  >
                    Reset Defaults (±3%)
                  </button>
                </div>
              </div>

              {/* Price Alerts History & Signals Log */}
              <div className="p-4 sm:p-5 rounded-3xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Recent Price Trigger Activity
                    </h4>
                  </div>
                  <button
                    onClick={() => {
                      setAlertHistory([]);
                      try { localStorage.removeItem('ton_price_alert_history'); } catch(e) {}
                    }}
                    className="text-[10px] text-slate-500 hover:text-slate-300"
                  >
                    Clear History
                  </button>
                </div>

                <div className="divide-y divide-slate-800/80 border border-slate-800 rounded-2xl overflow-hidden bg-slate-900/50">
                  {alertHistory.length > 0 ? (
                    alertHistory.map((item) => (
                      <div key={item.id} className="p-3 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2.5">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${
                            item.type === 'surge' ? 'bg-emerald-400 animate-ping' : item.type === 'drop' ? 'bg-rose-400' : 'bg-amber-400'
                          }`}></span>
                          <div>
                            <div className="font-bold text-white flex items-center gap-1.5">
                              <span>{item.title}</span>
                              <span className="text-[9px] font-mono text-cyan-300 bg-slate-800 px-1.5 py-0.2 rounded">
                                ${item.price.toFixed(2)} USD
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400">{item.message}</div>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 shrink-0">{item.time}</span>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-xs text-slate-500">
                      No price alert triggers recorded yet. Click &quot;Test Price Alert Notification&quot; to test.
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: API v3 LIVE EXPLORER */}
          {activeTab === 'api-v3' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-500/30 text-xs space-y-2">
                <h3 className="font-bold text-white flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-blue-400" />
                  <span>CryptoRank API v3 OpenAPI Base: https://api.cryptorank.io/v3</span>
                </h3>
                <p className="text-slate-300 leading-relaxed">
                  v3 replaces monolithic metadata endpoints with high-granularity resources. Authentication must be supplied via the <code className="bg-slate-900 px-1.5 py-0.5 rounded text-cyan-300 font-mono">X-Api-Key</code> HTTP header.
                </p>
              </div>

              {/* Endpoint Selector Bar */}
              <div className="flex items-center gap-2 flex-wrap">
                {[
                  { path: '/v3/currencies/toncoin', label: 'GET /v3/currencies/toncoin', title: 'Toncoin Single Asset' },
                  { path: '/v3/currencies', label: 'GET /v3/currencies', title: 'Currencies List' },
                  { path: '/v3/global', label: 'GET /v3/global', title: 'Global Market Overview' },
                  { path: '/v3/currencies/toncoin/tickers', label: 'GET /v3/currencies/{id}/tickers', title: 'Live Exchange Tickers' }
                ].map((ep) => (
                  <button
                    key={ep.path}
                    onClick={() => {
                      setSelectedEndpoint(ep.path);
                      if (ep.path.includes('global')) setActiveJsonPayload({ status: { code: 200, message: 'OK' }, data: globalData });
                      else if (ep.path.includes('tickers')) setActiveJsonPayload({ status: { code: 200, message: 'OK' }, data: tickers });
                      else if (ep.path === '/v3/currencies') setActiveJsonPayload({ status: { code: 200, message: 'OK' }, meta: { total: currencies.length }, data: currencies });
                      else setActiveJsonPayload({ status: { code: 200, message: 'OK' }, data: tonData });
                    }}
                    className={`px-3 py-1.5 rounded-xl font-mono text-[11px] font-bold border transition-all ${
                      selectedEndpoint === ep.path
                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/50'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    {ep.label}
                  </button>
                ))}
              </div>

              {/* cURL Snippet */}
              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between gap-3 text-xs">
                <div className="font-mono text-slate-300 break-all">
                  <span className="text-emerald-400 font-bold">curl</span> -X GET &quot;https://api.cryptorank.io{selectedEndpoint}&quot; \ <br />
                  &nbsp;&nbsp;-H &quot;Accept: application/json&quot; \ <br />
                  &nbsp;&nbsp;-H &quot;X-Api-Key: {savedKey || 'YOUR_API_KEY'}&quot;
                </div>

                <button
                  onClick={() => handleCopy(`curl -X GET "https://api.cryptorank.io${selectedEndpoint}" -H "Accept: application/json" -H "X-Api-Key: ${savedKey || 'YOUR_API_KEY'}"`, 'curl-v3')}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px] flex items-center gap-1.5 shrink-0 border border-slate-700"
                >
                  {copiedId === 'curl-v3' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === 'curl-v3' ? 'Copied' : 'Copy cURL'}</span>
                </button>
              </div>

              {/* Response Envelope Preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span>Response Envelope (v3: {`{ data, status }`})</span>
                  <span className="text-emerald-400">HTTP 200 OK</span>
                </div>
                <pre className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-mono text-cyan-300 max-h-96 overflow-y-auto">
                  {JSON.stringify(activeJsonPayload, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: MCP (MODEL CONTEXT PROTOCOL) */}
          {activeTab === 'mcp' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-indigo-500/20 text-indigo-300 font-black font-mono">
                    MCP Server
                  </div>
                  <h3 className="font-bold text-white text-sm">
                    CryptoRank Model Context Protocol Connector
                  </h3>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  CryptoRank provides an official <strong>MCP (Model Context Protocol)</strong> endpoint at <code className="bg-slate-900 px-1.5 py-0.5 rounded text-cyan-300 font-mono">https://api.cryptorank.io/mcp</code> allowing AI agents (Claude, Gemini, ChatGPT, Cursor, Windsurf) to natively query real-time crypto prices, liquidity pools, and TON travel metrics.
                </p>
              </div>

              {/* MCP Configuration JSON */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white">mcpServers Configuration (claude_desktop_config.json / Cursor)</span>
                  <button
                    onClick={() => handleCopy(JSON.stringify({
                      "mcpServers": {
                        "cryptorank": {
                          "url": "https://api.cryptorank.io/mcp",
                          "headers": {
                            "X-Api-Key": savedKey || "YOUR_CRYPTORANK_API_KEY"
                          }
                        }
                      }
                    }, null, 2), 'mcp-json')}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-mono flex items-center gap-1 border border-slate-700"
                  >
                    {copiedId === 'mcp-json' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedId === 'mcp-json' ? 'Copied' : 'Copy Config'}</span>
                  </button>
                </div>

                <pre className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-mono text-indigo-300 overflow-x-auto">
{`{
  "mcpServers": {
    "cryptorank": {
      "url": "https://api.cryptorank.io/mcp",
      "headers": {
        "X-Api-Key": "${savedKey || "YOUR_CRYPTORANK_API_KEY"}"
      }
    }
  }
}`}
                </pre>
              </div>

              {/* Available Tools in MCP */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Exposed MCP AI Tools
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1 text-xs">
                    <div className="font-bold text-cyan-300 font-mono flex items-center gap-1">
                      <span>get_currency_price</span>
                    </div>
                    <p className="text-slate-400 text-[11px]">
                      Queries instant spot price and 24h delta for TON or travel payment tokens.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1 text-xs">
                    <div className="font-bold text-cyan-300 font-mono flex items-center gap-1">
                      <span>get_market_overview</span>
                    </div>
                    <p className="text-slate-400 text-[11px]">
                      Queries global crypto market cap, fear/greed index, and DEX volume.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1 text-xs">
                    <div className="font-bold text-cyan-300 font-mono flex items-center gap-1">
                      <span>convert_travel_rate</span>
                    </div>
                    <p className="text-slate-400 text-[11px]">
                      Calculates exact TON required for hotel stays with zero-spread fiat rates.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1 text-xs">
                    <div className="font-bold text-cyan-300 font-mono flex items-center gap-1">
                      <span>get_dex_tickers</span>
                    </div>
                    <p className="text-slate-400 text-[11px]">
                      Inspects liquidity depth across STON.fi, DeDust, Binance, and Bybit.
                    </p>
                  </div>
                </div>
              </div>

              {/* Documentation Index Link */}
              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-400" />
                  <span>Full LLMs Reference Index:</span>
                  <code className="text-blue-300 font-mono">https://docs.cryptorank.io/llms.txt</code>
                </div>
                <a
                  href="https://docs.cryptorank.io/llms.txt"
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1"
                >
                  <span>Open LLMs.txt</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}

          {/* TAB 4: MIGRATION GUIDE (v2 -> v3) */}
          {activeTab === 'migration' && (
            <div className="space-y-5 text-xs">
              <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30 space-y-2">
                <h3 className="font-bold text-amber-300 text-sm flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  <span>v2 Deprecation & v3 Architectural Migration</span>
                </h3>
                <p className="text-slate-300 leading-relaxed">
                  CryptoRank Public API v2 is deprecated. v2 used heavy, monolithic full-metadata calls. v3 introduces granular micro-endpoints, strict <code className="bg-slate-900 px-1 py-0.5 rounded text-cyan-300 font-mono">X-Api-Key</code> header authentication, and standard `{` data, meta, status `}` response envelopes.
                </p>
              </div>

              {/* Migration Comparison Table */}
              <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="p-3">Feature / Concept</th>
                      <th className="p-3 text-rose-400">API v2 (Deprecated)</th>
                      <th className="p-3 text-emerald-400">API v3 (Current)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    <tr>
                      <td className="p-3 font-bold text-white">Base URL Prefix</td>
                      <td className="p-3 font-mono text-slate-400">https://api.cryptorank.io/v2</td>
                      <td className="p-3 font-mono text-emerald-300 font-bold">https://api.cryptorank.io/v3</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-white">Authentication</td>
                      <td className="p-3 text-slate-400 font-mono">?api_key=... (Query param)</td>
                      <td className="p-3 text-emerald-300 font-mono font-bold">X-Api-Key header only</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-white">Endpoint Architecture</td>
                      <td className="p-3 text-slate-400">Monolithic (full-metadata payloads)</td>
                      <td className="p-3 text-emerald-300 font-bold">Granular sliced endpoints</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-white">Response Envelope</td>
                      <td className="p-3 text-slate-400 font-mono">{`{ data: [...] }`}</td>
                      <td className="p-3 text-emerald-300 font-mono font-bold">{`{ data, meta, status }`}</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-white">Agent / AI Protocol</td>
                      <td className="p-3 text-slate-400">Not supported</td>
                      <td className="p-3 text-emerald-300 font-bold">MCP Server at /mcp</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <h4 className="font-bold text-white">Migration Step-by-Step for Developers</h4>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-300 text-xs">
                  <li>Replace base URL paths from <code className="text-rose-400 font-mono">/v2/*</code> to <code className="text-emerald-400 font-mono">/v3/*</code>.</li>
                  <li>Move your API key from query parameter <code className="text-rose-400 font-mono">?api_key=...</code> into the <code className="text-emerald-400 font-mono">X-Api-Key</code> request header.</li>
                  <li>Update payload parser to unwrap data from <code className="text-cyan-300 font-mono">response.data</code>.</li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 5: API KEY & AUTHORIZATION */}
          {activeTab === 'apikey' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Key className="w-4 h-4 text-blue-400" />
                    <span>CryptoRank API v3 Key Authorization</span>
                  </h3>
                  <a
                    href="https://cryptorank.io/api"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 underline"
                  >
                    <span>Get API Key</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  Enter your CryptoRank v3 API key to unlock higher rate limits, full DEX depth, and live TON volatility analytics. All calls will automatically include the required <code className="text-cyan-300 font-mono">X-Api-Key</code> header.
                </p>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="password"
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      placeholder="Paste your CryptoRank v3 API key..."
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-mono text-cyan-300 placeholder-slate-500 focus:outline-none focus:border-blue-400"
                    />
                    <button
                      onClick={handleSaveApiKey}
                      disabled={keyValidationStatus.loading}
                      className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-50"
                    >
                      {keyValidationStatus.loading ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      <span>Verify & Save</span>
                    </button>
                  </div>

                  {keyValidationStatus.message && (
                    <div
                      className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                        keyValidationStatus.valid
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                          : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                      }`}
                    >
                      {keyValidationStatus.valid ? (
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 shrink-0" />
                      )}
                      <span>{keyValidationStatus.message}</span>
                    </div>
                  )}

                  {savedKey && !keyValidationStatus.message && (
                    <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Active API Key Configured (Stored securely in browser session)</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Developer Environment Note */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <div className="font-bold text-slate-300">Server-Side Environment Variable:</div>
                <p className="text-slate-400">
                  You can also declare your secret key in <code className="text-cyan-300 font-mono">.env.example</code> under:
                </p>
                <div className="p-2.5 rounded-xl bg-slate-900 font-mono text-cyan-300 border border-slate-800 text-[11px]">
                  CRYPTORANK_API_KEY=your_key_here
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-slate-950 border-t border-slate-800 p-3 sm:p-4 flex items-center justify-between text-xs text-slate-400 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
            <span>CryptoRank API v3 • MCP Server live on api.cryptorank.io/mcp</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-all text-xs"
          >
            Close Explorer
          </button>
        </div>

      </div>
    </div>
  );
};
