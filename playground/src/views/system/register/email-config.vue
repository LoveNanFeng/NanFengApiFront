<script lang="ts" setup>
import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Button, message } from 'ant-design-vue';

import { useVbenForm, z } from '#/adapter/form';
import {
  getRegisterEmailConfig,
  getRegisterMobileConfig,
  testRegisterEmailConfig,
  updateRegisterEmailConfig,
} from '#/api/system/register';
import { $t } from '#/locales';

const emailLoading = ref(false);
const emailTestLoading = ref(false);
const mobileEnabled = ref<0 | 1>(0);

const [EmailForm, emailFormApi] = useVbenForm({
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
      defaultValue: true,
      fieldName: 'enabled',
      label: $t('system.register.enabled'),
    },
    {
      component: 'Input',
      fieldName: 'smtpServer',
      label: $t('system.register.smtpServer'),
      rules: 'required',
    },
    {
      component: 'InputNumber',
      componentProps: { max: 65_535, min: 1 },
      fieldName: 'smtpPort',
      label: $t('system.register.smtpPort'),
      rules: z.number().min(1).max(65_535),
    },
    {
      component: 'Input',
      fieldName: 'senderEmail',
      label: $t('system.register.senderEmail'),
      rules: z.string().email(),
    },
    {
      component: 'InputPassword',
      fieldName: 'authCode',
      label: $t('system.register.authCode'),
      rules: 'required',
    },
    {
      component: 'Input',
      fieldName: 'senderName',
      label: $t('system.register.senderName'),
      rules: 'required',
    },
    {
      component: 'Input',
      fieldName: 'testEmail',
      label: $t('system.register.testEmail'),
    },
  ],
  showDefaultActions: false,
  wrapperClass: 'grid-cols-2 gap-x-4',
});

async function loadEmailConfig() {
  emailLoading.value = true;
  try {
    const config = await getRegisterEmailConfig();
    await emailFormApi.setValues({
      authCode: config.authCode ?? '',
      enabled: (config.enabled ?? 0) === 1,
      senderEmail: config.senderEmail ?? '',
      senderName: config.senderName ?? '',
      smtpPort: config.smtpPort ?? 465,
      smtpServer: config.smtpServer ?? '',
      testEmail: '',
    });
  } finally {
    emailLoading.value = false;
  }
}

async function loadMobileEnabled() {
  try {
    const config = await getRegisterMobileConfig();
    mobileEnabled.value = config.enabled ?? 0;
  } catch {
    mobileEnabled.value = 0;
  }
}

async function onEmailTest() {
  const values = await emailFormApi.getValues();
  const testEmail = String(values.testEmail ?? '').trim();
  if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(testEmail)) {
    message.warning($t('system.register.testEmailRequired'));
    return;
  }
  const { valid } = await emailFormApi.validate();
  if (!valid) return;
  emailTestLoading.value = true;
  try {
    await testRegisterEmailConfig({
      ...(values as any),
      enabled: values.enabled ? 1 : 0,
      testEmail,
    });
    message.success($t('system.register.testSuccess'));
  } finally {
    emailTestLoading.value = false;
  }
}

async function onEmailSubmit() {
  const { valid } = await emailFormApi.validate();
  if (!valid) return;
  emailLoading.value = true;
  try {
    const values = await emailFormApi.getValues();
    if (values.enabled && mobileEnabled.value === 1) {
      message.warning($t('system.register.emailMobileConflict'));
      return;
    }
    await updateRegisterEmailConfig({
      ...(values as any),
      enabled: values.enabled ? 1 : 0,
    });
    message.success($t('system.register.saveSuccess'));
  } finally {
    emailLoading.value = false;
  }
}

onMounted(() => {
  void loadEmailConfig();
  void loadMobileEnabled();
});
</script>

<template>
  <Page auto-content-height>
    <div class="bg-card rounded-md p-6">
      <EmailForm />
      <div class="mt-4 flex justify-end gap-2">
        <Button :loading="emailTestLoading" @click="onEmailTest">
          {{ $t('system.register.test') }}
        </Button>
        <Button type="primary" :loading="emailLoading" @click="onEmailSubmit">
          {{ $t('system.register.save') }}
        </Button>
      </div>
    </div>
  </Page>
</template>
