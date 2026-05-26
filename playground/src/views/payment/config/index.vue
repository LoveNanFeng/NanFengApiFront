<script lang="ts" setup>
import type { PaymentConfigApi } from '#/api/system/payment';

import { h, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Alert, Button, message, Tag } from 'ant-design-vue';

import { useVbenForm, z } from '#/adapter/form';
import {
  getAlipayConfig,
  updateAlipayConfig,
  validateAlipayConfig,
} from '#/api/system/payment';
import { $t } from '#/locales';

const loading = ref(false);
const validateLoading = ref(false);
const enabled = ref<0 | 1>(0);
const updateTime = ref<null | string>(null);
const savedRemark = ref('');

const ALIPAY_NOTIFY_PATH = '/payment/alipay/notify';
const DEFAULT_GATEWAY_URL = 'https://openapi.alipay.com/gateway.do';
const DEFAULT_RETURN_ROUTE = '/workspace';

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
      formItemClass: 'col-span-6 lg:col-span-3',
      label: $t('system.payment.alipayEnabled'),
    },
    {
      component: 'Input',
      fieldName: 'appId',
      formItemClass: 'col-span-6 lg:col-span-3',
      label: $t('system.payment.appId'),
    },
    {
      component: 'Textarea',
      componentProps: {
        autoSize: { maxRows: 8, minRows: 5 },
        placeholder: $t('system.payment.privateKeyPlaceholder'),
      },
      fieldName: 'merchantPrivateKey',
      formItemClass: 'col-span-6 lg:col-span-3',
      label: $t('system.payment.merchantPrivateKey'),
    },
    {
      component: 'Textarea',
      componentProps: {
        autoSize: { maxRows: 8, minRows: 5 },
        placeholder: $t('system.payment.publicKeyPlaceholder'),
      },
      fieldName: 'alipayPublicKey',
      formItemClass: 'col-span-6 lg:col-span-3',
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
              fillNotifyUrl();
            },
          },
          () => $t('system.payment.autoFill'),
        ),
        placeholder: $t('system.payment.notifyUrlPlaceholder'),
      }),
      fieldName: 'notifyUrl',
      formItemClass: 'col-span-6 lg:col-span-3',
      help: $t('system.payment.notifyUrlHelp'),
      label: $t('system.payment.notifyUrl'),
      rules: z
        .string()
        .url()
        .or(z.literal(''))
        .optional(),
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
      formItemClass: 'col-span-6 lg:col-span-3',
      help: $t('system.payment.returnUrlHelp'),
      label: $t('system.payment.returnUrl'),
      rules: z
        .string()
        .url()
        .or(z.literal(''))
        .optional(),
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

function defaultNotifyUrl() {
  return `${apiBaseUrl()}${ALIPAY_NOTIFY_PATH}`;
}

function defaultReturnUrl() {
  return `${frontendBaseUrl()}/#${DEFAULT_RETURN_ROUTE}`;
}

async function fillNotifyUrl() {
  await alipayFormApi.setValues({ notifyUrl: defaultNotifyUrl() });
  message.success($t('system.payment.autoFillSuccess'));
}

async function fillReturnUrl() {
  await alipayFormApi.setValues({ returnUrl: defaultReturnUrl() });
  message.success($t('system.payment.autoFillSuccess'));
}

async function loadConfig() {
  loading.value = true;
  try {
    const config = await getAlipayConfig();
    enabled.value = config.enabled ?? 0;
    updateTime.value = config.updateTime ?? null;
    savedRemark.value = config.remark ?? '';
    await alipayFormApi.setValues({
      alipayPublicKey: config.alipayPublicKey ?? '',
      appId: config.appId ?? '',
      enabled: (config.enabled ?? 0) === 1,
      facePayEnabled: (config.facePayEnabled ?? 0) === 1,
      merchantPrivateKey: config.merchantPrivateKey ?? '',
      notifyUrl: config.notifyUrl ?? '',
      returnUrl: config.returnUrl ?? '',
      wapPayEnabled: (config.wapPayEnabled ?? 1) === 1,
      websitePayEnabled: (config.websitePayEnabled ?? 1) === 1,
    });
  } finally {
    loading.value = false;
  }
}

async function buildPayload(): Promise<PaymentConfigApi.AlipayConfig> {
  const values = await alipayFormApi.getValues();
  const enabledValue: 0 | 1 = values.enabled ? 1 : 0;
  return {
    alipayPublicKey: String(values.alipayPublicKey ?? '').trim(),
    appId: String(values.appId ?? '').trim(),
    charsetName: 'UTF-8' as const,
    enabled: enabledValue,
    facePayEnabled: values.facePayEnabled ? 1 : 0,
    formatType: 'JSON' as const,
    gatewayUrl: DEFAULT_GATEWAY_URL,
    merchantPrivateKey: String(values.merchantPrivateKey ?? '').trim(),
    notifyUrl: String(values.notifyUrl ?? '').trim(),
    remark: savedRemark.value.trim(),
    returnUrl: String(values.returnUrl ?? '').trim(),
    signType: 'RSA2' as const,
    wapPayEnabled: values.wapPayEnabled ? 1 : 0,
    websitePayEnabled: values.websitePayEnabled ? 1 : 0,
  };
}

async function onValidate() {
  const { valid } = await alipayFormApi.validate();
  if (!valid) return;

  validateLoading.value = true;
  try {
    await validateAlipayConfig(await buildPayload());
    message.success($t('system.payment.validateSuccess'));
  } finally {
    validateLoading.value = false;
  }
}

async function onSubmit() {
  const { valid } = await alipayFormApi.validate();
  if (!valid) return;

  loading.value = true;
  try {
    await updateAlipayConfig(await buildPayload());
    message.success($t('system.payment.saveSuccess'));
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
            {{ $t('system.payment.alipayTitle') }}
            <Tag v-if="enabled === 1" color="success">
              {{ $t('system.payment.enabledTag') }}
            </Tag>
            <Tag v-else>
              {{ $t('system.payment.disabledTag') }}
            </Tag>
          </div>
          <div class="payment-config-desc">
            {{ $t('system.payment.alipayDescription') }}
          </div>
        </div>
        <div v-if="updateTime" class="payment-config-time">
          {{ $t('system.payment.updateTime') }}：{{ updateTime }}
        </div>
      </div>

      <Alert
        class="payment-config-alert"
        show-icon
        type="info"
        :message="$t('system.payment.officialTip')"
        :description="$t('system.payment.officialDescription')"
      />

      <div class="payment-config-card">
        <AlipayForm />
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
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
  background: hsl(var(--card));
}

.payment-config-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 24px;
}

.payment-config-title {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  color: hsl(var(--foreground));
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 0;
}

.payment-config-desc,
.payment-config-time {
  margin-top: 6px;
  color: hsl(var(--muted-foreground));
  font-size: 14px;
}

.payment-config-card {
  padding: 24px;
}

.payment-config-card :deep(.payment-config-label) {
  white-space: nowrap;
}

.payment-config-card :deep(.ant-form-item-control) {
  min-width: 0;
}

.payment-config-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
}

.payment-url-fill-button {
  height: auto;
  padding: 0 4px;
}

@media (max-width: 768px) {
  .payment-config-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .payment-config-card {
    padding: 16px;
  }

  .payment-config-card :deep(.payment-config-label) {
    flex-basis: auto;
    max-width: none;
  }
}
</style>
