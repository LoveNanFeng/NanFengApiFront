<script lang="ts" setup>
import type { PackageApi } from '#/api/package';

import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Button, Empty, Spin, message } from 'ant-design-vue';

import {
  getMallInterfacePackageDetail,
} from '#/api/package';
import { $t } from '#/locales';

import PackagePayModal from '../components/package-pay-modal.vue';

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const detail = ref<PackageApi.MallInterfacePackage>();
const selectedSpecId = ref<string>();
const payModalRef = ref<InstanceType<typeof PackagePayModal>>();

const selectedSpec = computed(() => {
  return detail.value?.specs.find((item) => item.id === selectedSpecId.value);
});

const selectedPackageType = computed(() => {
  const specName = selectedSpec.value?.specName?.trim();
  if (specName) {
    return specName;
  }
  return packageTypeText(selectedSpec.value?.validDays);
});

async function loadDetail() {
  const id = String(route.params.id ?? '');
  if (!id) {
    return;
  }
  loading.value = true;
  try {
    const result = await getMallInterfacePackageDetail(id);
    detail.value = result;
    selectedSpecId.value = result.specs?.[0]?.id;
  } finally {
    loading.value = false;
  }
}

function goBack() {
  if (window.history.length > 1) {
    router.back();
    return;
  }
  router.push('/purchase/interface');
}

function selectSpec(spec: PackageApi.MallInterfacePackageSpec) {
  selectedSpecId.value = spec.id;
}

function moneyText(value?: number | string) {
  const price = Number(value ?? 0);
  if (!Number.isFinite(price)) {
    return '0';
  }
  return price.toLocaleString('zh-CN', {
    maximumFractionDigits: 4,
    minimumFractionDigits: price % 1 === 0 ? 0 : 2,
  });
}

function dailyLimitText(value?: number) {
  return Number(value ?? 0) === 0
    ? $t('system.package.dailyUnlimitedCalls')
    : $t('system.package.dailyCallLimit', [
        Number(value).toLocaleString('zh-CN'),
      ]);
}

function qpsLimitText(value?: number) {
  return Number(value ?? 0) === 0
    ? $t('system.package.qpsUnlimited')
    : $t('system.package.qpsLimitText', [Number(value).toLocaleString('zh-CN')]);
}

function validDaysText(value?: number) {
  return $t('system.package.validDaysText', [Number(value ?? 30).toLocaleString('zh-CN')]);
}

function packageTypeText(value?: number) {
  const days = Number(value ?? 30);
  if (days <= 31) {
    return $t('system.package.monthlyPackage');
  }
  if (days <= 93) {
    return $t('system.package.quarterlyPackage');
  }
  if (days <= 186) {
    return $t('system.package.halfYearPackage');
  }
  if (days <= 366) {
    return $t('system.package.yearlyPackage');
  }
  return $t('system.package.customDaysPackage', [days.toLocaleString('zh-CN')]);
}

function description() {
  return (
    detail.value?.remark ||
    detail.value?.interfaceRemark ||
    $t('system.package.interfacePackageTip')
  );
}

function onOrder() {
  if (!detail.value?.id || !selectedSpec.value?.id) {
    message.warning($t('system.package.specRequired'));
    return;
  }
  payModalRef.value?.open({
    description: description(),
    id: detail.value.id,
    interfaceId: detail.value.interfaceId,
    price: selectedSpec.value.price,
    specId: selectedSpec.value.id,
    subtitle: `${detail.value.interfaceName} / ${selectedSpec.value.specName}`,
    title: detail.value.name,
    type: 'INTERFACE',
  });
}

function onPurchaseSuccess() {
  loadDetail();
}

onMounted(() => {
  loadDetail();
});
</script>

<template>
  <Page auto-content-height content-class="package-detail-page">
    <PackagePayModal ref="payModalRef" @success="onPurchaseSuccess" />
    <Spin :spinning="loading">
      <div v-if="detail" class="detail-shell">
        <section class="detail-main">
          <Button class="detail-back" type="link" @click="goBack">
            <IconifyIcon class="size-4" icon="lucide:chevron-left" />
            {{ $t('system.package.back') }}
          </Button>

          <div class="detail-product">
            <div v-if="detail.avatarUrl" class="detail-product__avatar">
              <img :alt="detail.interfaceName" :src="detail.avatarUrl" />
            </div>
            <div
              v-else
              class="detail-product__avatar detail-product__avatar--empty"
            >
              <IconifyIcon class="size-9" icon="lucide:database" />
            </div>

            <div class="detail-product__info">
              <div class="detail-product__tags">
                <span>{{ $t('system.package.buyInterfaceTitle') }}</span>
                <span>{{ detail.interfaceName }}</span>
              </div>
              <h2>{{ detail.name }}</h2>
              <p>{{ description() }}</p>
            </div>
          </div>

          <div class="detail-section">
            <div class="detail-section__title">
              <h3>{{ $t('system.package.selectPackage') }}</h3>
              <span>{{ $t('system.package.viewQuotaInDetail') }}</span>
            </div>

            <div class="spec-grid">
              <button
                v-for="spec in detail.specs"
                :key="spec.id"
                class="spec-card"
                :class="{ 'is-active': selectedSpecId === spec.id }"
                type="button"
                @click="selectSpec(spec)"
              >
                <div class="spec-card__head">
                  <span class="spec-card__name">{{ spec.specName }}</span>
                  <IconifyIcon
                    v-if="selectedSpecId === spec.id"
                    class="size-5"
                    icon="lucide:check-circle-2"
                  />
                </div>
                <strong><small>&yen;</small>{{ moneyText(spec.price) }}</strong>
                <div class="spec-card__meta">
                  <span>{{ validDaysText(spec.validDays) }}</span>
                  <span>{{ dailyLimitText(spec.dailyLimit) }}</span>
                  <span>{{ qpsLimitText(spec.qpsLimit) }}</span>
                </div>
              </button>
            </div>
          </div>

          <div class="detail-section">
            <div class="detail-section__title">
              <h3>{{ $t('system.package.packageDetail') }}</h3>
            </div>

            <div class="detail-info-grid">
              <div class="detail-info-card">
                <IconifyIcon class="size-5" icon="lucide:file-text" />
                <div>
                  <span>{{ $t('system.package.applicableInterface') }}</span>
                  <strong>{{ detail.interfaceName }}</strong>
                </div>
              </div>
              <div class="detail-info-card">
                  <IconifyIcon class="size-5" icon="lucide:calendar-days" />
                <div>
                  <span>{{ $t('system.package.validPeriod') }}</span>
                  <strong>{{ validDaysText(selectedSpec?.validDays) }}</strong>
                </div>
              </div>
              <div class="detail-info-card">
                <IconifyIcon class="size-5" icon="lucide:bar-chart-3" />
                <div>
                  <span>{{ $t('system.package.dailyLimit') }}</span>
                  <strong>{{ dailyLimitText(selectedSpec?.dailyLimit) }}</strong>
                </div>
              </div>
              <div class="detail-info-card">
                <IconifyIcon class="size-5" icon="lucide:gauge" />
                <div>
                  <span>{{ $t('system.package.qpsLimit') }}</span>
                  <strong>{{ qpsLimitText(selectedSpec?.qpsLimit) }}</strong>
                </div>
              </div>
              <div class="detail-info-card">
                <IconifyIcon class="size-5" icon="lucide:layers" />
                <div>
                  <span>{{ $t('system.package.packageType') }}</span>
                  <strong>{{ selectedPackageType }}</strong>
                </div>
              </div>
            </div>
          </div>
        </section>

        <aside class="order-summary">
          <div class="order-summary__head">
            <span>{{ $t('system.package.orderSummary') }}</span>
            <strong><small>&yen;</small>{{ moneyText(selectedSpec?.price) }}</strong>
            <p>{{ detail.interfaceName }} / {{ selectedSpec?.specName || detail.name }}</p>
          </div>

          <div class="coupon-box">
            <span>{{ $t('system.package.couponNotReady') }}</span>
            <p>{{ $t('system.package.couponDescription') }}</p>
          </div>

          <div class="summary-lines">
            <div>
              <span>{{ $t('system.package.packageName') }}</span>
              <strong>{{ selectedSpec?.specName || detail.name }}</strong>
            </div>
            <div>
              <span>{{ $t('system.package.applicableInterface') }}</span>
              <strong>{{ detail.interfaceName }}</strong>
            </div>
            <div>
              <span>{{ $t('system.package.packageOriginalPrice') }}</span>
              <strong>&yen;{{ moneyText(selectedSpec?.price) }}</strong>
            </div>
          </div>

          <div class="summary-total">
            <span>{{ $t('system.package.payAmount') }}</span>
            <strong>&yen;{{ moneyText(selectedSpec?.price) }}</strong>
          </div>

          <Button
            block
            size="large"
            type="primary"
            @click="onOrder"
          >
            {{ $t('system.package.buyNow') }}
          </Button>
        </aside>
      </div>
      <div v-else class="detail-empty">
        <Empty />
      </div>
    </Spin>
  </Page>
</template>

<style scoped>
.package-detail-page {
  min-height: 100%;
}

.detail-shell {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 18px;
}

.detail-main,
.order-summary {
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
  background: hsl(var(--background));
  box-shadow: 0 10px 28px hsl(var(--foreground) / 4%);
}

.detail-main {
  padding: 24px;
}

.detail-back {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 18px;
  padding: 0;
  font-weight: 700;
}

.detail-product {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr);
  align-items: center;
  gap: 18px;
  padding-bottom: 24px;
  border-bottom: 1px solid hsl(var(--border));
}

.detail-product__avatar {
  display: flex;
  width: 72px;
  height: 72px;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 8px;
  background: hsl(var(--muted));
  color: hsl(var(--primary));
}

.detail-product__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.detail-product__avatar--empty {
  background: hsl(var(--primary) / 8%);
}

.detail-product__info {
  min-width: 0;
}

.detail-product__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}

.detail-product__tags span {
  display: inline-flex;
  height: 26px;
  align-items: center;
  border-radius: 6px;
  background: hsl(var(--muted) / 76%);
  color: hsl(var(--muted-foreground));
  font-size: 12px;
  line-height: 1;
  padding: 0 10px;
}

.detail-product__tags span:first-child {
  background: hsl(var(--primary) / 9%);
  color: hsl(var(--primary));
}

.detail-product__info h2 {
  overflow: hidden;
  margin: 0;
  color: hsl(var(--foreground));
  font-size: 24px;
  font-weight: 800;
  line-height: 32px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.detail-product__info p {
  display: -webkit-box;
  max-width: 820px;
  overflow: hidden;
  margin: 8px 0 0;
  color: hsl(var(--muted-foreground));
  font-size: 14px;
  line-height: 22px;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.detail-section {
  margin-top: 24px;
}

.detail-section__title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
}

.detail-section__title h3 {
  margin: 0;
  color: hsl(var(--foreground));
  font-size: 16px;
  font-weight: 800;
}

.detail-section__title span {
  color: hsl(var(--muted-foreground));
  font-size: 12px;
}

.spec-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 280px));
  gap: 12px;
}

.spec-card {
  position: relative;
  display: flex;
  min-height: 126px;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
  background: hsl(var(--background));
  color: hsl(var(--foreground));
  cursor: pointer;
  padding: 16px;
  text-align: left;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.spec-card:hover,
.spec-card.is-active {
  border-color: hsl(var(--primary) / 72%);
  box-shadow: 0 12px 28px hsl(var(--primary) / 10%);
}

.spec-card:hover {
  transform: translateY(-1px);
}

.spec-card.is-active::before {
  position: absolute;
  inset: 0 0 auto;
  height: 3px;
  background: hsl(var(--primary));
  content: '';
}

.spec-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.spec-card__head :deep(svg) {
  color: hsl(var(--primary));
}

.spec-card__name {
  min-width: 0;
  overflow: hidden;
  color: hsl(var(--foreground));
  font-size: 15px;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.spec-card strong {
  color: #f45d66;
  font-size: 24px;
  font-weight: 900;
  line-height: 1;
}

.spec-card small {
  margin-right: 2px;
  font-size: 14px;
}

.spec-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.spec-card__meta span {
  display: inline-flex;
  height: 24px;
  align-items: center;
  border-radius: 6px;
  background: hsl(var(--muted) / 72%);
  color: hsl(var(--muted-foreground));
  font-size: 12px;
  line-height: 1;
  padding: 0 8px;
}

.detail-info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.detail-info-card {
  display: flex;
  min-height: 76px;
  align-items: center;
  gap: 12px;
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
  background: hsl(var(--muted) / 38%);
  padding: 14px;
}

.detail-info-card > svg,
.detail-info-card :deep(svg) {
  flex: 0 0 auto;
  color: hsl(var(--primary));
}

.detail-info-card div {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
}

.detail-info-card span {
  color: hsl(var(--muted-foreground));
  font-size: 12px;
}

.detail-info-card strong {
  overflow: hidden;
  color: hsl(var(--foreground));
  font-size: 14px;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.order-summary {
  align-self: start;
  padding: 22px;
}

.order-summary__head {
  border-bottom: 1px solid hsl(var(--border));
  padding-bottom: 18px;
}

.order-summary__head > span {
  color: hsl(var(--foreground));
  font-size: 16px;
  font-weight: 800;
}

.order-summary__head > strong {
  display: block;
  margin-top: 16px;
  color: hsl(var(--foreground));
  font-size: 30px;
  font-weight: 900;
  line-height: 1;
}

.order-summary__head small {
  margin-right: 4px;
  font-size: 18px;
}

.order-summary__head p {
  overflow: hidden;
  margin: 10px 0 0;
  color: hsl(var(--muted-foreground));
  font-size: 13px;
  line-height: 20px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.coupon-box {
  margin-top: 18px;
  border: 1px solid #fed79a;
  border-radius: 8px;
  background: #fffaf0;
  color: #a66a19;
  padding: 14px;
}

.coupon-box span {
  display: block;
  font-size: 13px;
  font-weight: 800;
}

.coupon-box p {
  margin: 8px 0 0;
  font-size: 12px;
  line-height: 20px;
}

.summary-lines {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 18px;
  border-bottom: 1px solid hsl(var(--border));
  padding-bottom: 18px;
}

.summary-lines div,
.summary-total {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}

.summary-lines span,
.summary-total span {
  color: hsl(var(--muted-foreground));
  font-size: 13px;
}

.summary-lines strong {
  min-width: 0;
  overflow: hidden;
  color: hsl(var(--foreground));
  font-size: 13px;
  font-weight: 800;
  text-align: right;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.summary-total {
  margin: 22px 0 18px;
}

.summary-total strong {
  color: #f45d66;
  font-size: 28px;
  font-weight: 900;
}

.detail-empty {
  display: flex;
  min-height: 360px;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: hsl(var(--background));
}

@media (max-width: 1180px) {
  .detail-shell {
    grid-template-columns: 1fr;
  }

  .order-summary {
    align-self: stretch;
  }
}

@media (max-width: 768px) {
  .detail-main {
    padding: 18px;
  }

  .detail-product {
    grid-template-columns: 1fr;
  }

  .detail-product__info h2 {
    white-space: normal;
  }

  .detail-section__title {
    align-items: flex-start;
    flex-direction: column;
    gap: 6px;
  }

  .spec-grid,
  .detail-info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
