/**
 * Mock Email Notification Service for TON Price Alerts
 * Dispatches simulated email alerts when the TON/USD rate crosses the user's defined thresholds.
 */

import { addToast } from './toastService';
import { playPriceAlertChime } from './soundService';

export interface PriceAlertEmailPayload {
  id: string;
  recipientEmail: string;
  subject: string;
  triggerType: 'HIGH_TARGET' | 'LOW_DIP' | 'VOLATILITY_THRESHOLD' | 'TEST';
  currentPrice: number;
  thresholdPrice?: number;
  thresholdPercent?: number;
  changePercent?: number;
  sentAt: string;
  status: 'DELIVERED' | 'QUEUED';
  bodyText: string;
  bodyHtml: string;
}

type EmailListener = (emails: PriceAlertEmailPayload[]) => void;

const EMAIL_STORAGE_KEY = 'tontravel_sent_email_alerts';

let sentEmailsState: PriceAlertEmailPayload[] = (() => {
  try {
    const saved = localStorage.getItem(EMAIL_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
})();

const listeners = new Set<EmailListener>();

export function getSentEmailAlerts(): PriceAlertEmailPayload[] {
  return [...sentEmailsState];
}

export function subscribeToEmailAlerts(listener: EmailListener): () => void {
  listeners.add(listener);
  listener([...sentEmailsState]);
  return () => {
    listeners.delete(listener);
  };
}

function persistAndNotify() {
  try {
    localStorage.setItem(EMAIL_STORAGE_KEY, JSON.stringify(sentEmailsState.slice(0, 30)));
  } catch (e) {
    console.error('Failed to cache sent emails:', e);
  }
  const current = [...sentEmailsState];
  listeners.forEach((listener) => {
    try {
      listener(current);
    } catch (e) {
      console.error('Error in email listener:', e);
    }
  });
}

/**
 * Dispatch a mock email alert to the user's authenticated address
 */
export async function sendMockPriceAlertEmail(params: {
  recipientEmail: string;
  triggerType: 'HIGH_TARGET' | 'LOW_DIP' | 'VOLATILITY_THRESHOLD' | 'TEST';
  currentPrice: number;
  thresholdPrice?: number;
  thresholdPercent?: number;
  changePercent?: number;
}): Promise<PriceAlertEmailPayload> {
  const { recipientEmail, triggerType, currentPrice, thresholdPrice, thresholdPercent, changePercent } = params;

  let titleBadge = 'PRICE MOVEMENT ALERT';
  let subject = `[TON Travel Alert] TON/USD Alert: $${currentPrice.toFixed(2)}`;
  let alertSummary = '';

  if (triggerType === 'HIGH_TARGET') {
    titleBadge = 'TAKE-PROFIT TARGET HIT';
    subject = `🎯 [TON Travel Alert] TON Reached Target Rate $${currentPrice.toFixed(2)} USD!`;
    alertSummary = `TON/USD has risen to or surpassed your target price threshold of $${thresholdPrice?.toFixed(2)} USD.`;
  } else if (triggerType === 'LOW_DIP') {
    titleBadge = 'DIP-BUY OPPORTUNITY';
    subject = `📉 [TON Travel Alert] TON Dipped to $${currentPrice.toFixed(2)} USD (Buy Zone)`;
    alertSummary = `TON/USD has dropped to or below your buy-dip price threshold of $${thresholdPrice?.toFixed(2)} USD.`;
  } else if (triggerType === 'VOLATILITY_THRESHOLD') {
    titleBadge = 'VOLATILITY THRESHOLD CROSSED';
    subject = `⚡ [TON Travel Alert] Volatility Spike: TON moved ${changePercent && changePercent > 0 ? '+' : ''}${changePercent?.toFixed(1)}% (Threshold ±${thresholdPercent}%)`;
    alertSummary = `TON price experienced significant volatility exceeding your ±${thresholdPercent}% sensitivity trigger.`;
  } else {
    titleBadge = 'TEST NOTIFICATION';
    subject = `🧪 [TON Travel Alert] Test Price Alert Dispatch to ${recipientEmail}`;
    alertSummary = `This is a verification test of your automated TON Travel price threshold dispatch system.`;
  }

  const emailId = `mail-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const sentAt = new Date().toISOString();

  const bodyText = `
TON TRAVEL MARKET ALERT
----------------------------------------
To: ${recipientEmail}
Status: ${titleBadge}
Time: ${new Date(sentAt).toLocaleString()}
Current TON/USD: $${currentPrice.toFixed(3)}
Trigger Reference: ${thresholdPrice ? `$${thresholdPrice.toFixed(2)}` : `±${thresholdPercent}%`}

${alertSummary}

Log in to TonTravel to book flights, hotels, or manage cashback at favorable market rates.
  `.trim();

  const bodyHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0b1120; color: #f8fafc; padding: 24px; border-radius: 16px; border: 1px solid #1e293b; max-width: 540px;">
      <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #1e293b; padding-bottom: 16px; margin-bottom: 16px;">
        <h2 style="color: #38bdf8; margin: 0; font-size: 18px; font-weight: 800;">TON Travel Alerts</h2>
        <span style="background-color: #1e293b; color: #f59e0b; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase;">${titleBadge}</span>
      </div>
      <p style="color: #cbd5e1; font-size: 14px; line-height: 1.5; margin: 0 0 16px 0;">
        ${alertSummary}
      </p>
      <div style="background-color: #0f172a; border: 1px solid #334155; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
        <div style="font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700;">Current Exchange Rate</div>
        <div style="font-size: 28px; font-weight: 900; color: #38bdf8; font-family: monospace; margin: 4px 0;">$${currentPrice.toFixed(3)} <span style="font-size: 14px; color: #64748b;">USD</span></div>
        <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">
          Configured Trigger: <strong style="color: #f1f5f9;">${thresholdPrice ? `$${thresholdPrice.toFixed(2)}` : `±${thresholdPercent}%`}</strong>
        </div>
      </div>
      <div style="font-size: 12px; color: #64748b; border-top: 1px solid #1e293b; padding-top: 12px;">
        Dispatched to <strong style="color: #94a3b8;">${recipientEmail}</strong> at ${new Date(sentAt).toLocaleTimeString()}
      </div>
    </div>
  `;

  const payload: PriceAlertEmailPayload = {
    id: emailId,
    recipientEmail,
    subject,
    triggerType,
    currentPrice,
    thresholdPrice,
    thresholdPercent,
    changePercent,
    sentAt,
    status: 'DELIVERED',
    bodyText,
    bodyHtml
  };

  sentEmailsState = [payload, ...sentEmailsState.slice(0, 24)];
  persistAndNotify();

  // Play subtle harmonic audio notification chime (if unmuted)
  try {
    playPriceAlertChime(triggerType);
  } catch (audioErr) {
    console.warn('Audio chime playback suppressed:', audioErr);
  }

  // Dispatch Global Toast
  addToast({
    title: '📧 Mock Alert Email Sent',
    message: `Dispatched to ${recipientEmail}: ${subject}`,
    type: triggerType === 'HIGH_TARGET' ? 'up' : triggerType === 'LOW_DIP' ? 'down' : 'info',
    subMessage: `Rate: $${currentPrice.toFixed(2)} | Delivered via Mock SMTP Service`,
    duration: 5000
  });

  return payload;
}

export function clearSentEmails() {
  sentEmailsState = [];
  persistAndNotify();
}
