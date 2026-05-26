<script lang="ts" setup>
import { ref } from 'vue';

import { IconifyIcon } from '@vben/icons';

import PublicSiteFooter from '#/components/public-site-footer.vue';
import PublicSiteHeader from '#/components/public-site-header.vue';
import { usePublicSiteTheme } from '#/composables/use-public-site-theme';
import { useSiteBrand } from '#/site-brand';

const { siteThemeVars } = usePublicSiteTheme();
const siteBrand = useSiteBrand();

const footerSiteConfig = ref({
  description: '',
  logoUrl: siteBrand.logoUrl || '',
  siteName: siteBrand.siteName || 'NanFengAPI',
});

const preview = ref<{ name: string; qrcode: string; tip: string } | null>(null);

function openPreview(m: (typeof methods)[number]) {
  preview.value = { name: m.name, qrcode: m.qrcode, tip: m.tip };
}

function closePreview() {
  preview.value = null;
}

const methods = [
  {
    key: 'wechat',
    name: '微信支付',
    icon: 'lucide:message-circle',
    color: '#07c160',
    qrcode: '/wx.jpg',
    tip: '打开微信扫一扫',
  },
  {
    key: 'alipay',
    name: '支付宝',
    icon: 'lucide:circle-dollar-sign',
    color: '#1677ff',
    qrcode: '/zfb.jpg',
    tip: '打开支付宝扫一扫',
  },
];
</script>

<template>
  <div class="donate-page" :style="siteThemeVars">
    <PublicSiteHeader active-key="donate" />

    <main>
      <section class="donate-hero">
        <div class="donate-pill">
          <IconifyIcon icon="lucide:heart" />
          赞赏支持
        </div>
        <h1>赞赏支持</h1>
        <p>如果我们的服务对您有帮助，欢迎赞赏支持，您的每一份心意都是我们前进的动力。</p>
      </section>

      <section class="donate-shell">
        <div class="donate-card">
          <div class="donate-card-head">
            <div>
              <span>DONATE</span>
              <h2>扫码赞赏</h2>
            </div>
            <p class="donate-card-sub">选择您习惯的支付方式扫码赞赏</p>
          </div>

          <div class="donate-grid">
            <div
              v-for="m in methods"
              :key="m.key"
              class="donate-method"
            >
              <div class="donate-method-header">
                <span
                  class="donate-method-badge"
                  :style="{ background: m.color + '18', color: m.color }"
                >
                  <IconifyIcon :icon="m.icon" />
                  {{ m.name }}
                </span>
              </div>

              <div
                class="donate-qrcode-wrapper"
                role="button"
                :aria-label="'放大查看' + m.name + '收款码'"
                tabindex="0"
                @click="openPreview(m)"
                @keydown.enter="openPreview(m)"
              >
                <img
                  :alt="m.name + '收款码'"
                  :src="m.qrcode"
                  class="donate-qrcode"
                />
                <div class="donate-qrcode-hint">
                  <IconifyIcon icon="lucide:zoom-in" />
                  <span>点击放大</span>
                </div>
              </div>

              <div class="donate-method-footer">
                <IconifyIcon icon="lucide:smartphone" class="donate-scan-icon" />
                <span>{{ m.tip }}</span>
              </div>
            </div>
          </div>

          <div class="donate-thanks">
            <IconifyIcon icon="lucide:sparkles" />
            <span>感谢您的每一份支持！</span>
          </div>
        </div>
      </section>
    </main>

    <Transition name="preview-fade">
      <div
        v-if="preview"
        class="preview-overlay"
        role="dialog"
        aria-modal="true"
        :aria-label="'查看' + preview.name + '收款码'"
        @click.self="closePreview"
      >
        <div class="preview-panel">
          <div class="preview-header">
            <strong>{{ preview.name }} 收款码</strong>
            <button
              class="preview-close"
              type="button"
              aria-label="关闭"
              @click="closePreview"
            >
              <IconifyIcon icon="lucide:x" />
            </button>
          </div>
          <div class="preview-body">
            <img
              :alt="preview.name + '收款码'"
              :src="preview.qrcode"
              class="preview-image"
            />
          </div>
          <div class="preview-footer">
            <IconifyIcon icon="lucide:smartphone" />
            <span>{{ preview.tip }}</span>
          </div>
        </div>
      </div>
    </Transition>

    <PublicSiteFooter :site-config="footerSiteConfig" />
  </div>
</template>

<style scoped>
.donate-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background:
    linear-gradient(rgb(219 234 254 / 36%) 1px, transparent 1px),
    linear-gradient(90deg, rgb(219 234 254 / 36%) 1px, transparent 1px),
    linear-gradient(180deg, #f8fbff 0%, #f5f7fb 100%);
  background-size: 96px 96px, 96px 96px, auto;
  color: #0f172a;
}

.donate-page main {
  flex: 1 0 auto;
  padding-bottom: 42px;
}

.donate-hero {
  display: grid;
  min-height: 200px;
  place-items: center;
  text-align: center;
  padding-top: 10px;
}

.donate-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1px solid rgb(var(--home-primary-rgb) / 14%);
  border-radius: 999px;
  background: rgb(var(--home-primary-rgb) / 8%);
  color: var(--home-primary);
  font-size: 12px;
  font-weight: 900;
  padding: 7px 16px;
}

.donate-hero h1 {
  margin: 18px 0 10px;
  font-size: clamp(30px, 4vw, 44px);
  font-weight: 950;
  letter-spacing: 0;
}

.donate-hero p {
  margin: 0;
  max-width: 500px;
  color: #64748b;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.7;
}

.donate-shell {
  width: min(780px, calc(100% - 80px));
  margin: 0 auto;
}

.donate-card {
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: rgb(255 255 255 / 86%);
  box-shadow: 0 16px 42px rgb(15 23 42 / 6%);
  backdrop-filter: blur(12px);
  padding: 28px 32px 32px;
}

.donate-card-head {
  margin-bottom: 24px;
  text-align: center;
}

.donate-card-head span {
  display: block;
  color: var(--home-primary);
  font-size: 12px;
  font-weight: 950;
  letter-spacing: 0.12em;
}

.donate-card-head h2 {
  margin: 6px 0 0;
  font-size: 24px;
  font-weight: 950;
}

.donate-card-sub {
  margin: 8px 0 0;
  color: #64748b;
  font-size: 14px;
  font-weight: 700;
}

.donate-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.donate-method {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: rgb(255 255 255 / 72%);
  padding: 20px 18px 18px;
  transition:
    border-color 0.25s ease,
    box-shadow 0.25s ease,
    transform 0.25s ease;
}

.donate-method:hover {
  border-color: rgb(var(--home-primary-rgb) / 20%);
  box-shadow: 0 12px 32px rgb(var(--home-primary-rgb) / 8%);
  transform: translateY(-2px);
}

.donate-method-header {
  display: flex;
  align-items: center;
  justify-content: center;
}

.donate-method-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 900;
  padding: 6px 14px;
}

.donate-qrcode-wrapper {
  position: relative;
  width: 200px;
  height: 200px;
  border: 1px solid #f1f5f9;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 4px 16px rgb(15 23 42 / 5%);
  overflow: hidden;
  padding: 8px;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.donate-qrcode-wrapper:hover {
  border-color: rgb(var(--home-primary-rgb) / 30%);
  box-shadow: 0 8px 24px rgb(var(--home-primary-rgb) / 12%);
}

.donate-qrcode-wrapper:focus-visible {
  outline: 2px solid var(--home-primary);
  outline-offset: 2px;
}

.donate-qrcode {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 8px;
}

.donate-qrcode-hint {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border-radius: 12px;
  background: rgb(15 23 42 / 42%);
  color: #fff;
  font-size: 13px;
  font-weight: 800;
  opacity: 0;
  transition: opacity 0.2s ease;
  pointer-events: none;
}

.donate-qrcode-hint svg {
  font-size: 22px;
}

.donate-qrcode-wrapper:hover .donate-qrcode-hint {
  opacity: 1;
}

.donate-method-footer {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #64748b;
  font-size: 13px;
  font-weight: 700;
}

.donate-scan-icon {
  font-size: 15px;
  color: var(--home-primary);
}

.donate-thanks {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #f1f5f9;
  color: #64748b;
  font-size: 14px;
  font-weight: 800;
}

.donate-thanks svg {
  color: #f59e0b;
  font-size: 16px;
}

/* preview overlay */
.preview-overlay {
  position: fixed;
  z-index: 1000;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgb(15 23 42 / 60%);
  backdrop-filter: blur(8px);
  padding: 24px;
}

.preview-panel {
  display: flex;
  max-width: 420px;
  width: 100%;
  flex-direction: column;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 24px 56px rgb(15 23 42 / 16%);
  overflow: hidden;
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid #f1f5f9;
  padding: 16px 20px;
  font-size: 16px;
  font-weight: 950;
}

.preview-close {
  display: grid;
  width: 36px;
  height: 36px;
  place-items: center;
  border: 0;
  border-radius: 8px;
  background: #f1f5f9;
  color: #475569;
  cursor: pointer;
  font-size: 18px;
  transition:
    background 0.15s ease,
    color 0.15s ease;
}

.preview-close:hover {
  background: #e2e8f0;
  color: #0f172a;
}

.preview-body {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 28px 24px;
  background: #f8fafc;
}

.preview-image {
  width: 100%;
  max-width: 320px;
  height: auto;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 8px 24px rgb(15 23 42 / 8%);
}

.preview-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-top: 1px solid #f1f5f9;
  color: #64748b;
  font-size: 14px;
  font-weight: 700;
  padding: 14px 20px;
}

.preview-footer svg {
  color: var(--home-primary);
  font-size: 16px;
}

.preview-fade-enter-active,
.preview-fade-leave-active {
  transition: opacity 0.2s ease;
}

.preview-fade-enter-from,
.preview-fade-leave-to {
  opacity: 0;
}

.preview-fade-enter-active .preview-panel,
.preview-fade-leave-active .preview-panel {
  transition: transform 0.2s ease;
}

.preview-fade-enter-from .preview-panel,
.preview-fade-leave-to .preview-panel {
  transform: scale(0.94);
}

@media (max-width: 720px) {
  .donate-page main {
    padding-bottom: 32px;
  }

  .donate-hero {
    min-height: 220px;
    padding: 0 18px;
  }

  .donate-shell {
    width: min(100% - 28px, 760px);
  }

  .donate-card {
    border-radius: 16px;
    padding: 18px 16px 22px;
  }

  .donate-grid {
    grid-template-columns: 1fr;
    gap: 14px;
  }

  .donate-qrcode-wrapper {
    width: 180px;
    height: 180px;
  }

  .preview-overlay {
    padding: 16px;
  }

  .preview-panel {
    max-width: 360px;
  }

  .preview-body {
    padding: 20px 16px;
  }

  .preview-image {
    max-width: 260px;
  }
}
</style>
