export type AccentTheme = 'blue' | 'purple' | 'emerald';

export interface ThemeDefinition {
  id: AccentTheme;
  name: string;
  tagline: string;
  dotColor: string;
  primaryHex: string;
  secondaryHex: string;
  headerBg: string; // For Telegram frame header
  headerGradient: string;
  activeTabClass: string;
  activeTabBg: string;
  primaryButtonClass: string;
  badgeClass: string;
  textAccentClass: string;
  borderAccentClass: string;
  glowColorClass: string;
  ringClass: string;
}

export type AccentThemeDef = ThemeDefinition;

export const THEMES: Record<AccentTheme, ThemeDefinition> = {
  blue: {
    id: 'blue',
    name: 'Telegram Blue',
    tagline: 'Classic Telegram messenger signature blue',
    dotColor: '#0088cc',
    primaryHex: '#0088cc',
    secondaryHex: '#38bdf8',
    headerBg: 'bg-[#0088cc]',
    headerGradient: 'from-[#0088cc] via-[#0277b6] to-[#005f9e]',
    activeTabClass: 'text-[#0088cc]',
    activeTabBg: 'bg-cyan-950/50',
    primaryButtonClass: 'bg-[#0088cc] hover:bg-[#0077b3] text-white shadow-[#0088cc]/25',
    badgeClass: 'bg-[#0088cc]/15 text-[#38bdf8] border-[#0088cc]/40',
    textAccentClass: 'text-cyan-400',
    borderAccentClass: 'border-cyan-500/40',
    glowColorClass: 'bg-cyan-500/10',
    ringClass: 'focus:ring-cyan-400'
  },
  purple: {
    id: 'purple',
    name: 'TON Purple',
    tagline: 'Web3 & TON ecosystem royal amethyst',
    dotColor: '#9333ea',
    primaryHex: '#9333ea',
    secondaryHex: '#c084fc',
    headerBg: 'bg-purple-700',
    headerGradient: 'from-purple-700 via-indigo-700 to-purple-900',
    activeTabClass: 'text-purple-400',
    activeTabBg: 'bg-purple-950/50',
    primaryButtonClass: 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-600/25',
    badgeClass: 'bg-purple-500/15 text-purple-300 border-purple-500/40',
    textAccentClass: 'text-purple-400',
    borderAccentClass: 'border-purple-500/40',
    glowColorClass: 'bg-purple-500/10',
    ringClass: 'focus:ring-purple-400'
  },
  emerald: {
    id: 'emerald',
    name: 'Emerald Green',
    tagline: 'Lush eco-traveler & tropical mint',
    dotColor: '#10b981',
    primaryHex: '#10b981',
    secondaryHex: '#34d399',
    headerBg: 'bg-emerald-600',
    headerGradient: 'from-emerald-600 via-teal-700 to-emerald-900',
    activeTabClass: 'text-emerald-400',
    activeTabBg: 'bg-emerald-950/50',
    primaryButtonClass: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/25',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
    textAccentClass: 'text-emerald-400',
    borderAccentClass: 'border-emerald-500/40',
    glowColorClass: 'bg-emerald-500/10',
    ringClass: 'focus:ring-emerald-400'
  }
};

const THEME_STORAGE_KEY = 'telegram_travel_accent_theme_v1';

export function loadSavedTheme(): AccentTheme {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY) as AccentTheme;
    if (saved && (saved === 'blue' || saved === 'purple' || saved === 'emerald')) {
      return saved;
    }
  } catch (e) {
    console.error('Failed to load accent theme', e);
  }
  return 'blue';
}

export function saveTheme(theme: AccentTheme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (e) {
    console.error('Failed to save accent theme', e);
  }
}
