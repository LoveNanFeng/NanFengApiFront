<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router';

import { LOGIN_PATH } from '@vben/constants';
import { IconifyIcon } from '@vben/icons';
import { useAccessStore, useUserStore } from '@vben/stores';

import { usePublicSiteTheme } from '#/composables/use-public-site-theme';
import { useSiteBrand } from '#/site-brand';

type PublicNavKey = 'home' | 'links' | 'market' | 'opensource' | 'donate';

interface NavItem {
  key: PublicNavKey;
  label: string;
  to: string;
  href?: string;
  external?: boolean;
}

const props = withDefaults(
  defineProps<{
    activeKey?: PublicNavKey;
  }>(),
  {
    activeKey: 'home',
  },
);

const REGISTER_PATH = '/auth/register';
const CONSOLE_FALLBACK_PATH = '/workspace';

const navItems: NavItem[] = [
  { key: 'home', label: '首页', to: '/' },
  { key: 'market', label: '接口市场', to: '/apilist' },
  { key: 'links', label: '友情链接', to: '/links' },
  { key: 'donate', label: '赞赏支持', to: '/donate' },
  { key: 'opensource', label: '开源地址', to: '', href: 'https://github.com/LoveNanFeng/NanFengAPI', external: true },
];
const mobileNavItems = computed(() =>
  navItems,
);

const accessStore = useAccessStore();
const userStore = useUserStore();
const siteBrand = useSiteBrand();
const { activeTheme, setSiteTheme, siteThemeVars, themeOptions } =
  usePublicSiteTheme();

const siteName = computed(() => siteBrand.siteName || 'NanFengAPI');
const siteLogoUrl = computed(() => siteBrand.logoUrl || '');
const isSignedIn = computed(() => Boolean(accessStore.accessToken));
const headerRef = ref<HTMLElement | null>(null);
const isMobileMenuOpen = ref(false);
const isThemeMenuOpen = ref(false);
const themeSwitcherRef = ref<HTMLElement | null>(null);
const consolePath = computed(() => {
  const homePath = String(userStore.userInfo?.homePath || CONSOLE_FALLBACK_PATH).trim();
  return homePath || CONSOLE_FALLBACK_PATH;
});

function toggleThemeMenu() {
  isThemeMenuOpen.value = !isThemeMenuOpen.value;
}

function handleThemeSelect(themeKey: string) {
  setSiteTheme(themeKey);
  isThemeMenuOpen.value = false;
}

function toggleMobileMenu() {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
  isThemeMenuOpen.value = false;
}

function closeMobileMenu() {
  isMobileMenuOpen.value = false;
  isThemeMenuOpen.value = false;
}

function handleOutsidePointerDown(event: PointerEvent) {
  const target = event.target as Node;

  if (!themeSwitcherRef.value?.contains(target)) {
    isThemeMenuOpen.value = false;
  }

  if (window.innerWidth <= 720 && !headerRef.value?.contains(target)) {
    isMobileMenuOpen.value = false;
  }
}

function handleWindowResize() {
  if (window.innerWidth > 720) {
    isMobileMenuOpen.value = false;
    isThemeMenuOpen.value = false;
  }
}

onMounted(() => {
  document.addEventListener('pointerdown', handleOutsidePointerDown);
  window.addEventListener('resize', handleWindowResize);
});

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handleOutsidePointerDown);
  window.removeEventListener('resize', handleWindowResize);
});
</script>

<template>
  <header ref="headerRef" class="site-public-header" :style="siteThemeVars">
    <RouterLink class="public-brand" to="/">
      <img v-if="siteLogoUrl" class="public-brand-logo" :alt="siteName" :src="siteLogoUrl" />
      <span v-else class="public-brand-mark" aria-hidden="true"></span>
      <span>{{ siteName }}</span>
    </RouterLink>

    <nav class="site-nav" aria-label="站点导航">
      <template v-for="item in navItems" :key="item.key">
        <a
          v-if="item.external"
          :class="{ active: props.activeKey === item.key }"
          :href="item.href"
          rel="noopener noreferrer"
          target="_blank"
        >{{ item.label }}</a>
        <RouterLink
          v-else
          :class="{ active: props.activeKey === item.key }"
          :to="item.to"
        >{{ item.label }}</RouterLink>
      </template>
    </nav>

    <div class="site-actions">
      <div
        ref="themeSwitcherRef"
        class="theme-switcher"
        :class="{ open: isThemeMenuOpen }"
        aria-label="站点主题色"
      >
        <button
          class="theme-toggle"
          :aria-expanded="isThemeMenuOpen"
          :aria-label="`当前主题色：${activeTheme.name}`"
          type="button"
          @click="toggleThemeMenu"
        >
          <span :style="{ '--theme-color': activeTheme.color }">
            <IconifyIcon icon="lucide:check" />
          </span>
          <IconifyIcon icon="lucide:chevron-down" />
        </button>

        <div class="theme-options">
          <button
            v-for="item in themeOptions"
            :key="item.key"
            :aria-label="item.name"
            :class="{ active: item.key === activeTheme.key }"
            :style="{ '--theme-color': item.color }"
            type="button"
            @click="handleThemeSelect(item.key)"
          >
            <IconifyIcon v-if="item.key === activeTheme.key" icon="lucide:check" />
          </button>
        </div>
      </div>

      <RouterLink v-if="isSignedIn" class="console-link" :to="consolePath">
        <span class="console-label-full">前往控制台</span>
        <span class="console-label-short">控制台</span>
      </RouterLink>
      <template v-else>
        <RouterLink class="login-link" :to="LOGIN_PATH">登录</RouterLink>
        <RouterLink class="register-link" :to="REGISTER_PATH">注册</RouterLink>
      </template>
    </div>

    <button
      class="mobile-menu-toggle"
      :aria-expanded="isMobileMenuOpen"
      :aria-label="isMobileMenuOpen ? '关闭站点导航' : '打开站点导航'"
      type="button"
      @click="toggleMobileMenu"
    >
      <IconifyIcon :icon="isMobileMenuOpen ? 'lucide:x' : 'lucide:menu'" />
    </button>

    <div class="mobile-menu-panel" :class="{ open: isMobileMenuOpen }">
      <nav class="mobile-site-nav" aria-label="移动端站点导航">
        <template v-for="item in mobileNavItems" :key="item.key">
          <a
            v-if="item.external"
            :class="{ active: props.activeKey === item.key }"
            :href="item.href"
            rel="noopener noreferrer"
            target="_blank"
            @click="closeMobileMenu"
          >{{ item.label }}</a>
          <RouterLink
            v-else
            :class="{ active: props.activeKey === item.key }"
            :to="item.to"
            @click="closeMobileMenu"
          >{{ item.label }}</RouterLink>
        </template>
      </nav>

      <div class="mobile-menu-actions">
        <RouterLink
          v-if="isSignedIn"
          class="console-link"
          :to="consolePath"
          @click="closeMobileMenu"
        >
          控制台
        </RouterLink>
        <template v-else>
          <RouterLink class="login-link" :to="LOGIN_PATH" @click="closeMobileMenu">
            登录
          </RouterLink>
          <RouterLink class="register-link" :to="REGISTER_PATH" @click="closeMobileMenu">
            注册
          </RouterLink>
        </template>
      </div>
    </div>
  </header>
</template>

<style scoped>
.site-public-header {
  --home-accent: #4f46e5;
  --home-primary: #2563eb;
  --home-primary-rgb: 37 99 235;
  --home-soft: #eff6ff;

  position: fixed;
  z-index: 50;
  top: 0;
  font-family:
    'HarmonyOS Sans SC', 'MiSans', 'Microsoft YaHei UI', 'PingFang SC',
    sans-serif;
  font-size: 15px;
  font-weight: 400;
  line-height: 1.5;
  color: #0f172a;
  right: 0;
  left: 0;
  display: grid;
  height: 72px;
  grid-template-columns: 260px 1fr auto;
  align-items: center;
  gap: 28px;
  border-bottom: 1px solid #e2e8f0;
  background: rgb(255 255 255 / 92%);
  padding: 0 clamp(24px, 4vw, 64px);
  backdrop-filter: blur(18px);
}

.public-brand,
.site-nav,
.site-actions {
  display: flex;
  align-items: center;
}

.mobile-menu-toggle,
.mobile-menu-panel {
  display: none;
}

.public-brand {
  min-width: 0;
  gap: 12px;
  color: #0f172a;
  font-size: 22px;
  font-weight: 900;
  text-decoration: none;
}

.public-brand-logo {
  width: 56px;
  height: 48px;
  flex: 0 0 auto;
  border-radius: 10px;
  object-fit: contain;
}

.public-brand > span:last-child {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.public-brand-mark {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 40px;
}

.public-brand-mark::before {
  position: absolute;
  inset: 0;
  border-radius: 12px;
  background: linear-gradient(
    145deg,
    #22d3ee 0%,
    var(--home-primary) 58%,
    var(--home-accent) 100%
  );
  clip-path: polygon(46% 3%, 60% 3%, 100% 96%, 75% 96%, 51% 43%, 26% 96%, 0 96%);
  content: '';
}

.public-brand-mark::after {
  position: absolute;
  left: 17px;
  bottom: 5px;
  width: 11px;
  height: 12px;
  background: rgb(255 255 255 / 88%);
  clip-path: polygon(50% 0, 100% 100%, 0 100%);
  content: '';
}

.site-nav {
  justify-content: center;
  gap: clamp(18px, 3vw, 42px);
}

.site-nav a {
  position: relative;
  color: #334155;
  font-size: 15px;
  font-weight: 800;
  text-decoration: none;
}

.site-nav a.active,
.site-nav a:hover {
  color: var(--home-primary);
}

.site-nav a.active::after,
.site-nav a:hover::after {
  position: absolute;
  right: 0;
  bottom: -25px;
  left: 0;
  height: 3px;
  border-radius: 999px;
  background: var(--home-primary);
  content: '';
}

.site-actions {
  align-items: center;
  gap: 12px;
}

.theme-switcher {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  background: rgb(15 23 42 / 4%);
  padding: 7px 9px;
}

.theme-toggle {
  display: none;
  align-items: center;
  gap: 4px;
  border: 0;
  background: transparent;
  color: #475569;
  cursor: pointer;
  padding: 0;
}

.theme-toggle span,
.theme-options button {
  display: grid;
  width: 22px;
  height: 22px;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: var(--theme-color);
  color: #fff;
  font-size: 13px;
  padding: 0;
}

.theme-toggle span {
  box-shadow:
    0 0 0 3px #fff,
    0 0 0 5px rgb(var(--home-primary-rgb) / 22%);
}

.theme-toggle > svg {
  font-size: 14px;
  transition: transform 0.2s ease;
}

.theme-switcher.open .theme-toggle > svg {
  transform: rotate(180deg);
}

.theme-options {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.theme-options button {
  cursor: pointer;
}

.theme-options button.active {
  box-shadow:
    0 0 0 3px #fff,
    0 0 0 5px rgb(var(--home-primary-rgb) / 22%);
  animation: theme-pulse 2.4s ease-in-out infinite;
}

.login-link,
.register-link,
.console-link {
  display: inline-flex;
  min-width: 86px;
  height: 42px;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 850;
  text-decoration: none;
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.login-link {
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #0f172a;
}

.register-link,
.console-link {
  border: 1px solid var(--home-primary);
  background: var(--home-primary);
  color: #fff;
  box-shadow: 0 14px 28px rgb(var(--home-primary-rgb) / 18%);
}

.login-link:hover,
.register-link:hover,
.console-link:hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 30px rgb(var(--home-primary-rgb) / 16%);
}

.console-label-short {
  display: none;
}

@keyframes theme-pulse {
  0%,
  100% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.08);
  }
}

@media (prefers-reduced-motion: reduce) {
  .site-public-header,
  .theme-options button.active {
    transition-duration: 0.001ms !important;
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
  }
}

@media (max-width: 1280px) {
  .site-public-header {
    grid-template-columns: 220px 1fr auto;
  }
}

@media (max-width: 960px) {
  .site-public-header {
    height: auto;
    grid-template-columns: 1fr auto;
    gap: 16px;
    padding: 16px 20px;
  }

  .site-nav {
    display: none;
  }
}

@media (max-width: 720px) {
  .site-public-header {
    grid-template-columns: minmax(0, 1fr) auto auto;
    gap: 10px;
    padding: 14px 16px;
  }

  .public-brand {
    gap: 10px;
  }

  .public-brand-logo {
    width: 48px;
    height: 42px;
  }

  .site-actions {
    display: flex;
    gap: 0;
  }

  .site-actions .login-link,
  .site-actions .register-link,
  .site-actions .console-link {
    display: none;
  }

  .theme-switcher {
    position: relative;
    background: transparent;
    padding: 0;
  }

  .theme-toggle {
    display: inline-flex;
    width: 48px;
    height: 44px;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    background: transparent;
    box-shadow: none;
  }

  .theme-toggle span {
    box-shadow:
      0 0 0 3px #fff,
      0 0 0 6px rgb(var(--home-primary-rgb) / 18%);
    animation: theme-pulse 2.4s ease-in-out infinite;
  }

  .theme-options {
    position: absolute;
    z-index: 2;
    top: calc(100% + 10px);
    right: 0;
    gap: 10px;
    border: 1px solid #e2e8f0;
    border-radius: 999px;
    background: #fff;
    box-shadow: 0 16px 36px rgb(15 23 42 / 10%);
    opacity: 0;
    padding: 10px;
    pointer-events: none;
    transform: translateY(-6px);
    transition:
      opacity 0.18s ease,
      transform 0.18s ease;
  }

  .theme-switcher.open .theme-options {
    opacity: 1;
    pointer-events: auto;
    transform: translateY(0);
  }

  .mobile-menu-toggle {
    display: grid;
    width: 44px;
    height: 44px;
    place-items: center;
    border: 0;
    border-radius: 10px;
    background: transparent;
    color: #475569;
    font-size: 25px;
  }

  .mobile-menu-panel {
    position: absolute;
    top: 100%;
    right: 0;
    left: 0;
    display: grid;
    gap: 18px;
    overflow: hidden;
    max-height: 0;
    border-bottom: 1px solid #e2e8f0;
    background: rgb(255 255 255 / 98%);
    opacity: 0;
    padding: 0 18px;
    pointer-events: none;
    transform: translateY(-8px);
    transition:
      max-height 0.24s ease,
      opacity 0.18s ease,
      padding 0.24s ease,
      transform 0.18s ease;
    backdrop-filter: blur(18px);
  }

  .mobile-menu-panel.open {
    max-height: 420px;
    opacity: 1;
    padding: 18px;
    pointer-events: auto;
    transform: translateY(0);
  }

  .mobile-site-nav {
    display: grid;
  }

  .mobile-site-nav a {
    position: relative;
    display: block;
    border-bottom: 1px solid #f1f5f9;
    color: #334155;
    font-size: 15px;
    font-weight: 800;
    padding: 14px 0 14px 24px;
    text-decoration: none;
  }

  .mobile-site-nav a::before {
    position: absolute;
    top: 50%;
    left: 0;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #cbd5e1;
    content: '';
    transform: translateY(-50%);
  }

  .mobile-site-nav a.active {
    color: var(--home-primary);
  }

  .mobile-site-nav a.active::before {
    background: var(--home-primary);
  }

  .mobile-menu-actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .mobile-menu-actions .console-link {
    grid-column: 1 / -1;
  }
}

@media (max-width: 560px) {
  .public-brand {
    font-size: 18px;
  }

  .public-brand-logo {
    width: 44px;
    height: 38px;
  }

  .public-brand-mark {
    width: 36px;
    height: 34px;
  }

  .public-brand-mark::after {
    left: 13px;
    bottom: 4px;
    width: 10px;
    height: 11px;
  }

  .mobile-menu-actions .login-link,
  .mobile-menu-actions .register-link,
  .mobile-menu-actions .console-link {
    min-width: 0;
  }
}

@media (max-width: 420px) {
  .public-brand > span:last-child {
    display: none;
  }
}
</style>
