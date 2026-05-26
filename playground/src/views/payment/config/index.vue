<script lang="ts" setup>
import type { PaymentConfigApi } from '#/api/system/payment';

import { computed, h, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Alert, Button, message, Tabs, Tag } from 'ant-design-vue';

import { useVbenForm, z } from '#/adapter/form';
import {
  getAlipayConfig,
  getWechatConfig,
  updateAlipayConfig,
  updateWechatConfig,
  validateAlipayConfig,
  validateWechatConfig,
} from '#/api/system/payment';
import { $t } from '#/locales';

type PaymentTab = 'alipay' | 'wechat';

const activeTab = ref<PaymentTab>('alipay');
const loading = ref(false);
const validateLoading = ref(false);
const alipayEnabled = ref<0 | 1>(0);
const wechatEnabled = ref<0 | 1>(0);
const alipayUpdateTime = ref<null | string>(null);
const wechatUpdateTime = ref<null | string>(null);
const alipayRemark = ref('');
const wechatRemark = ref('');

const ALIPAY_NOTIFY_PATH = '/payment/alipay/notify';
const WECHAT_NOTIFY_PATH = '/payment/wechat/notify';
const DEFAULT_CHARSET_NAME = ['UTF', '8'].join('-');
const DEFAULT_GATEWAY_URL = 'https://openapi.alipay.com/gateway.do';
const DEFAULT_WECHAT_GATEWAY_URL = 'https://api.mch.weixin.qq.com';
const DEFAULT_RETURN_ROUTE = '/workspace';

const currentEnabled = computed(() =>
  activeTab.value === 'alipay' ? alipayEnabled.value : wechatEnabled.value,
);

const currentUpdateTime = computed(() =>
  activeTab.value === 'alipay'
    ? alipayUpdateTime.value
    : wechatUpdateTime.value,
);

const currentTitle = computed(() =>
  activeTab.value === 'alipay'
    ? $t('system.payment.alipayTitle')
    : $t('system.payment.wechatTitle'),
);

const currentDescription = computed(() =>
  activeTab.value === 'alipay'
    ? $t('system.payment.alipayDescription')
    : $t('system.payment.wechatDescription'),
);

const currentTip = computed(() =>
  activeTab.value === 'alipay'
    ? $t('system.payment.officialTip')
    : $t('system.payment.wechatOfficialTip'),
);

const currentTipDescription = computed(() =>
  activeTab.value === 'alipay'
    ? $t('system.payment.officialDescription')
    : $t('system.payment.wechatOfficialDescription'),
);

const [AlipayForm, alipayFormApi] = useVbenForm({
  commonConfig: {
    colon: true,
    componentProps: {
      class: 'w-full',
    },
    formItemClass: 'col-span-6 lg:col-span-3',
    labelClass: 'payment-config-label',
    labelWidth: 136,
  },
  layout: 'horizontal',
  schema: [
    {
      component: 'Switch',
      componentProps: {
        checkedChildren: $t('system.payment.enableAction'),
        class: 'w-auto',
        unCheckedChildren: $t('system.payment.disableAction'),
      },
      defaultValue: false,
      fieldName: 'enabled',
      label: $t('system.payment.alipayEnabled'),
    },
    {
      component: 'Input',
      fieldName: 'appId',
      label: $t('system.payment.appId'),
    },
    {
      component: 'Textarea',
      componentProps: {
        autoSize: { maxRows: 8, minRows: 5 },
        placeholder: $t('system.payment.privateKeyPlaceholder'),
      },
      fieldName: 'merchantPrivateKey',
      label: $t('system.payment.merchantPrivateKey'),
    },
    {
      component: 'Textarea',
      componentProps: {
        autoSize: { maxRows: 8, minRows: 5 },
        placeholder: $t('system.payment.publicKeyPlaceholder'),
      },
      fieldName: 'alipayPublicKey',
      label: $t('system.payment.alipayPublicKey'),
    },
    {
      component: 'Switch',
      componentProps: {
        checkedChildren: $t('system.payment.enableAction'),
        class: 'w-auto',
        unCheckedChildren: $t('system.payment.disableAction'),
      },
      defaultValue: true,
      fieldName: 'wapPayEnabled',
      formItemClass: 'col-span-6 lg:col-span-2',
      help: $t('system.payment.wapPayHelp'),
      label: $t('system.payment.wapPayEnabled'),
    },
    {
      component: 'Switch',
      componentProps: {
        checkedChildren: $t('system.payment.enableAction'),
        class: 'w-auto',
        unCheckedChildren: $t('system.payment.disableAction'),
      },
      defaultValue: true,
      fieldName: 'websitePayEnabled',
      formItemClass: 'col-span-6 lg:col-span-2',
      help: $t('system.payment.websitePayHelp'),
      label: $t('system.payment.websitePayEnabled'),
    },
    {
      component: 'Switch',
      componentProps: {
        checkedChildren: $t('system.payment.enableAction'),
        class: 'w-auto',
        unCheckedChildren: $t('system.payment.disableAction'),
      },
      defaultValue: false,
      fieldName: 'facePayEnabled',
      formItemClass: 'col-span-6 lg:col-span-2',
      help: $t('system.payment.facePayHelp'),
      label: $t('system.payment.facePayEnabled'),
    },
    {
      component: 'Input',
      componentProps: () => ({
        addonAfter: h(
          Button,
          {
            class: 'payment-url-fill-button',
            size: 'small',
            type: 'link',
            onClick(event: MouseEvent) {
              event.preventDefault();
              event.stopPropagation();
              fillAlipayNotifyUrl();
            },
          },
          () => $t('system.payment.autoFill'),
        ),
        placeholder: $t('system.payment.notifyUrlPlaceholder'),
      }),
      fieldName: 'notifyUrl',
      help: $t('system.payment.notifyUrlHelp'),
      label: $t('system.payment.notifyUrl'),
      rules: z.string().url().or(z.literal('')).optional(),
    },
    {
      component: 'Input',
      componentProps: () => ({
        addonAfter: h(
          Button,
          {
            class: 'payment-url-fill-button',
            size: 'small',
            type: 'link',
            onClick(event: MouseEvent) {
              event.preventDefault();
              event.stopPropagation();
              fillReturnUrl();
            },
          },
          () => $t('system.payment.autoFill'),
        ),
        placeholder: $t('system.payment.returnUrlPlaceholder'),
      }),
      fieldName: 'returnUrl',
      help: $t('system.payment.returnUrlHelp'),
      label: $t('system.payment.returnUrl'),
      rules: z.string().url().or(z.literal('')).optional(),
    },
  ],
  showDefaultActions: false,
  wrapperClass: 'grid-cols-6 gap-x-4',
});

const [WechatForm, wechatFormApi] = useVbenForm({
  commonConfig: {
    colon: true,
    componentProps: {
      class: 'w-full',
    },
    formItemClass: 'col-span-6 lg:col-span-3',
    labelClass: 'payment-config-label',
    labelWidth: 150,
  },
  layout: 'horizontal',
  schema: [
    {
      component: 'Switch',
      componentProps: {
        checkedChildren: $t('system.payment.enableAction'),
        class: 'w-auto',
        unCheckedChildren: $t('system.payment.disableAction'),
      },
      defaultValue: false,
      fieldName: 'enabled',
      label: $t('system.payment.wechatEnabled'),
    },
    {
      component: 'Input',
      fieldName: 'appId',
      label: $t('system.payment.appId'),
    },
    {
      component: 'Input',
      fieldName: 'mchId',
      label: $t('system.payment.mchId'),
    },
    {
      component: 'Input',
      fieldName: 'merchantSerialNo',
      label: $t('system.payment.merchantSerialNo'),
    },
    {
      component: 'InputPassword',
      componentProps: {
        placeholder: $t('system.payment.apiV3KeyPlaceholder'),
      },
      fieldName: 'apiV3Key',
      label: $t('system.payment.apiV3Key'),
    },
    {
      component: 'Switch',
      componentProps: {
        checkedChildren: $t('system.payment.enableAction'),
        class: 'w-auto',
        unCheckedChildren: $t('system.payment.disableAction'),
      },
      defaultValue: true,
      fieldName: 'nativePayEnabled',
      help: $t('system.payment.wechatNativePayHelp'),
      label: $t('system.payment.wechatNativePayEnabled'),
    },
    {
      component: 'Textarea',
      componentProps: {
        autoSize: { maxRows: 8, minRows: 5 },
        placeholder: $t('system.payment.wechatPrivateKeyPlaceholder'),
      },
      fieldName: 'merchantPrivateKey',
      label: $t('system.payment.wechatMerchantPrivateKey'),
    },
    {
      component: 'Textarea',
      componentProps: {
        autoSize: { maxRows: 8, minRows: 4 },
        placeholder: $t('system.payment.wechatpayPublicKeyPlaceholder'),
      },
      fieldName: 'wechatpayPublicKey',
      label: $t('system.payment.wechatpayPublicKey'),
    },
    {
      component: 'Input',
      fieldName: 'wechatpayPublicKeyId',
      label: $t('system.payment.wechatpayPublicKeyId'),
    },
    {
      component: 'Input',
      componentProps: () => ({
        addonAfter: h(
          Button,
          {
            class: 'payment-url-fill-button',
            size: 'small',
            type: 'link',
            onClick(event: MouseEvent) {
              event.preventDefault();
              event.stopPropagation();
              fillWechatNotifyUrl();
            },
          },
          () => $t('system.payment.autoFill'),
        ),
        placeholder: $t('system.payment.wechatNotifyUrlPlaceholder'),
      }),
      fieldName: 'notifyUrl',
      help: $t('system.payment.wechatNotifyUrlHelp'),
      label: $t('system.payment.notifyUrl'),
      rules: z.string().url().or(z.literal('')).optional(),
    },
  ],
  showDefaultActions: false,
  wrapperClass: 'grid-cols-6 gap-x-4',
});

function apiBaseUrl() {
  const apiUrl = String(import.meta.env.VITE_GLOB_API_URL || '/api').trim();
  if (/^https?:\/\//i.test(apiUrl)) {
    return apiUrl.replace(/\/$/, '');
  }
  return `${window.location.origin}${apiUrl.startsWith('/') ? apiUrl : `/${apiUrl}`}`.replace(
    /\/$/,
    '',
  );
}

function frontendBaseUrl() {
  return new URL(import.meta.env.BASE_URL || '/', window.location.origin)
    .toString()
    .replace(/\/$/, '');
}

function defaultNotifyUrl(path: string) {
  return `${apiBaseUrl()}${path}`;
}

function defaultReturnUrl() {
  return `${frontendBaseUrl()}/#${DEFAULT_RETURN_ROUTE}`;
}

async function fillAlipayNotifyUrl() {
  await alipayFormApi.setValues({
    notifyUrl: defaultNotifyUrl(ALIPAY_NOTIFY_PATH),
  });
  message.success($t('system.payment.autoFillSuccess'));
}

async function fillWechatNotifyUrl() {
  await wechatFormApi.setValues({
    notifyUrl: defaultNotifyUrl(WECHAT_NOTIFY_PATH),
  });
  message.success($t('system.payment.autoFillSuccess'));
}

async function fillReturnUrl() {
  await alipayFormApi.setValues({ returnUrl: defaultReturnUrl() });
  message.success($t('system.payment.autoFillSuccess'));
}

async function loadConfig() {
  loading.value = true;
  try {
    const [alipayConfig, wechatConfig] = await Promise.all([
      getAlipayConfig(),
      getWechatConfig(),
    ]);
    alipayEnabled.value = alipayConfig.enabled ?? 0;
    alipayUpdateTime.value = alipayConfig.updateTime ?? null;
    alipayRemark.value = alipayConfig.remark ?? '';
    await alipayFormApi.setValues({
      alipayPublicKey: alipayConfig.alipayPublicKey ?? '',
      appId: alipayConfig.appId ?? '',
      enabled: (alipayConfig.enabled ?? 0) === 1,
      facePayEnabled: (alipayConfig.facePayEnabled ?? 0) === 1,
      merchantPrivateKey: alipayConfig.merchantPrivateKey ?? '',
      notifyUrl: alipayConfig.notifyUrl ?? '',
      returnUrl: alipayConfig.returnUrl ?? '',
      wapPayEnabled: (alipayConfig.wapPayEnabled ?? 1) === 1,
      websitePayEnabled: (alipayConfig.websitePayEnabled ?? 1) === 1,
    });

    wechatEnabled.value = wechatConfig.enabled ?? 0;
    wechatUpdateTime.value = wechatConfig.updateTime ?? null;
    wechatRemark.value = wechatConfig.remark ?? '';
    await wechatFormApi.setValues({
      apiV3Key: wechatConfig.apiV3Key ?? '',
      appId: wechatConfig.appId ?? '',
      enabled: (wechatConfig.enabled ?? 0) === 1,
      mchId: wechatConfig.mchId ?? '',
      merchantPrivateKey: wechatConfig.merchantPrivateKey ?? '',
      merchantSerialNo: wechatConfig.merchantSerialNo ?? '',
      nativePayEnabled: (wechatConfig.nativePayEnabled ?? 1) === 1,
      notifyUrl: wechatConfig.notifyUrl ?? '',
      wechatpayPublicKey: wechatConfig.wechatpayPublicKey ?? '',
      wechatpayPublicKeyId: wechatConfig.wechatpayPublicKeyId ?? '',
    });
  } finally {
    loading.value = false;
  }
}

async function buildAlipayPayload(): Promise<PaymentConfigApi.AlipayConfig> {
  const values = await alipayFormApi.getValues();
  return {
    alipayPublicKey: String(values.alipayPublicKey ?? '').trim(),
    appId: String(values.appId ?? '').trim(),
    charsetName: DEFAULT_CHARSET_NAME,
    enabled: values.enabled ? 1 : 0,
    facePayEnabled: values.facePayEnabled ? 1 : 0,
    formatType: 'JSON',
    gatewayUrl: DEFAULT_GATEWAY_URL,
    merchantPrivateKey: String(values.merchantPrivateKey ?? '').trim(),
    notifyUrl: String(values.notifyUrl ?? '').trim(),
    remark: alipayRemark.value.trim(),
    returnUrl: String(values.returnUrl ?? '').trim(),
    signType: 'RSA2',
    wapPayEnabled: values.wapPayEnabled ? 1 : 0,
    websitePayEnabled: values.websitePayEnabled ? 1 : 0,
  };
}

async function buildWechatPayload(): Promise<PaymentConfigApi.WechatConfig> {
  const values = await wechatFormApi.getValues();
  return {
    apiV3Key: String(values.apiV3Key ?? '').trim(),
    appId: String(values.appId ?? '').trim(),
    enabled: values.enabled ? 1 : 0,
    gatewayUrl: DEFAULT_WECHAT_GATEWAY_URL,
    mchId: String(values.mchId ?? '').trim(),
    merchantPrivateKey: String(values.merchantPrivateKey ?? '').trim(),
    merchantSerialNo: String(values.merchantSerialNo ?? '').trim(),
    nativePayEnabled: values.nativePayEnabled ? 1 : 0,
    notifyUrl: String(values.notifyUrl ?? '').trim(),
    remark: wechatRemark.value.trim(),
    wechatpayPublicKey: String(values.wechatpayPublicKey ?? '').trim(),
    wechatpayPublicKeyId: String(values.wechatpayPublicKeyId ?? '').trim(),
  };
}

async function onValidate() {
  const formApi = activeTab.value === 'alipay' ? alipayFormApi : wechatFormApi;
  const { valid } = await formApi.validate();
  if (!valid) return;

  validateLoading.value = true;
  try {
    if (activeTab.value === 'alipay') {
      await validateAlipayConfig(await buildAlipayPayload());
      message.success($t('system.payment.validateSuccess'));
    } else {
      await validateWechatConfig(await buildWechatPayload());
      message.success($t('system.payment.wechatValidateSuccess'));
    }
  } finally {
    validateLoading.value = false;
  }
}

async function onSubmit() {
  const formApi = activeTab.value === 'alipay' ? alipayFormApi : wechatFormApi;
  const { valid } = await formApi.validate();
  if (!valid) return;

  loading.value = true;
  try {
    if (activeTab.value === 'alipay') {
      await updateAlipayConfig(await buildAlipayPayload());
      message.success($t('system.payment.saveSuccess'));
    } else {
      await updateWechatConfig(await buildWechatPayload());
      message.success($t('system.payment.wechatSaveSuccess'));
    }
    await loadConfig();
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  void loadConfig();
});
</script>

<template>
  <Page auto-content-height>
    <div class="payment-config-page">
      <div class="payment-config-header">
        <div>
          <div class="payment-config-title">
            {{ currentTitle }}
            <Tag v-if="currentEnabled === 1" color="success">
              {{ $t('system.payment.enabledTag') }}
            </Tag>
            <Tag v-else>
              {{ $t('system.payment.disabledTag') }}
            </Tag>
          </div>
          <div class="payment-config-desc">
            {{ currentDescription }}
          </div>
        </div>
        <div v-if="currentUpdateTime" class="payment-config-time">
          {{ $t('system.payment.updateTime') }}：{{ currentUpdateTime }}
        </div>
      </div>

      <Alert
        class="payment-config-alert"
        show-icon
        type="info"
        :message="currentTip"
        :description="currentTipDescription"
      />

      <div class="payment-config-card">
        <Tabs v-model:active-key="activeTab" class="payment-config-tabs">
          <Tabs.TabPane key="alipay" :tab="$t('system.payment.alipayTitle')">
            <AlipayForm />
          </Tabs.TabPane>
          <Tabs.TabPane key="wechat" :tab="$t('system.payment.wechatTitle')">
            <WechatForm />
          </Tabs.TabPane>
        </Tabs>
        <div class="payment-config-actions">
          <Button :loading="validateLoading" @click="onValidate">
            {{ $t('system.payment.validate') }}
          </Button>
          <Button type="primary" :loading="loading" @click="onSubmit">
            {{ $t('system.payment.save') }}
          </Button>
        </div>
      </div>
    </div>
  </Page>
</template>

<style scoped>
.payment-config-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.payment-config-header,
.payment-config-card,
.payment-config-alert {
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
}

.payment-config-header {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
}

.payment-config-title {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  font-size: 20px;
  font-weight: 700;
  color: hsl(var(--foreground));
  letter-spacing: 0;
}

.payment-config-desc,
.payment-config-time {
  margin-top: 6px;
  font-size: 14px;
  color: hsl(var(--muted-foreground));
}

.payment-config-card {
  padding: 18px 24px 24px;
}

.payment-config-tabs :deep(.ant-tabs-nav) {
  margin-bottom: 22px;
}

.payment-config-card :deep(.payment-config-label) {
  white-space: nowrap;
}

.payment-config-card :deep(.ant-form-item-control) {
  min-width: 0;
}

.payment-config-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 16px;
}

.payment-url-fill-button {
  height: auto;
  padding: 0 4px;
}

@media (max-width: 768px) {
  .payment-config-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .payment-config-card {
    padding: 14px 16px 16px;
  }

  .payment-config-card :deep(.payment-config-label) {
    flex-basis: auto;
    max-width: none;
  }
}
</style>
