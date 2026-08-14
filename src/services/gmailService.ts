import { Booking } from '../types';
import { generateBookingReceiptHtml } from './driveService';

export interface GmailProfile {
  emailAddress: string;
  messagesTotal: number;
  threadsTotal: number;
  historyId: string;
}

export interface GmailMessageSummary {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  snippet: string;
  isTravel: boolean;
  categoryTag?: 'hotel' | 'flight' | 'receipt' | 'travel' | 'general';
  estimatedHotelName?: string;
  estimatedCity?: string;
  unread: boolean;
}

export interface GmailMessageDetail extends GmailMessageSummary {
  bodyHtml?: string;
  bodyText?: string;
  labels: string[];
}

/**
 * Encodes an RFC 2822 MIME message to Base64URL string for the Gmail API.
 */
export function createBase64UrlEmail(to: string, subject: string, htmlBody: string): string {
  const boundary = `===TON_Travel_Boundary_${Date.now()}===`;
  const rawText = htmlBody.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

  const emailLines = [
    `To: ${to}`,
    `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: 7bit',
    '',
    rawText,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: 7bit',
    '',
    htmlBody,
    '',
    `--${boundary}--`
  ];

  const emailRaw = emailLines.join('\r\n');
  return btoa(unescape(encodeURIComponent(emailRaw)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Fetches the connected user's Gmail profile information.
 */
export async function getGmailProfile(accessToken: string): Promise<GmailProfile> {
  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gmail API error (${response.status}): ${errorText}`);
  }

  return response.json();
}

/**
 * Classifies whether a subject/snippet relates to travel.
 */
function classifyTravelEmail(subject: string, snippet: string, from: string): { isTravel: boolean; tag: 'hotel' | 'flight' | 'receipt' | 'travel' | 'general'; hotelName?: string; city?: string } {
  const combined = (subject + ' ' + snippet + ' ' + from).toLowerCase();

  const isHotel = combined.includes('hotel') || combined.includes('resort') || combined.includes('booking.com') || combined.includes('airbnb') || combined.includes('agoda') || combined.includes('stay') || combined.includes('check-in') || combined.includes('room');
  const isFlight = combined.includes('flight') || combined.includes('airline') || combined.includes('ticket') || combined.includes('boarding pass') || combined.includes('emirates') || combined.includes('airways') || combined.includes('delta') || combined.includes('airport');
  const isReceipt = combined.includes('receipt') || combined.includes('invoice') || combined.includes('voucher') || combined.includes('payment') || combined.includes('cashback');

  let tag: 'hotel' | 'flight' | 'receipt' | 'travel' | 'general' = 'general';
  if (isHotel) tag = 'hotel';
  else if (isFlight) tag = 'flight';
  else if (isReceipt) tag = 'receipt';
  else if (combined.includes('travel') || combined.includes('trip') || combined.includes('itinerary') || combined.includes('tour')) tag = 'travel';

  // Extract possible hotel / destination names
  let hotelName: string | undefined;
  let city: string | undefined;

  const popularDestinations = ['Bali', 'Paris', 'Dubai', 'Tokyo', 'Maldives', 'New York', 'Bangkok', 'Rome', 'London', 'Singapore', 'Barcelona', 'Phuket'];
  for (const dest of popularDestinations) {
    if (combined.includes(dest.toLowerCase())) {
      city = dest;
      break;
    }
  }

  if (subject.toLowerCase().includes('booking') || subject.toLowerCase().includes('reservation')) {
    const cleanSub = subject.replace(/^(Fwd:|Re:|Confirmation:?|Your booking at)\s*/i, '').trim();
    hotelName = cleanSub.slice(0, 35);
  }

  return {
    isTravel: tag !== 'general',
    tag,
    hotelName,
    city
  };
}

/**
 * Searches and lists emails from the user's Gmail mailbox.
 */
export async function listGmailMessages(
  accessToken: string,
  searchQuery: string = 'hotel OR booking OR reservation OR flight OR travel OR voucher OR "TON Travel"',
  maxResults: number = 15
): Promise<GmailMessageSummary[]> {
  const url = new URL('https://gmail.googleapis.com/gmail/v1/users/me/messages');
  if (searchQuery) {
    url.searchParams.set('q', searchQuery);
  }
  url.searchParams.set('maxResults', String(maxResults));

  const listResponse = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!listResponse.ok) {
    const errorText = await listResponse.text();
    throw new Error(`Gmail API error (${listResponse.status}): ${errorText}`);
  }

  const data = await listResponse.json();
  const rawMessages: { id: string; threadId: string }[] = data.messages || [];

  if (rawMessages.length === 0) {
    return [];
  }

  // Fetch headers & snippet for top messages in parallel (up to 12 items)
  const summaries: GmailMessageSummary[] = await Promise.all(
    rawMessages.slice(0, 12).map(async (msg) => {
      try {
        const detailRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Date`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        if (!detailRes.ok) {
          return {
            id: msg.id,
            threadId: msg.threadId,
            subject: 'Email Message',
            from: 'Unknown',
            to: '',
            date: new Date().toLocaleDateString(),
            snippet: '',
            isTravel: false,
            categoryTag: 'general',
            unread: false
          };
        }

        const msgData = await detailRes.json();
        const headers: { name: string; value: string }[] = msgData.payload?.headers || [];

        const getHeader = (name: string) => headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

        const subject = getHeader('Subject') || '(No Subject)';
        const from = getHeader('From') || 'Unknown';
        const to = getHeader('To') || '';
        const dateRaw = getHeader('Date');
        const snippet = msgData.snippet || '';
        const unread = (msgData.labelIds || []).includes('UNREAD');

        let dateStr = dateRaw;
        try {
          if (dateRaw) {
            dateStr = new Date(dateRaw).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            });
          }
        } catch {
          dateStr = dateRaw;
        }

        const classification = classifyTravelEmail(subject, snippet, from);

        return {
          id: msg.id,
          threadId: msg.threadId,
          subject,
          from,
          to,
          date: dateStr || 'Recently',
          snippet,
          isTravel: classification.isTravel,
          categoryTag: classification.tag,
          estimatedHotelName: classification.hotelName,
          estimatedCity: classification.city,
          unread
        };
      } catch (err) {
        return {
          id: msg.id,
          threadId: msg.threadId,
          subject: 'Reservation Message',
          from: 'Travel Service',
          to: '',
          date: 'Recent',
          snippet: '',
          isTravel: true,
          categoryTag: 'travel',
          unread: false
        };
      }
    })
  );

  return summaries;
}

/**
 * Fetches full details and body content of a specific Gmail message.
 */
export async function getGmailMessageDetail(accessToken: string, messageId: string): Promise<GmailMessageDetail> {
  const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gmail API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const headers: { name: string; value: string }[] = data.payload?.headers || [];
  const getHeader = (name: string) => headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

  const subject = getHeader('Subject') || '(No Subject)';
  const from = getHeader('From') || 'Unknown';
  const to = getHeader('To') || '';
  const dateRaw = getHeader('Date');
  const snippet = data.snippet || '';
  const labels: string[] = data.labelIds || [];
  const unread = labels.includes('UNREAD');

  let bodyHtml: string | undefined;
  let bodyText: string | undefined;

  function extractParts(part: any) {
    if (!part) return;
    if (part.mimeType === 'text/html' && part.body?.data) {
      try {
        const decoded = decodeURIComponent(escape(atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'))));
        bodyHtml = decoded;
      } catch (e) {
        bodyHtml = atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'));
      }
    } else if (part.mimeType === 'text/plain' && part.body?.data) {
      try {
        const decoded = decodeURIComponent(escape(atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'))));
        bodyText = decoded;
      } catch (e) {
        bodyText = atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'));
      }
    }

    if (part.parts && Array.isArray(part.parts)) {
      part.parts.forEach(extractParts);
    }
  }

  if (data.payload) {
    extractParts(data.payload);
  }

  const classification = classifyTravelEmail(subject, snippet, from);

  return {
    id: data.id,
    threadId: data.threadId,
    subject,
    from,
    to,
    date: dateRaw || 'Recently',
    snippet,
    bodyHtml,
    bodyText,
    labels,
    isTravel: classification.isTravel,
    categoryTag: classification.tag,
    estimatedHotelName: classification.hotelName,
    estimatedCity: classification.city,
    unread
  };
}

/**
 * Sends an email via Gmail API `messages.send`.
 * Note: Caller must provide explicit user confirmation before invoking.
 */
export async function sendGmailEmail(
  accessToken: string,
  to: string,
  subject: string,
  htmlBody: string
): Promise<{ id: string; threadId: string }> {
  const base64Raw = createBase64UrlEmail(to, subject, htmlBody);

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ raw: base64Raw })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gmail Send Error (${response.status}): ${errorText}`);
  }

  return response.json();
}

/**
 * Sends a stylized TON Travel Booking Confirmation Voucher directly to the recipient's Gmail inbox.
 */
export async function sendBookingVoucherViaGmail(
  accessToken: string,
  booking: Booking,
  recipientEmail: string
): Promise<{ id: string; threadId: string }> {
  const htmlReceipt = generateBookingReceiptHtml(booking);
  const subject = `🏨 Booking Confirmation #${booking.id} - ${booking.hotelName} (TON Travel)`;

  return sendGmailEmail(accessToken, recipientEmail, subject, htmlReceipt);
}
