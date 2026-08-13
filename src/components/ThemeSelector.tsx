import React from 'react';
import { AccentTheme, THEMES, ThemeDefinition } from '../utils/theme';
import { Palette, Check, Sparkles } from 'lucide-react';

interface ThemeSelectorProps {
  currentTheme: AccentTheme;
  onSelectTheme: (theme: AccentTheme) => void;
  variant?: 'inline-card' | 'compact-bar' | 'dropdown';
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  currentTheme,
  onSelectTheme,
  variant = 'inline-card'
}) => {
  const themeList: ThemeDefinition[] = [
    THEMES.blue,
    THEMES.purple,
    THEMES.emerald
  ];

  if (variant === 'compact-bar') {
    return (
      <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-full border border-slate-700/60 shadow-inner">
        <span className="text-[10px] font-bold text-slate-400 pl-2 pr-1 flex items-center gap-1">
          <Palette className="w-3 h-3 text-slate-300" />
          <span className="hidden sm:inline">Theme:</span>
        </span>
        {themeList.map((t) => {
          const isSelected = currentTheme === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onSelectTheme(t.id)}
              className={`px-2 py-0.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-slate-800 text-white shadow-md ring-1 ring-white/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
              title={`Switch accent color to ${t.name}`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full transition-transform"
                style={{ backgroundColor: t.dotColor }}
              />
              <span className="text-[11px] whitespace-nowrap">{t.name.split(' ')[0]}</span>
              {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4 relative overflow-hidden">
      {/* Decorative glow */}
      <div
        className="absolute -top-12 -right-12 w-40 h-40 rounded-full blur-3xl opacity-20 transition-all duration-500 pointer-events-none"
        style={{ backgroundColor: THEMES[currentTheme].dotColor }}
      />

      <div className="flex items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-lg transition-colors duration-300"
            style={{ backgroundColor: THEMES[currentTheme].primaryHex }}
          >
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Accent Color Theme</span>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-normal border border-slate-700">
                Personalization
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Customize the Mini App interface accents, buttons, and navigation colors
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 relative z-10">
        {themeList.map((t) => {
          const isSelected = currentTheme === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onSelectTheme(t.id)}
              className={`p-4 rounded-2xl border text-left transition-all duration-300 relative group flex flex-col justify-between ${
                isSelected
                  ? 'bg-slate-950/90 shadow-lg scale-[1.02]'
                  : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700 hover:bg-slate-950/80'
              }`}
              style={{
                borderColor: isSelected ? t.primaryHex : undefined,
                boxShadow: isSelected ? `0 10px 25px -5px ${t.primaryHex}25` : undefined
              }}
            >
              {/* Top Row: Color circle & active check */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-5 h-5 rounded-full ring-4 ring-slate-800 flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm"
                    style={{ backgroundColor: t.dotColor }}
                  />
                  <span className="font-extrabold text-sm text-white">
                    {t.name}
                  </span>
                </div>

                {isSelected ? (
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm"
                    style={{ backgroundColor: t.primaryHex }}
                  >
                    ✓
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500 group-hover:text-slate-400 font-semibold">
                    Select
                  </span>
                )}
              </div>

              {/* Tagline */}
              <p className="text-[11px] text-slate-400 mt-3 leading-relaxed">
                {t.tagline}
              </p>

              {/* Mini UI Swatch Preview */}
              <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center gap-1.5">
                <div
                  className="h-2 flex-1 rounded-full opacity-80"
                  style={{ backgroundColor: t.primaryHex }}
                />
                <div
                  className="h-2 w-4 rounded-full opacity-50"
                  style={{ backgroundColor: t.secondaryHex }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
