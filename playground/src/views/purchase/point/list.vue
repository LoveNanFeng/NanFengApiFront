<script lang="ts" setup>
import type { PackageApi } from '#/api/package';

import { onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Button, Empty, Pagination, Spin } from 'ant-design-vue';

import { getMallPointPackageList } from '#/api/package';
import { $t } from '#/locales';

import PackagePayModal from '../components/package-pay-modal.vue';

const loading = ref(false);
const payModalRef = ref<InstanceType<typeof PackagePayModal>>();
const packages = ref<PackageApi.MallPointPackage[]>([]);
const pagination = reactive({
  current: 1,
  pageSize: 12,
  total: 0,
});

async function queryPackages(page = 1) {
  loading.value = true;
  try {
    const result = await getMallPointPackageList({
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

function pointText(value: number | string) {
  const points = Number(value ?? 0);
  return $t('system.package.pointAmountText', [
    Number.isFinite(points) ? points.toLocaleString('zh-CN') : '0',
  ]);
}

function packageTip(item: PackageApi.MallPointPackage) {
  return item.remark?.trim() || $t('system.package.pointPackageTip');
}

function onBuy(item: PackageApi.MallPointPackage) {
  payModalRef.value?.open({
    description: packageTip(item),
    id: item.id,
    price: item.price,
    subtitle: pointText(item.pointAmount),
    title: item.name,
    type: 'POINT',
  });
}

function onPurchaseSuccess() {
  queryPackages(pagination.current);
}

onMounted(() => {
  queryPackages();
});
</script>

<template>
  <Page auto-content-height content-class="purchase-page">
    <PackagePayModal ref="payModalRef" @success="onPurchaseSuccess" />
    <Spin :spinning="loading">
      <div v-if="packages.length > 0" class="package-card-grid">
        <article
          v-for="item in packages"
          :key="item.id"
          class="package-card package-card--point"
        >
          <div class="package-card__top">
            <div class="package-card__title-wrap">
              <div class="package-card__icon">
                <IconifyIcon class="size-8" icon="lucide:coins" />
              </div>
              <div class="package-card__title">
                <span>{{ $t('system.package.pointBenefit') }}</span>
                <h3>{{ item.name }}</h3>
              </div>
            </div>
            <span class="package-card__badge">
              {{ $t('system.package.buyPointTitle') }}
            </span>
          </div>

          <p class="package-card__desc">{{ packageTip(item) }}</p>

          <div class="package-card__price">
            <span>{{ $t('system.package.lowestPrice') }}</span>
            <strong><small>&yen;</small>{{ moneyText(item.price) }}</strong>
          </div>

          <div class="package-card__limits">
            <div class="package-card__limit package-card__limit--primary">
              <IconifyIcon class="size-5" icon="lucide:gem" />
              <span>{{ $t('system.package.pointQuota') }}</span>
              <strong>{{ pointText(item.pointAmount) }}</strong>
            </div>
            <div class="package-card__limit">
              <IconifyIcon class="size-5" icon="lucide:sparkles" />
              <span>{{ $t('system.package.coverage') }}</span>
              <strong>{{ $t('system.package.pointsUsableScope') }}</strong>
            </div>
          </div>

          <div class="package-card__actions">
            <Button
              type="primary"
              @click="onBuy(item)"
            >
              {{ $t('system.package.buyNow') }}
            </Button>
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
  position: relative;
  display: flex;
  min-height: 282px;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
  background:
    linear-gradient(180deg, hsl(var(--background)), hsl(var(--background))),
    radial-gradient(circle at 92% 0%, hsl(var(--primary) / 10%), transparent 34%);
  box-shadow: 0 8px 24px hsl(var(--foreground) / 4%);
  padding: 18px;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.package-card:hover {
  border-color: hsl(var(--primary) / 48%);
  box-shadow: 0 14px 32px hsl(var(--foreground) / 8%);
  transform: translateY(-2px);
}

.package-card__top {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.package-card__title-wrap {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 12px;
}

.package-card__icon {
  display: flex;
  width: 58px;
  height: 58px;
  flex: 0 0 58px;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
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

.package-card__badge {
  flex: 0 0 auto;
  border-radius: 6px;
  background: #eef6ff;
  color: hsl(var(--primary));
  font-size: 12px;
  font-weight: 700;
  line-height: 28px;
  padding: 0 10px;
}

.package-card__desc {
  position: relative;
  z-index: 1;
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

.package-card__price {
  position: relative;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 6px;
  margin-top: 16px;
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

.package-card__limits {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 8px;
  margin-top: 14px;
}

.package-card__limit {
  display: grid;
  min-height: 54px;
  grid-template-columns: 20px minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
  background: hsl(var(--muted) / 38%);
  color: hsl(var(--muted-foreground));
  padding: 10px;
}

.package-card__limit--primary {
  background: hsl(var(--primary) / 6%);
}

.package-card__limit :deep(svg) {
  grid-row: 1 / 3;
  color: hsl(var(--primary));
}

.package-card__limit span {
  display: block;
  grid-column: 2;
  font-size: 12px;
  line-height: 16px;
}

.package-card__limit strong {
  display: block;
  grid-column: 2;
  min-width: 0;
  overflow: hidden;
  color: hsl(var(--foreground));
  font-size: 13px;
  font-weight: 800;
  line-height: 18px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.package-card__actions {
  position: relative;
  z-index: 1;
  display: flex;
  gap: 10px;
  margin-top: auto;
  padding-top: 16px;
}

.package-card__actions :deep(.ant-btn) {
  min-width: 96px;
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
