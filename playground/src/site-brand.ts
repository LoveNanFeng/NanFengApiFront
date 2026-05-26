import type { SiteConfigApi } from '#/api/system/site';

import { reactive, readonly } from 'vue';

import { useAppConfig } from '@vben/hooks';
import { updatePreferences } from '@vben/preferences';

interface ApiEnvelope<T> {
  code?: number;
  data?: T;
  message?: string;
}

const DEFAULT_SITE_NAME = String(
  import.meta.env.VITE_APP_TITLE || 'NanFengAPI',
).trim();
const DEFAULT_LOGO_URL = '/favicon.ico';
const { apiURL } = useAppConfig(import.meta.env, import.meta.env.PROD);

const siteBrand = reactive({
  copyright: '',
  description: '',
  icp: '',
  logoUrl: DEFAULT_LOGO_URL,
  siteName: DEFAULT_SITE_NAME,
  slogan: '',
});

function normalizeApiUrl(path: string) {
  const base = String(apiURL || '').replace(/\/$/, '');
  return `${base}${path}`;
}

function clean(value: unknown) {
  return String(value ?? '').trim();
}

function copyrightYear(copyright: string) {
  return (
    copyright.match(/\b(19|20)\d{2}\b/)?.[0] ||
    String(new Date().getFullYear())
  );
}

function updateFavicon(logoUrl: string) {
  if (typeof document === 'undefined') {
    return;
  }

  let icon = document.querySelector<HTMLLinkElement>("link[rel='icon']");
  if (!icon) {
    icon = document.createElement('link');
    icon.rel = 'icon';
    document.head.append(icon);
  }
  icon.href = logoUrl;
}

function updateGlobalLoadingTitle(siteName: string) {
  if (typeof window === 'undefined') {
    return;
  }

  (window as any).__NANFENG_SET_LOADING_SITE_NAME__?.(siteName);
}

function applySiteBrand(config?: null | Partial<SiteConfigApi.Config>) {
  const siteName = clean(config?.siteName) || DEFAULT_SITE_NAME;
  const logoUrl = clean(config?.logoUrl) || DEFAULT_LOGO_URL;
  const slogan = clean(config?.slogan);
  const description = clean(config?.description);
  const copyright = clean(config?.copyright);
  const icp = clean(config?.icp);

  Object.assign(siteBrand, {
    copyright,
    description,
    icp,
    logoUrl,
    siteName,
    slogan,
  });

  updatePreferences({
    app: {
      name: siteName,
    },
    copyright: {
      companyName: siteName,
      companySiteLink: '',
      content: copyright,
      date: copyrightYear(copyright),
      enable: true,
      icp,
      icpLink: '',
    },
    logo: {
      fit: 'contain',
      source: logoUrl,
      sourceDark: logoUrl,
    },
  });
  updateFavicon(logoUrl);
  updateGlobalLoadingTitle(siteName);

  return readonly(siteBrand);
}

async function loadPublicSiteConfig() {
  const response = await fetch(normalizeApiUrl('/site/config'), {
    credentials: 'include',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as ApiEnvelope<SiteConfigApi.Config>;
  return payload?.data ?? null;
}

async function initSiteBrand() {
  try {
    applySiteBrand(await loadPublicSiteConfig());
  } catch {
    applySiteBrand(null);
  }
}

function useSiteBrand() {
  return readonly(siteBrand);
}

export { applySiteBrand, initSiteBrand, useSiteBrand };
