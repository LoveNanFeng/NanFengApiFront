<script lang="ts" setup>
import type { HomeApi } from '#/api/home';

import { computed } from 'vue';
import { RouterLink } from 'vue-router';

import { LOGIN_PATH } from '@vben/constants';
import { IconifyIcon } from '@vben/icons';
import { useAccessStore, useUserStore } from '@vben/stores';

const API_MARKET_PATH = '/apilist';
const LINKS_PATH = '/links';
const CONSOLE_FALLBACK_PATH = '/workspace';

interface ContactItem {
  icon: string;
  label: string;
  value: string;
}

const props = withDefaults(
  defineProps<{
    siteConfig?: Partial<HomeApi.SiteConfig>;
  }>(),
  {
    siteConfig: () => ({}),
  },
);

const accessStore = useAccessStore();
const userStore = useUserStore();

const siteName = computed(
  () => String(props.siteConfig.siteName || 'NanFengAPI').trim() || 'NanFengAPI',
);
const siteLogoUrl = computed(() => String(props.siteConfig.logoUrl || '').trim());
const siteSlogan = computed(
  () => String(props.siteConfig.slogan || '').trim() || '稳定、清晰、可运营的 API 服务平台',
);
const siteDescription = computed(
  () => String(props.siteConfig.description || '').trim() || '统一管理接口、Key、套餐、计费与调用日志。',
);
const copyrightText = computed(
  () =>
    String(props.siteConfig.copyright || '').trim() ||
    `© 2026 ${siteName.value}. All rights reserved.`,
);
const icpText = computed(() => String(props.siteConfig.icp || '').trim() || 'API Billing Platform');
const contactItems = computed<ContactItem[]>(() =>
  [
    { icon: 'lucide:mail', label: '邮箱', value: String(props.siteConfig.contactEmail || '').trim() },
    { icon: 'lucide:phone', label: '电话', value: String(props.siteConfig.contactPhone || '').trim() },
    { icon: 'lucide:message-circle', label: 'QQ', value: String(props.siteConfig.contactQq || '').trim() },
    { icon: 'lucide:message-square', label: '微信', value: String(props.siteConfig.contactWechat || '').trim() },
    { icon: 'lucide:map-pin', label: '地址', value: String(props.siteConfig.contactAddress || '').trim() },
  ].filter((item) => item.value),
);

const consolePath = computed(() => {
  const homePath = String(userStore.userInfo?.homePath || CONSOLE_FALLBACK_PATH).trim();
  return homePath || CONSOLE_FALLBACK_PATH;
});
const protectedEntryPath = computed(() => (accessStore.accessToken ? consolePath.value : LOGIN_PATH));
</script>

<template>
  <footer class="site-footer">
    <div class="footer-main">
      <div class="footer-brand">
        <RouterLink class="brand" to="/">
          <img v-if="siteLogoUrl" class="brand-logo" :alt="siteName" :src="siteLogoUrl" />
          <span v-else class="brand-mark" aria-hidden="true"></span>
          <span>{{ siteName }}</span>
        </RouterLink>
        <p>{{ siteSlogan }}，{{ siteDescription }}</p>
      </div>

      <nav class="footer-links" aria-label="底部导航">
        <section>
          <h3>产品</h3>
          <RouterLink :to="API_MARKET_PATH">接口市场</RouterLink>
          <RouterLink :to="LINKS_PATH">友情链接</RouterLink>
        </section>
        <section>
          <h3>资源</h3>
          <RouterLink :to="protectedEntryPath">文档中心</RouterLink>
          <RouterLink :to="protectedEntryPath">调用记录</RouterLink>
          <RouterLink :to="protectedEntryPath">接口状态</RouterLink>
        </section>
        <section>
          <h3>支持</h3>
          <RouterLink :to="protectedEntryPath">帮助中心</RouterLink>
          <RouterLink :to="{ path: '/', hash: '#quickstart' }">快速接入</RouterLink>
          <RouterLink :to="consolePath">控制台</RouterLink>
        </section>
        <section>
          <h3>联系我们</h3>
          <div v-if="contactItems.length > 0" class="contact-list">
            <span
              v-for="item in contactItems"
              :key="`${item.label}-${item.value}`"
              :title="`${item.label}：${item.value}`"
            >
              <IconifyIcon :icon="item.icon" />
              <em>{{ item.label }}</em>
              <strong>{{ item.value }}</strong>
            </span>
          </div>
          <p v-else class="contact-empty">后台站点配置中维护联系方式</p>
        </section>
      </nav>
    </div>

    <div class="footer-bottom">
      <span>{{ copyrightText }}</span>
      <span>{{ icpText }}</span>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  position: relative;
  z-index: 1;
  overflow: hidden;
  width: 100%;
  margin-top: 64px;
  border-top: 1px solid rgb(var(--home-primary-rgb) / 10%);
  background:
    radial-gradient(circle at 12% 0%, rgb(var(--home-primary-rgb) / 8%), transparent 28%),
    linear-gradient(180deg, rgb(255 255 255 / 92%), rgb(248 251 255 / 94%));
  color: #64748b;
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 75%);
}

.footer-main {
  display: grid;
  grid-template-columns: minmax(260px, 0.82fr) minmax(0, 1.5fr);
  gap: 44px;
  width: min(1440px, calc(100% - 96px));
  margin: 0 auto;
  padding: 56px 0 44px;
}

.brand {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 12px;
  color: #0f172a;
  font-size: 22px;
  font-weight: 900;
  text-decoration: none;
}

.brand-logo {
  width: 56px;
  height: 48px;
  flex: 0 0 auto;
  border-radius: 10px;
  object-fit: contain;
}

.brand > span:last-child {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.brand-mark {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 40px;
}

.brand-mark::before {
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

.brand-mark::after {
  position: absolute;
  left: 17px;
  bottom: 5px;
  width: 11px;
  height: 12px;
  background: rgb(255 255 255 / 88%);
  clip-path: polygon(50% 0, 100% 100%, 0 100%);
  content: '';
}

.footer-brand p {
  max-width: 430px;
  margin: 16px 0 0;
  color: #64748b;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.8;
}

.footer-links {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 28px;
}

.footer-links section {
  display: grid;
  align-content: start;
  gap: 10px;
}

.footer-links h3 {
  margin: 0 0 4px;
  color: #0f172a;
  font-size: 14px;
  font-weight: 950;
}

.site-footer a {
  color: #64748b;
  font-size: 13px;
  font-weight: 800;
  text-decoration: none;
  transition:
    color 0.2s ease,
    transform 0.2s ease;
}

.site-footer a:hover {
  color: var(--home-primary);
  transform: translateX(3px);
}

.contact-list {
  display: grid;
  gap: 10px;
}

.contact-list span {
  display: grid;
  grid-template-columns: 18px max-content minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  min-width: 0;
  color: #64748b;
  font-size: 13px;
  font-weight: 800;
}

.contact-list svg {
  color: var(--home-primary);
  font-size: 16px;
}

.contact-list em {
  color: #94a3b8;
  font-style: normal;
  white-space: nowrap;
}

.contact-list strong {
  min-width: 0;
  overflow: hidden;
  color: #475569;
  font-weight: 850;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.contact-empty {
  margin: 0;
  color: #94a3b8;
  font-size: 13px;
  font-weight: 800;
  line-height: 1.7;
}

.footer-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  width: min(1440px, calc(100% - 96px));
  margin: 0 auto;
  border-top: 1px solid #e2e8f0;
  color: #94a3b8;
  font-size: 12px;
  font-weight: 800;
  padding: 18px 0;
}

@media (max-width: 960px) {
  .footer-main,
  .footer-bottom {
    width: min(100% - 28px, 760px);
  }

  .footer-main {
    grid-template-columns: 1fr;
    gap: 28px;
    padding: 28px;
  }

  .footer-links {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .footer-bottom {
    align-items: stretch;
    flex-direction: column;
  }
}

@media (max-width: 720px) {
  .site-footer {
    margin-bottom: 0;
    margin-top: 40px;
    background: #fff;
  }

  .footer-main {
    display: block;
    width: min(100% - 36px, 760px);
    padding: 28px 0 22px;
  }

  .footer-brand p {
    margin-top: 12px;
    font-size: 13px;
    line-height: 1.7;
  }

  .footer-links {
    display: none;
  }

  .footer-bottom {
    align-items: center;
    gap: 8px;
    width: min(100% - 36px, 760px);
    padding: 18px 0 22px;
    font-size: 12px;
    text-align: center;
  }

  .footer-bottom span:last-child {
    order: -1;
  }
}

@media (max-width: 560px) {
  .brand {
    font-size: 18px;
  }

  .brand-mark {
    width: 36px;
    height: 34px;
  }

  .brand-mark::after {
    left: 13px;
    bottom: 4px;
    width: 10px;
    height: 11px;
  }
}
</style>
