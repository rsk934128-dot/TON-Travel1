import React from 'react';
import { Building2, Map, Wallet, Luggage, Sparkles } from 'lucide-react';
import { AccentTheme, THEMES } from '../utils/theme';
import { useLanguage } from '../utils/i18n';

export type TabType = 'hotels' | 'map' | 'cashback' | 'stays';

interface BottomTabsProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  bookingCount: number;
  cashbackBalanceTon: number;
  isPremium: boolean;
  currentTheme?: AccentTheme;
}

export const BottomTabs: React.FC<BottomTabsProps> = ({
  activeTab,
  onChangeTab,
  bookingCount,
  cashbackBalanceTon,
  isPremium,
  currentTheme = 'blue'
}) => {
  const { t } = useLanguage();
  const themeDef = THEMES[currentTheme];

  const getTabStyle = (tab: TabType) => {
    const isActive = activeTab === tab;
    if (!isActive) return 'text-slate-400 hover:text-slate-200';
    return `${themeDef.activeTabClass} ${themeDef.activeTabBg} font-bold shadow-sm`;
  };

  return (
    <nav className="sticky bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-800/80 py-2 px-3 z-40">
      <div className="max-w-md mx-auto grid grid-cols-4 gap-1 text-center">
        {/* Tab 1: Hotels */}
        <button
          onClick={() => onChangeTab('hotels')}
          className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${getTabStyle('hotels')}`}
        >
          <Building2 className={`w-5 h-5 mb-1 ${activeTab === 'hotels' ? 'stroke-[2.5px]' : ''}`} />
          <span className="text-[11px] leading-tight">{t('tab.hotels')}</span>
        </button>

        {/* Tab 2: Map */}
        <button
          onClick={() => onChangeTab('map')}
          className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${getTabStyle('map')}`}
        >
          <Map className={`w-5 h-5 mb-1 ${activeTab === 'map' ? 'stroke-[2.5px]' : ''}`} />
          <span className="text-[11px] leading-tight">{t('tab.map')}</span>
        </button>

        {/* Tab 3: Cashback Wallet */}
        <button
          onClick={() => onChangeTab('cashback')}
          className={`relative flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${getTabStyle('cashback')}`}
        >
          <div className="relative">
            <Wallet className={`w-5 h-5 mb-1 ${activeTab === 'cashback' ? 'stroke-[2.5px]' : ''}`} />
            {cashbackBalanceTon > 0 && (
              <span
                className="absolute -top-1 -right-2 text-slate-950 font-black text-[9px] px-1 rounded-full shadow-sm"
                style={{ backgroundColor: themeDef.secondaryHex }}
              >
                {cashbackBalanceTon > 0 ? `${cashbackBalanceTon.toFixed(1)}` : ''}
              </span>
            )}
          </div>
          <span className="text-[11px] leading-tight flex items-center gap-0.5">
            <span>{t('tab.wallet')}</span>
            {isPremium && <Sparkles className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />}
          </span>
        </button>

        {/* Tab 4: My Stays */}
        <button
          onClick={() => onChangeTab('stays')}
          className={`relative flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${getTabStyle('stays')}`}
        >
          <div className="relative">
            <Luggage className={`w-5 h-5 mb-1 ${activeTab === 'stays' ? 'stroke-[2.5px]' : ''}`} />
            {bookingCount > 0 && (
              <span
                className="absolute -top-1 -right-2 text-white font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center shadow-sm"
                style={{ backgroundColor: themeDef.primaryHex }}
              >
                {bookingCount}
              </span>
            )}
          </div>
          <span className="text-[11px] leading-tight">{t('tab.stays')}</span>
        </button>
      </div>
    </nav>
  );
};
