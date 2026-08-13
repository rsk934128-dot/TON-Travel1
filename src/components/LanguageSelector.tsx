import React, { useState, useRef, useEffect } from 'react';
import { Globe, Check, ChevronDown, Sparkles } from 'lucide-react';
import { Language, LANGUAGES, LanguageOption, useLanguage } from '../utils/i18n';
import { AccentThemeDef } from '../utils/theme';

interface LanguageSelectorProps {
  currentLanguage?: Language;
  onSelectLanguage?: (lang: Language) => void;
  themeDef?: AccentThemeDef;
  variant?: 'header' | 'compact-bar' | 'inline-card' | 'dropdown';
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  currentLanguage,
  onSelectLanguage,
  themeDef,
  variant = 'header'
}) => {
  const context = useLanguage();
  const activeLang = currentLanguage || context.language;
  const handleSelect = onSelectLanguage || context.setLanguage;
  const currentInfo = LANGUAGES[activeLang] || LANGUAGES.en;

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const langList: LanguageOption[] = [
    LANGUAGES.en,
    LANGUAGES.ru,
    LANGUAGES.es
  ];

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Variant 1: Compact header pill with dropdown menu
  if (variant === 'header' || variant === 'dropdown') {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          id="header-language-switcher-btn"
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          title={`Current Language: ${currentInfo.nativeName} (${currentInfo.name}). Click to switch language.`}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 hover:text-white border border-slate-700/70 transition-all shadow-sm group"
        >
          <span className="text-sm">{currentInfo.flag}</span>
          <span className="text-xs font-bold">{currentInfo.code.toUpperCase()}</span>
          <span className="text-[11px] text-slate-300 font-medium hidden sm:inline">
            {currentInfo.nativeName}
          </span>
          <ChevronDown className={`w-3 h-3 text-slate-400 group-hover:text-white transition-transform ${isOpen ? 'rotate-180 text-cyan-400' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-52 bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 space-y-1">
            <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 flex items-center justify-between">
              <span>Choose Language</span>
              <Globe className="w-3 h-3 text-cyan-400" />
            </div>

            {langList.map((item) => {
              const isSelected = activeLang === item.code;
              return (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => {
                    handleSelect(item.code);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all text-left ${
                    isSelected
                      ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">{item.flag}</span>
                    <div>
                      <div className="text-xs font-bold leading-tight">{item.nativeName}</div>
                      <div className="text-[10px] text-slate-400 leading-tight">{item.name}</div>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-cyan-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Variant 2: Compact bar (like compact theme selector)
  if (variant === 'compact-bar') {
    return (
      <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-full border border-slate-700/60 shadow-inner">
        <span className="text-[10px] font-bold text-slate-400 pl-2 pr-1 flex items-center gap-1">
          <Globe className="w-3 h-3 text-slate-300" />
          <span className="hidden sm:inline">Lang:</span>
        </span>
        {langList.map((item) => {
          const isSelected = activeLang === item.code;
          return (
            <button
              key={item.code}
              type="button"
              onClick={() => handleSelect(item.code)}
              className={`px-2 py-0.5 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${
                isSelected
                  ? 'bg-slate-800 text-white shadow-md ring-1 ring-white/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
              title={`Switch language to ${item.nativeName}`}
            >
              <span>{item.flag}</span>
              <span className="text-[11px] uppercase font-bold">{item.code}</span>
              {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
            </button>
          );
        })}
      </div>
    );
  }

  // Variant 3: Inline Card for Settings View (e.g. WalletView.tsx)
  return (
    <div
      id="settings-language-switcher-card"
      className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4 relative overflow-hidden"
    >
      {/* Decorative background glow */}
      <div
        className="absolute -top-12 -right-12 w-40 h-40 rounded-full blur-3xl opacity-20 transition-all duration-500 pointer-events-none bg-cyan-500"
      />

      <div className="flex items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-lg bg-gradient-to-tr from-cyan-600 to-blue-600"
          >
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>App Interface Language</span>
              <span className="text-[10px] bg-slate-800 text-cyan-300 px-2 py-0.5 rounded-full font-normal border border-cyan-900/60">
                {currentInfo.flag} {currentInfo.nativeName}
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Select between English, Russian, and Spanish to localize all UI labels, tabs, and booking flows
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 relative z-10">
        {langList.map((item) => {
          const isSelected = activeLang === item.code;
          return (
            <button
              key={item.code}
              type="button"
              onClick={() => handleSelect(item.code)}
              className={`p-4 rounded-2xl border text-left transition-all duration-200 relative group flex flex-col justify-between ${
                isSelected
                  ? 'bg-slate-950/90 border-cyan-500/80 shadow-lg shadow-cyan-950/50 scale-[1.02]'
                  : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700 hover:bg-slate-950/80'
              }`}
            >
              <div className="flex items-start justify-between w-full mb-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{item.flag}</span>
                  <div>
                    <h4 className="font-extrabold text-sm text-white group-hover:text-cyan-300 transition-colors">
                      {item.nativeName}
                    </h4>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {item.name}
                    </span>
                  </div>
                </div>

                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-cyan-500 border-cyan-400 text-slate-950'
                      : 'border-slate-700 bg-slate-900 group-hover:border-slate-500'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </div>

              <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <span>{item.description}</span>
                {isSelected && (
                  <span className="text-[10px] font-bold text-cyan-400 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-800/60">
                    Active
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
