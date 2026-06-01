<script lang="ts" setup>
import type { CaptchaVerifyPassingData, VbenFormSchema } from '@vben/common-ui';
import type { Recordable } from '@vben/types';

import type { AuthApi } from '#/api';

import { computed, markRaw, onMounted, ref, useTemplateRef } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { AuthenticationLogin, SliderCaptcha, z } from '@vben/common-ui';
import { SvgQQChatIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { VbenIconButton } from '@vben-core/shadcn-ui';

import { message } from 'ant-design-vue';

import { getCaptchaApi, getQqLoginUrlApi, verifyCaptchaApi } from '#/api';
import { useAuthStore } from '#/store';

defineOptions({ name: 'Login' });

const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();
const loginRef =
  useTemplateRef<InstanceType<typeof AuthenticationLogin>>('loginRef');
const captchaId = ref('');
const captcha = ref<AuthApi.CaptchaResult | null>(null);
const captchaChecking = ref(false);
const captchaVerified = ref(false);
const qqLoginLoading = ref(false);

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
      rules: z
        .boolean()
        .refine(
          (value) => value && (captchaVerified.value || captchaChecking.value),
          {
            message: $t('authentication.verifyRequiredTip'),
          },
        ),
    },
  ];
});

async function onSubmit(params: Recordable<any>) {
  const { captcha: _captcha, ...loginParams } = params;
  if (captchaChecking.value) {
    message.info('验证码验证中，请稍候');
    return;
  }
  if (!captchaVerified.value) {
    message.warning($t('authentication.verifyRequiredTip'));
    return;
  }
  try {
    await authStore.authLogin({
      ...loginParams,
      captchaId: captchaId.value,
    });
  } catch {
    await resetCaptcha(true);
  }
}

async function onQqLogin() {
  if (qqLoginLoading.value) return;
  qqLoginLoading.value = true;
  try {
    const { url } = await getQqLoginUrlApi();
    if (!url) {
      message.warning('QQ快捷登录暂不可用');
      return;
    }
    window.location.href = url;
  } catch {
    message.warning('QQ快捷登录暂不可用，请稍后再试');
  } finally {
    qqLoginLoading.value = false;
  }
}

onMounted(() => {
  loadCaptcha();
  const qqError = String(route.query.qqError || '').trim();
  if (qqError) {
    message.error(qqError);
    void router.replace({ path: route.path, query: {} });
  }
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
  >
    <template #third-party-login>
      <div class="mt-4">
        <div class="mb-3 flex items-center gap-3 text-xs text-muted-foreground">
          <span class="h-px flex-1 bg-border"></span>
          <span>快捷登录</span>
          <span class="h-px flex-1 bg-border"></span>
        </div>
        <div class="flex flex-wrap justify-center">
          <VbenIconButton
            :disabled="qqLoginLoading"
            tooltip="QQ 快捷登录"
            tooltip-side="top"
            class="mb-3"
            @click="onQqLogin"
          >
            <SvgQQChatIcon />
          </VbenIconButton>
        </div>
      </div>
    </template>
  </AuthenticationLogin>
</template>
