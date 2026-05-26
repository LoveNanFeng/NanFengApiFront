<script lang="ts" setup>
import type { PackageApi } from '#/api/package';

import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Button, Empty, Pagination, Spin, message } from 'ant-design-vue';

import { getMallInterfacePackageList } from '#/api/package';
import { $t } from '#/locales';

const router = useRouter();
const loading = ref(false);
const packages = ref<PackageApi.MallInterfacePackage[]>([]);
const pagination = reactive({
  current: 1,
  pageSize: 12,
  total: 0,
});

async function queryPackages(page = 1) {
  loading.value = true;
  try {
    const result = await getMallInterfacePackageList({
      page,
      pageSize: pagination.pageSize,
    });
    packages.value = result.items;
    pagination.current = page;
    pagination.total = result.total;
  } finally {
    loading.value = false;
  }
}

function onPageChange(page: number, pageSize: number) {
  pagination.pageSize = pageSize;
  queryPackages(page);
}

function goDetail(item: PackageApi.MallInterfacePackage) {
  router.push(`/purchase/interface/detail/${item.id}`);
}

function moneyText(value: number | string) {
  const price = Number(value ?? 0);
  if (!Number.isFinite(price)) {
    return '0';
  }
  return price.toLocaleString('zh-CN', {
    maximumFractionDigits: 4,
    minimumFractionDigits: price % 1 === 0 ? 0 : 2,
  });
}

function primarySpec(item: PackageApi.MallInterfacePackage) {
  return item.specs?.[0];
}

function priceValue(item: PackageApi.MallInterfacePackage) {
  return item.minPrice ?? primarySpec(item)?.price ?? 0;
}

function description(item: PackageApi.MallInterfacePackage) {
  return item.remark || item.interfaceRemark || $t('system.package.interfacePackageTip');
}

function specCountText(item: PackageApi.MallInterfacePackage) {
  return $t('system.package.specCount', [Number(item.specCount ?? item.specs?.length ?? 0)]);
}

function onDocument() {
  message.info($t('system.package.documentNotReady'));
}

onMounted(() => {
  queryPackages();
});
</script>

<template>
  <Page auto-content-height content-class="purchase-page">
    <Spin :spinning="loading">
      <div v-if="packages.length > 0" class="package-card-grid">
        <article
          v-for="item in packages"
          :key="item.id"
          class="package-card package-card--interface"
          role="button"
          tabindex="0"
          @click="goDetail(item)"
          @keydown.enter="goDetail(item)"
        >
          <div class="package-card__top">
            <div v-if="item.avatarUrl" class="package-card__avatar">
              <img :alt="item.interfaceName" :src="item.avatarUrl" />
            </div>
            <div v-else class="package-card__avatar package-card__avatar--empty">
              <IconifyIcon class="size-8" icon="lucide:package-open" />
            </div>
            <div class="package-card__title">
              <span>{{ item.interfaceName }}</span>
              <h3>{{ item.name }}</h3>
            </div>
          </div>

          <p class="package-card__desc">{{ description(item) }}</p>

          <div class="package-card__meta">
            <span>
              <IconifyIcon class="size-4" icon="lucide:layers-3" />
              {{ specCountText(item) }}
            </span>
            <span>{{ $t('system.package.viewQuotaInDetail') }}</span>
          </div>

          <div class="package-card__footer">
            <div class="package-card__price">
              <span>{{ $t('system.package.lowestPrice') }}</span>
              <strong><small>&yen;</small>{{ moneyText(priceValue(item)) }}</strong>
              <span>/ {{ primarySpec(item)?.specName || $t('system.package.monthlyPackage') }}</span>
            </div>

            <div class="package-card__actions">
              <Button type="primary" @click.stop="goDetail(item)">
                {{ $t('system.package.buyNow') }}
              </Button>
              <Button @click.stop="onDocument">
                {{ $t('system.package.apiDocument') }}
              </Button>
            </div>
          </div>
        </article>
      </div>
      <div v-else class="purchase-empty">
        <Empty />
      </div>
    </Spin>

    <div class="purchase-pagination">
      <Pagination
        :current="pagination.current"
        :page-size="pagination.pageSize"
        :page-size-options="['12', '24', '36']"
        show-size-changer
        :total="pagination.total"
        @change="onPageChange"
        @show-size-change="onPageChange"
      />
    </div>
  </Page>
</template>

<style scoped>
.purchase-page {
  min-height: 100%;
}

.package-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 360px));
  align-items: start;
  gap: 16px;
}

.package-card {
  display: flex;
  min-height: 248px;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
  background:
    linear-gradient(180deg, hsl(var(--background)), hsl(var(--background))),
    radial-gradient(circle at 92% 0%, hsl(var(--primary) / 10%), transparent 34%);
  box-shadow: 0 8px 24px hsl(var(--foreground) / 4%);
  padding: 18px;
  text-align: left;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.package-card:hover,
.package-card:focus-visible {
  border-color: hsl(var(--primary) / 50%);
  box-shadow: 0 14px 32px hsl(var(--foreground) / 8%);
  outline: none;
  transform: translateY(-2px);
}

.package-card__top {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 12px;
}

.package-card__avatar {
  display: flex;
  width: 58px;
  height: 58px;
  flex: 0 0 58px;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 8px;
  background: hsl(var(--muted));
}

.package-card__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.package-card__avatar--empty {
  background: hsl(var(--primary) / 8%);
  color: hsl(var(--primary));
}

.package-card__title {
  min-width: 0;
}

.package-card__title span {
  display: block;
  overflow: hidden;
  color: hsl(var(--muted-foreground));
  font-size: 12px;
  font-weight: 600;
  line-height: 17px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.package-card__title h3 {
  overflow: hidden;
  margin: 4px 0 0;
  color: hsl(var(--foreground));
  font-size: 18px;
  font-weight: 800;
  line-height: 26px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.package-card__desc {
  display: -webkit-box;
  min-height: 44px;
  overflow: hidden;
  margin: 16px 0 0;
  color: hsl(var(--muted-foreground));
  font-size: 14px;
  line-height: 22px;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.package-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}

.package-card__meta span {
  display: inline-flex;
  height: 28px;
  align-items: center;
  gap: 5px;
  border-radius: 6px;
  background: hsl(var(--muted) / 72%);
  color: hsl(var(--muted-foreground));
  font-size: 12px;
  line-height: 1;
  padding: 0 10px;
}

.package-card__meta span:first-child {
  background: hsl(var(--primary) / 8%);
  color: hsl(var(--primary));
}

.package-card__footer {
  margin-top: auto;
  padding-top: 18px;
}

.package-card__price {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 6px;
  color: hsl(var(--muted-foreground));
  font-size: 13px;
}

.package-card__price strong {
  color: #f45d66;
  font-size: 26px;
  font-weight: 900;
  line-height: 1;
}

.package-card__price small {
  margin-right: 2px;
  font-size: 15px;
  font-weight: 800;
}

.package-card__actions {
  display: flex;
  gap: 10px;
  padding-top: 14px;
}

.package-card__actions :deep(.ant-btn) {
  min-width: 92px;
  height: 34px;
  border-radius: 6px;
  font-weight: 700;
}

.purchase-empty {
  display: flex;
  min-height: 360px;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: hsl(var(--background));
}

.purchase-pagination {
  display: flex;
  justify-content: flex-end;
  padding: 16px 0 4px;
}

@media (max-width: 768px) {
  .package-card-grid {
    grid-template-columns: 1fr;
  }
}
</style>
