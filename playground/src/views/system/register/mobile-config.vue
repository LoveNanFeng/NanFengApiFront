<script lang="ts" setup>
import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Button, message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import {
  getRegisterMobileConfig,
  testRegisterMobileConfig,
  updateRegisterMobileConfig,
} from '#/api/system/register';
import { $t } from '#/locales';

const mobileLoading = ref(false);
const mobileTestLoading = ref(false);

const [MobileForm, mobileFormApi] = useVbenForm({
  commonConfig: {
    colon: true,
    componentProps: { class: 'w-full' },
    formItemClass: 'col-span-2 md:col-span-1',
  },
  layout: 'horizontal',
  schema: [
    {
      component: 'Switch',
      componentProps: {
        checkedChildren: $t('system.register.enableAction'),
        class: 'w-auto',
        unCheckedChildren: $t('system.register.disableAction'),
      },
      defaultValue: false,
      fieldName: 'enabled',
      label: $t('system.register.mobileEnabled'),
    },
    {
      component: 'Select',
      componentProps: {
        disabled: true,
        options: [
          { label: $t('system.register.providerAliyun'), value: 'aliyun' },
        ],
      },
      defaultValue: 'aliyun',
      fieldName: 'provider',
      label: $t('system.register.provider'),
      rules: 'required',
    },
    {
      component: 'Input',
      fieldName: 'accessKeyId',
      label: $t('system.register.accessKeyId'),
      rules: 'required',
    },
    {
      component: 'InputPassword',
      fieldName: 'accessKeySecret',
      label: $t('system.register.accessKeySecret'),
      rules: 'required',
    },
    {
      component: 'Input',
      fieldName: 'signName',
      label: $t('system.register.smsSignName'),
      rules: 'required',
    },
    {
      component: 'Input',
      fieldName: 'templateId',
      label: $t('system.register.smsTemplateId'),
      rules: 'required',
    },
    {
      component: 'Input',
      fieldName: 'region',
      label: $t('system.register.region'),
      rules: 'required',
    },
    {
      component: 'Input',
      fieldName: 'endpoint',
      label: $t('system.register.endpoint'),
      rules: 'required',
    },
    {
      component: 'Input',
      componentProps: { maxlength: 11 },
      fieldName: 'testMobile',
      label: $t('system.register.testMobile'),
    },
  ],
  showDefaultActions: false,
  wrapperClass: 'grid-cols-2 gap-x-4',
});

async function loadMobileConfig() {
  mobileLoading.value = true;
  try {
    const config = await getRegisterMobileConfig();
    await mobileFormApi.setValues({
      accessKeyId: config.accessKeyId ?? '',
      accessKeySecret: config.accessKeySecret ?? '',
      enabled: (config.enabled ?? 0) === 1,
      endpoint:
        config.endpoint === 'dysmsapi.aliyuncs.com'
          ? 'dypnsapi.aliyuncs.com'
          : (config.endpoint ?? 'dypnsapi.aliyuncs.com'),
      provider: 'aliyun',
      region: config.region ?? 'cn-hangzhou',
      signName: config.signName ?? '',
      templateId: config.templateId ?? '',
      testMobile: '',
    });
  } finally {
    mobileLoading.value = false;
  }
}

async function onMobileTest() {
  const values = await mobileFormApi.getValues();
  const testMobile = String(values.testMobile ?? '').trim();
  if (!/^1[3-9]\d{9}$/.test(testMobile)) {
    message.warning($t('system.register.testMobileRequired'));
    return;
  }
  const { valid } = await mobileFormApi.validate();
  if (!valid) return;
  mobileTestLoading.value = true;
  try {
    await testRegisterMobileConfig({
      ...(values as any),
      enabled: values.enabled ? 1 : 0,
      provider: 'aliyun',
      testMobile,
    });
    message.success($t('system.register.testSuccess'));
  } finally {
    mobileTestLoading.value = false;
  }
}

async function onMobileSubmit() {
  const { valid } = await mobileFormApi.validate();
  if (!valid) return;
  mobileLoading.value = true;
  try {
    const values = await mobileFormApi.getValues();
    await updateRegisterMobileConfig({
      ...(values as any),
      enabled: values.enabled ? 1 : 0,
      provider: 'aliyun',
    });
    message.success($t('system.register.saveSuccess'));
  } finally {
    mobileLoading.value = false;
  }
}

onMounted(() => {
  void loadMobileConfig();
});
</script>

<template>
  <Page auto-content-height>
    <div class="bg-card rounded-md p-6">
      <MobileForm />
      <div class="mt-4 flex justify-end gap-2">
        <Button :loading="mobileTestLoading" @click="onMobileTest">
          {{ $t('system.register.test') }}
        </Button>
        <Button type="primary" :loading="mobileLoading" @click="onMobileSubmit">
          {{ $t('system.register.save') }}
        </Button>
      </div>
    </div>
  </Page>
</template>
