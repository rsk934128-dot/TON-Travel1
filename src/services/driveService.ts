import { Booking } from '../types';
import firebaseConfig from '../../firebase-applet-config.json';

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (config: {
            client_id?: string;
            scope: string;
            callback: (response: { access_token?: string; error?: string; scope?: string }) => void;
            error_callback?: (err: any) => void;
          }) => {
            requestAccessToken: () => void;
          };
        };
      };
    };
    gapi?: {
      load: (api: string, callback: () => void) => void;
      client: {
        init: (config: any) => Promise<void>;
        setToken: (token: { access_token: string }) => void;
      };
    };
  }
}

export interface DriveUploadResult {
  fileId: string;
  webViewLink: string;
  filename: string;
}

/**
 * Requests OAuth access token for Google Drive scope using GSI initTokenClient.
 */
export function requestDriveAuthToken(): Promise<{ token: string; email?: string }> {
  return new Promise((resolve, reject) => {
    if (!window.google?.accounts?.oauth2) {
      reject(new Error('Google Identity Services SDK not loaded. Please ensure internet connection.'));
      return;
    }

    try {
      const clientId = firebaseConfig.oAuthClientId || (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || '';
      if (!clientId) {
        reject(new Error('Missing OAuth Client ID in configuration. Please configure OAuth.'));
        return;
      }

      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/drive.file',
        callback: async (response) => {
          if (response.error || !response.access_token) {
            reject(new Error(response.error || 'Failed to acquire Google Drive access token.'));
            return;
          }

          const accessToken = response.access_token;
          
          // Fetch user info from Google OAuth userinfo endpoint
          let userEmail = 'user@google.com';
          try {
            const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${accessToken}` }
            });
            if (userRes.ok) {
              const userData = await userRes.json();
              if (userData.email) userEmail = userData.email;
            }
          } catch (e) {
            console.warn('Could not fetch user email:', e);
          }

          resolve({ token: accessToken, email: userEmail });
        },
        error_callback: (err) => {
          reject(err);
        }
      });

      tokenClient.requestAccessToken();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate formatted HTML receipt for hotel stay voucher & TON cashback receipt
 */
export function generateBookingReceiptHtml(booking: Booking): string {
  const dateFormatted = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>TON Travel Booking Voucher - ${booking.id}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f6f9; color: #1e293b; margin: 0; padding: 40px 20px; }
    .container { max-width: 680px; margin: 0 auto; background: #ffffff; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.08); overflow: hidden; border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #0088cc 0%, #005580 100%); padding: 32px; color: #ffffff; text-align: center; position: relative; }
    .badge { display: inline-block; background: rgba(255,255,255,0.2); backdrop-filter: blur(8px); padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; }
    .title { margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; }
    .subtitle { font-size: 14px; opacity: 0.9; margin-top: 6px; }
    .content { padding: 32px; }
    .status-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px 20px; color: #166534; font-weight: 600; font-size: 15px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
    .section-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-top: 24px; margin-bottom: 12px; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
    .field { background: #f8fafc; padding: 12px 16px; border-radius: 8px; border: 1px solid #f1f5f9; }
    .label { font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 600; margin-bottom: 4px; }
    .value { font-size: 15px; font-weight: 700; color: #0f172a; }
    .cashback-card { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: #ffffff; border-radius: 12px; padding: 20px; margin-top: 24px; border: 1px solid #334155; }
    .cashback-amount { font-size: 26px; font-weight: 800; color: #38bdf8; margin-top: 4px; }
    .footer { text-align: center; padding: 24px; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; background: #fafafa; }
    .qr-placeholder { background: #ffffff; width: 80px; height: 80px; border-radius: 8px; border: 2px dashed #0088cc; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #0088cc; font-weight: 700; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="badge">💎 TON TRAVEL VOUCHER</div>
      <h1 class="title">Booking Confirmation</h1>
      <div class="subtitle">Issued via Telegram Mini App | Reference #${booking.id}</div>
    </div>
    <div class="content">
      <div class="status-box">
        <div>
          <span style="font-size:18px;">✅</span> <strong>Reservation Guaranteed</strong>
        </div>
        <div style="font-size:13px; color:#15803d;">Check-in Ready</div>
      </div>

      <div class="section-title">Hotel Details</div>
      <div style="font-size: 20px; font-weight: 800; color: #0f172a; margin-bottom: 4px;">${booking.hotelName}</div>
      <div style="font-size: 14px; color: #64748b; margin-bottom: 16px;">📍 ${booking.hotelLocation}</div>

      <div class="grid">
        <div class="field">
          <div class="label">Room Category</div>
          <div class="value">${booking.roomName}</div>
        </div>
        <div class="field">
          <div class="label">Guests</div>
          <div class="value">${booking.guests} Guest(s)</div>
        </div>
        <div class="field">
          <div class="label">Check-In Date</div>
          <div class="value">${booking.checkIn}</div>
        </div>
        <div class="field">
          <div class="label">Check-Out Date</div>
          <div class="value">${booking.checkOut} (${booking.nights} night/s)</div>
        </div>
      </div>

      <div class="section-title">Payment & TON Cashback Summary</div>
      <div class="grid">
        <div class="field">
          <div class="label">Total Paid</div>
          <div class="value">$${booking.totalPriceUsd.toFixed(2)} USD (${booking.totalPriceTon.toFixed(2)} TON)</div>
        </div>
        <div class="field">
          <div class="label">Payment Method</div>
          <div class="value">${booking.paymentMethod === 'TON' ? '💎 TON Wallet' : booking.paymentMethod === 'USDT_TON' ? '💵 USDT on TON' : '💳 Bank Card'}</div>
        </div>
      </div>

      <div class="cashback-card">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <div style="font-size:12px; text-transform:uppercase; letter-spacing:1px; color:#94a3b8;">
              ${booking.cashbackPercentage}% TON Cashback Reward ${booking.cashbackPercentage === 8 ? '👑 Telegram Premium' : ''}
            </div>
            <div class="cashback-amount">+${booking.cashbackTon.toFixed(3)} TON</div>
            <div style="font-size:13px; color:#cbd5e1; margin-top:2px;">
              approx. $${booking.cashbackUsd.toFixed(2)} USD sent to wallet
            </div>
          </div>
          <div class="qr-placeholder">
            TON SPACE
          </div>
        </div>
        <div style="font-size:11px; color:#94a3b8; margin-top:12px; border-top:1px solid #334155; padding-top:8px;">
          Payout Wallet: <code style="color:#38bdf8;">${booking.userWallet}</code>
        </div>
      </div>

      <div class="section-title">Guest Information</div>
      <div class="grid">
        <div class="field">
          <div class="label">Primary Guest</div>
          <div class="value">${booking.guestName}</div>
        </div>
        <div class="field">
          <div class="label">Email Contact</div>
          <div class="value">${booking.guestEmail}</div>
        </div>
      </div>
    </div>

    <div class="footer">
      Generated on ${dateFormatted} by TON Travel App<br/>
      Need support? Contact @TONTravelBot on Telegram.
    </div>
  </div>
</body>
</html>`;
}

/**
 * Uploads generated hotel booking voucher receipt directly to user's Google Drive.
 */
export async function saveBookingReceiptToDrive(
  booking: Booking,
  accessToken: string
): Promise<DriveUploadResult> {
  const htmlContent = generateBookingReceiptHtml(booking);
  const fileName = `TON_Travel_Booking_${booking.hotelName.replace(/[^a-zA-Z0-9]/g, '_')}_${booking.id}.html`;

  const metadata = {
    name: fileName,
    mimeType: 'text/html',
    description: `TON Travel Hotel Reservation Confirmation & Cashback Receipt for ${booking.hotelName} (Ref: ${booking.id})`
  };

  const boundary = '-------314159265358979323846';
  const delimiter = "\r\n--" + boundary + "\r\n";
  const close_delim = "\r\n--" + boundary + "--";

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: text/html; charset=UTF-8\r\n\r\n' +
    htmlContent +
    close_delim;

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary="${boundary}"`,
      },
      body: multipartRequestBody
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Drive API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();

  return {
    fileId: data.id,
    webViewLink: data.webViewLink || `https://drive.google.com/file/d/${data.id}/view`,
    filename: fileName
  };
}
