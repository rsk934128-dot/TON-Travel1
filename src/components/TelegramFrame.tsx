import React, { useState, useEffect } from 'react';
import { UserState } from '../types';
import { Sparkles, Shield, Wallet, Smartphone, Monitor, CheckCircle, ExternalLink, Zap, Award, ArrowRightLeft, Crown, TrendingUp, UserCheck, Database, Globe2 } from 'lucide-react';
import { LoyaltyTierStatus } from '../utils/loyalty';
import { AccentTheme, THEMES } from '../utils/theme';
import { ThemeSelector } from './ThemeSelector';
import { CurrencySelector } from './CurrencySelector';
import { LanguageSelector } from './LanguageSelector';
import { useLanguage } from '../utils/i18n';
import appLogo from '../assets/images/ton_travel_logo_1786647813598.jpg';

interface TelegramFrameProps {
  children: React.ReactNode;
  userState: UserState;
  loyaltyStatus?: LoyaltyTierStatus;
  currentTheme?: AccentTheme;
  selectedCurrency?: string;
  rates?: Record<string, number>;
  onOpenConverter?: () => void;
  onOpenAdmin?: () => void;
  onOpenCryptoRank?: () => void;
  onOpenBookingApi?: () => void;
  onOpenAuth?: () => void;
  onSelectTheme?: (theme: AccentTheme) => void;
  onTogglePremium: () => void;
  onConnectWallet: () => void;
  onDriveAuth: () => void;
}

export const TelegramFrame: React.FC<TelegramFrameProps> = ({
  children,
  userState,
  loyaltyStatus,
  currentTheme = 'blue',
  selectedCurrency = 'USD',
  rates = {},
  onOpenConverter,
  onOpenAdmin,
  onOpenCryptoRank,
  onOpenBookingApi,
  onOpenAuth,
  onSelectTheme,
  onTogglePremium,
  onConnectWallet,
  onDriveAuth
}) => {
  const { t } = useLanguage();
  const [isPhoneFrame, setIsPhoneFrame] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const activeThemeDef = THEMES[currentTheme];

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col items-center justify-start antialiased font-sans">
      {/* Top Banner Control Bar for Demo / Testing Options */}
      <header className="w-full bg-[#0f172a]/90 backdrop-blur-md border-b border-slate-800 px-3 py-2 text-xs flex flex-wrap items-center justify-between gap-2 z-50 sticky top-0">
        <div className="flex items-center gap-2 flex-wrap">
          <div
            className="flex items-center gap-2 px-2.5 py-1 rounded-full font-bold transition-colors duration-300 shadow-sm"
            style={{
              backgroundColor: `${activeThemeDef.primaryHex}20`,
              color: activeThemeDef.secondaryHex
            }}
          >
            <img
              src={appLogo}
              alt="TON Travel Logo"
              referrerPolicy="no-referrer"
              className="w-5 h-5 rounded-full object-cover shadow-sm ring-1 ring-white/30"
            />
            <span>TON TRAVEL MINI APP</span>
          </div>
          
          <div className="hidden sm:flex items-center gap-1.5 text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700/50">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>1 TON = <strong className="text-white">${userState.tonPriceUsd.toFixed(2)}</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Language Selector */}
          <LanguageSelector variant="header" themeDef={activeThemeDef} />

          {/* Quick Currency Selector & FX Rates Converter Trigger */}
          {onOpenConverter && (
            <CurrencySelector
              selectedCurrency={selectedCurrency}
              onOpenConverter={onOpenConverter}
              rates={rates}
              tonPriceUsd={userState.tonPriceUsd}
              themeDef={activeThemeDef}
              variant="header"
            />
          )}

          {/* Quick CryptoRank v3 Connector & Live Market Explorer Trigger */}
          {onOpenCryptoRank && (
            <button
              onClick={onOpenCryptoRank}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-xs bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 transition-all active:scale-95 shadow-sm"
              title="Open CryptoRank v3 Live Prices, OpenAPI & MCP Server"
            >
              <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
              <span>CryptoRank v3</span>
            </button>
          )}

          {/* Quick Booking.com API Integration Diagnostics Trigger */}
          {onOpenBookingApi && (
            <button
              onClick={onOpenBookingApi}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-xs bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition-all active:scale-95 shadow-sm"
              title="Open Booking.com API Integration & Diagnostics"
            >
              <Globe2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Booking.com API</span>
            </button>
          )}

          {/* Super Admin Control Center Trigger */}
          {onOpenAdmin && (
            <button
              onClick={onOpenAdmin}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold text-xs bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-md shadow-amber-500/20 transition-all active:scale-95"
              title="Open Admin Control Portal (SuperAdmins: rubelbank92@gmail.com & rubels1k994@gmail.com)"
            >
              <Crown className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
              <span>Admin Portal</span>
            </button>
          )}

          {/* Quick Accent Theme Selector */}
          {onSelectTheme && (
            <ThemeSelector
              currentTheme={currentTheme}
              onSelectTheme={onSelectTheme}
              variant="compact-bar"
            />
          )}

          {/* Frequent Traveler Loyalty Tier Badge */}
          {loyaltyStatus && (
            <div className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${loyaltyStatus.tier.badgeColor}`}>
              <span>{loyaltyStatus.tier.icon}</span>
              <span>{loyaltyStatus.tier.displayName}</span>
              {loyaltyStatus.bonusPercentage > 0 && (
                <span className="text-[10px] bg-amber-400/20 text-amber-300 px-1.5 py-0.2 rounded-md">
                  +{loyaltyStatus.bonusPercentage}% Bonus
                </span>
              )}
            </div>
          )}

          {/* Telegram Premium Status Toggle */}
          <button
            onClick={onTogglePremium}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold transition-all text-xs ${
              userState.isTelegramPremium
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/20'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
            }`}
            title="Click to toggle Telegram Premium status and compare cashback rate (8% vs 5%)"
          >
            <Sparkles className={`w-3.5 h-3.5 ${userState.isTelegramPremium ? 'text-amber-300 fill-amber-300' : 'text-slate-400'}`} />
            <span>
              {userState.isTelegramPremium ? t('header.premium_active') : t('header.standard_active')}
            </span>
          </button>

          {/* Firebase Auth & Cloud Sync Button */}
          {onOpenAuth && (
            <button
              onClick={onOpenAuth}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                userState.firebaseUid
                  ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/50 shadow-sm'
                  : 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40'
              }`}
              title={userState.firebaseUid ? `Firestore Cloud Sync Active (${userState.firebaseEmail})` : 'Login / Register to sync user data in Firestore'}
            >
              {userState.firebaseUid ? <UserCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Database className="w-3.5 h-3.5 text-blue-400" />}
              <span>{userState.firebaseUid ? 'Cloud Synced' : 'লগইন / সিঙ্ক'}</span>
            </button>
          )}

          {/* TON Wallet Quick Connect */}
          <button
            onClick={onConnectWallet}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all shadow-md ${
              userState.connectedWallet
                ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/60'
                : 'text-white'
            }`}
            style={{
              backgroundColor: userState.connectedWallet ? undefined : activeThemeDef.primaryHex
            }}
          >
            <Wallet className="w-3.5 h-3.5" />
            <span className="max-w-[100px] truncate">
              {userState.connectedWallet
                ? `${userState.connectedWallet.slice(0, 4)}...${userState.connectedWallet.slice(-4)}`
                : t('header.connect_wallet')}
            </span>
          </button>

          {/* Google Drive Status Indicator */}
          <button
            onClick={onDriveAuth}
            className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
              userState.googleDriveToken
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
            }`}
            title={userState.googleDriveToken ? `Connected as ${userState.driveUserEmail}` : 'Connect Google Drive to export hotel vouchers'}
          >
            <CheckCircle className={`w-3.5 h-3.5 ${userState.googleDriveToken ? 'text-emerald-400' : 'text-slate-400'}`} />
            <span>{userState.googleDriveToken ? t('header.drive_connected') : t('header.sync_drive')}</span>
          </button>

          {/* Device Frame View Toggle */}
          <button
            onClick={() => setIsPhoneFrame(!isPhoneFrame)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all border border-slate-700/60"
            title={isPhoneFrame ? "Switch to Full View" : "Switch to Telegram Mobile Preview"}
          >
            {isPhoneFrame ? <Monitor className="w-4 h-4 text-cyan-400" /> : <Smartphone className="w-4 h-4 text-purple-400" />}
          </button>
        </div>
      </header>

      {/* Main View Area */}
      <div className={`w-full flex-1 flex flex-col items-center justify-start ${isPhoneFrame ? 'py-6 px-4' : ''}`}>
        {isPhoneFrame ? (
          /* Phone Frame Container */
          <div className="w-full max-w-[420px] h-[850px] bg-slate-900 border-[8px] border-slate-800 rounded-[48px] shadow-2xl shadow-cyan-950/40 flex flex-col overflow-hidden relative border-t-[12px]">
            {/* Notch */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-36 h-5 bg-slate-800 rounded-b-xl z-50 flex items-center justify-center">
              <div className="w-12 h-1 bg-slate-700 rounded-full"></div>
            </div>

            {/* Telegram Mini App Top Status Bar */}
            <div
              className="pt-6 px-6 pb-2 text-white flex items-center justify-between text-xs font-medium z-40 select-none transition-colors duration-300"
              style={{ backgroundColor: activeThemeDef.primaryHex }}
            >
              <span>{currentTime || '12:00'}</span>
              <div className="flex items-center gap-1.5 text-[11px]">
                <span>5G</span>
                <div className="w-5 h-2.5 border border-white rounded-sm p-[1px] flex items-center">
                  <div className="h-full w-4/5 bg-white rounded-2xs"></div>
                </div>
              </div>
            </div>

            {/* Telegram Header Bar */}
            <div
              className="px-4 py-2.5 text-white flex items-center justify-between z-40 border-b border-white/20 transition-colors duration-300"
              style={{ backgroundColor: activeThemeDef.primaryHex }}
            >
              <div className="flex items-center gap-2.5">
                <img
                  src={appLogo}
                  alt="TON Travel Logo"
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-full object-cover shadow-md ring-1 ring-white/40"
                />
                <div>
                  <h1 className="font-bold text-sm leading-tight">TON Travel</h1>
                  <p className="text-[10px] text-white/80 flex items-center gap-1">
                    <span>bot</span> • <span>3M+ Hotels</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {loyaltyStatus && (
                  <span className="text-[10px] bg-black/30 backdrop-blur-md px-2 py-0.5 rounded-full font-bold border border-white/20 text-white flex items-center gap-1">
                    <span>{loyaltyStatus.tier.icon}</span>
                    <span>{loyaltyStatus.tier.name}</span>
                  </span>
                )}
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-medium">
                  {userState.isTelegramPremium ? '👑 Premium' : 'Free'}
                </span>
              </div>
            </div>

            {/* Scrollable Mini App Inner Screen */}
            <div className="flex-1 overflow-y-auto bg-slate-950 flex flex-col">
              {children}
            </div>
          </div>
        ) : (
          /* Full Web Application Screen */
          <div className="w-full max-w-6xl flex-1 flex flex-col">
            {children}
          </div>
        )}
      </div>
    </div>
  );
};
