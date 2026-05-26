<script lang="ts" setup>
import type { CaptchaVerifyPassingData, VbenFormSchema } from '@vben/common-ui';
import type { Recordable } from '@vben/types';
import type { AuthApi } from '#/api';

import { computed, markRaw, onMounted, ref, useTemplateRef } from 'vue';

import { AuthenticationLogin, SliderCaptcha, z } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { getCaptchaApi, verifyCaptchaApi } from '#/api';
import { useAuthStore } from '#/store';

defineOptions({ name: 'Login' });

const authStore = useAuthStore();
const loginRef =
  useTemplateRef<InstanceType<typeof AuthenticationLogin>>('loginRef');
const captchaId = ref('');
const captcha = ref<AuthApi.CaptchaResult | null>(null);
const captchaChecking = ref(false);
const captchaVerified = ref(false);

async function loadCaptcha() {
  try {
    const res = await getCaptchaApi();
    captcha.value = res;
    captchaId.value = res.captchaId;
    captchaVerified.value = false;
  } catch {
    captcha.value = null;
    captchaId.value = '';
  }
}

async function resetCaptcha(reload = false) {
  captchaVerified.value = false;
  const formApi = loginRef.value?.getFormApi();
  await formApi?.setFieldValue('captcha', false, false);
  formApi
    ?.getFieldComponentRef<InstanceType<typeof SliderCaptcha>>('captcha')
    ?.resume();
  if (reload) {
    captcha.value = null;
    captchaId.value = '';
    await loadCaptcha();
  }
}

async function onSliderSuccess(values: CaptchaVerifyPassingData) {
  if (!captcha.value || captchaChecking.value) return;
  captchaChecking.value = true;
  try {
    await verifyCaptchaApi(captcha.value, String(values.time));
    captchaVerified.value = true;
    const formApi = loginRef.value?.getFormApi();
    await formApi?.setFieldValue('captcha', true);
    await formApi?.validateField('captcha');
  } catch {
    await resetCaptcha(true);
  } finally {
    captchaChecking.value = false;
  }
}

const formSchema = computed((): VbenFormSchema[] => {
  return [
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: $t('authentication.loginAccountTip'),
      },
      fieldName: 'username',
      label: $t('authentication.loginAccount'),
      rules: z
        .string()
        .min(1, { message: $t('authentication.loginAccountTip') }),
    },
    {
      component: 'VbenInputPassword',
      componentProps: {
        placeholder: $t('authentication.password'),
      },
      fieldName: 'password',
      label: $t('authentication.password'),
      rules: z.string().min(1, { message: $t('authentication.passwordTip') }),
    },
    {
      component: markRaw(SliderCaptcha),
      componentProps: {
        onSuccess: onSliderSuccess,
      },
      fieldName: 'captcha',
      rules: z.boolean().refine((value) => value && captchaVerified.value, {
        message: $t('authentication.verifyRequiredTip'),
      }),
    },
  ];
});

async function onSubmit(params: Recordable<any>) {
  const { captcha: _captcha, ...loginParams } = params;
  try {
    await authStore.authLogin({
      ...loginParams,
      captchaId: captchaId.value,
    });
  } catch {
    await resetCaptcha(true);
  }
}

onMounted(() => {
  loadCaptcha();
});
</script>

<template>
  <AuthenticationLogin
    ref="loginRef"
    :form-schema="formSchema"
    :loading="authStore.loginLoading"
    :show-code-login="false"
    :show-qrcode-login="false"
    :show-third-party-login="false"
    @submit="onSubmit"
  />
</template>
