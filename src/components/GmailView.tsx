import React, { useState, useEffect } from 'react';
import {
  Mail,
  Send,
  Search,
  RefreshCw,
  Sparkles,
  Luggage,
  Calendar,
  Building2,
  Plane,
  Receipt,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Plus,
  X,
  FileText,
  UserCheck,
  LogOut,
  ChevronRight,
  Info
} from 'lucide-react';
import { Booking } from '../types';
import {
  GmailMessageSummary,
  GmailMessageDetail,
  GmailProfile,
  getGmailProfile,
  listGmailMessages,
  getGmailMessageDetail,
  sendGmailEmail,
  sendBookingVoucherViaGmail
} from '../services/gmailService';
import {
  signInWithGoogle,
  signOutGoogle,
  getAccessToken,
  initAuth
} from '../services/googleAuth';
import { User } from 'firebase/auth';
import { useLanguage } from '../utils/i18n';

interface GmailViewProps {
  bookings: Booking[];
  onImportBooking?: (booking: Partial<Booking>) => void;
}

export const GmailView: React.FC<GmailViewProps> = ({
  bookings,
  onImportBooking
}) => {
  const { t } = useLanguage();

  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [profile, setProfile] = useState<GmailProfile | null>(null);

  // Email List State
  const [messages, setMessages] = useState<GmailMessageSummary[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'all' | 'hotel' | 'flight' | 'receipt' | 'travel'>('all');
  const [selectedMessage, setSelectedMessage] = useState<GmailMessageDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Compose & Send Modal State
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [selectedBookingForEmail, setSelectedBookingForEmail] = useState<Booking | null>(bookings[0] || null);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccessMessage, setSendSuccessMessage] = useState<string | null>(null);
  const [sendErrorMessage, setSendErrorMessage] = useState<string | null>(null);

  // User Confirmation Dialog (MANDATORY per SKILL guidelines)
  const [pendingConfirmation, setPendingConfirmation] = useState<{
    type: 'send_voucher' | 'send_custom';
    to: string;
    subject: string;
    description: string;
    action: () => Promise<void>;
  } | null>(null);

  // Initialize Auth Listener
  useEffect(() => {
    const unsubscribe = initAuth(
      async (firebaseUser, token) => {
        setUser(firebaseUser);
        setAccessToken(token);
        if (firebaseUser.email) {
          setRecipientEmail(firebaseUser.email);
        }
        loadData(token);
      },
      () => {
        setUser(null);
        setAccessToken(null);
        setProfile(null);
        setMessages([]);
      }
    );

    return () => unsubscribe();
  }, []);

  const loadData = async (token: string) => {
    setIsLoadingMessages(true);
    try {
      const [userProfile, msgs] = await Promise.all([
        getGmailProfile(token).catch(() => null),
        listGmailMessages(token, 'hotel OR booking OR reservation OR flight OR travel OR voucher OR "TON Travel"')
      ]);

      if (userProfile) {
        setProfile(userProfile);
        if (!recipientEmail && userProfile.emailAddress) {
          setRecipientEmail(userProfile.emailAddress);
        }
      }
      setMessages(msgs);
    } catch (err: any) {
      console.error('Error fetching Gmail data:', err);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoggingIn(true);
    setSendErrorMessage(null);
    try {
      const result = await signInWithGoogle();
      if (result) {
        setUser(result.user);
        setAccessToken(result.accessToken);
        if (result.user.email) {
          setRecipientEmail(result.user.email);
        }
        await loadData(result.accessToken);
      }
    } catch (err: any) {
      console.error('Sign-in error:', err);
      setSendErrorMessage(err?.message || 'Failed to sign in with Google');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignOut = async () => {
    await signOutGoogle();
    setUser(null);
    setAccessToken(null);
    setProfile(null);
    setMessages([]);
    setSelectedMessage(null);
  };

  const handleRefresh = async () => {
    if (!accessToken) return;
    setIsLoadingMessages(true);
    try {
      const q = searchQuery ? searchQuery : 'hotel OR booking OR reservation OR flight OR travel OR voucher OR "TON Travel"';
      const msgs = await listGmailMessages(accessToken, q);
      setMessages(msgs);
    } catch (err: any) {
      console.error('Refresh error:', err);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleRefresh();
  };

  const handleOpenMessage = async (msgSummary: GmailMessageSummary) => {
    if (!accessToken) return;
    setIsLoadingDetail(true);
    try {
      const detail = await getGmailMessageDetail(accessToken, msgSummary.id);
      setSelectedMessage(detail);
    } catch (err: any) {
      console.error('Error loading message details:', err);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // Request Confirmation before Sending (Destructive/Mutating Guard)
  const triggerSendVoucherConfirmation = (booking: Booking) => {
    const targetEmail = recipientEmail || user?.email || profile?.emailAddress || '';
    if (!targetEmail) {
      setSendErrorMessage('Please specify a recipient email address.');
      return;
    }

    setPendingConfirmation({
      type: 'send_voucher',
      to: targetEmail,
      subject: `🏨 Booking Confirmation #${booking.id} - ${booking.hotelName} (TON Travel)`,
      description: `Send official TON Travel voucher & cryptographic cashback receipt for ${booking.hotelName} to ${targetEmail} via your Gmail account.`,
      action: async () => {
        if (!accessToken) throw new Error('Not authenticated with Google');
        await sendBookingVoucherViaGmail(accessToken, booking, targetEmail);
        setSendSuccessMessage(`Booking voucher sent to ${targetEmail}!`);
        setIsComposeOpen(false);
      }
    });
  };

  const triggerSendCustomEmailConfirmation = () => {
    if (!recipientEmail) {
      setSendErrorMessage('Please enter a recipient email.');
      return;
    }
    if (!emailSubject) {
      setSendErrorMessage('Please enter a subject line.');
      return;
    }
    if (!emailBody) {
      setSendErrorMessage('Please enter an email body.');
      return;
    }

    setPendingConfirmation({
      type: 'send_custom',
      to: recipientEmail,
      subject: emailSubject,
      description: `Send email to ${recipientEmail} with subject "${emailSubject}" from your Gmail account.`,
      action: async () => {
        if (!accessToken) throw new Error('Not authenticated with Google');
        await sendGmailEmail(accessToken, recipientEmail, emailSubject, `<div style="font-family:sans-serif;padding:20px;line-height:1.6;">${emailBody.replace(/\n/g, '<br/>')}</div>`);
        setSendSuccessMessage(`Email sent successfully to ${recipientEmail}!`);
        setIsComposeOpen(false);
        setEmailSubject('');
        setEmailBody('');
      }
    });
  };

  const executeConfirmedAction = async () => {
    if (!pendingConfirmation) return;
    setIsSending(true);
    setSendErrorMessage(null);
    try {
      await pendingConfirmation.action();
    } catch (err: any) {
      console.error('Send error:', err);
      setSendErrorMessage(err?.message || 'Failed to send email via Gmail.');
    } finally {
      setIsSending(false);
      setPendingConfirmation(null);
    }
  };

  const filteredMessages = messages.filter((m) => {
    if (activeCategoryFilter === 'all') return true;
    return m.categoryTag === activeCategoryFilter;
  });

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-red-950/70 via-slate-900 to-slate-900 border border-red-500/30 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400 shadow-md">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white">Gmail Travel Hub</h2>
              <span className="bg-red-500/20 text-red-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-red-500/40">
                Official Google API
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Sync travel confirmations, send TON booking vouchers, and manage hotel itineraries.
            </p>
          </div>
        </div>

        {/* Auth CTA or User Profile */}
        {user ? (
          <div className="flex items-center gap-2 bg-slate-950/80 p-2 rounded-2xl border border-slate-800 self-start sm:self-auto">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'Google User'}
                className="w-8 h-8 rounded-full ring-2 ring-emerald-500/40"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-bold text-xs">
                {user.email?.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="text-left pr-2">
              <div className="text-xs font-extrabold text-white truncate max-w-[140px]">
                {user.displayName || user.email?.split('@')[0]}
              </div>
              <div className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-2.5 h-2.5" />
                <span>Connected</span>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-rose-400 rounded-xl transition-colors"
              title="Sign Out Google"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* Official Google Sign In Button */
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoggingIn}
            className="flex items-center gap-2.5 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg transition-all self-start sm:self-auto disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
            </svg>
            <span>{isLoggingIn ? 'Connecting Gmail...' : 'Sign in with Google'}</span>
          </button>
        )}
      </div>

      {/* Notifications / Alerts */}
      {sendSuccessMessage && (
        <div className="p-3.5 bg-emerald-950/80 border border-emerald-700/80 rounded-2xl text-emerald-300 text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{sendSuccessMessage}</span>
          </div>
          <button onClick={() => setSendSuccessMessage(null)} className="p-1 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {sendErrorMessage && (
        <div className="p-3.5 bg-rose-950/80 border border-rose-700/80 rounded-2xl text-rose-300 text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{sendErrorMessage}</span>
          </div>
          <button onClick={() => setSendErrorMessage(null)} className="p-1 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Gmail Controls */}
      {user ? (
        <div className="space-y-5">
          {/* Action Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Quick Action 1: Send Booking Voucher via Gmail */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center gap-2 text-cyan-400 font-extrabold text-xs mb-1">
                  <Luggage className="w-4 h-4" />
                  <span>Send Voucher to Gmail</span>
                </div>
                <p className="text-xs text-slate-400">
                  Email your formatted TON Travel hotel reservation and cashback receipt directly to your inbox.
                </p>
              </div>

              {bookings.length > 0 ? (
                <div className="space-y-2">
                  <select
                    aria-label="Select booking to send voucher"
                    value={selectedBookingForEmail?.id || ''}
                    onChange={(e) => {
                      const found = bookings.find((b) => b.id === e.target.value);
                      if (found) setSelectedBookingForEmail(found);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    {bookings.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.hotelName} ({b.checkIn})
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => {
                      if (selectedBookingForEmail) {
                        triggerSendVoucherConfirmation(selectedBookingForEmail);
                      }
                    }}
                    className="w-full bg-[#0088cc] hover:bg-[#0077b3] text-white font-extrabold text-xs py-2 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Booking Voucher</span>
                  </button>
                </div>
              ) : (
                <div className="text-[11px] text-slate-500 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                  No stays booked yet. Book a stay first to send receipts via Gmail.
                </div>
              )}
            </div>

            {/* Quick Action 2: Compose Custom Travel Message */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center gap-2 text-red-400 font-extrabold text-xs mb-1">
                  <Mail className="w-4 h-4" />
                  <span>Compose Travel Email</span>
                </div>
                <p className="text-xs text-slate-400">
                  Contact hotel concierge, airport transfers, or tour coordinators directly through Gmail.
                </p>
              </div>

              <button
                onClick={() => setIsComposeOpen(true)}
                className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-xs py-2 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all mt-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Compose New Email</span>
              </button>
            </div>
          </div>

          {/* Inbox Search & Filter Header */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                  <span>Travel Inbox Scanner</span>
                  {profile && (
                    <span className="text-xs text-slate-400 font-normal">
                      ({profile.emailAddress})
                    </span>
                  )}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleRefresh}
                  disabled={isLoadingMessages}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingMessages ? 'animate-spin text-cyan-400' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search Gmail for reservations, airlines, confirmations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-20 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-red-500/60 transition-all"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-red-600 hover:bg-red-500 text-white font-bold text-[11px] px-3 py-1.5 rounded-xl transition-all"
              >
                Search
              </button>
            </form>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
              {[
                { id: 'all', label: 'All Travel', icon: Luggage },
                { id: 'hotel', label: 'Hotels & Stays', icon: Building2 },
                { id: 'flight', label: 'Flights & Airlines', icon: Plane },
                { id: 'receipt', label: 'Vouchers & Receipts', icon: Receipt },
                { id: 'travel', label: 'Itineraries', icon: Calendar }
              ].map((filter) => {
                const isSelected = activeCategoryFilter === filter.id;
                const Icon = filter.icon;
                return (
                  <button
                    key={filter.id}
                    onClick={() => setActiveCategoryFilter(filter.id as any)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 flex items-center gap-1.5 border ${
                      isSelected
                        ? 'bg-red-600/30 text-red-200 border-red-500/60 shadow-sm'
                        : 'bg-slate-950 text-slate-400 hover:text-slate-200 border-slate-800'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{filter.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Email Message List */}
            {isLoadingMessages ? (
              <div className="p-10 text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-red-400 animate-spin mx-auto" />
                <p className="text-xs text-slate-400">Scanning your Gmail for travel itineraries...</p>
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="p-8 text-center bg-slate-950/60 border border-slate-800/80 rounded-2xl space-y-2">
                <Mail className="w-8 h-8 text-slate-600 mx-auto" />
                <h4 className="font-bold text-white text-xs">No Travel Emails Found</h4>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                  Try searching for a different hotel name, booking code, or airline reference above.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredMessages.map((msg) => (
                  <div
                    key={msg.id}
                    onClick={() => handleOpenMessage(msg)}
                    className="bg-slate-950/80 hover:bg-slate-950 border border-slate-800/80 hover:border-red-500/40 p-3.5 rounded-2xl cursor-pointer transition-all flex items-start justify-between gap-3 group"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-xs text-white group-hover:text-red-300 transition-colors">
                          {msg.from.split('<')[0].replace(/"/g, '')}
                        </span>

                        {msg.categoryTag === 'hotel' && (
                          <span className="bg-amber-500/20 text-amber-300 text-[9px] font-extrabold px-2 py-0.5 rounded-md border border-amber-500/30">
                            🏨 Hotel
                          </span>
                        )}
                        {msg.categoryTag === 'flight' && (
                          <span className="bg-sky-500/20 text-sky-300 text-[9px] font-extrabold px-2 py-0.5 rounded-md border border-sky-500/30">
                            ✈️ Flight
                          </span>
                        )}
                        {msg.categoryTag === 'receipt' && (
                          <span className="bg-emerald-500/20 text-emerald-300 text-[9px] font-extrabold px-2 py-0.5 rounded-md border border-emerald-500/30">
                            🧾 Receipt
                          </span>
                        )}

                        {msg.unread && (
                          <span className="w-2 h-2 rounded-full bg-red-400 shadow-sm" />
                        )}
                      </div>

                      <h4 className="text-xs font-bold text-slate-200 line-clamp-1">
                        {msg.subject}
                      </h4>

                      <p className="text-[11px] text-slate-400 line-clamp-1">
                        {msg.snippet}
                      </p>
                    </div>

                    <div className="shrink-0 text-right space-y-1">
                      <div className="text-[10px] text-slate-500 font-medium">
                        {msg.date}
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-red-400 group-hover:translate-x-0.5 transition-all ml-auto" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Not Signed In State */
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-10 text-center space-y-5 shadow-xl max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-3xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto shadow-inner">
            <Mail className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-black text-white">Connect Your Gmail</h3>
            <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
              Link your Google account with permission to read travel booking confirmations, send TON cashback vouchers, and organize all hotel stays in one place.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoggingIn}
              className="inline-flex items-center gap-3 bg-white hover:bg-slate-100 text-slate-800 font-bold text-sm px-6 py-3 rounded-2xl shadow-xl transition-all disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
              <span>{isLoggingIn ? 'Connecting...' : 'Sign in with Google'}</span>
            </button>
          </div>

          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 pt-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Encrypted token stored securely in memory only</span>
          </div>
        </div>
      )}

      {/* Message Reader Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-start justify-between gap-3 bg-slate-950">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs text-red-400 font-bold mb-1">
                  <Mail className="w-3.5 h-3.5" />
                  <span className="truncate">{selectedMessage.from}</span>
                </div>
                <h3 className="text-base font-black text-white">{selectedMessage.subject}</h3>
                <div className="text-[11px] text-slate-400 mt-1">{selectedMessage.date}</div>
              </div>
              <button
                onClick={() => setSelectedMessage(null)}
                className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4 bg-slate-900">
              {/* Quick Actions inside Email Reader */}
              {selectedMessage.isTravel && onImportBooking && (
                <div className="bg-gradient-to-r from-amber-500/15 to-yellow-500/10 border border-amber-500/30 p-3.5 rounded-2xl flex items-center justify-between gap-3">
                  <div className="text-xs">
                    <div className="font-extrabold text-amber-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Travel Reservation Detected</span>
                    </div>
                    <div className="text-slate-300 text-[11px] mt-0.5">
                      {selectedMessage.estimatedHotelName ? `Hotel: ${selectedMessage.estimatedHotelName}` : 'Booking confirmation found in email.'}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onImportBooking({
                        hotelName: selectedMessage.estimatedHotelName || 'Imported Hotel Stay',
                        hotelLocation: selectedMessage.estimatedCity || 'Worldwide',
                        checkIn: new Date().toISOString().split('T')[0],
                        checkOut: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
                        status: 'Confirmed'
                      });
                      setSendSuccessMessage('Stay imported to your TON Travel bookings list!');
                      setSelectedMessage(null);
                    }}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-3.5 py-1.5 rounded-xl shrink-0 shadow-md transition-all"
                  >
                    Import Stay
                  </button>
                </div>
              )}

              {/* Render HTML content securely in iframe or parsed text */}
              {selectedMessage.bodyHtml ? (
                <div className="bg-white rounded-2xl p-4 overflow-hidden border border-slate-300 shadow-inner">
                  <iframe
                    title="Email Body"
                    srcDoc={selectedMessage.bodyHtml}
                    className="w-full min-h-[350px] border-none"
                    sandbox="allow-same-origin"
                  />
                </div>
              ) : selectedMessage.bodyText ? (
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">
                  {selectedMessage.bodyText}
                </div>
              ) : (
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs text-slate-300 leading-relaxed">
                  {selectedMessage.snippet}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-end">
              <button
                onClick={() => setSelectedMessage(null)}
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compose Custom Email Modal */}
      {isComposeOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-red-400" />
                <h3 className="font-extrabold text-white text-base">Compose Travel Email</h3>
              </div>
              <button
                onClick={() => setIsComposeOpen(false)}
                className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">To:</label>
                <input
                  type="email"
                  placeholder="concierge@hotel.com"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-red-500/50"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Subject:</label>
                <input
                  type="text"
                  placeholder="Special Request / Late Check-in / Airport Transfer"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-red-500/50"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Message:</label>
                <textarea
                  rows={5}
                  placeholder="Hello, I will be arriving at 14:00. Could you please arrange high floor check-in?"
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-red-500/50 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsComposeOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all"
              >
                Cancel
              </button>
              <button
                onClick={triggerSendCustomEmailConfirmation}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-lg transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Email</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Explicit User Confirmation Modal (MANDATORY per Workspace Skill for all data mutations & sends) */}
      {pendingConfirmation && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
              <Info className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-base font-extrabold text-white">Confirm Gmail Action</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {pendingConfirmation.description}
              </p>
            </div>

            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-[11px] space-y-1">
              <div className="text-slate-400"><strong>Recipient:</strong> {pendingConfirmation.to}</div>
              <div className="text-slate-400 truncate"><strong>Subject:</strong> {pendingConfirmation.subject}</div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setPendingConfirmation(null)}
                disabled={isSending}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all"
              >
                Cancel
              </button>
              <button
                onClick={executeConfirmedAction}
                disabled={isSending}
                className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs shadow-lg transition-all flex items-center justify-center gap-1.5"
              >
                {isSending ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Confirm & Send</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
