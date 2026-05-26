<script lang="ts" setup>
import type { InterfacePackageStats, UserWorkbenchStats } from '#/api/core/user';
import type { RechargeApi } from '#/api/payment';

import { computed, ref } from 'vue';

import { IconifyIcon } from '@vben/icons';

import {
  Button,
  Modal,
  QRCode,
  Radio,
  RadioGroup,
  Spin,
  Tag,
  message,
} from 'ant-design-vue';

import { getUserWorkbenchStatsApi } from '#/api/core/user';
import {
  createGlobalPackagePaymentOrder,
  createInterfacePackagePaymentOrder,
  createPointPackagePaymentOrder,
  getRechargeCapabilities,
  syncRechargeOrder,
} from '#/api/payment';

type PackagePayType = 'GLOBAL' | 'INTERFACE' | 'POINT';

interface PackagePayTarget {
  description?: string;
  id: string;
  interfaceId?: string;
  price: number | string;
  specId?: string;
  subtitle?: string;
  title: string;
  type: PackagePayType;
}

const emit = defineEmits<{ success: [] }>();

const visible = ref(false);
const loading = ref(false);
const syncLoading = ref(false);
const target = ref<PackagePayTarget>();
const balance = ref<number | string>(0);
const workbenchStats = ref<null | UserWorkbenchStats>(null);
const capabilities = ref<null | RechargeApi.Capabilities>(null);
const payChannel = ref<RechargeApi.PayChannel>('BALANCE');
const preferredProduct = ref<RechargeApi.PayProduct>('AUTO');
const order = ref<null | RechargeApi.PackagePaymentOrder>(null);
let orderTimer: number | undefined;

const clientType = computed<RechargeApi.ClientType>(() =>
  isMobileDevice() ? 'MOBILE' : 'DESKTOP',
);

const amount = computed(() => Number(target.value?.price ?? 0));

const balanceEnough = computed(() => {
  const userBalance = Number(balance.value ?? 0);
  return Number.isFinite(userBalance) && userBalance >= amount.value;
});

const currentInterfacePackage = computed<InterfacePackageStats | undefined>(() => {
  const item = target.value;
  if (item?.type !== 'INTERFACE' || !item.interfaceId) {
    return undefined;
  }
  return workbenchStats.value?.interfacePackages?.find(
    (pkg) => String(pkg.interfaceId) === String(item.interfaceId),
  );
});

const purchaseEffect = computed(() => {
  const item = target.value;
  if (!item) {
    return null;
  }
  if (item.type === 'GLOBAL') {
    const current = workbenchStats.value?.memberPackage;
    if (current?.packageId) {
      if (String(current.packageId) === String(item.id)) {
        return {
          description: current.expireTime
            ? `当前全站套餐到期时间为 ${current.expireTime}，购买后会在原到期时间后顺延。`
            : '当前全站套餐无固定到期时间，购买后会按套餐有效期重新确认权益。',
          icon: 'lucide:calendar-plus',
          tone: 'info',
          title: '同规格续费',
        };
      }
      return {
        description:
          '当前已有其他全站套餐，购买后会替换当前套餐，并从当前时间重新计算有效期。',
        icon: 'lucide:refresh-cw',
        tone: 'danger',
        title: '覆盖当前全站套餐',
      };
    }
  }
  if (item.type === 'INTERFACE') {
    const current = currentInterfacePackage.value;
    if (current?.specId) {
      if (String(current.specId) === String(item.specId)) {
        return {
          description: current.expireTime
            ? `当前接口套餐到期时间为 ${current.expireTime}，购买后会在原到期时间后顺延。`
            : '当前接口套餐无固定到期时间，购买后会按套餐有效期重新确认权益。',
          icon: 'lucide:calendar-plus',
          tone: 'info',
          title: '同规格续费',
        };
      }
      return {
        description:
          '当前接口已有其他规格套餐，购买后会替换该接口的原套餐，并从当前时间重新计算有效期。',
        icon: 'lucide:refresh-cw',
        tone: 'danger',
        title: '覆盖当前接口套餐',
      };
    }
  }
  if (item.type === 'POINT') {
    return {
      description: '购买成功后点数会直接增加到账户点数中。',
      icon: 'lucide:coins',
      tone: 'info',
      title: '点数到账',
    };
  }
  return {
    description: '购买成功后套餐会立即生效。',
    icon: 'lucide:circle-check',
    tone: 'info',
    title: '立即开通',
  };
});

const alipayUsable = computed(() => {
  const item = capabilities.value;
  return !!item?.enabled && (item.websitePayEnabled || item.wapPayEnabled || item.facePayEnabled);
});

const defaultProduct = computed<Exclude<RechargeApi.PayProduct, 'AUTO'>>(() => {
  const item = capabilities.value;
  if (!item) {
    return 'PAGE';
  }
  return clientType.value === 'MOBILE' ? item.mobileDefault : item.desktopDefault;
});

const productOptions = computed(() => {
  const item = capabilities.value;
  if (!item) {
    return [];
  }
  const options: Array<{ label: string; value: RechargeApi.PayProduct }> = [
    { label: `自动选择（${payProductLabel(defaultProduct.value)}）`, value: 'AUTO' },
  ];
  if (item.websitePayEnabled) {
    options.push({ label: '电脑网站支付', value: 'PAGE' });
  }
  if (item.wapPayEnabled) {
    options.push({ label: '手机网站支付', value: 'WAP' });
  }
  if (item.facePayEnabled) {
    options.push({ label: '当面付扫码', value: 'FACE' });
  }
  return options;
});

const submitDisabled = computed(() => {
  if (!target.value || loading.value) {
    return true;
  }
  if (payChannel.value === 'BALANCE') {
    return amount.value > 0 && !balanceEnough.value;
  }
  return amount.value < 0.01 || !alipayUsable.value;
});

const submitText = computed(() => {
  if (payChannel.value === 'BALANCE') {
    return amount.value <= 0 ? '免费开通' : '确认购买';
  }
  return '去支付';
});

function moneyText(value?: number | string) {
  const price = Number(value ?? 0);
  if (!Number.isFinite(price)) {
    return '¥0.00';
  }
  return `¥${price.toLocaleString('zh-CN', {
    maximumFractionDigits: 4,
    minimumFractionDigits: 2,
  })}`;
}

function packageTypeLabel(type?: PackagePayType) {
  if (type === 'GLOBAL') {
    return '全站套餐';
  }
  if (type === 'INTERFACE') {
    return '接口套餐';
  }
  return '点数套餐';
}

function payProductLabel(value?: string) {
  if (value === 'PAGE') {
    return '电脑网站支付';
  }
  if (value === 'WAP') {
    return '手机网站支付';
  }
  if (value === 'FACE') {
    return '当面付扫码';
  }
  return '支付宝支付';
}

function isMobileDevice() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }
  return /Android|iPhone|iPad|iPod|Mobile|Windows Phone/i.test(
    navigator.userAgent || '',
  );
}

async function open(item: PackagePayTarget) {
  target.value = item;
  order.value = null;
  workbenchStats.value = null;
  visible.value = true;
  payChannel.value = 'BALANCE';
  preferredProduct.value = 'AUTO';
  stopPolling();
  await loadPaymentContext();
}

async function loadPaymentContext() {
  loading.value = true;
  try {
    const stats = await getUserWorkbenchStatsApi();
    workbenchStats.value = stats;
    balance.value = stats.balance;
    try {
      capabilities.value = await getRechargeCapabilities();
    } catch (error) {
      capabilities.value = null;
      console.error('Failed to load Alipay capabilities:', error);
    }
    if (amount.value > 0 && !balanceEnough.value && alipayUsable.value) {
      payChannel.value = 'ALIPAY';
    }
  } finally {
    loading.value = false;
  }
}

function stopPolling() {
  if (orderTimer) {
    window.clearInterval(orderTimer);
    orderTimer = undefined;
  }
}

function closeModal() {
  visible.value = false;
  stopPolling();
}

function expectedPayProduct(): RechargeApi.PayProduct {
  return preferredProduct.value === 'AUTO'
    ? defaultProduct.value
    : preferredProduct.value;
}

function shouldPreopenPaymentWindow() {
  return (
    payChannel.value === 'ALIPAY' &&
    clientType.value === 'DESKTOP' &&
    expectedPayProduct() !== 'FACE'
  );
}

function createAndSubmitAlipayForm(
  payOrder: RechargeApi.PackagePaymentOrder,
  formTarget: '_blank' | '_self',
) {
  if (!payOrder.gatewayUrl || !payOrder.formParams) {
    return;
  }
  const form = document.createElement('form');
  form.method = 'post';
  form.acceptCharset = 'UTF-8';
  form.action = payOrder.formActionUrl || payOrder.gatewayUrl;
  form.target = formTarget;
  form.style.display = 'none';
  Object.entries(payOrder.formParams).forEach(([key, value]) => {
    if (key === 'charset') {
      return;
    }
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = key;
    input.value = value;
    form.append(input);
  });
  document.body.append(form);
  form.submit();
  window.setTimeout(() => form.remove(), 1000);
}

function openAlipayPayment(
  payOrder: RechargeApi.PackagePaymentOrder,
  paymentWindow: null | Window,
) {
  if (payOrder.qrCode) {
    paymentWindow?.close();
    return;
  }
  if (clientType.value === 'MOBILE') {
    paymentWindow?.close();
    createAndSubmitAlipayForm(payOrder, '_self');
    return;
  }
  if (paymentWindow && payOrder.formHtml) {
    paymentWindow.document.open();
    paymentWindow.document.write(payOrder.formHtml);
    paymentWindow.document.close();
    return;
  }
  createAndSubmitAlipayForm(payOrder, '_blank');
}

function startPolling(orderNo: string) {
  stopPolling();
  orderTimer = window.setInterval(() => {
    void syncCurrentOrder(orderNo, false);
  }, 3000);
}

async function syncCurrentOrder(orderNo?: string, showPendingMessage = true) {
  const currentOrderNo = orderNo ?? order.value?.orderNo;
  if (!currentOrderNo || syncLoading.value) {
    return;
  }
  syncLoading.value = true;
  try {
    const latest = await syncRechargeOrder(currentOrderNo);
    order.value = {
      ...(order.value ?? {}),
      ...latest,
    } as RechargeApi.PackagePaymentOrder;
    if (latest.status === 'PAID') {
      stopPolling();
      message.success('购买成功，套餐已生效');
      emit('success');
      window.setTimeout(() => closeModal(), 600);
      return;
    }
    if (latest.status === 'CLOSED' || latest.status === 'FAILED') {
      stopPolling();
      message.warning('当前支付订单未完成，请重新发起购买');
      return;
    }
    if (showPendingMessage) {
      message.info('暂未查询到支付成功，请稍后再试');
    }
  } finally {
    syncLoading.value = false;
  }
}

async function createPackageOrder() {
  if (!target.value) {
    return;
  }
  const payload: RechargeApi.PackageOrderPayload = {
    clientType: clientType.value,
    payChannel: payChannel.value,
    preferredProduct: preferredProduct.value,
    specId: target.value.specId,
  };
  if (target.value.type === 'GLOBAL') {
    return await createGlobalPackagePaymentOrder(target.value.id, payload);
  }
  if (target.value.type === 'INTERFACE') {
    return await createInterfacePackagePaymentOrder(target.value.id, payload);
  }
  return await createPointPackagePaymentOrder(target.value.id, payload);
}

async function submitOrder() {
  if (submitDisabled.value) {
    return;
  }
  let paymentWindow: null | Window = null;
  if (shouldPreopenPaymentWindow()) {
    paymentWindow = window.open('', '_blank');
  }
  loading.value = true;
  try {
    const payOrder = await createPackageOrder();
    if (!payOrder) {
      return;
    }
    order.value = payOrder;
    if (payOrder.status === 'PAID') {
      paymentWindow?.close();
      message.success('购买成功，套餐已生效');
      emit('success');
      await loadPaymentContext();
      closeModal();
      return;
    }
    openAlipayPayment(payOrder, paymentWindow);
    if (payOrder.payProduct === 'FACE') {
      message.success('请使用支付宝扫码完成支付');
    } else if (payOrder.payProduct === 'WAP' && clientType.value === 'MOBILE') {
      message.success('正在跳转支付宝支付');
    } else {
      message.success('支付页面已打开，支付完成后会自动确认');
    }
    startPolling(payOrder.orderNo);
  } catch (error) {
    paymentWindow?.close();
    console.error('Failed to create package payment order:', error);
  } finally {
    loading.value = false;
  }
}

defineExpose({ open });
</script>

<template>
  <Modal
    v-model:open="visible"
    :footer="null"
    :mask-closable="!loading"
    destroy-on-close
    title="确认购买"
    width="560px"
    @cancel="stopPolling"
  >
    <Spin :spinning="loading && !order">
      <div v-if="target" class="package-pay">
        <div class="package-pay__summary">
          <div class="package-pay__icon">
            <IconifyIcon
              class="size-6"
              :icon="
                target.type === 'GLOBAL'
                  ? 'lucide:globe-2'
                  : target.type === 'INTERFACE'
                    ? 'lucide:package-open'
                    : 'lucide:coins'
              "
            />
          </div>
          <div class="package-pay__main">
            <Tag color="blue">{{ packageTypeLabel(target.type) }}</Tag>
            <h3>{{ target.title }}</h3>
            <p>{{ target.subtitle || target.description || '购买后立即生效' }}</p>
          </div>
          <strong>{{ moneyText(target.price) }}</strong>
        </div>

        <div
          v-if="purchaseEffect"
          class="package-pay__effect"
          :class="`is-${purchaseEffect.tone}`"
        >
          <IconifyIcon class="size-5" :icon="purchaseEffect.icon" />
          <div>
            <strong>{{ purchaseEffect.title }}</strong>
            <p>{{ purchaseEffect.description }}</p>
          </div>
        </div>

        <div class="package-pay__section">
          <div class="package-pay__section-head">
            <span>支付方式</span>
            <em>
              当前余额 {{ moneyText(balance) }}
              <template v-if="amount > 0 && !balanceEnough">，余额不足</template>
            </em>
          </div>
          <RadioGroup
            v-model:value="payChannel"
            class="package-pay__channels"
            :class="{ 'is-single': !alipayUsable }"
          >
            <Radio class="package-pay__channel" value="BALANCE">
              <div class="package-pay__channel-title">
                <IconifyIcon class="size-5" icon="lucide:wallet-cards" />
                <span>余额支付</span>
              </div>
              <p>
                {{
                  balanceEnough || amount <= 0
                    ? '使用账户余额直接购买'
                    : alipayUsable
                      ? '余额不足，请先充值或选择支付宝'
                      : '余额不足，请先充值'
                }}
              </p>
            </Radio>
            <Radio
              v-if="alipayUsable"
              class="package-pay__channel"
              :disabled="amount < 0.01"
              value="ALIPAY"
            >
              <div class="package-pay__channel-title">
                <IconifyIcon class="size-5" icon="lucide:scan-line" />
                <span>支付宝支付</span>
              </div>
              <p>支持网站、手机或扫码支付</p>
            </Radio>
          </RadioGroup>
        </div>

        <div v-if="payChannel === 'ALIPAY'" class="package-pay__section">
          <div class="package-pay__section-head">
            <span>支付宝方式</span>
            <em>{{ clientType === 'MOBILE' ? '已识别手机端' : '已识别电脑端' }}</em>
          </div>
          <RadioGroup
            v-model:value="preferredProduct"
            class="package-pay__products"
          >
            <Radio
              v-for="item in productOptions"
              :key="item.value"
              :value="item.value"
            >
              {{ item.label }}
            </Radio>
          </RadioGroup>
          <div v-if="capabilities" class="package-pay__tags">
            <Tag v-if="capabilities.websitePayEnabled" color="processing">
              网站支付
            </Tag>
            <Tag v-if="capabilities.wapPayEnabled" color="success">
              手机支付
            </Tag>
            <Tag v-if="capabilities.facePayEnabled" color="warning">
              当面付
            </Tag>
          </div>
        </div>

        <div v-if="order" class="package-pay__order">
          <div class="package-pay__order-head">
            <div>
              <span>订单号</span>
              <strong>{{ order.orderNo }}</strong>
            </div>
            <Tag :color="order.status === 'PAID' ? 'success' : 'processing'">
              {{ order.status === 'PAID' ? '已支付' : '待支付' }}
            </Tag>
          </div>
          <div v-if="order.qrCode" class="package-pay__qrcode">
            <QRCode :bordered="false" :size="180" :value="order.qrCode" />
            <p>请使用支付宝扫码完成支付</p>
          </div>
          <div v-else-if="order.payChannel === 'ALIPAY'" class="package-pay__tip">
            支付页面已打开，完成支付后系统会自动确认并开通套餐。
          </div>
        </div>

        <div class="package-pay__actions">
          <Button @click="closeModal">取消</Button>
          <Button
            v-if="order?.payChannel === 'ALIPAY'"
            :loading="syncLoading"
            @click="syncCurrentOrder()"
          >
            我已完成支付
          </Button>
          <Button
            type="primary"
            :disabled="submitDisabled"
            :loading="loading"
            @click="submitOrder"
          >
            {{ submitText }}
          </Button>
        </div>
      </div>
    </Spin>
  </Modal>
</template>

<style scoped>
.package-pay {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.package-pay__summary,
.package-pay__order {
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
  background: hsl(var(--background));
  padding: 14px;
}

.package-pay__summary {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
}

.package-pay__icon {
  display: flex;
  width: 48px;
  height: 48px;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: hsl(var(--primary) / 8%);
  color: hsl(var(--primary));
}

.package-pay__main {
  min-width: 0;
}

.package-pay__main h3 {
  overflow: hidden;
  margin: 6px 0 2px;
  color: hsl(var(--foreground));
  font-size: 18px;
  font-weight: 800;
  line-height: 24px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.package-pay__main p,
.package-pay__channel p,
.package-pay__tip,
.package-pay__qrcode p,
.package-pay__section-head em,
.package-pay__order-head span {
  margin: 0;
  color: rgb(100 116 139);
  font-size: 13px;
  line-height: 20px;
}

.package-pay__summary > strong {
  color: #f45d66;
  font-size: 24px;
  font-weight: 900;
  white-space: nowrap;
}

.package-pay__effect {
  display: grid;
  grid-template-columns: 20px minmax(0, 1fr);
  align-items: flex-start;
  gap: 10px;
  border: 1px solid hsl(var(--primary) / 24%);
  border-radius: 8px;
  background: hsl(var(--primary) / 6%);
  color: hsl(var(--primary));
  padding: 12px;
}

.package-pay__effect.is-warning {
  border-color: #f6c56b;
  background: #fff8e8;
  color: #b36b00;
}

.package-pay__effect.is-danger {
  border-color: #ff7875;
  background: #fff1f0;
  color: #cf1322;
}

.package-pay__effect strong {
  display: block;
  color: inherit;
  font-size: 14px;
  font-weight: 800;
  line-height: 20px;
}

.package-pay__effect p {
  margin: 2px 0 0;
  color: hsl(var(--foreground) / 72%);
  font-size: 13px;
  line-height: 20px;
}

.package-pay__section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.package-pay__section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.package-pay__section-head span {
  color: hsl(var(--foreground));
  font-size: 14px;
  font-weight: 800;
}

.package-pay__channels {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.package-pay__channels.is-single {
  grid-template-columns: 1fr;
}

.package-pay__channel {
  display: block;
  height: 100%;
  margin: 0;
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
  background: hsl(var(--background));
  padding: 12px;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease;
}

.package-pay__channel:has(.ant-radio-wrapper-checked),
.package-pay__channel:has(.ant-radio-checked) {
  border-color: hsl(var(--primary) / 60%);
  background: hsl(var(--primary) / 5%);
}

.package-pay__channel-title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: hsl(var(--foreground));
  font-size: 14px;
  font-weight: 800;
}

.package-pay__channel-title :deep(svg) {
  color: hsl(var(--primary));
}

.package-pay__channel p {
  margin-top: 8px;
}

.package-pay__products {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 12px;
}

.package-pay__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.package-pay__order-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.package-pay__order-head strong {
  display: block;
  margin-top: 2px;
  color: hsl(var(--foreground));
  font-size: 13px;
  font-weight: 700;
  line-height: 20px;
  word-break: break-all;
}

.package-pay__qrcode {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-top: 14px;
}

.package-pay__tip {
  margin-top: 12px;
  border-radius: 8px;
  background: hsl(var(--primary) / 7%);
  padding: 12px;
}

.package-pay__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

:global(.dark) .package-pay__main p,
:global(.dark) .package-pay__channel p,
:global(.dark) .package-pay__tip,
:global(.dark) .package-pay__qrcode p,
:global(.dark) .package-pay__section-head em,
:global(.dark) .package-pay__order-head span {
  color: rgb(148 163 184);
}

@media (max-width: 640px) {
  .package-pay__summary {
    grid-template-columns: 48px minmax(0, 1fr);
  }

  .package-pay__summary > strong {
    grid-column: 1 / -1;
  }

  .package-pay__channels,
  .package-pay__products {
    grid-template-columns: 1fr;
  }
}
</style>
