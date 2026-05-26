import { initPreferences } from '@vben/preferences';
import { unmountGlobalLoading } from '@vben/utils';

import { overridesPreferences, preferencesExtension } from './preferences';

function resetWindowScroll() {
  window.scrollTo({ behavior: 'auto', left: 0, top: 0 });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

function setupScrollRestoration() {
  if (typeof window === 'undefined') {
    return;
  }

  if ('scrollRestoration' in window.history) {
    window.history.scrollRestoration = 'manual';
  }

  resetWindowScroll();
  window.addEventListener('pageshow', resetWindowScroll, { once: true });
  window.addEventListener('load', resetWindowScroll, { once: true });
}

function migrateDefaultThemeToLight(namespace: string) {
  const migrationKey = `${namespace}-light-theme-migrated-v1`;
  if (localStorage.getItem(migrationKey)) {
    return;
  }

  const preferencesKey = `${namespace}-preferences`;
  const themeKey = `${namespace}-preferences-theme`;
  const cachedPreferences = localStorage.getItem(preferencesKey);

  if (cachedPreferences) {
    try {
      const parsed = JSON.parse(cachedPreferences);
      parsed.value = {
        ...parsed.value,
        theme: {
          ...parsed.value?.theme,
          mode: 'light',
        },
      };
      localStorage.setItem(preferencesKey, JSON.stringify(parsed));
    } catch {
      localStorage.removeItem(preferencesKey);
    }
  }

  localStorage.setItem(themeKey, JSON.stringify({ value: 'light' }));
  localStorage.setItem(migrationKey, 'true');
}

function removeDeprecatedDeptState(namespace: string) {
  const migrationKey = `${namespace}-remove-deprecated-menu-state-v4`;
  if (localStorage.getItem(migrationKey)) {
    return;
  }

  const markers = [
    '/system/dept',
    '/system/role',
    '/dashboard',
    '/analytics',
    '/interface',
    'SystemDept',
    'Dashboard',
    'Analytics',
    'InterfaceManagement',
    'system.dept.title',
    'page.dashboard.analytics',
    'system.interface.title',
    'System:Dept:',
  ];

  for (const storage of [localStorage, sessionStorage]) {
    const keys = Array.from({ length: storage.length }, (_, index) =>
      storage.key(index),
    ).filter((key): key is string => !!key);

    for (const key of keys) {
      if (!key.startsWith(namespace)) {
        continue;
      }

      const value = storage.getItem(key);
      if (value && markers.some((marker) => value.includes(marker))) {
        storage.removeItem(key);
      }
    }
  }

  localStorage.setItem(migrationKey, 'true');
}

async function initApplication() {
  const env = import.meta.env.PROD ? 'prod' : 'dev';
  const appVersion = import.meta.env.VITE_APP_VERSION;
  const namespace = `${import.meta.env.VITE_APP_NAMESPACE}-${appVersion}-${env}`;

  migrateDefaultThemeToLight(namespace);
  removeDeprecatedDeptState(namespace);

  await initPreferences({
    extension: preferencesExtension,
    namespace,
    overrides: overridesPreferences,
  });

  const { bootstrap } = await import('./bootstrap');
  await bootstrap(namespace);

  unmountGlobalLoading();
}

setupScrollRestoration();
initApplication();
