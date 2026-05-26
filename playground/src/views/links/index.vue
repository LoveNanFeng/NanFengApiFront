<script lang="ts" setup>
import type { FriendLinkApi } from '#/api/friend-link';

import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { LOGIN_PATH } from '@vben/constants';
import { IconifyIcon } from '@vben/icons';
import { useAccessStore } from '@vben/stores';

import { Modal, message } from 'ant-design-vue';

import {
  applyFriendLink,
  getFriendLinkApplyStatus,
  getPublicFriendLinkMeta,
  getPublicFriendLinks,
} from '#/api/friend-link';
import PublicSiteFooter from '#/components/public-site-footer.vue';
import PublicSiteHeader from '#/components/public-site-header.vue';
import { usePublicSiteTheme } from '#/composables/use-public-site-theme';

const accessStore = useAccessStore();
const router = useRouter();
const route = useRoute();
const { siteThemeVars } = usePublicSiteTheme();

const links = ref<FriendLinkApi.FriendLinkItem[]>([]);
const meta = ref<FriendLinkApi.PublicMeta>({
  config: {
    applyEnabled: 1,
    applyNotice: '请先在贵站添加本站链接，再提交友链申请。',
  },
  siteInfo: {
    description: '稳定、清晰、可运营的 API 服务平台',
    logoUrl: '',
    siteName: 'NanFengAPI',
    siteUrl: '',
  },
});
const loading = ref(false);
const modalOpen = ref(false);
const submitting = ref(false);
const hasSubmittedApply = ref(false);
const applyForm = reactive<FriendLinkApi.ApplyPayload>({
  backlinkUrl: '',
  description: '',
  logoUrl: '',
  siteName: '',
  siteUrl: '',
});

const isSignedIn = computed(() => Boolean(accessStore.accessToken));
const applyEnabled = computed(() => meta.value.config.applyEnabled === 1);
const footerSiteConfig = computed(() => ({
  description: meta.value.siteInfo.description,
  logoUrl: meta.value.siteInfo.logoUrl,
  siteName: meta.value.siteInfo.siteName,
}));

onMounted(() => {
  loadPageData();
});

async function loadPageData() {
  loading.value = true;
  try {
    const [list, pageMeta] = await Promise.all([
      getPublicFriendLinks(),
      getPublicFriendLinkMeta(),
    ]);
    links.value = list;
    meta.value = pageMeta;
    if (isSignedIn.value) {
      const status = await getFriendLinkApplyStatus();
      hasSubmittedApply.value = status.submitted;
    }
  } finally {
    loading.value = false;
  }
}

function openApplyModal() {
  if (!applyEnabled.value) {
    message.warning('友链申请暂未开放');
    return;
  }
  if (hasSubmittedApply.value) {
    message.warning('您已提交过友链暂时无法提交');
    return;
  }
  if (!isSignedIn.value) {
    message.warning('请先登录后再申请友链');
    router.push({
      path: LOGIN_PATH,
      query: {
        redirect: encodeURIComponent(route.fullPath),
      },
    });
    return;
  }
  modalOpen.value = true;
}

function resetApplyForm() {
  applyForm.backlinkUrl = '';
  applyForm.description = '';
  applyForm.logoUrl = '';
  applyForm.siteName = '';
  applyForm.siteUrl = '';
}

function assertApplyForm() {
  if (!applyForm.siteName.trim()) return '请填写网站名称';
  if (!applyForm.siteUrl.trim()) return '请填写网站地址';
  return '';
}

async function submitApply() {
  const error = assertApplyForm();
  if (error) {
    message.warning(error);
    return;
  }
  submitting.value = true;
  try {
    await applyFriendLink({
      backlinkUrl: applyForm.backlinkUrl.trim(),
      contactEmail: '',
      contactName: '',
      contactQq: '',
      description: applyForm.description?.trim(),
      logoUrl: applyForm.logoUrl?.trim(),
      siteName: applyForm.siteName.trim(),
      siteUrl: applyForm.siteUrl.trim(),
    });
    message.success('友链申请已提交，请等待管理员审核');
    hasSubmittedApply.value = true;
    modalOpen.value = false;
    resetApplyForm();
  } finally {
    submitting.value = false;
  }
}

function firstText(value?: string) {
  return value?.trim()?.slice(0, 1) || '友';
}
</script>

<template>
  <div class="links-page" :style="siteThemeVars">
    <PublicSiteHeader active-key="links" />

    <main>
      <section class="links-hero">
        <div class="links-pill">
          <IconifyIcon icon="lucide:link" />
          友情链接
        </div>
        <h1>友情链接</h1>
        <p>优质 API 站点、开发者资源与合作伙伴展示。</p>
      </section>

      <section class="links-shell">
        <div class="links-main-card">
          <div class="links-card-head">
            <div>
              <span>LINKS</span>
              <h2>友链列表</h2>
            </div>
            <em>{{ links.length }} 个</em>
          </div>

          <div v-if="links.length > 0" class="links-grid">
            <a
              v-for="item in links"
              :key="item.id"
              class="link-card"
              :href="item.siteUrl"
              rel="noopener noreferrer"
              target="_blank"
            >
              <img
                v-if="item.logoUrl"
                :alt="item.siteName"
                :src="item.logoUrl"
              />
              <span v-else>{{ firstText(item.siteName) }}</span>
              <div>
                <strong>{{ item.siteName }}</strong>
                <p>{{ item.description || item.siteUrl }}</p>
              </div>
              <IconifyIcon icon="lucide:arrow-up-right" />
            </a>
          </div>

          <div v-else class="links-empty">
            <IconifyIcon icon="lucide:link-2-off" />
            <strong>{{ loading ? '正在加载友链...' : '暂无友链' }}</strong>
            <p>审核通过的友情链接会展示在这里。</p>
          </div>
        </div>

        <div class="links-apply-strip">
          <strong>想和我们交换友情链接？</strong>
          <button
            class="apply-button"
            :class="{ 'apply-button--disabled': !applyEnabled || hasSubmittedApply }"
            type="button"
            @click="openApplyModal"
          >
            <IconifyIcon icon="lucide:plus" />
            {{ hasSubmittedApply ? '您已提交过友链暂时无法提交' : applyEnabled ? '申请友链' : '申请暂未开放' }}
          </button>
        </div>
      </section>
    </main>

    <PublicSiteFooter :site-config="footerSiteConfig" />

    <Modal
      v-model:open="modalOpen"
      title="申请友情链接"
      ok-text="提交申请"
      :confirm-loading="submitting"
      @ok="submitApply"
    >
      <div class="apply-form">
        <label>
          <span>网站名称 <b>*</b></span>
          <input v-model="applyForm.siteName" maxlength="80" placeholder="请输入您的网站名称" />
        </label>
        <label>
          <span>网站地址 <b>*</b></span>
          <input v-model="applyForm.siteUrl" placeholder="https://example.com" />
        </label>
        <label class="apply-form__full">
          <span>网站 Logo</span>
          <input v-model="applyForm.logoUrl" placeholder="https://example.com/logo.png 或 /favicon.ico" />
        </label>
        <label class="apply-form__full">
          <span>网站描述</span>
          <textarea
            v-model="applyForm.description"
            maxlength="200"
            placeholder="简单介绍一下您的网站"
            rows="3"
          ></textarea>
        </label>
        <label class="apply-form__full">
          <span>已放置我方链接的页面</span>
          <input v-model="applyForm.backlinkUrl" placeholder="填写贵站已添加本站链接的页面地址（可选）" />
        </label>
      </div>
    </Modal>
  </div>
</template>

<style scoped>
.links-page {
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

.links-page main {
  flex: 1 0 auto;
  padding-bottom: 42px;
}

.links-hero {
  display: grid;
  min-height: 220px;
  place-items: center;
  text-align: center;
  padding-top: 10px;
}

.links-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1px solid rgb(var(--home-primary-rgb) / 14%);
  border-radius: 999px;
  background: rgb(var(--home-primary-rgb) / 8%);
  color: var(--home-primary);
  font-size: 12px;
  font-weight: 900;
  padding: 7px 12px;
}

.links-hero h1 {
  margin: 18px 0 10px;
  font-size: clamp(30px, 4vw, 44px);
  font-weight: 950;
  letter-spacing: 0;
}

.links-hero p {
  margin: 0;
  color: #64748b;
  font-size: 15px;
  font-weight: 700;
}

.links-shell {
  display: flex;
  width: min(1180px, calc(100% - 80px));
  flex-direction: column;
  gap: 24px;
  margin: 0 auto;
}

.links-main-card,
.links-apply-strip {
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: rgb(255 255 255 / 86%);
  box-shadow: 0 16px 42px rgb(15 23 42 / 6%);
  backdrop-filter: blur(12px);
}

.links-main-card {
  padding: 22px 24px 24px;
}

.links-card-head,
.apply-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.links-card-head span {
  display: block;
  color: var(--home-primary);
  font-size: 12px;
  font-weight: 950;
  letter-spacing: 0.12em;
}

.links-card-head h2,
.apply-title h2 {
  margin: 6px 0 0;
  font-size: 21px;
  font-weight: 950;
}

.links-card-head em {
  border-radius: 999px;
  background: #f1f5f9;
  color: #334155;
  font-size: 13px;
  font-style: normal;
  font-weight: 900;
  padding: 6px 12px;
}

.links-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 12px;
  margin-top: 18px;
}

.link-card {
  display: grid;
  min-height: 76px;
  grid-template-columns: 44px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: rgb(255 255 255 / 94%);
  color: inherit;
  padding: 12px 14px;
  text-decoration: none;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.link-card:hover {
  border-color: rgb(var(--home-primary-rgb) / 26%);
  box-shadow: 0 12px 28px rgb(var(--home-primary-rgb) / 10%);
  transform: translateY(-2px);
}

.link-card img,
.link-card > span {
  display: grid;
  width: 44px;
  height: 44px;
  place-items: center;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #f1f5f9;
  color: var(--home-primary);
  font-size: 20px;
  font-weight: 950;
  object-fit: cover;
}

.link-card strong {
  display: block;
  font-size: 14px;
  font-weight: 950;
}

.link-card p {
  overflow: hidden;
  margin: 4px 0 0;
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.link-card svg {
  color: #94a3b8;
  font-size: 16px;
}

.links-empty {
  display: grid;
  min-height: 180px;
  place-items: center;
  align-content: center;
  gap: 10px;
  color: #64748b;
  text-align: center;
}

.links-empty svg {
  color: var(--home-primary);
  font-size: 30px;
}

.links-empty strong {
  color: #0f172a;
  font-size: 16px;
}

.links-apply-strip {
  display: flex;
  min-height: 82px;
  align-items: center;
  justify-content: center;
  gap: 18px;
  padding: 18px 22px;
}

.links-apply-strip strong {
  font-size: 16px;
  font-weight: 950;
}

.apply-button {
  display: inline-flex;
  height: 40px;
  align-items: center;
  justify-content: center;
  gap: 9px;
  border: 0;
  border-radius: 10px;
  background: var(--home-primary);
  color: #fff;
  cursor: pointer;
  font-weight: 950;
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
  font-size: 13px;
  padding: 0 20px;
}

.apply-button:not(.apply-button--disabled):hover {
  transform: translateY(-1px);
}

.apply-button--disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.apply-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.apply-form label {
  display: grid;
  gap: 8px;
}

.apply-form__full {
  grid-column: 1 / -1;
}

.apply-form span {
  color: #475569;
  font-weight: 800;
}

.apply-form b {
  color: #ef4444;
}

.apply-form input,
.apply-form textarea {
  width: 100%;
  border: 1px solid #dbe3ef;
  border-radius: 8px;
  outline: none;
  padding: 10px 12px;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.apply-form textarea {
  resize: vertical;
}

.apply-form input:focus,
.apply-form textarea:focus {
  border-color: var(--home-primary);
  box-shadow: 0 0 0 3px rgb(var(--home-primary-rgb) / 12%);
}

@media (max-width: 1100px) {
  .links-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .links-page main {
    padding-bottom: 32px;
  }

  .links-hero {
    min-height: 240px;
    padding: 0 18px;
  }

  .links-shell {
    width: min(100% - 28px, 760px);
  }

  .links-main-card,
  .links-apply-strip {
    border-radius: 16px;
    padding: 18px;
  }

  .links-grid,
  .apply-form {
    grid-template-columns: 1fr;
  }

  .links-apply-strip {
    align-items: stretch;
    flex-direction: column;
    text-align: center;
  }

  .link-card {
    grid-template-columns: 48px minmax(0, 1fr);
  }

  .link-card svg {
    display: none;
  }

  .link-card img,
  .link-card > span {
    width: 48px;
    height: 48px;
  }
}
</style>
