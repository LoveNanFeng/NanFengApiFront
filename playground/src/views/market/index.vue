<script lang="ts" setup>
import type { MarketApi } from '#/api/market';

import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { IconifyIcon } from '@vben/icons';

import { getMarketApis } from '#/api/market';
import PublicSiteFooter from '#/components/public-site-footer.vue';
import PublicSiteHeader from '#/components/public-site-header.vue';
import { usePublicSiteTheme } from '#/composables/use-public-site-theme';

const API_MARKET_PATH = '/apilist';
const route = useRoute();
const router = useRouter();
const { siteThemeVars } = usePublicSiteTheme();

const keyword = ref(queryKeyword(route.query.keyword));
const requestMethod = ref<'' | MarketApi.RequestMethod>('');
const priceType = ref<'' | MarketApi.PriceType>('');
const featuredOnly = ref(false);
const items = ref<MarketApi.ApiItem[]>([]);
const loading = ref(false);
const page = ref(1);
const pageSize = 12;
const total = ref(0);

const canLoadMore = computed(() => items.value.length < total.value);
onMounted(() => {
  void loadApis(true);
});

watch(
  () => route.query.keyword,
  (value) => {
    const nextKeyword = queryKeyword(value);
    if (nextKeyword !== keyword.value) {
      keyword.value = nextKeyword;
      void loadApis(true);
    }
  },
);

watch([requestMethod, priceType, featuredOnly], () => {
  void loadApis(true);
});

async function loadApis(reset = false) {
  if (loading.value) {
    return;
  }
  if (reset) {
    page.value = 1;
    items.value = [];
  }
  loading.value = true;
  try {
    const result = await getMarketApis({
      featuredOnly: featuredOnly.value ? 1 : undefined,
      keyword: keyword.value.trim() || undefined,
      page: page.value,
      pageSize,
      priceType: priceType.value || undefined,
      requestMethod: requestMethod.value || undefined,
    });
    const nextItems = result.items ?? [];
    items.value = reset ? nextItems : [...items.value, ...nextItems];
    total.value = Number(result.total || 0);
  } finally {
    loading.value = false;
  }
}

async function submitSearch() {
  const nextKeyword = keyword.value.trim();
  if (queryKeyword(route.query.keyword) === nextKeyword) {
    await loadApis(true);
    return;
  }
  await router.replace({
    path: API_MARKET_PATH,
    query: nextKeyword ? { keyword: nextKeyword } : {},
  });
}

function clearSearch() {
  keyword.value = '';
  void submitSearch();
}

function loadMore() {
  if (!canLoadMore.value || loading.value) {
    return;
  }
  page.value += 1;
  void loadApis(false);
}

function queryKeyword(value: unknown) {
  const raw = Array.isArray(value) ? value[0] : value;
  return String(raw ?? '').trim();
}

function methodLabel(method: string) {
  return method === 'GET_POST' ? 'GET/POST' : method;
}

function compactNumber(value: number | string | undefined) {
  const number = Number(value || 0);
  if (number >= 10_000) {
    return `${(number / 10_000).toFixed(number >= 100_000 ? 0 : 1)}w`;
  }
  if (number >= 1000) {
    return `${(number / 1000).toFixed(number >= 10_000 ? 0 : 1)}k`;
  }
  return String(number);
}

function priceClass(item: MarketApi.ApiItem) {
  if (Number(item.price || 0) <= 0) {
    return 'free';
  }
  return Number(item.pointPrice || 0) > 0 ? 'point' : 'paid';
}
</script>

<template>
  <main class="market-page" :style="siteThemeVars">
    <PublicSiteHeader active-key="market" />

    <form class="search-box" @submit.prevent="submitSearch">
      <IconifyIcon icon="lucide:search" />
      <input v-model="keyword" placeholder="搜索接口名称或描述" type="search" />
      <button
        v-if="keyword"
        aria-label="清空搜索"
        type="button"
        @click="clearSearch"
      >
        <IconifyIcon icon="lucide:x" />
      </button>
      <button aria-label="搜索接口" class="search-submit" type="submit">
        搜索
      </button>
    </form>

    <section class="market-shell">
      <section class="api-list">
        <div class="list-head">
          <div>
            <span>LIST</span>
            <h2>全部接口</h2>
          </div>
          <small>公开字段不包含第三方地址、接口编码、密钥和请求参数模板</small>
        </div>

        <div v-if="items.length > 0" class="api-grid">
          <RouterLink
            v-for="item in items"
            :key="item.id"
            class="api-card"
            :to="{ name: 'ApiDocs', params: { id: item.id } }"
          >
            <div class="api-card-top">
              <span class="api-icon">
                <img
                  v-if="item.avatarUrl"
                  :alt="item.name"
                  :src="item.avatarUrl"
                />
                <IconifyIcon v-else icon="lucide:boxes" />
              </span>
              <div class="api-tags">
                <span v-if="Number(item.isTop) === 1">置顶</span>
                <span v-if="Number(item.isFeatured) === 1">精选</span>
              </div>
              <span class="method-badge">{{
                methodLabel(item.requestMethod)
              }}</span>
            </div>

            <div class="api-card-body">
              <h3>{{ item.name }}</h3>
              <p>{{ item.description || '暂无接口说明' }}</p>
            </div>

            <div class="api-card-foot">
              <div class="api-meta">
                <em :class="priceClass(item)">{{ item.priceLabel }}</em>
                <span>{{ compactNumber(item.callCount) }} 次调用</span>
              </div>
              <span class="api-card-action">
                查看文档
                <IconifyIcon icon="lucide:arrow-right" />
              </span>
            </div>
          </RouterLink>
        </div>
        <div v-else class="empty-state">
          <IconifyIcon icon="lucide:search-x" />
          <span>{{ loading ? '正在加载接口' : '没有匹配的接口' }}</span>
        </div>

        <button
          v-if="canLoadMore"
          class="load-more"
          :disabled="loading"
          type="button"
          @click="loadMore"
        >
          {{ loading ? '加载中' : '加载更多' }}
        </button>
      </section>
    </section>

    <PublicSiteFooter />
  </main>
</template>

<style scoped>
.market-page {
  --home-accent: #4f46e5;
  --home-primary: #2563eb;
  --home-primary-rgb: 37 99 235;
  --home-soft: #eff6ff;

  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding-top: 72px;
  font-family:
    'HarmonyOS Sans SC', MiSans, 'Microsoft YaHei UI', 'PingFang SC', sans-serif;
  color: #0f172a;
  background:
    linear-gradient(
      90deg,
      rgb(var(--home-primary-rgb) / 5%) 1px,
      transparent 1px
    ),
    linear-gradient(
      180deg,
      rgb(var(--home-primary-rgb) / 5%) 1px,
      transparent 1px
    ),
    #f8fbff;
  background-size: 72px 72px;
}

.search-box,
.api-meta,
.api-tags {
  display: flex;
  align-items: center;
}

.list-head span {
  font-size: 12px;
  font-weight: 950;
  color: var(--home-primary);
  letter-spacing: 0.08em;
}

.api-card-body p,
.list-head small {
  font-size: 14px;
  font-weight: 700;
  line-height: 1.8;
  color: #64748b;
}

.search-box {
  gap: 10px;
  width: min(100% - 40px, 720px);
  min-height: 52px;
  padding: 6px 8px 6px 16px;
  margin: 36px auto 28px;
  background: #fff;
  border: 1px solid rgb(var(--home-primary-rgb) / 20%);
  border-radius: 10px;
  box-shadow: 0 4px 16px rgb(15 23 42 / 5%);
}

.search-box svg {
  flex: 0 0 auto;
  font-size: 20px;
  color: var(--home-primary);
}

.search-box input {
  flex: 1;
  min-width: 0;
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
  outline: none;
  border: 0;
}

.search-box button {
  display: inline-flex;
  flex: 0 0 auto;
  gap: 4px;
  align-items: center;
  justify-content: center;
  height: 38px;
  padding: 0 8px;
  font-size: 13px;
  font-weight: 700;
  color: #94a3b8;
  white-space: nowrap;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 8px;
}

.search-box button.search-submit {
  min-width: 76px;
  padding: 0 20px;
  font-size: 14px;
  color: #fff;
  background: var(--home-primary);
  border: 1px solid var(--home-primary);
}

.load-more {
  width: 100%;
  height: 40px;
  margin-top: 18px;
  font-weight: 850;
  color: #0f172a;
  cursor: pointer;
  background: #fff;
  border: 1px solid #dbe3ef;
  border-radius: 8px;
}

.market-shell {
  flex: 1 0 auto;
  width: min(100% - 40px, 1320px);
  padding-bottom: 56px;
  margin: 0 auto;
}

.api-card,
.empty-state {
  background: rgb(255 255 255 / 94%);
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 18px 42px rgb(15 23 42 / 6%);
}

.list-head {
  display: flex;
  gap: 18px;
  align-items: end;
  justify-content: space-between;
  margin-bottom: 16px;
}

.list-head h2 {
  margin: 6px 0 0;
  font-size: 30px;
  font-weight: 950;
}

.api-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.api-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 18px;
  min-height: 270px;
  padding: 20px;
  overflow: hidden;
  color: inherit;
  text-decoration: none;
  cursor: pointer;
  background:
    linear-gradient(180deg, rgb(255 255 255 / 98%), rgb(255 255 255 / 90%)),
    linear-gradient(135deg, rgb(var(--home-primary-rgb) / 9%), transparent 42%);
  border-color: rgb(var(--home-primary-rgb) / 10%);
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.api-card::before {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  height: 3px;
  content: '';
  background: linear-gradient(
    90deg,
    var(--home-primary),
    rgb(var(--home-primary-rgb) / 8%)
  );
  opacity: 0;
  transition: opacity 0.2s ease;
}

.api-card:hover {
  border-color: rgb(var(--home-primary-rgb) / 38%);
  box-shadow:
    0 24px 56px rgb(var(--home-primary-rgb) / 13%),
    0 8px 22px rgb(15 23 42 / 6%);
  transform: translateY(-2px);
}

.api-card:hover::before {
  opacity: 1;
}

.api-card:focus-visible {
  outline: 3px solid rgb(var(--home-primary-rgb) / 28%);
  outline-offset: 3px;
}

.api-card-top {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 16px;
  align-items: center;
}

.api-icon {
  display: inline-grid;
  flex: 0 0 auto;
  place-items: center;
  width: 58px;
  height: 58px;
  font-size: 27px;
  color: var(--home-primary);
  background:
    linear-gradient(
      145deg,
      rgb(255 255 255 / 80%),
      rgb(var(--home-primary-rgb) / 8%)
    ),
    var(--home-soft);
  border: 1px solid rgb(var(--home-primary-rgb) / 16%);
  border-radius: 12px;
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 88%),
    0 12px 24px rgb(var(--home-primary-rgb) / 8%);
}

.api-icon img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 12px;
}

.method-badge {
  display: inline-flex;
  flex: 0 0 auto;
  grid-column: 3;
  align-items: center;
  justify-content: center;
  justify-self: end;
  width: max-content;
  height: 30px;
  padding: 0 10px;
  font-size: 12px;
  font-weight: 950;
  color: #475569;
  white-space: nowrap;
  background: rgb(248 250 252 / 88%);
  border: 1px solid rgb(var(--home-primary-rgb) / 10%);
  border-radius: 999px;
}

.api-card-body {
  min-width: 0;
}

.api-card-body h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 950;
  line-height: 1.35;
  color: #0f172a;
}

.api-card-body p {
  display: -webkit-box;
  min-height: 52px;
  margin: 12px 0 0;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.api-meta,
.api-tags {
  flex-wrap: wrap;
  gap: 8px;
}

.api-card-foot {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
}

.api-card-action {
  display: inline-flex;
  flex: 0 0 auto;
  gap: 6px;
  align-items: center;
  font-size: 13px;
  font-weight: 950;
  color: var(--home-primary);
}

.api-card-action svg {
  font-size: 15px;
  transition: transform 0.2s ease;
}

.api-card:hover .api-card-action svg {
  transform: translateX(3px);
}

.api-meta em,
.api-meta span,
.api-tags span {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 6px 10px;
  font-size: 12px;
  font-style: normal;
  font-weight: 900;
  border-radius: 8px;
}

.api-meta em.free {
  color: #059669;
  background: #ecfdf5;
}

.api-meta em.point {
  color: #ea580c;
  background: #fff7ed;
}

.api-meta em.paid {
  color: #dc2626;
  background: #fef2f2;
}

.api-meta span,
.api-tags span {
  color: #475569;
  background: #f1f5f9;
}

.api-tags span {
  background: rgb(241 245 249 / 82%);
}

.empty-state {
  display: grid;
  place-items: center;
  min-height: 220px;
  padding: 24px;
  font-weight: 850;
  color: #64748b;
}

.empty-state svg {
  font-size: 34px;
  color: #94a3b8;
}

@media (max-width: 1180px) {
  .api-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .api-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .market-shell,
  .filter-bar {
    width: min(100% - 24px, 1320px);
  }

  .market-page {
    padding-top: 70px;
  }

  .search-box {
    gap: 8px;
    width: min(100% - 24px, 720px);
    min-height: 50px;
    padding: 5px 6px 5px 14px;
    margin: 20px auto;
  }

  .search-box input {
    font-size: 14px;
  }

  .search-box button.search-submit {
    min-width: 66px;
    height: 36px;
    padding: 0 16px;
    font-size: 13px;
  }

  .market-shell {
    padding-bottom: 32px;
  }

  .list-head {
    display: block;
    margin: 0 0 12px;
  }

  .list-head span,
  .list-head small {
    display: none;
  }

  .list-head h2 {
    margin: 0;
    font-size: 20px;
  }

  .api-grid {
    gap: 12px;
  }

  .api-card {
    display: grid;
    grid-template-areas:
      'top body'
      'foot foot';
    grid-template-columns: 48px minmax(0, 1fr);
    gap: 14px;
    min-height: 0;
    padding: 16px;
    border-radius: 12px;
  }

  .api-card::before {
    display: none;
  }

  .api-card-top {
    display: block;
    grid-area: top;
    align-items: start;
  }

  .api-card-top .api-tags {
    display: none;
  }

  .api-icon {
    width: 48px;
    height: 48px;
    font-size: 22px;
    border-radius: 10px;
  }

  .method-badge {
    position: absolute;
    right: 16px;
    bottom: 16px;
    height: 24px;
    padding: 0 8px;
    font-size: 11px;
  }

  .api-card-body {
    grid-area: body;
    padding-right: 0;
  }

  .api-card-body h3 {
    padding-right: 0;
    font-size: 17px;
  }

  .api-card-body p {
    min-height: 0;
    margin-top: 6px;
    font-size: 13px;
    line-height: 1.6;
  }

  .api-card-foot {
    flex-direction: column;
    grid-area: foot;
    gap: 10px;
    align-items: flex-start;
    padding-right: 70px;
    margin-top: 0;
  }

  .api-meta em,
  .api-meta span,
  .api-tags span {
    min-height: 26px;
    padding: 5px 9px;
    font-size: 11px;
    border-radius: 999px;
  }

  .empty-state {
    min-height: 180px;
    border-radius: 12px;
  }
}
</style>
