import React, { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import {
  Bell,
  BellRing,
  Sliders,
  TrendingUp,
  TrendingDown,
  Cloud,
  CheckCircle2,
  AlertCircle,
  Save,
  RefreshCw,
  Sparkles,
  Volume2,
  VolumeX,
  LogIn,
  Calendar,
  Activity,
  Mail,
  MailCheck,
  Send,
  Inbox,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Download,
  FileSpreadsheet,
  Lightbulb,
  Zap,
  Target,
  History,
  Clock,
  Trash2,
  Check,
  ExternalLink
} from 'lucide-react';
import { TonPriceAlertConfig, UserState, PriceAlertEvent } from '../types';
import {
  auth,
  savePriceAlertConfigToFirestore,
  subscribeToPriceAlertConfig,
  recordPriceAlertEventToFirestore,
  subscribeToPriceAlertEvents,
  loadPriceAlertEventsFromFirestore,
  deletePriceAlertEventFromFirestore
} from '../services/firebaseService';
import {
  getCryptoRankTonPriceHistory,
  CryptoRankPricePoint
} from '../services/cryptorankService';
import {
  sendMockPriceAlertEmail,
  subscribeToEmailAlerts,
  PriceAlertEmailPayload
} from '../services/emailNotificationService';
import {
  playPriceAlertChime,
  playPreviewChime,
  setSoundMuted,
  isSoundMuted,
  subscribeToSoundMute
} from '../services/soundService';
import { onAuthStateChanged, User } from 'firebase/auth';
import { addToast } from '../services/toastService';

interface PriceAlertManagerProps {
  userState?: UserState;
  onOpenAuth?: () => void;
  onOpenCryptoRankConnector?: () => void;
}

const DEFAULT_CONFIG: TonPriceAlertConfig = {
  enabled: true,
  thresholdPercent: 3.0,
  alertOnHigh: true,
  highTargetPrice: 6.50,
  alertOnLow: true,
  lowTargetPrice: 4.50,
  soundEnabled: true,
  browserNotifications: false,
  emailNotificationsEnabled: true
};

const PRESET_THRESHOLDS = [1.0, 2.0, 3.0, 5.0, 8.0, 10.0];

export const PriceAlertManager: React.FC<PriceAlertManagerProps> = ({
  userState,
  onOpenAuth,
  onOpenCryptoRankConnector
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);
  const [config, setConfig] = useState<TonPriceAlertConfig>(() => {
    try {
      const saved = localStorage.getItem('tontravel_price_alert_config');
      return saved ? { ...DEFAULT_CONFIG, ...JSON.parse(saved) } : DEFAULT_CONFIG;
    } catch {
      return DEFAULT_CONFIG;
    }
  });

  // User's active authenticated email address
  const activeEmailRecipient = useMemo(() => {
    return (
      currentUser?.email ||
      userState?.firebaseEmail ||
      userState?.driveUserEmail ||
      'rubelbank92@gmail.com'
    );
  }, [currentUser?.email, userState?.firebaseEmail, userState?.driveUserEmail]);

  // Email Notification logs state
  const [sentEmails, setSentEmails] = useState<PriceAlertEmailPayload[]>([]);
  const [showEmailLogs, setShowEmailLogs] = useState<boolean>(false);
  const [isSendingTestEmail, setIsSendingTestEmail] = useState<boolean>(false);

  // Tab View State: 'triggers' (Thresholds, Live Chart & Controls) | 'history' (Last 10 Firestore Events)
  const [activeTab, setActiveTab] = useState<'triggers' | 'history'>('triggers');

  // Triggered Price Alert Events State (Last 10 from Firestore)
  const [alertEvents, setAlertEvents] = useState<PriceAlertEvent[]>(() => {
    try {
      const local = localStorage.getItem('tontravel_cached_price_alert_events');
      return local ? JSON.parse(local) : [];
    } catch {
      return [];
    }
  });
  const [isEventsLoading, setIsEventsLoading] = useState<boolean>(false);
  const [isSimulatingTrigger, setIsSimulatingTrigger] = useState<boolean>(false);

  useEffect(() => {
    const unsub = subscribeToEmailAlerts(setSentEmails);
    return () => unsub();
  }, []);

  // Local draft threshold input state
  const [thresholdInput, setThresholdInput] = useState<string>(
    config.thresholdPercent ? config.thresholdPercent.toString() : '3.0'
  );
  const [highTargetInput, setHighTargetInput] = useState<string>(
    config.highTargetPrice ? config.highTargetPrice.toString() : '6.50'
  );
  const [lowTargetInput, setLowTargetInput] = useState<string>(
    config.lowTargetPrice ? config.lowTargetPrice.toString() : '4.50'
  );
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 30-Day Historical Price Trend State (Recharts)
  const [historyData, setHistoryData] = useState<CryptoRankPricePoint[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState<boolean>(true);

  const fetchHistory30d = async () => {
    setIsHistoryLoading(true);
    try {
      const points = await getCryptoRankTonPriceHistory('30d');
      setHistoryData(points);
    } catch (err) {
      console.error('Failed to load 30d TON price history:', err);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory30d();
  }, []);

  // Sync auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsub();
  }, []);

  // Listen to Firestore real-time updates for logged-in user (Alert Config & Notification Events)
  useEffect(() => {
    if (!currentUser?.uid) {
      // Offline / Local storage fallback for unauthenticated preview
      try {
        const local = localStorage.getItem('tontravel_cached_price_alert_events');
        if (local) {
          setAlertEvents(JSON.parse(local));
        }
      } catch {}
      return;
    }

    const unsubFirestore = subscribeToPriceAlertConfig(currentUser.uid, (cloudConfig) => {
      if (cloudConfig) {
        setConfig(cloudConfig);
        setSoundMuted(!cloudConfig.soundEnabled);
        setThresholdInput(cloudConfig.thresholdPercent.toString());
        setHighTargetInput(cloudConfig.highTargetPrice.toString());
        setLowTargetInput(cloudConfig.lowTargetPrice.toString());
        try {
          localStorage.setItem('tontravel_price_alert_config', JSON.stringify(cloudConfig));
        } catch {
          // ignore
        }
      }
    });

    // Real-time subscription to the last 10 triggered price alert events from Firestore
    setIsEventsLoading(true);
    const unsubEvents = subscribeToPriceAlertEvents(
      currentUser.uid,
      (events) => {
        setAlertEvents(events);
        setIsEventsLoading(false);
        try {
          localStorage.setItem('tontravel_cached_price_alert_events', JSON.stringify(events));
        } catch {}
      },
      10
    );

    return () => {
      unsubFirestore();
      unsubEvents();
    };
  }, [currentUser?.uid]);

  // Current TON Price
  const currentTonPrice = userState?.tonPriceUsd || 5.82;

  // Record a Triggered Price Alert Event to Firestore (with local caching)
  const recordPriceAlertEvent = async (eventData: {
    triggerType: 'HIGH_TARGET' | 'LOW_DIP' | 'VOLATILITY_THRESHOLD' | 'TEST';
    currentPrice: number;
    thresholdPrice?: number;
    thresholdPercent?: number;
    changePercent?: number;
    recipientEmail?: string;
    subject?: string;
  }) => {
    const timestamp = new Date().toISOString();
    const fullEvent = {
      ...eventData,
      recipientEmail: eventData.recipientEmail || activeEmailRecipient,
      timestamp
    };

    if (currentUser?.uid) {
      await recordPriceAlertEventToFirestore(currentUser.uid, fullEvent);
    } else {
      const localEvent: PriceAlertEvent = {
        id: `local-evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        ...fullEvent
      };
      setAlertEvents((prev) => {
        const updated = [localEvent, ...prev.filter((p) => p.id !== localEvent.id)].slice(0, 10);
        try {
          localStorage.setItem('tontravel_cached_price_alert_events', JSON.stringify(updated));
        } catch {}
        return updated;
      });
    }
  };

  // Real-time Threshold Crossing & Email Dispatch Logic
  const [lastTriggeredPrice, setLastTriggeredPrice] = useState<number | null>(null);
  const [lastTriggerTimestamp, setLastTriggerTimestamp] = useState<number>(0);

  useEffect(() => {
    if (!config.enabled || !config.emailNotificationsEnabled) return;
    if (!currentTonPrice || currentTonPrice <= 0) return;

    const now = Date.now();
    // 30-second debounce to prevent flood on repeated ticks
    if (now - lastTriggerTimestamp < 30000 && lastTriggeredPrice === currentTonPrice) {
      return;
    }

    // 1. High Target crossing
    if (config.alertOnHigh && config.highTargetPrice && currentTonPrice >= config.highTargetPrice) {
      if (lastTriggeredPrice === null || lastTriggeredPrice < config.highTargetPrice) {
        const subject = `🎯 [TON Travel Alert] TON Reached Target Rate $${currentTonPrice.toFixed(2)} USD!`;
        sendMockPriceAlertEmail({
          recipientEmail: activeEmailRecipient,
          triggerType: 'HIGH_TARGET',
          currentPrice: currentTonPrice,
          thresholdPrice: config.highTargetPrice
        });
        recordPriceAlertEvent({
          triggerType: 'HIGH_TARGET',
          currentPrice: currentTonPrice,
          thresholdPrice: config.highTargetPrice,
          subject
        });
        setLastTriggeredPrice(currentTonPrice);
        setLastTriggerTimestamp(now);
        return;
      }
    }

    // 2. Low Target crossing
    if (config.alertOnLow && config.lowTargetPrice && currentTonPrice <= config.lowTargetPrice) {
      if (lastTriggeredPrice === null || lastTriggeredPrice > config.lowTargetPrice) {
        const subject = `📉 [TON Travel Alert] TON Dipped to $${currentTonPrice.toFixed(2)} USD (Buy Zone)`;
        sendMockPriceAlertEmail({
          recipientEmail: activeEmailRecipient,
          triggerType: 'LOW_DIP',
          currentPrice: currentTonPrice,
          thresholdPrice: config.lowTargetPrice
        });
        recordPriceAlertEvent({
          triggerType: 'LOW_DIP',
          currentPrice: currentTonPrice,
          thresholdPrice: config.lowTargetPrice,
          subject
        });
        setLastTriggeredPrice(currentTonPrice);
        setLastTriggerTimestamp(now);
        return;
      }
    }

    // 3. Volatility threshold check against 30d baseline / last triggered
    if (lastTriggeredPrice !== null && lastTriggeredPrice > 0) {
      const pctChange = Math.abs(((currentTonPrice - lastTriggeredPrice) / lastTriggeredPrice) * 100);
      if (pctChange >= config.thresholdPercent) {
        const diffPercent = ((currentTonPrice - lastTriggeredPrice) / lastTriggeredPrice) * 100;
        const subject = `⚡ [TON Travel Alert] Volatility Spike: TON moved ${diffPercent > 0 ? '+' : ''}${diffPercent.toFixed(1)}% (Threshold ±${config.thresholdPercent}%)`;
        sendMockPriceAlertEmail({
          recipientEmail: activeEmailRecipient,
          triggerType: 'VOLATILITY_THRESHOLD',
          currentPrice: currentTonPrice,
          thresholdPercent: config.thresholdPercent,
          changePercent: diffPercent
        });
        recordPriceAlertEvent({
          triggerType: 'VOLATILITY_THRESHOLD',
          currentPrice: currentTonPrice,
          thresholdPercent: config.thresholdPercent,
          changePercent: diffPercent,
          subject
        });
        setLastTriggeredPrice(currentTonPrice);
        setLastTriggerTimestamp(now);
      }
    } else {
      setLastTriggeredPrice(currentTonPrice);
    }
  }, [
    currentTonPrice,
    config.enabled,
    config.emailNotificationsEnabled,
    config.alertOnHigh,
    config.highTargetPrice,
    config.alertOnLow,
    config.lowTargetPrice,
    config.thresholdPercent,
    activeEmailRecipient,
    lastTriggeredPrice,
    lastTriggerTimestamp
  ]);

  // Handle Save / Update Threshold
  const handleUpdateThreshold = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    const parsedThreshold = parseFloat(thresholdInput);
    if (isNaN(parsedThreshold) || parsedThreshold <= 0 || parsedThreshold > 50) {
      setErrorMessage('Please enter a valid threshold percentage between 0.1% and 50%');
      return;
    }

    const parsedHigh = parseFloat(highTargetInput);
    const parsedLow = parseFloat(lowTargetInput);

    const updatedConfig: TonPriceAlertConfig = {
      ...config,
      thresholdPercent: Number(parsedThreshold.toFixed(1)),
      highTargetPrice: !isNaN(parsedHigh) && parsedHigh > 0 ? Number(parsedHigh.toFixed(2)) : config.highTargetPrice,
      lowTargetPrice: !isNaN(parsedLow) && parsedLow > 0 ? Number(parsedLow.toFixed(2)) : config.lowTargetPrice,
      updatedAt: new Date().toISOString()
    };

    setIsSaving(true);

    try {
      // Always persist to local storage
      localStorage.setItem('tontravel_price_alert_config', JSON.stringify(updatedConfig));
      setConfig(updatedConfig);

      if (currentUser?.uid) {
        await savePriceAlertConfigToFirestore(currentUser.uid, updatedConfig);
      } else {
        addToast({
          title: 'Price Alert Threshold Updated',
          message: `Threshold set to ±${updatedConfig.thresholdPercent}% volatility sensitivity`,
          type: 'success',
          subMessage: 'Saved locally in session (Sign in to sync across devices)'
        });
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error updating price alert threshold:', err);
      setErrorMessage(err?.message || 'Failed to update price alert threshold');
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle Email Notifications
  const handleToggleEmailAlerts = async () => {
    const willEnable = !(config.emailNotificationsEnabled ?? true);
    const updated: TonPriceAlertConfig = {
      ...config,
      emailNotificationsEnabled: willEnable,
      updatedAt: new Date().toISOString()
    };
    setConfig(updated);
    localStorage.setItem('tontravel_price_alert_config', JSON.stringify(updated));

    if (currentUser?.uid) {
      await savePriceAlertConfigToFirestore(currentUser.uid, updated);
    } else {
      addToast({
        title: willEnable ? 'Email Alerts Enabled' : 'Email Alerts Paused',
        message: willEnable
          ? `Mock dispatch alerts active for ${activeEmailRecipient}`
          : 'Email notifications temporarily paused',
        type: willEnable ? 'success' : 'info',
        subMessage: 'Saved in local storage'
      });
    }
  };

  // Trigger Instant Test Email
  const handleSendTestEmail = async () => {
    setIsSendingTestEmail(true);
    try {
      const subject = `🧪 [TON Travel Alert] Test Price Alert Dispatch to ${activeEmailRecipient}`;
      await sendMockPriceAlertEmail({
        recipientEmail: activeEmailRecipient,
        triggerType: 'TEST',
        currentPrice: currentTonPrice,
        thresholdPercent: config.thresholdPercent
      });
      await recordPriceAlertEvent({
        triggerType: 'TEST',
        currentPrice: currentTonPrice,
        thresholdPercent: config.thresholdPercent,
        subject
      });
    } catch (err) {
      console.error('Error sending test email:', err);
    } finally {
      setIsSendingTestEmail(false);
    }
  };

  // Simulate any trigger type on demand and record to Firestore
  const handleSimulateTrigger = async (
    type: 'HIGH_TARGET' | 'LOW_DIP' | 'VOLATILITY_THRESHOLD' | 'TEST'
  ) => {
    setIsSimulatingTrigger(true);
    try {
      let simPrice = currentTonPrice;
      let subject = `[TON Travel Alert] TON/USD Alert: $${simPrice.toFixed(2)}`;
      let triggerRefPrice: number | undefined = undefined;
      let triggerPct: number | undefined = undefined;
      let changePct: number | undefined = undefined;

      if (type === 'HIGH_TARGET') {
        simPrice = Math.max(currentTonPrice, config.highTargetPrice || 6.50);
        triggerRefPrice = config.highTargetPrice || 6.50;
        subject = `🎯 [TON Travel Alert] TON Reached Target Rate $${simPrice.toFixed(2)} USD!`;
      } else if (type === 'LOW_DIP') {
        simPrice = Math.min(currentTonPrice, config.lowTargetPrice || 4.50);
        triggerRefPrice = config.lowTargetPrice || 4.50;
        subject = `📉 [TON Travel Alert] TON Dipped to $${simPrice.toFixed(2)} USD (Buy Zone)`;
      } else if (type === 'VOLATILITY_THRESHOLD') {
        triggerPct = config.thresholdPercent;
        changePct = 3.8;
        simPrice = Number((currentTonPrice * 1.038).toFixed(3));
        subject = `⚡ [TON Travel Alert] Volatility Spike: TON moved +3.8% (Threshold ±${config.thresholdPercent}%)`;
      } else {
        subject = `🧪 [TON Travel Alert] System Verification Test at $${simPrice.toFixed(2)} USD`;
      }

      await sendMockPriceAlertEmail({
        recipientEmail: activeEmailRecipient,
        triggerType: type,
        currentPrice: simPrice,
        thresholdPrice: triggerRefPrice,
        thresholdPercent: triggerPct,
        changePercent: changePct
      });

      await recordPriceAlertEvent({
        triggerType: type,
        currentPrice: simPrice,
        thresholdPrice: triggerRefPrice,
        thresholdPercent: triggerPct,
        changePercent: changePct,
        subject
      });

      addToast({
        title: '🔔 Alert Event Triggered & Logged',
        message: `${type.replace(/_/g, ' ')} recorded at $${simPrice.toFixed(2)} TON/USD to Firestore`,
        type: 'success',
        subMessage: 'Synced to Notification History tab'
      });
    } catch (err) {
      console.error('Error simulating price alert:', err);
    } finally {
      setIsSimulatingTrigger(false);
    }
  };

  // Delete an event record from Firestore
  const handleDeleteEvent = async (eventId: string) => {
    if (currentUser?.uid && !eventId.startsWith('local-')) {
      await deletePriceAlertEventFromFirestore(currentUser.uid, eventId);
    }
    setAlertEvents((prev) => {
      const updated = prev.filter((e) => e.id !== eventId);
      try {
        localStorage.setItem('tontravel_cached_price_alert_events', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    addToast({
      title: 'Alert Record Deleted',
      message: 'Removed notification event from history ledger',
      type: 'info'
    });
  };

  // Manually refresh events from Firestore
  const handleRefreshEvents = async () => {
    if (!currentUser?.uid) {
      addToast({
        title: 'Local Session',
        message: 'Sign in to fetch synced events from Firestore cloud storage.',
        type: 'info'
      });
      return;
    }
    setIsEventsLoading(true);
    try {
      const events = await loadPriceAlertEventsFromFirestore(currentUser.uid, 10);
      setAlertEvents(events);
      addToast({
        title: 'History Refreshed',
        message: `Synced ${events.length} price alert events from Firestore`,
        type: 'success'
      });
    } catch (err) {
      console.error('Error fetching price alert events:', err);
    } finally {
      setIsEventsLoading(false);
    }
  };

  // Export Notification History to CSV
  const handleDownloadNotificationHistoryCsv = () => {
    if (!alertEvents || alertEvents.length === 0) {
      addToast({
        title: 'No Notification History',
        message: 'There are no alert events in the ledger to export yet.',
        type: 'warning'
      });
      return;
    }

    const headers = [
      'Event ID',
      'Timestamp (UTC)',
      'Date & Time (Local)',
      'Trigger Type',
      'TON Rate at Alert (USD)',
      'Target / Threshold Reference',
      'Recipient Email',
      'Subject'
    ];

    const rows = alertEvents.map((evt) => {
      const triggerRef = evt.thresholdPrice
        ? `$${evt.thresholdPrice.toFixed(2)}`
        : evt.thresholdPercent
        ? `±${evt.thresholdPercent}%`
        : 'Manual / System';
      return [
        `"${evt.id}"`,
        `"${evt.timestamp}"`,
        `"${new Date(evt.timestamp).toLocaleString()}"`,
        `"${evt.triggerType}"`,
        evt.currentPrice.toFixed(4),
        `"${triggerRef}"`,
        `"${evt.recipientEmail || activeEmailRecipient}"`,
        `"${(evt.subject || '').replace(/"/g, '""')}"`
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `TON_Price_Alert_Notification_History_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    addToast({
      title: 'History Exported',
      message: `Exported ${alertEvents.length} alert events to CSV report`,
      type: 'success'
    });
  };

  // Relative Time Helper
  const formatRelativeTime = (isoString: string): string => {
    try {
      const diff = Date.now() - new Date(isoString).getTime();
      if (diff < 60000) return 'Just now';
      if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
      if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
      return new Date(isoString).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  // Export & Download 30-Day Historical Price Data as CSV Report
  const [isExportingCsv, setIsExportingCsv] = useState<boolean>(false);

  const handleDownloadReport = () => {
    if (!historyData || historyData.length === 0) {
      addToast({
        title: 'No Historical Data Available',
        message: 'The 30-day TON price dataset is still loading. Please try again shortly.',
        type: 'warning'
      });
      return;
    }

    setIsExportingCsv(true);

    try {
      const exportTimestamp = new Date().toISOString();
      const firstPrice = historyData[0]?.price || currentTonPrice;

      // CSV Header columns
      const headers = [
        'Date Label',
        'ISO Timestamp (UTC)',
        'Currency Pair',
        'TON Price (USD)',
        'Estimated 24h Volume (USD)',
        'Purchasing Power (Hotel Equiv USD)',
        '30D Trend Delta (%)',
        'Take-Profit Target ($USD)',
        'Dip-Buy Target ($USD)',
        'Configured Alert Threshold (%)',
        'Alert Status',
        'User Email Address'
      ];

      // Format CSV Rows
      const rows = historyData.map((pt) => {
        const deltaPct = (((pt.price - firstPrice) / firstPrice) * 100).toFixed(2);
        return [
          `"${pt.formattedTime}"`,
          `"${pt.timestamp}"`,
          '"TON/USD"',
          pt.price.toFixed(4),
          pt.volume.toString(),
          `"$${pt.hotelEquiv || (pt.price * 0.4).toFixed(2)}"`,
          `"${deltaPct}%"`,
          config.highTargetPrice.toFixed(2),
          config.lowTargetPrice.toFixed(2),
          `"±${config.thresholdPercent}%"`,
          `"${config.enabled ? 'ACTIVE' : 'PAUSED'}"`,
          `"${activeEmailRecipient}"`
        ].join(',');
      });

      // Add summary / metadata block at bottom
      const metadataRows = [
        '',
        '--- REPORT SUMMARY METADATA ---',
        `"Export Generated At","${exportTimestamp}"`,
        `"30-Day High Price (USD)","${stats30d.max.toFixed(4)}"`,
        `"30-Day Low Price (USD)","${stats30d.min.toFixed(4)}"`,
        `"30-Day Average Price (USD)","${stats30d.avg.toFixed(4)}"`,
        `"30-Day Net Performance","${stats30d.changePercent.toFixed(2)}%"`,
        `"Current TON/USD Spot Rate","${currentTonPrice.toFixed(4)}"`
      ];

      const csvContent = [headers.join(','), ...rows, ...metadataRows].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `TON_USD_30Day_Price_Report_${dateStr}.csv`;

      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      addToast({
        title: '📊 Price Report Downloaded',
        message: `Successfully exported ${historyData.length} daily price points to CSV`,
        type: 'success',
        subMessage: `${filename} (${(blob.size / 1024).toFixed(1)} KB)`
      });
    } catch (err: any) {
      console.error('Failed to export CSV report:', err);
      addToast({
        title: 'Export Failed',
        message: err?.message || 'Could not generate price report CSV',
        type: 'error'
      });
    } finally {
      setIsExportingCsv(false);
    }
  };

  const handleToggleEnabled = async () => {
    const updated: TonPriceAlertConfig = {
      ...config,
      enabled: !config.enabled,
      updatedAt: new Date().toISOString()
    };
    setConfig(updated);
    localStorage.setItem('tontravel_price_alert_config', JSON.stringify(updated));

    if (currentUser?.uid) {
      await savePriceAlertConfigToFirestore(currentUser.uid, updated);
    } else {
      addToast({
        title: updated.enabled ? 'Price Alerts Enabled' : 'Price Alerts Paused',
        message: updated.enabled
          ? `Monitoring active at ±${updated.thresholdPercent}% sensitivity`
          : 'Real-time alert triggers paused',
        type: updated.enabled ? 'success' : 'info',
        subMessage: 'Saved in local storage'
      });
    }
  };

  const handleToggleSound = async () => {
    const willEnable = !config.soundEnabled;
    const updated: TonPriceAlertConfig = {
      ...config,
      soundEnabled: willEnable,
      updatedAt: new Date().toISOString()
    };
    setConfig(updated);
    setSoundMuted(!willEnable);
    localStorage.setItem('tontravel_price_alert_config', JSON.stringify(updated));

    if (willEnable) {
      playPreviewChime('TEST');
    }

    if (currentUser?.uid) {
      await savePriceAlertConfigToFirestore(currentUser.uid, updated);
    }

    addToast({
      title: willEnable ? '🔊 Audio Chime Unmuted' : '🔇 Audio Chime Muted',
      message: willEnable
        ? 'Subtle harmonic chime will play whenever price alert events trigger'
        : 'Price alert sound notifications muted',
      type: willEnable ? 'success' : 'info'
    });
  };

  const handleTestChimeSound = (
    triggerType: 'HIGH_TARGET' | 'LOW_DIP' | 'VOLATILITY_THRESHOLD' | 'TEST' = 'TEST'
  ) => {
    playPreviewChime(triggerType);
    addToast({
      title: '🎵 Playing Sample Chime',
      message: `Auditioning subtle ${triggerType.replace(/_/g, ' ').toLowerCase()} tone`,
      type: 'info'
    });
  };

  const handlePresetSelect = (preset: number) => {
    setThresholdInput(preset.toString());
  };

  // 30-Day Computed Statistics
  const stats30d = useMemo(() => {
    if (!historyData || historyData.length === 0) {
      return {
        min: currentTonPrice * 0.9,
        max: currentTonPrice * 1.1,
        avg: currentTonPrice,
        first: currentTonPrice,
        latest: currentTonPrice,
        changeUsd: 0,
        changePercent: 0,
        isPositive: true
      };
    }

    const prices = historyData.map((p) => p.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    const first = prices[0];
    const latest = prices[prices.length - 1];
    const changeUsd = latest - first;
    const changePercent = (changeUsd / first) * 100;
    const isPositive = changePercent >= 0;

    return {
      min,
      max,
      avg,
      first,
      latest,
      changeUsd,
      changePercent,
      isPositive
    };
  }, [historyData, currentTonPrice]);

  // Recommended alert price based on historical 30-day average rate minus 5%
  const suggestedAlertPrice = useMemo(() => {
    return Number((stats30d.avg * 0.95).toFixed(2));
  }, [stats30d.avg]);

  const suggestedThresholdPercent = useMemo(() => {
    if (!currentTonPrice || currentTonPrice <= 0) return 5.0;
    const diffPct = Math.abs(((currentTonPrice - suggestedAlertPrice) / currentTonPrice) * 100);
    return Math.max(1.0, Math.min(25.0, Number(diffPct.toFixed(1))));
  }, [currentTonPrice, suggestedAlertPrice]);

  const handleApplySuggestedThreshold = async () => {
    const recommendedPrice = suggestedAlertPrice;
    const recommendedPercent = suggestedThresholdPercent;

    setThresholdInput(recommendedPercent.toString());

    const updated: TonPriceAlertConfig = {
      ...config,
      thresholdPercent: recommendedPercent,
      lowTargetPrice: recommendedPrice,
      alertOnLow: true,
      updatedAt: new Date().toISOString()
    };

    setConfig(updated);
    localStorage.setItem('tontravel_price_alert_config', JSON.stringify(updated));

    if (currentUser?.uid) {
      await savePriceAlertConfigToFirestore(currentUser.uid, updated);
    }

    addToast({
      title: '✨ Suggested Threshold Applied',
      message: `Set proactive dip alert to $${recommendedPrice.toFixed(2)} (-5% below 30d avg $${stats30d.avg.toFixed(2)}) with ±${recommendedPercent}% threshold`,
      type: 'success',
      subMessage: 'Saved to alert triggers'
    });
  };

  return (
    <div
      id="price-alert-manager"
      className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-800 hover:border-blue-500/40 rounded-3xl p-5 sm:p-6 transition-all shadow-xl space-y-5"
    >
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center border transition-all ${
              config.enabled
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-400 shadow-lg shadow-amber-500/10'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            {config.enabled ? (
              <BellRing className="w-5 h-5 animate-pulse text-amber-300" />
            ) : (
              <Bell className="w-5 h-5 text-slate-400" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm sm:text-base text-white tracking-tight">
                TON Price Alert Manager
              </h3>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  config.enabled
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                {config.enabled ? 'ACTIVE' : 'PAUSED'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live market volatility threshold & target rate tracking
            </p>
          </div>
        </div>

        {/* Quick Toggles */}
        <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
          <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-xl p-0.5 shadow-sm">
            <button
              id="toggle-price-alert-sound"
              onClick={handleToggleSound}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                config.soundEnabled
                  ? 'bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30'
                  : 'text-slate-500 hover:text-slate-400 hover:bg-slate-800'
              }`}
              title={config.soundEnabled ? 'Audio Chime Enabled (Click to Mute)' : 'Audio Chime Muted (Click to Unmute)'}
            >
              {config.soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span>{config.soundEnabled ? 'Sound On' : 'Muted'}</span>
            </button>

            {config.soundEnabled && (
              <button
                type="button"
                id="preview-chime-quick-btn"
                onClick={() => handleTestChimeSound('TEST')}
                className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-all text-[11px]"
                title="Audition alert chime"
              >
                <Sparkles className="w-3 h-3 text-cyan-400" />
              </button>
            )}
          </div>

          <button
            id="toggle-price-alert-status"
            onClick={handleToggleEnabled}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border shadow-sm ${
              config.enabled
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/30'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {config.enabled ? 'Pause Alerts' : 'Enable Alerts'}
          </button>
        </div>
      </div>

      {/* Tab Navigation: Price Triggers vs Notification History */}
      <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
        <button
          type="button"
          id="tab-price-triggers"
          onClick={() => setActiveTab('triggers')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
            activeTab === 'triggers'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Price Triggers & Analytics</span>
        </button>

        <button
          type="button"
          id="tab-notification-history"
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all relative ${
            activeTab === 'history'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Notification History</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
              activeTab === 'history'
                ? 'bg-amber-400 text-slate-950 font-black'
                : 'bg-slate-800 text-slate-300 border border-slate-700'
            }`}
          >
            {alertEvents.length}
          </span>
        </button>
      </div>

      {/* VIEW 1: Price Triggers & Analytics Tab */}
      {activeTab === 'triggers' && (
        <div className="space-y-5">
          {/* Current Metrics Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3">
          <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
            <Sliders className="w-3 h-3 text-cyan-400" />
            <span>Active Threshold</span>
          </div>
          <div className="text-base font-extrabold text-white mt-1 font-mono">
            ±{config.thresholdPercent.toFixed(1)}%
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Sensitivity limit</div>
        </div>

        <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3">
          <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-blue-400" />
            <span>Live TON Rate</span>
          </div>
          <div className="text-base font-extrabold text-cyan-300 mt-1 font-mono">
            ${currentTonPrice.toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">USD Benchmark</div>
        </div>

        <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3">
          <div className="text-[10px] uppercase font-bold text-emerald-400 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>High Target</span>
          </div>
          <div className="text-base font-extrabold text-emerald-300 mt-1 font-mono">
            ${config.highTargetPrice.toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Take-profit alert</div>
        </div>

        <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3">
          <div className="text-[10px] uppercase font-bold text-rose-400 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <TrendingDown className="w-3 h-3" />
              <span>Low Target</span>
            </div>
            <button
              type="button"
              id="low-target-apply-suggested-btn"
              onClick={handleApplySuggestedThreshold}
              className="text-[9px] font-mono text-amber-400 hover:text-amber-300 font-bold bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-800/60 transition-colors"
              title="Apply Suggested Alert Price (30d avg -5%)"
            >
              Rec: ${suggestedAlertPrice.toFixed(2)}
            </button>
          </div>
          <div className="text-base font-extrabold text-rose-300 mt-1 font-mono">
            ${config.lowTargetPrice.toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Dip-buy alert</div>
        </div>
      </div>

      {/* 30-Day Historical Price Trend Chart (Recharts) */}
      <div
        id="price-alert-30d-chart-container"
        className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-3.5 sm:p-4 space-y-3"
      >
        {/* Chart Header & Trend Summary */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-800/80 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Calendar className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-black text-white uppercase tracking-wider">
                  30-Day TON/USD Price History
                </h4>
                <span
                  className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border flex items-center gap-0.5 ${
                    stats30d.isPositive
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                  }`}
                >
                  {stats30d.isPositive ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                  <span>
                    {stats30d.isPositive ? '+' : ''}
                    {stats30d.changePercent.toFixed(2)}%
                  </span>
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Daily closing exchange rates & threshold intersection analysis
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <div className="hidden sm:flex text-[10px] font-mono text-slate-400 items-center gap-2">
              <span>H: <strong className="text-emerald-400">${stats30d.max.toFixed(2)}</strong></span>
              <span>L: <strong className="text-rose-400">${stats30d.min.toFixed(2)}</strong></span>
              <span>Avg: <strong className="text-slate-300">${stats30d.avg.toFixed(2)}</strong></span>
            </div>

            <button
              type="button"
              id="download-30d-price-report-btn"
              onClick={handleDownloadReport}
              disabled={isExportingCsv || isHistoryLoading}
              className="px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-cyan-300 hover:text-cyan-200 border border-blue-500/40 text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50 shadow-sm"
              title="Download 30-Day Historical TON Price Data as CSV"
            >
              <Download className={`w-3.5 h-3.5 ${isExportingCsv ? 'animate-bounce' : ''}`} />
              <span>Download Report</span>
            </button>

            <button
              type="button"
              id="refresh-30d-history-btn"
              onClick={fetchHistory30d}
              disabled={isHistoryLoading}
              className="p-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-300 hover:border-slate-700 transition-colors"
              title="Refresh 30-Day Historical Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isHistoryLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Recharts Area Chart Component */}
        <div className="w-full h-48 sm:h-56 relative">
          {isHistoryLoading && (
            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-10 rounded-xl">
              <div className="flex items-center gap-2 text-xs text-blue-300 font-mono">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                <span>Loading 30-day TON price curve...</span>
              </div>
            </div>
          )}

          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={historyData}
              margin={{ top: 8, right: 8, left: -22, bottom: 0 }}
            >
              <defs>
                <linearGradient id="alertManager30dGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={stats30d.isPositive ? '#06b6d4' : '#f43f5e'}
                    stopOpacity={0.4}
                  />
                  <stop
                    offset="95%"
                    stopColor={stats30d.isPositive ? '#3b82f6' : '#881337'}
                    stopOpacity={0.0}
                  />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />

              <XAxis
                dataKey="formattedTime"
                stroke="#64748b"
                tick={{ fontSize: 9, fill: '#64748b' }}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
                minTickGap={20}
              />

              <YAxis
                domain={['auto', 'auto']}
                stroke="#64748b"
                tick={{ fontSize: 9, fill: '#64748b' }}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
                tickFormatter={(val) => `$${Number(val).toFixed(2)}`}
              />

              {/* 30-Day Average Reference Line */}
              <ReferenceLine
                y={stats30d.avg}
                stroke="#64748b"
                strokeDasharray="3 3"
                label={{
                  value: `Avg $${stats30d.avg.toFixed(2)}`,
                  fill: '#94a3b8',
                  fontSize: 8,
                  position: 'insideBottomRight'
                }}
              />

              {/* High Target Price Alert Reference Line (if in visible range) */}
              {config.alertOnHigh && config.highTargetPrice && (
                <ReferenceLine
                  y={config.highTargetPrice}
                  stroke="#10b981"
                  strokeDasharray="4 4"
                  label={{
                    value: `High Target $${config.highTargetPrice.toFixed(2)}`,
                    fill: '#34d399',
                    fontSize: 8,
                    position: 'insideTopLeft'
                  }}
                />
              )}

              {/* Low Target Price Alert Reference Line (if in visible range) */}
              {config.alertOnLow && config.lowTargetPrice && (
                <ReferenceLine
                  y={config.lowTargetPrice}
                  stroke="#f43f5e"
                  strokeDasharray="4 4"
                  label={{
                    value: `Low Target $${config.lowTargetPrice.toFixed(2)}`,
                    fill: '#fb7185',
                    fontSize: 8,
                    position: 'insideBottomLeft'
                  }}
                />
              )}

              {/* Suggested Threshold Reference Line (30-Day Avg minus 5%) */}
              <ReferenceLine
                y={suggestedAlertPrice}
                stroke="#f59e0b"
                strokeDasharray="2 2"
                label={{
                  value: `Suggested $${suggestedAlertPrice.toFixed(2)} (-5%)`,
                  fill: '#fcd34d',
                  fontSize: 8,
                  position: 'insideBottom'
                }}
              />

              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as CryptoRankPricePoint;
                    const price = data.price;
                    const delta = price - stats30d.first;
                    const deltaPct = (delta / stats30d.first) * 100;

                    return (
                      <div className="bg-slate-900/95 border border-cyan-500/40 rounded-xl p-2.5 shadow-2xl backdrop-blur-md text-xs space-y-1 min-w-[170px]">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono border-b border-slate-800 pb-1">
                          <span>{data.formattedTime}</span>
                          <span className="text-cyan-400">TON/USD</span>
                        </div>

                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-slate-300 text-[11px]">Price:</span>
                          <strong className="text-xs font-black text-cyan-300 font-mono">
                            ${price.toFixed(3)}
                          </strong>
                        </div>

                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <span className="text-slate-400">30d Delta:</span>
                          <span
                            className={`font-bold ${
                              deltaPct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {deltaPct >= 0 ? '+' : ''}
                            {deltaPct.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              <Area
                type="monotone"
                dataKey="price"
                stroke={stats30d.isPositive ? '#22d3ee' : '#fb7185'}
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#alertManager30dGradient)"
                activeDot={{
                  r: 5,
                  fill: '#38bdf8',
                  stroke: '#ffffff',
                  strokeWidth: 1.5
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Dynamic Legend / Threshold Cross Status */}
        <div className="flex items-center justify-between flex-wrap gap-2 text-[10px] text-slate-400 pt-1 border-t border-slate-800/60 font-mono">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-slate-300">
              <span className="w-2 h-0.5 bg-cyan-400 rounded-full inline-block"></span>
              <span>30D Rate Trend</span>
            </span>
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-2 h-0.5 border-b border-emerald-400 border-dashed inline-block"></span>
              <span>Target: ${config.highTargetPrice.toFixed(2)}</span>
            </span>
            <span className="flex items-center gap-1 text-rose-400">
              <span className="w-2 h-0.5 border-b border-rose-400 border-dashed inline-block"></span>
              <span>Dip: ${config.lowTargetPrice.toFixed(2)}</span>
            </span>
            <span className="flex items-center gap-1 text-amber-300">
              <span className="w-2 h-0.5 border-b border-amber-400 border-dotted inline-block"></span>
              <span>Suggested: ${suggestedAlertPrice.toFixed(2)}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="export-csv-footer-btn"
              onClick={handleDownloadReport}
              disabled={isExportingCsv || isHistoryLoading}
              className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors disabled:opacity-50"
            >
              <FileSpreadsheet className="w-3 h-3" />
              <span>Export CSV</span>
            </button>
            <span className="text-slate-600">•</span>
            <span className="text-slate-500">
              Current: ${currentTonPrice.toFixed(2)} USD
            </span>
          </div>
        </div>
      </div>

      {/* Price Alert Notifications (Email Dispatch System) */}
      <div
        id="price-alert-notifications-card"
        className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-4 sm:p-5 space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className={`p-2.5 rounded-2xl border shrink-0 transition-all ${
                config.emailNotificationsEnabled
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 shadow-lg shadow-emerald-500/10'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
            >
              {config.emailNotificationsEnabled ? (
                <MailCheck className="w-5 h-5" />
              ) : (
                <Mail className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-extrabold text-white tracking-tight">
                  Price Alert Email Notifications
                </h4>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    config.emailNotificationsEnabled
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  {config.emailNotificationsEnabled ? 'ENABLED' : 'DISABLED'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Automatically triggers email notifications when TON/USD crosses your defined thresholds.
              </p>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-[11px] text-slate-500">Recipient:</span>
                <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-950/60 px-2.5 py-0.5 rounded-lg border border-cyan-800/50 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-cyan-400" />
                  <span>{activeEmailRecipient}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Action Controls & Master Toggle */}
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <button
              type="button"
              id="send-test-price-alert-email-btn"
              onClick={handleSendTestEmail}
              disabled={isSendingTestEmail}
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
              title="Send a sample price alert notification email"
            >
              <Send className={`w-3.5 h-3.5 ${isSendingTestEmail ? 'animate-bounce text-cyan-400' : 'text-slate-400'}`} />
              <span>{isSendingTestEmail ? 'Sending...' : 'Send Test Alert'}</span>
            </button>

            {/* Toggle Switch */}
            <button
              type="button"
              id="toggle-email-price-alerts-switch"
              role="switch"
              aria-checked={config.emailNotificationsEnabled ?? true}
              onClick={handleToggleEmailAlerts}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/40 ${
                config.emailNotificationsEnabled ? 'bg-emerald-500' : 'bg-slate-800'
              }`}
              title={config.emailNotificationsEnabled ? 'Disable email alerts' : 'Enable email alerts'}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  config.emailNotificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Sent Emails Drawer / Logs Toggle */}
        <div className="pt-2 border-t border-slate-800/60">
          <div className="flex items-center justify-between">
            <button
              type="button"
              id="toggle-sent-emails-log"
              onClick={() => setShowEmailLogs(!showEmailLogs)}
              className="text-xs font-bold text-slate-400 hover:text-cyan-300 flex items-center gap-1.5 transition-colors"
            >
              <Inbox className="w-3.5 h-3.5 text-cyan-400" />
              <span>Dispatched Alert Emails Log</span>
              <span className="text-[10px] font-mono font-bold bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded-full border border-slate-700">
                {sentEmails.length}
              </span>
              {showEmailLogs ? (
                <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>

            {sentEmails.length > 0 && showEmailLogs && (
              <span className="text-[10px] text-slate-500">
                Delivered to authenticated inbox
              </span>
            )}
          </div>

          {/* Collapsible Sent Emails List */}
          {showEmailLogs && (
            <div className="mt-3 space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {sentEmails.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-900/60 border border-dashed border-slate-800 text-center text-xs text-slate-500">
                  No price alert emails dispatched yet. Trigger an alert test or wait for market price threshold crossing.
                </div>
              ) : (
                sentEmails.map((mail) => (
                  <div
                    key={mail.id}
                    className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[9px] font-mono font-black px-1.5 py-0.5 rounded border uppercase ${
                            mail.triggerType === 'HIGH_TARGET'
                              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                              : mail.triggerType === 'LOW_DIP'
                              ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                              : mail.triggerType === 'VOLATILITY_THRESHOLD'
                              ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                              : 'bg-blue-500/15 border-blue-500/30 text-blue-400'
                          }`}
                        >
                          {mail.triggerType}
                        </span>
                        <strong className="text-white text-xs font-semibold">{mail.subject}</strong>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">
                        {new Date(mail.sentAt).toLocaleTimeString()}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 font-mono flex items-center justify-between border-t border-slate-800/60 pt-1">
                      <span>To: <strong className="text-slate-300">{mail.recipientEmail}</strong></span>
                      <span className="text-cyan-400 font-bold">TON: ${mail.currentPrice.toFixed(3)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Audio Notification Chime Settings Card */}
      <div
        id="price-alert-sound-notification-card"
        className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-4 sm:p-5 space-y-3"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className={`p-2.5 rounded-2xl border shrink-0 transition-all ${
                config.soundEnabled
                  ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400 shadow-lg shadow-cyan-500/10'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
            >
              {config.soundEnabled ? (
                <Volume2 className="w-5 h-5" />
              ) : (
                <VolumeX className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-extrabold text-white tracking-tight">
                  Audio Chime Notification Playback
                </h4>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    config.soundEnabled
                      ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  {config.soundEnabled ? 'CHIME ACTIVE' : 'MUTED'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Synthesizes subtle Web Audio harmonic chimes when price alert events or mock dispatches occur.
              </p>
              <div className="flex items-center gap-2 mt-2 flex-wrap text-[11px] text-slate-400">
                <span className="text-slate-500">Harmonic Tone:</span>
                <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                  Dual/Triple Sine Chimes (Exponential Soft Decay)
                </span>
              </div>
            </div>
          </div>

          {/* Action Controls & Sound Switch */}
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <button
              type="button"
              id="test-chime-sound-btn"
              onClick={() => handleTestChimeSound('TEST')}
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 hover:text-cyan-200 border border-slate-700/80 font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95"
              title="Audition the harmonic price alert sound"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Test Chime</span>
            </button>

            {/* Toggle Switch */}
            <button
              type="button"
              id="toggle-sound-mute-switch"
              role="switch"
              aria-checked={config.soundEnabled}
              onClick={handleToggleSound}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500/40 ${
                config.soundEnabled ? 'bg-cyan-500' : 'bg-slate-800'
              }`}
              title={config.soundEnabled ? 'Mute audio notification chime' : 'Unmute audio notification chime'}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  config.soundEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Quick Tone Audition Bar */}
        <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between gap-2 flex-wrap text-xs">
          <span className="text-[11px] text-slate-400 font-medium">Audition alert sound types:</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => handleTestChimeSound('HIGH_TARGET')}
              className="px-2 py-0.5 rounded-lg bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold font-mono transition-all"
            >
              🎯 High Target
            </button>
            <button
              type="button"
              onClick={() => handleTestChimeSound('LOW_DIP')}
              className="px-2 py-0.5 rounded-lg bg-rose-950/50 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 text-[10px] font-bold font-mono transition-all"
            >
              📉 Dip Buy
            </button>
            <button
              type="button"
              onClick={() => handleTestChimeSound('VOLATILITY_THRESHOLD')}
              className="px-2 py-0.5 rounded-lg bg-amber-950/50 hover:bg-amber-900/60 border border-amber-500/30 text-amber-300 text-[10px] font-bold font-mono transition-all"
            >
              ⚡ Volatility Spike
            </button>
          </div>
        </div>
      </div>

      {/* Threshold Modification Form */}
      <form onSubmit={handleUpdateThreshold} className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="threshold-percent-input"
              className="text-xs font-bold text-slate-300 flex items-center gap-1.5"
            >
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span>Modify Alert Volatility Threshold (%)</span>
            </label>
            <span className="text-[11px] font-mono text-cyan-400 font-bold">
              Current: ±{config.thresholdPercent}%
            </span>
          </div>

          {/* Quick Preset Buttons & Proactive Suggestion */}
          <div className="flex flex-wrap items-center gap-1.5">
            {PRESET_THRESHOLDS.map((val) => (
              <button
                key={val}
                type="button"
                id={`preset-threshold-${val}`}
                onClick={() => handlePresetSelect(val)}
                className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold transition-all border ${
                  parseFloat(thresholdInput) === val
                    ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 ring-1 ring-amber-400/30'
                    : 'bg-slate-800/70 border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                }`}
              >
                ±{val}%
              </button>
            ))}

            {/* Suggested Threshold Button */}
            <button
              type="button"
              id="suggested-threshold-btn"
              onClick={handleApplySuggestedThreshold}
              className="px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all border bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-cyan-500/20 border-amber-500/50 text-amber-300 hover:text-white hover:border-amber-400 hover:from-amber-500/30 hover:to-cyan-500/30 flex items-center gap-1.5 shadow-sm active:scale-95"
              title={`Calculates recommended alert price $${suggestedAlertPrice.toFixed(2)} (30d average $${stats30d.avg.toFixed(2)} minus 5%)`}
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              <span>Suggested Threshold (Avg -5%)</span>
            </button>
          </div>

          {/* Proactive Recommendation Insight Banner */}
          <div
            id="suggested-threshold-insight-banner"
            className="p-3 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs"
          >
            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shrink-0 mt-0.5 sm:mt-0">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-white">Recommended Proactive Dip Rate:</span>
                  <span className="font-mono font-black text-amber-300 text-sm bg-amber-950/80 px-2 py-0.5 rounded-lg border border-amber-800/60">
                    ${suggestedAlertPrice.toFixed(2)} USD
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    (30d Avg ${stats30d.avg.toFixed(2)} - 5%)
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Proactively captures favorable rate dips before buying TON or booking travel reservations.
                </p>
              </div>
            </div>

            <button
              type="button"
              id="apply-suggested-threshold-banner-btn"
              onClick={handleApplySuggestedThreshold}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all shrink-0 self-start sm:self-auto"
            >
              <Zap className="w-3.5 h-3.5 text-slate-950 fill-slate-950" />
              <span>Apply Recommendation</span>
            </button>
          </div>

          {/* Main Input Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
            <div className="relative flex-1">
              <input
                id="threshold-percent-input"
                type="number"
                step="0.1"
                min="0.1"
                max="50"
                value={thresholdInput}
                onChange={(e) => setThresholdInput(e.target.value)}
                placeholder="e.g. 3.0"
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-2xl px-4 py-3 text-sm font-mono font-bold text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-400/40 transition-all"
                required
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-500 pointer-events-none">
                % change
              </span>
            </div>

            <button
              type="submit"
              id="update-price-alert-btn"
              disabled={isSaving}
              className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black px-6 py-3 rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-98 transition-all disabled:opacity-50 shrink-0"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Syncing...</span>
                </>
              ) : saveSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-950" />
                  <span>Updated!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Update Threshold</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error Feedback */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Firestore Cloud Sync Status Card */}
        <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl shrink-0 ${
                currentUser
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              }`}
            >
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-white flex items-center gap-1.5">
                <span>{currentUser ? 'Cloud Synced via Firestore' : 'Local Storage Mode'}</span>
                {currentUser && (
                  <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950 px-1.5 py-0.2 rounded border border-emerald-800">
                    users/{currentUser.uid.slice(0, 6)}...
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {currentUser
                  ? 'Alert configurations are persisted in real-time to your Firebase account'
                  : 'Sign in with Google/Firebase to sync price alert triggers across all your devices'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            {!currentUser && onOpenAuth && (
              <button
                type="button"
                id="sign-in-for-cloud-sync"
                onClick={onOpenAuth}
                className="px-3 py-1.5 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 text-cyan-300 border border-blue-500/40 font-bold text-xs flex items-center gap-1.5 transition-all"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Connect Firebase</span>
              </button>
            )}

            {onOpenCryptoRankConnector && (
              <button
                type="button"
                id="open-full-cryptorank-modal"
                onClick={onOpenCryptoRankConnector}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium text-xs transition-all border border-slate-700"
              >
                Open Advanced Center
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  )}

      {/* VIEW 2: Notification History Tab (Last 10 Firestore Alert Events) */}
      {activeTab === 'history' && (
        <div id="price-alert-notification-history-view" className="space-y-4">
          {/* Notification History Sub-Header Banner */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shrink-0">
                <History className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-extrabold text-sm text-white">Triggered Price Alert Events</h4>
                  <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded-full border border-cyan-800/60 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                    Last 10 Events • Firestore Realtime
                  </span>
                </div>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Historical ledger of triggered price alerts with timestamps & recorded TON/USD exchange rates.
                </p>
              </div>
            </div>

            {/* Action Controls */}
            <div className="flex items-center gap-2 flex-wrap shrink-0 self-start sm:self-auto">
              <button
                type="button"
                id="simulate-test-alert-trigger-btn"
                onClick={() => handleSimulateTrigger('TEST')}
                disabled={isSimulatingTrigger}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                <span>Simulate Test Trigger</span>
              </button>

              <button
                type="button"
                id="export-notification-history-csv-btn"
                onClick={handleDownloadNotificationHistoryCsv}
                disabled={alertEvents.length === 0}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-xs flex items-center gap-1.5 transition-all border border-slate-700 disabled:opacity-40"
                title="Export last 10 notification events to CSV"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>CSV</span>
              </button>

              <button
                type="button"
                id="refresh-notification-history-btn"
                onClick={handleRefreshEvents}
                className="p-1.5 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-cyan-300 border border-slate-800 transition-all"
                title="Refresh from Firestore"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isEventsLoading ? 'animate-spin text-cyan-400' : ''}`} />
              </button>
            </div>
          </div>

          {/* Firestore Connection Indicator */}
          {currentUser ? (
            <div className="px-3 py-2 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Cloud className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Firestore collection:{' '}
                  <code className="text-[11px] font-mono text-emerald-200">
                    users/{currentUser.uid.slice(0, 8)}.../priceAlertEvents
                  </code>
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold bg-emerald-900/60 px-2 py-0.5 rounded border border-emerald-700/50">
                ORDER BY timestamp DESC (LIMIT 10)
              </span>
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-950/40 to-slate-900 border border-blue-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 shrink-0">
                  <LogIn className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-white">Local Session Mode</div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Sign in with Firebase to persist and sync your price alert trigger history across all your devices.
                  </p>
                </div>
              </div>
              {onOpenAuth && (
                <button
                  type="button"
                  onClick={onOpenAuth}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 self-start sm:self-auto shrink-0 transition-all"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In to Sync</span>
                </button>
              )}
            </div>
          )}

          {/* Quick Simulation Bar for all trigger conditions */}
          <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="text-slate-400 flex items-center gap-1.5 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Simulate Trigger Scenarios:</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleSimulateTrigger('HIGH_TARGET')}
                className="px-2.5 py-1 rounded-lg bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 font-mono text-[11px] font-bold transition-all active:scale-95 flex items-center gap-1"
              >
                <Target className="w-3 h-3 text-emerald-400" />
                <span>High Target (${config.highTargetPrice.toFixed(2)})</span>
              </button>
              <button
                type="button"
                onClick={() => handleSimulateTrigger('LOW_DIP')}
                className="px-2.5 py-1 rounded-lg bg-rose-950/70 hover:bg-rose-900 border border-rose-500/40 text-rose-300 font-mono text-[11px] font-bold transition-all active:scale-95 flex items-center gap-1"
              >
                <TrendingDown className="w-3 h-3 text-rose-400" />
                <span>Dip Buy (${config.lowTargetPrice.toFixed(2)})</span>
              </button>
              <button
                type="button"
                onClick={() => handleSimulateTrigger('VOLATILITY_THRESHOLD')}
                className="px-2.5 py-1 rounded-lg bg-amber-950/70 hover:bg-amber-900 border border-amber-500/40 text-amber-300 font-mono text-[11px] font-bold transition-all active:scale-95 flex items-center gap-1"
              >
                <Zap className="w-3 h-3 text-amber-400" />
                <span>Volatility (±{config.thresholdPercent}%)</span>
              </button>
            </div>
          </div>

          {/* Event Ledger Cards */}
          {isEventsLoading ? (
            <div className="p-8 text-center bg-slate-950/40 rounded-2xl border border-slate-800 space-y-2">
              <RefreshCw className="w-6 h-6 text-amber-400 animate-spin mx-auto" />
              <p className="text-xs text-slate-400">Loading price alert events from Firestore...</p>
            </div>
          ) : alertEvents.length === 0 ? (
            <div className="p-8 text-center bg-slate-950/40 rounded-2xl border border-dashed border-slate-800 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                <History className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">No Price Alert Events Recorded Yet</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                  Trigger events will appear here in real-time as TON/USD market fluctuations cross your active threshold of ±{config.thresholdPercent}%.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleSimulateTrigger('TEST')}
                className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-xs inline-flex items-center gap-1.5 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Simulate First Price Alert Event</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {alertEvents.map((evt, idx) => {
                const isHigh = evt.triggerType === 'HIGH_TARGET';
                const isLow = evt.triggerType === 'LOW_DIP';
                const isVolatility = evt.triggerType === 'VOLATILITY_THRESHOLD';
                const isTest = evt.triggerType === 'TEST';

                return (
                  <div
                    key={evt.id || idx}
                    className="bg-slate-950/70 hover:bg-slate-950 border border-slate-800/80 hover:border-amber-500/30 rounded-2xl p-3.5 sm:p-4 transition-all space-y-3"
                  >
                    {/* Top Row: Badge, Index & Timestamp */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-mono text-slate-500 font-bold">
                          #{idx + 1}
                        </span>

                        {isHigh && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 flex items-center gap-1">
                            <Target className="w-3 h-3 text-emerald-400" />
                            <span>TAKE-PROFIT TARGET HIT</span>
                          </span>
                        )}
                        {isLow && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/15 border border-rose-500/40 text-rose-300 flex items-center gap-1">
                            <TrendingDown className="w-3 h-3 text-rose-400" />
                            <span>DIP-BUY OPPORTUNITY</span>
                          </span>
                        )}
                        {isVolatility && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 border border-amber-500/40 text-amber-300 flex items-center gap-1">
                            <Zap className="w-3 h-3 text-amber-400" />
                            <span>VOLATILITY THRESHOLD CROSSED</span>
                          </span>
                        )}
                        {isTest && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-cyan-400" />
                            <span>SYSTEM VERIFICATION TEST</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span className="font-mono text-slate-300 font-semibold">{formatRelativeTime(evt.timestamp)}</span>
                        <span className="text-slate-600">•</span>
                        <span className="font-mono text-slate-500 text-[10px]" title={evt.timestamp}>
                          {new Date(evt.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Middle Row: Prominent TON/USD Price Rate & Threshold Reference */}
                    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          TON/USD Rate at Alert Time
                        </span>
                        <div className="flex items-baseline gap-2 mt-0.5">
                          <span className="text-xl sm:text-2xl font-black font-mono text-amber-300 tracking-tight">
                            ${evt.currentPrice.toFixed(3)}
                          </span>
                          <span className="text-xs font-bold text-slate-400 font-mono">USD / TON</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 sm:text-right">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">
                            Trigger Reference
                          </span>
                          <div className="font-mono font-bold text-xs text-white mt-0.5">
                            {evt.thresholdPrice
                              ? `Target: $${evt.thresholdPrice.toFixed(2)} USD`
                              : evt.thresholdPercent
                              ? `Sensitivity: ±${evt.thresholdPercent}%`
                              : 'Manual Trigger'}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteEvent(evt.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/50 border border-transparent hover:border-rose-800/40 transition-all self-center"
                          title="Delete event record from Firestore"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Bottom Row: Recipient Email & Subject */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-[11px] text-slate-400 pt-1">
                      <div className="flex items-center gap-1.5 text-slate-300 truncate">
                        <Mail className="w-3 h-3 text-cyan-400 shrink-0" />
                        <span className="truncate">{evt.subject || `TON/USD Alert at $${evt.currentPrice.toFixed(2)}`}</span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-500 shrink-0">
                        Recipient: <span className="text-slate-300">{evt.recipientEmail || activeEmailRecipient}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
