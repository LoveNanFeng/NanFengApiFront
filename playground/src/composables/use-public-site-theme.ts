import { computed, ref, watchEffect } from 'vue';

interface PublicThemeOption {
  accent: string;
  color: string;
  key: string;
  mapColors: string[];
  name: string;
  rgb: string;
  soft: string;
}

const THEME_STORAGE_KEY = 'nanfeng_home_theme';

const themeOptions: PublicThemeOption[] = [
  {
    accent: '#4f46e5',
    color: '#2563eb',
    key: 'blue',
    mapColors: ['#eaf2fb', '#d9e9fb', '#afd3ff', '#6aa9ff', '#2563eb'],
    name: '科技蓝',
    rgb: '37 99 235',
    soft: '#eff6ff',
  },
  {
    accent: '#7c3aed',
    color: '#6d5dfc',
    key: 'violet',
    mapColors: ['#f1efff', '#e4ddff', '#c7b8ff', '#9b7dff', '#6d5dfc'],
    name: '星云紫',
    rgb: '109 93 252',
    soft: '#f3f0ff',
  },
  {
    accent: '#e11d48',
    color: '#f0446e',
    key: 'rose',
    mapColors: ['#fff1f4', '#ffdce5', '#ffb4c5', '#fb7185', '#f0446e'],
    name: '珊瑚红',
    rgb: '240 68 110',
    soft: '#fff1f4',
  },
  {
    accent: '#f59e0b',
    color: '#f6b73c',
    key: 'amber',
    mapColors: ['#fff8e7', '#ffedbd', '#fed77a', '#fbbf24', '#f59e0b'],
    name: '暖金',
    rgb: '246 183 60',
    soft: '#fff8e7',
  },
  {
    accent: '#4f46e5',
    color: '#6366f1',
    key: 'indigo',
    mapColors: ['#eef2ff', '#dfe6ff', '#bdc9ff', '#818cf8', '#6366f1'],
    name: '靛蓝',
    rgb: '99 102 241',
    soft: '#eef2ff',
  },
  {
    accent: '#059669',
    color: '#10b981',
    key: 'green',
    mapColors: ['#ecfdf5', '#d1fae5', '#a7f3d0', '#34d399', '#10b981'],
    name: '松石绿',
    rgb: '16 185 129',
    soft: '#ecfdf5',
  },
  {
    accent: '#111827',
    color: '#374151',
    key: 'slate',
    mapColors: ['#f1f5f9', '#e2e8f0', '#cbd5e1', '#64748b', '#334155'],
    name: '石墨',
    rgb: '55 65 81',
    soft: '#f1f5f9',
  },
];

function getInitialThemeKey() {
  if (typeof localStorage === 'undefined') {
    return themeOptions[0]!.key;
  }
  const cached = localStorage.getItem(THEME_STORAGE_KEY);
  return themeOptions.some((item) => item.key === cached)
    ? cached!
    : themeOptions[0]!.key;
}

const selectedTheme = ref(getInitialThemeKey());

const activeTheme = computed(
  () =>
    themeOptions.find((item) => item.key === selectedTheme.value) ??
    themeOptions[0]!,
);

const siteThemeVars = computed(() => ({
  '--home-accent': activeTheme.value.accent,
  '--home-primary': activeTheme.value.color,
  '--home-primary-rgb': activeTheme.value.rgb,
  '--home-soft': activeTheme.value.soft,
}));

watchEffect(() => {
  if (typeof document === 'undefined') {
    return;
  }
  for (const [key, value] of Object.entries(siteThemeVars.value)) {
    document.documentElement.style.setProperty(key, value);
  }
});

function setSiteTheme(key: string) {
  if (!themeOptions.some((item) => item.key === key)) {
    return;
  }
  selectedTheme.value = key;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(THEME_STORAGE_KEY, key);
  }
}

function usePublicSiteTheme() {
  return {
    activeTheme,
    selectedTheme,
    setSiteTheme,
    siteThemeVars,
    themeOptions,
  };
}

export { themeOptions, usePublicSiteTheme };
export type { PublicThemeOption };
