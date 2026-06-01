<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router';

import { LOGIN_PATH } from '@vben/constants';
import { IconifyIcon } from '@vben/icons';
import { useAccessStore, useUserStore } from '@vben/stores';

import { usePublicSiteTheme } from '#/composables/use-public-site-theme';
import { useSiteBrand } from '#/site-brand';

type PublicNavKey = 'donate' | 'home' | 'links' | 'market' | 'opensource';

interface NavItem {
  external?: boolean;
  href?: string;
  key: PublicNavKey;
  label: string;
  to: string;
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
  {
    key: 'opensource',
    label: '开源地址',
    to: '',
    href: 'https://github.com/LoveNanFeng/NanFengAPI',
    external: true,
  },
];
const mobileNavItems = computed(() => navItems);

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
  const homePath = String(
    userStore.userInfo?.homePath || CONSOLE_FALLBACK_PATH,
  ).trim();
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
      <img
        v-if="siteLogoUrl"
        class="public-brand-logo"
        :alt="siteName"
        :src="siteLogoUrl"
      />
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
          >{{ item.label }}</a
        >
        <RouterLink
          v-else
          :class="{ active: props.activeKey === item.key }"
          :to="item.to"
        >
          {{ item.label }}
        </RouterLink>
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
            <IconifyIcon
              v-if="item.key === activeTheme.key"
              icon="lucide:check"
            />
          </button>
        </div>
      </div>

      <RouterLink v-if="isSignedIn" class="console-link" :to="consolePath">
        <span class="console-label-full">前往控制台</span>
        <span class="console-label-short">控制台</span>
      </RouterLink>
      <template v-else>
        <RouterLink class="login-link" :to="LOGIN_PATH"> 登录 </RouterLink>
        <RouterLink class="register-link" :to="REGISTER_PATH">
          注册
        </RouterLink>
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
            >{{ item.label }}</a
          >
          <RouterLink
            v-else
            :class="{ active: props.activeKey === item.key }"
            :to="item.to"
            @click="closeMobileMenu"
          >
            {{ item.label }}
          </RouterLink>
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
          <RouterLink
            class="login-link"
            :to="LOGIN_PATH"
            @click="closeMobileMenu"
          >
            登录
          </RouterLink>
          <RouterLink
            class="register-link"
            :to="REGISTER_PATH"
            @click="closeMobileMenu"
          >
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
  top: 0;
  right: 0;
  left: 0;
  z-index: 50;
  display: grid;
  grid-template-columns: 260px 1fr auto;
  gap: 28px;
  align-items: center;
  height: 72px;
  padding: 0 clamp(24px, 4vw, 64px);
  font-family:
    'HarmonyOS Sans SC', MiSans, 'Microsoft YaHei UI', 'PingFang SC', sans-serif;
  font-size: 15px;
  font-weight: 400;
  line-height: 1.5;
  color: #0f172a;
  background: rgb(255 255 255 / 92%);
  border-bottom: 1px solid #e2e8f0;
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
  gap: 12px;
  min-width: 0;
  font-size: 22px;
  font-weight: 900;
  color: #0f172a;
  text-decoration: none;
}

.public-brand-logo {
  flex: 0 0 auto;
  width: 56px;
  height: 48px;
  object-fit: contain;
  border-radius: 10px;
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
  content: '';
  background: linear-gradient(
    145deg,
    #22d3ee 0%,
    var(--home-primary) 58%,
    var(--home-accent) 100%
  );
  border-radius: 12px;
  clip-path: polygon(
    46% 3%,
    60% 3%,
    100% 96%,
    75% 96%,
    51% 43%,
    26% 96%,
    0 96%
  );
}

.public-brand-mark::after {
  position: absolute;
  bottom: 5px;
  left: 17px;
  width: 11px;
  height: 12px;
  content: '';
  background: rgb(255 255 255 / 88%);
  clip-path: polygon(50% 0, 100% 100%, 0 100%);
}

.site-nav {
  gap: clamp(18px, 3vw, 42px);
  justify-content: center;
}

.site-nav a {
  position: relative;
  font-size: 15px;
  font-weight: 800;
  color: #334155;
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
  content: '';
  background: var(--home-primary);
  border-radius: 999px;
}

.site-actions {
  gap: 12px;
  align-items: center;
}

.theme-switcher {
  display: inline-flex;
  align-items: center;
  padding: 7px 9px;
  background: rgb(15 23 42 / 4%);
  border-radius: 999px;
}

.theme-toggle {
  display: none;
  gap: 4px;
  align-items: center;
  padding: 0;
  color: #475569;
  cursor: pointer;
  background: transparent;
  border: 0;
}

.theme-toggle span,
.theme-options button {
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  padding: 0;
  font-size: 13px;
  color: #fff;
  background: var(--theme-color);
  border: 0;
  border-radius: 50%;
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
  gap: 8px;
  align-items: center;
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
  align-items: center;
  justify-content: center;
  min-width: 86px;
  height: 42px;
  font-size: 14px;
  font-weight: 850;
  text-decoration: none;
  border-radius: 8px;
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.login-link {
  color: #0f172a;
  background: #fff;
  border: 1px solid #cbd5e1;
}

.register-link,
.console-link {
  color: #fff;
  background: var(--home-primary);
  border: 1px solid var(--home-primary);
  box-shadow: 0 14px 28px rgb(var(--home-primary-rgb) / 18%);
}

.login-link:hover,
.register-link:hover,
.console-link:hover {
  box-shadow: 0 16px 30px rgb(var(--home-primary-rgb) / 16%);
  transform: translateY(-2px);
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
    scroll-behavior: auto !important;
    transition-duration: 0.001ms !important;
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
  }
}

@media (max-width: 1280px) {
  .site-public-header {
    grid-template-columns: 220px 1fr auto;
  }
}

@media (max-width: 960px) {
  .site-public-header {
    grid-template-columns: 1fr auto;
    gap: 16px;
    height: auto;
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
    padding: 0;
    background: transparent;
  }

  .theme-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 44px;
    background: transparent;
    border-radius: 12px;
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
    top: calc(100% + 10px);
    right: 0;
    z-index: 2;
    gap: 10px;
    padding: 10px;
    pointer-events: none;
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 999px;
    box-shadow: 0 16px 36px rgb(15 23 42 / 10%);
    opacity: 0;
    transform: translateY(-6px);
    transition:
      opacity 0.18s ease,
      transform 0.18s ease;
  }

  .theme-switcher.open .theme-options {
    pointer-events: auto;
    opacity: 1;
    transform: translateY(0);
  }

  .mobile-menu-toggle {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    font-size: 25px;
    color: #475569;
    background: transparent;
    border: 0;
    border-radius: 10px;
  }

  .mobile-menu-panel {
    position: absolute;
    top: 100%;
    right: 0;
    left: 0;
    display: grid;
    gap: 18px;
    max-height: 0;
    padding: 0 18px;
    overflow: hidden;
    pointer-events: none;
    background: rgb(255 255 255 / 98%);
    border-bottom: 1px solid #e2e8f0;
    opacity: 0;
    backdrop-filter: blur(18px);
    transform: translateY(-8px);
    transition:
      max-height 0.24s ease,
      opacity 0.18s ease,
      padding 0.24s ease,
      transform 0.18s ease;
  }

  .mobile-menu-panel.open {
    max-height: 420px;
    padding: 18px;
    pointer-events: auto;
    opacity: 1;
    transform: translateY(0);
  }

  .mobile-site-nav {
    display: grid;
  }

  .mobile-site-nav a {
    position: relative;
    display: block;
    padding: 14px 0 14px 24px;
    font-size: 15px;
    font-weight: 800;
    color: #334155;
    text-decoration: none;
    border-bottom: 1px solid #f1f5f9;
  }

  .mobile-site-nav a::before {
    position: absolute;
    top: 50%;
    left: 0;
    width: 6px;
    height: 6px;
    content: '';
    background: #cbd5e1;
    border-radius: 50%;
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
    bottom: 4px;
    left: 13px;
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
