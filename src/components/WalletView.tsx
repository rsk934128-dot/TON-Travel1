import React, { useState } from 'react';
import { UserState, Booking } from '../types';
import { Wallet, Sparkles, CheckCircle, ArrowUpRight, Cloud, RefreshCw, ShieldCheck, Zap, Copy, ExternalLink, Award, Gift, Palette, ArrowRightLeft, Globe, HelpCircle, AlertTriangle, Terminal, Code, TrendingUp, Cpu, Database, UserCheck } from 'lucide-react';
import confetti from 'canvas-confetti';
import { FrequentTravelerLoyaltySection } from './FrequentTravelerLoyaltySection';
import { DailyRewardsCard } from './DailyRewardsCard';
import { PriceAlertManager } from './PriceAlertManager';
import { ThemeSelector } from './ThemeSelector';
import { CurrencySelector } from './CurrencySelector';
import { LanguageSelector } from './LanguageSelector';
import { calculateLoyaltyTier } from '../utils/loyalty';
import { AccentTheme, AccentThemeDef } from '../utils/theme';
import { formatFiatEstimate, getCurrencyInfo } from '../utils/currency';
import { useLanguage } from '../utils/i18n';
import appLogo from '../assets/images/ton_travel_logo_1786647813598.jpg';

interface WalletViewProps {
  userState: UserState;
  bookings: Booking[];
  currentTheme?: AccentTheme;
  themeDef?: AccentThemeDef;
  selectedCurrency?: string;
  rates?: Record<string, number>;
  onOpenConverter?: () => void;
  onOpenTonTroubleshooter?: () => void;
  onOpenTonApiInspector?: () => void;
  onOpenCryptoRankConnector?: () => void;
  onOpenAuth?: () => void;
  onSelectTheme?: (theme: AccentTheme) => void;
  onConnectWallet: () => void;
  onTogglePremium: () => void;
  onDriveAuth: () => void;
  onClaimCashback: (amountTon: number) => void;
  onDailyRewardClaimed: (amountTon: number) => void;
}

export const WalletView: React.FC<WalletViewProps> = ({
  userState,
  bookings,
  currentTheme = 'blue',
  themeDef,
  selectedCurrency = 'USD',
  rates = {},
  onOpenConverter,
  onOpenTonTroubleshooter,
  onOpenTonApiInspector,
  onOpenCryptoRankConnector,
  onOpenAuth,
  onSelectTheme,
  onConnectWallet,
  onTogglePremium,
  onDriveAuth,
  onClaimCashback,
  onDailyRewardClaimed
}) => {
  const { t } = useLanguage();
  const [copiedWallet, setCopiedWallet] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimedSuccess, setClaimedSuccess] = useState(false);

  const tonBalance = userState.tonBalance;
  const balanceUsd = tonBalance * userState.tonPriceUsd;
  const showFiat = selectedCurrency !== 'USD';
  const balanceFiat = formatFiatEstimate(balanceUsd, selectedCurrency, rates);

  const totalCashbackTonEarned = bookings.reduce((sum, b) => sum + b.cashbackTon, 0);

  const copyWalletAddress = () => {
    if (userState.connectedWallet) {
      navigator.clipboard.writeText(userState.connectedWallet);
      setCopiedWallet(true);
      setTimeout(() => setCopiedWallet(false), 2000);
    }
  };

  const handleClaimTON = () => {
    if (tonBalance <= 0) return;

    setIsClaiming(true);
    setTimeout(() => {
      setIsClaiming(false);
      setClaimedSuccess(true);
      onClaimCashback(tonBalance);

      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.5 }
        });
      } catch (e) {
        // fallback
      }

      setTimeout(() => setClaimedSuccess(false), 4000);
    }, 1500);
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      
      {/* Top Header Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-[#003855] border border-cyan-500/30 rounded-3xl p-6 shadow-2xl">
        <div className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4 w-64 h-64 bg-[#0088cc]/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <img
                src={appLogo}
                alt="TON Travel"
                referrerPolicy="no-referrer"
                className="w-11 h-11 rounded-2xl object-cover shadow-lg ring-1 ring-cyan-400/40"
              />
              <div>
                <h2 className="text-sm font-bold text-slate-300">{t('wallet.title')}</h2>
                <p className="text-[11px] text-cyan-300 font-medium">{t('wallet.subtitle')}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onOpenConverter && (
                <button
                  onClick={onOpenConverter}
                  className="bg-slate-800/90 hover:bg-slate-700 text-xs font-bold text-cyan-300 px-3 py-1.5 rounded-full border border-slate-700 flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>{t('wallet.fx_calculator')}</span>
                </button>
              )}

              <button
                onClick={onConnectWallet}
                className="bg-slate-800/90 hover:bg-slate-700 text-xs font-bold text-slate-200 px-3 py-1.5 rounded-full border border-slate-700 flex items-center gap-1.5 transition-all"
              >
                <Wallet className="w-3.5 h-3.5 text-cyan-400" />
                <span>{userState.connectedWallet ? t('header.switch_wallet') : t('header.connect_wallet')}</span>
              </button>
            </div>
          </div>

          {/* Balance Display */}
          <div className="pt-2">
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              {t('wallet.available_balance')}
            </div>
            <div className="flex items-baseline gap-2 mt-1 flex-wrap">
              <span className="text-4xl font-black text-white tracking-tight">
                {tonBalance.toFixed(3)}
              </span>
              <span className="text-xl font-bold text-cyan-400">TON</span>
              <span className="text-sm font-semibold text-slate-400">
                (≈ ${balanceUsd.toFixed(2)} USD {showFiat && `• ≈ ${balanceFiat}`})
              </span>
            </div>
          </div>

          {/* Connected Address Pill */}
          {userState.connectedWallet && (
            <div className="flex items-center gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-xs font-mono text-cyan-300">
              <span className="truncate">{userState.connectedWallet}</span>
              <button onClick={copyWalletAddress} className="text-slate-400 hover:text-white p-1">
                {copiedWallet ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}

          {/* Claim Action Bar & Troubleshooter trigger */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={handleClaimTON}
              disabled={tonBalance <= 0 || isClaiming}
              className="flex-1 bg-gradient-to-r from-[#0088cc] to-cyan-500 hover:from-[#0077b3] hover:to-cyan-400 text-white font-bold py-3 px-5 rounded-2xl shadow-xl shadow-[#0088cc]/25 transition-all text-xs flex items-center justify-center gap-2 disabled:opacity-40"
            >
              {isClaiming ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{t('wallet.transferring')}</span>
                </>
              ) : claimedSuccess ? (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-300" />
                  <span>{t('wallet.transferred')}</span>
                </>
              ) : (
                <>
                  <ArrowUpRight className="w-4 h-4" />
                  <span>{t('wallet.withdraw_btn', { amount: tonBalance.toFixed(2) })}</span>
                </>
              )}
            </button>

            {onOpenAuth && (
              <button
                onClick={onOpenAuth}
                className={`px-3.5 py-3 rounded-2xl flex items-center gap-2 text-xs font-bold transition-all shadow-sm active:scale-95 ${
                  userState.firebaseUid
                    ? 'bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40'
                    : 'bg-gradient-to-r from-blue-600/30 to-cyan-600/30 hover:from-blue-600/40 hover:to-cyan-600/40 text-cyan-300 border border-cyan-500/30'
                }`}
                title="Firebase Auth & Firestore Cloud Storage Sync"
              >
                {userState.firebaseUid ? <UserCheck className="w-4 h-4 text-emerald-400" /> : <Database className="w-4 h-4 text-cyan-400" />}
                <span>{userState.firebaseUid ? 'Cloud Synced' : 'Firebase লগইন'}</span>
              </button>
            )}

            {onOpenTonTroubleshooter && (
              <button
                onClick={onOpenTonTroubleshooter}
                className="px-3.5 py-3 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-amber-300 border border-amber-500/30 flex items-center gap-2 text-xs font-bold transition-all shadow-sm active:scale-95"
                title="TON Space Transaction Troubleshooting & Gas Guide"
              >
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>TON Space Help</span>
              </button>
            )}

            {onOpenTonApiInspector && (
              <button
                onClick={onOpenTonApiInspector}
                className="px-3.5 py-3 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 flex items-center gap-2 text-xs font-bold transition-all shadow-sm active:scale-95"
                title="TON API v2 Explorer (Accounts, Raw Blockchain State, NFTs)"
              >
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span>TON API v2</span>
              </button>
            )}

            {onOpenCryptoRankConnector && (
              <button
                onClick={onOpenCryptoRankConnector}
                className="px-3.5 py-3 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-blue-300 border border-blue-500/30 flex items-center gap-2 text-xs font-bold transition-all shadow-sm active:scale-95"
                title="CryptoRank v3 Connector & MCP (Live Prices, OpenAPI v3, Model Context Protocol)"
              >
                <TrendingUp className="w-4 h-4 text-blue-400" />
                <span>CryptoRank v3</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Daily Rewards (24-Hour Bonus & Streak Progression) */}
      <DailyRewardsCard
        userState={userState}
        onRewardClaimed={onDailyRewardClaimed}
      />

      {/* Frequent Traveler Loyalty Tier Section */}
      <FrequentTravelerLoyaltySection
        bookings={bookings}
        userState={userState}
      />

      {/* TON Market Volatility & Price Alert Manager (Firestore Synced) */}
      <PriceAlertManager
        userState={userState}
        onOpenAuth={onOpenAuth}
        onOpenCryptoRankConnector={onOpenCryptoRankConnector}
      />

      {/* Settings Menu: Language Switcher, Currency & Theme */}
      <div className="space-y-4">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
          <span>{t('wallet.settings_title')}</span>
          <span className="text-[10px] text-cyan-400 font-normal">Global Preferences</span>
        </div>

        {/* 1. Language Switcher Card (English, Russian, Spanish) */}
        <LanguageSelector
          variant="inline-card"
          themeDef={themeDef}
        />

        {/* 2. Local Currency Preferences & Live FX Converter */}
        {onOpenConverter && (
          <div className="space-y-2">
            <CurrencySelector
              selectedCurrency={selectedCurrency}
              onOpenConverter={onOpenConverter}
              rates={rates}
              tonPriceUsd={userState.tonPriceUsd}
              themeDef={themeDef}
              variant="card"
            />
          </div>
        )}

        {/* 3. Accent Theme Personalization Settings */}
        {onSelectTheme && (
          <ThemeSelector
            currentTheme={currentTheme}
            onSelectTheme={onSelectTheme}
            variant="inline-card"
          />
        )}
      </div>

      {/* Telegram Premium Banner Offer */}
      <div className={`p-5 rounded-3xl border transition-all ${
        userState.isTelegramPremium
          ? 'bg-gradient-to-r from-purple-950/60 via-slate-900 to-indigo-950/60 border-purple-500/40'
          : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-purple-500/20 text-purple-300 rounded-2xl border border-purple-500/30">
              <Sparkles className="w-6 h-6 text-amber-300 fill-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm text-white">{t('wallet.premium_title')}</h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${userState.isTelegramPremium ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                  {userState.isTelegramPremium ? 'Active 8%' : 'Standard 5%'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                {t('wallet.premium_desc')}
              </p>
            </div>
          </div>

          <button
            onClick={onTogglePremium}
            className={`shrink-0 text-xs font-bold px-4 py-2.5 rounded-xl transition-all ${
              userState.isTelegramPremium
                ? 'bg-purple-900/60 hover:bg-purple-800 text-purple-200 border border-purple-700/50'
                : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-500/20'
            }`}
          >
            {userState.isTelegramPremium ? t('wallet.premium_btn_disable') : t('wallet.premium_btn_enable')}
          </button>
        </div>
      </div>

      {/* Google Drive Integration Info */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-2xl">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">{t('wallet.drive_title')}</h3>
              <p className="text-xs text-slate-400">{t('wallet.drive_desc')}</p>
            </div>
          </div>

          <button
            onClick={onDriveAuth}
            className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all border ${
              userState.googleDriveToken
                ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
          >
            {userState.googleDriveToken ? `Connected (${userState.driveUserEmail})` : 'Connect Drive'}
          </button>
        </div>
      </div>

      {/* Historic Cashback Ledger */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          {t('wallet.history_title')}
        </h3>

        {bookings.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center text-slate-500 text-xs">
            {t('wallet.no_history')}
          </div>
        ) : (
          <div className="space-y-2.5">
            {bookings.map((b) => (
              <div
                key={b.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-950/60 border border-cyan-800/40 flex items-center justify-center text-base">
                    🏨
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">{b.hotelName}</h4>
                    <p className="text-slate-400 text-[11px]">{b.bookingDate} • {b.paymentMethod}</p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-emerald-400 font-extrabold text-sm">
                    +{b.cashbackTon.toFixed(3)} TON
                  </div>
                  <div className="text-slate-400 text-[10px]">
                    ≈ ${b.cashbackUsd.toFixed(2)} USD ({b.cashbackPercentage}%)
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

