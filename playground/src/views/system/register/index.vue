<script lang="ts" setup>
import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Button, message } from 'ant-design-vue';

import { useVbenForm, z } from '#/adapter/form';
import {
  getRegisterOpenConfig,
  updateRegisterOpenConfig,
} from '#/api/system/register';
import { $t } from '#/locales';

const openLoading = ref(false);

const [OpenForm, openFormApi] = useVbenForm({
  commonConfig: {
    colon: true,
    componentProps: { class: 'w-full' },
    formItemClass: 'col-span-1',
    labelWidth: 150,
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
      defaultValue: true,
      fieldName: 'registerEnabled',
      label: $t('system.register.openRegister'),
    },
    {
      component: 'InputNumber',
      componentProps: { max: 1000, min: 1, precision: 0, step: 1 },
      defaultValue: 1,
      fieldName: 'defaultUserQps',
      label: $t('system.register.defaultUserQps'),
      rules: z.number().min(1).max(1000),
    },
    {
      component: 'InputNumber',
      componentProps: { max: 1_000_000_000, min: 0, precision: 0, step: 100 },
      defaultValue: 0,
      fieldName: 'registerGiftPoints',
      label: $t('system.register.registerGiftPoints'),
      rules: z.number().min(0).max(1_000_000_000),
    },
    {
      component: 'InputNumber',
      componentProps: { max: 1_000_000, min: 0, precision: 0, step: 1 },
      defaultValue: 5,
      fieldName: 'verificationCodeIpMinuteLimit',
      label: $t('system.register.verificationCodeIpMinuteLimit'),
      rules: z.number().min(0).max(1_000_000),
    },
    {
      component: 'InputNumber',
      componentProps: { max: 1_000_000, min: 0, precision: 0, step: 1 },
      defaultValue: 20,
      fieldName: 'verificationCodeIpHourLimit',
      label: $t('system.register.verificationCodeIpHourLimit'),
      rules: z.number().min(0).max(1_000_000),
    },
    {
      component: 'InputNumber',
      componentProps: { max: 1_000_000, min: 0, precision: 0, step: 1 },
      defaultValue: 50,
      fieldName: 'verificationCodeIpDayLimit',
      label: $t('system.register.verificationCodeIpDayLimit'),
      rules: z.number().min(0).max(1_000_000),
    },
    {
      component: 'InputNumber',
      componentProps: { max: 1_000_000, min: 0, precision: 0, step: 1 },
      defaultValue: 10,
      fieldName: 'registerIpHourLimit',
      label: $t('system.register.registerIpHourLimit'),
      rules: z.number().min(0).max(1_000_000),
    },
  ],
  showDefaultActions: false,
  wrapperClass: 'grid-cols-1 gap-x-4 gap-y-2 md:grid-cols-2',
});

async function loadOpenConfig() {
  openLoading.value = true;
  try {
    const config = await getRegisterOpenConfig();
    await openFormApi.setValues({
      defaultUserQps: Number(config.defaultUserQps ?? 1),
      registerIpHourLimit: Number(config.registerIpHourLimit ?? 10),
      registerEnabled: (config.registerEnabled ?? 1) === 1,
      registerGiftPoints: Number(config.registerGiftPoints ?? 0),
      verificationCodeIpDayLimit: Number(config.verificationCodeIpDayLimit ?? 50),
      verificationCodeIpHourLimit: Number(config.verificationCodeIpHourLimit ?? 20),
      verificationCodeIpMinuteLimit: Number(config.verificationCodeIpMinuteLimit ?? 5),
    });
  } finally {
    openLoading.value = false;
  }
}

async function onOpenSubmit() {
  const { valid } = await openFormApi.validate();
  if (!valid) return;
  openLoading.value = true;
  try {
    const values = await openFormApi.getValues();
    const qps = Number(values.defaultUserQps ?? 1);
    const giftPoints = Number(values.registerGiftPoints ?? 0);
    const vcMinute = Number(values.verificationCodeIpMinuteLimit ?? 5);
    const vcHour = Number(values.verificationCodeIpHourLimit ?? 20);
    const vcDay = Number(values.verificationCodeIpDayLimit ?? 50);
    const regHour = Number(values.registerIpHourLimit ?? 10);
    await updateRegisterOpenConfig({
      defaultUserQps: Number.isFinite(qps) ? Math.max(1, Math.floor(qps)) : 1,
      registerIpHourLimit: Number.isFinite(regHour) ? Math.max(0, Math.floor(regHour)) : 10,
      registerEnabled: values.registerEnabled ? 1 : 0,
      registerGiftPoints: Number.isFinite(giftPoints) ? Math.max(0, Math.floor(giftPoints)) : 0,
      verificationCodeIpDayLimit: Number.isFinite(vcDay) ? Math.max(0, Math.floor(vcDay)) : 50,
      verificationCodeIpHourLimit: Number.isFinite(vcHour) ? Math.max(0, Math.floor(vcHour)) : 20,
      verificationCodeIpMinuteLimit: Number.isFinite(vcMinute) ? Math.max(0, Math.floor(vcMinute)) : 5,
    });
    message.success($t('system.register.saveSuccess'));
  } finally {
    openLoading.value = false;
  }
}

onMounted(() => {
  void loadOpenConfig();
});
</script>

<template>
  <Page auto-content-height>
    <div class="bg-card rounded-md p-6">
      <OpenForm />
      <div class="mt-4 flex justify-end">
        <Button type="primary" :loading="openLoading" @click="onOpenSubmit">
          {{ $t('system.register.save') }}
        </Button>
      </div>
    </div>
  </Page>
</template>
