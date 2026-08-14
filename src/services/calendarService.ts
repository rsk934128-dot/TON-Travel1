import { Booking } from '../types';

/**
 * Helper to clean and format dates for ICS (YYYYMMDD or YYYYMMDDTHHMMSSZ)
 */
function formatDateForICS(dateStr: string, timeStr = '150000'): string {
  // dateStr is typically YYYY-MM-DD
  const cleaned = dateStr.replace(/-/g, '');
  if (cleaned.length === 8) {
    return `${cleaned}T${timeStr}Z`;
  }
  return cleaned;
}

function formatDateForGoogle(dateStr: string, timeStr = '150000'): string {
  const cleaned = dateStr.replace(/-/g, '');
  return `${cleaned}T${timeStr}Z`;
}

function formatNowForICS(): string {
  const now = new Date();
  return now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function escapeICS(str: string): string {
  return (str || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Generates an RFC 5545 compliant .ics string for a hotel booking
 */
export function generateICSContent(booking: Booking): string {
  const dtStamp = formatNowForICS();
  const dtStart = formatDateForICS(booking.checkIn, '150000'); // Standard 3:00 PM check-in
  const dtEnd = formatDateForICS(booking.checkOut, '110000'); // Standard 11:00 AM check-out
  const summary = escapeICS(`🏨 Stay at ${booking.hotelName} (${booking.roomName})`);
  const location = escapeICS(booking.hotelLocation || `${booking.hotelName}`);
  
  const descriptionText = [
    `TON Travel Hotel Reservation`,
    `Confirmation Reference: ${booking.id}`,
    `Hotel: ${booking.hotelName}`,
    `Room: ${booking.roomName}`,
    `Check-in: ${booking.checkIn} (from 15:00)`,
    `Check-out: ${booking.checkOut} (until 11:00)`,
    `Nights: ${booking.nights} | Guests: ${booking.guests}`,
    `Total Paid: $${booking.totalPriceUsd} (${booking.totalPriceTon.toFixed(2)} TON)`,
    `Cashback Earned: +${booking.cashbackTon.toFixed(3)} TON (${booking.cashbackPercentage}%)`,
    `Payment Method: ${booking.paymentMethod}`,
    `Primary Guest: ${booking.guestName} (${booking.guestEmail})`,
    booking.userWallet ? `Payout Wallet: ${booking.userWallet}` : '',
    booking.driveFileUrl ? `Google Drive Voucher: ${booking.driveFileUrl}` : '',
    `Booked via TON Travel Telegram Mini App`
  ].filter(Boolean).join('\n');

  const escapedDescription = escapeICS(descriptionText);

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//TON Travel//Telegram Travel Mini App//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:tontravel-${booking.id}@telegram.travel`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${escapedDescription}`,
    `LOCATION:${location}`,
    'STATUS:CONFIRMED',
    'CATEGORIES:TRAVEL,HOTEL,VACATION',
    'BEGIN:VALARM',
    'TRIGGER:-P1D',
    'ACTION:DISPLAY',
    `DESCRIPTION:Reminder: Upcoming stay tomorrow at ${booking.hotelName}`,
    'END:VALARM',
    'BEGIN:VALARM',
    'TRIGGER:-PT2H',
    'ACTION:DISPLAY',
    `DESCRIPTION:Check-in today at ${booking.hotelName} (15:00)`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
}

/**
 * Triggers native .ics file download in the browser
 */
export function downloadICSFile(booking: Booking): void {
  const icsData = generateICSContent(booking);
  const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
  const filename = `TONTravel_${booking.hotelName.replace(/[^a-zA-Z0-9]/g, '_')}_${booking.id}.ics`;

  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(link.href);
}

/**
 * Returns a direct Google Calendar prefilled event creation URL
 */
export function getGoogleCalendarUrl(booking: Booking): string {
  const title = encodeURIComponent(`🏨 Stay at ${booking.hotelName} (${booking.roomName})`);
  const start = formatDateForGoogle(booking.checkIn, '150000');
  const end = formatDateForGoogle(booking.checkOut, '110000');
  const location = encodeURIComponent(booking.hotelLocation || booking.hotelName);
  
  const details = encodeURIComponent(
    `TON Travel Reservation Confirmed!\n\n` +
    `Booking Ref: ${booking.id}\n` +
    `Hotel: ${booking.hotelName}\n` +
    `Room: ${booking.roomName}\n` +
    `Check-in: ${booking.checkIn} (15:00)\n` +
    `Check-out: ${booking.checkOut} (11:00)\n` +
    `Total: $${booking.totalPriceUsd} (${booking.totalPriceTon.toFixed(2)} TON)\n` +
    `Cashback Earned: +${booking.cashbackTon.toFixed(3)} TON\n` +
    `Guest: ${booking.guestName} (${booking.guestEmail})\n` +
    (booking.driveFileUrl ? `Receipt: ${booking.driveFileUrl}\n` : '') +
    `\nBooked with TON Travel Mini App`
  );

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${location}`;
}

/**
 * Returns an Outlook Live / Office 365 calendar event web link
 */
export function getOutlookCalendarUrl(booking: Booking): string {
  const title = encodeURIComponent(`🏨 Stay at ${booking.hotelName} (${booking.roomName})`);
  const location = encodeURIComponent(booking.hotelLocation || booking.hotelName);
  const start = `${booking.checkIn}T15:00:00Z`;
  const end = `${booking.checkOut}T11:00:00Z`;
  const body = encodeURIComponent(
    `TON Travel Booking Ref: ${booking.id}\nHotel: ${booking.hotelName}\nGuest: ${booking.guestName}`
  );

  return `https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent&subject=${title}&startdt=${start}&enddt=${end}&body=${body}&location=${location}`;
}

/**
 * Returns a Yahoo Calendar event link
 */
export function getYahooCalendarUrl(booking: Booking): string {
  const title = encodeURIComponent(`🏨 Stay at ${booking.hotelName}`);
  const location = encodeURIComponent(booking.hotelLocation || booking.hotelName);
  const start = formatDateForGoogle(booking.checkIn, '150000');
  const end = formatDateForGoogle(booking.checkOut, '110000');
  const desc = encodeURIComponent(`TON Travel Ref: ${booking.id} - ${booking.roomName}`);

  return `https://calendar.yahoo.com/?v=60&view=d&type=20&title=${title}&st=${start}&et=${end}&desc=${desc}&in_loc=${location}`;
}
