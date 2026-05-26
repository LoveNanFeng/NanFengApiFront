<script setup lang="ts">
import type { CaptchaVerifyPassingData } from '@vben/common-ui';
import type { VbenFormSchema } from '#/adapter/form';
import type { AuthApi } from '#/api';

import { computed, ref } from 'vue';

import { ProfilePasswordSetting, SliderCaptcha, z } from '@vben/common-ui';

import { changePasswordApi, getCaptchaApi, verifyCaptchaApi } from '#/api';
import { useAuthStore } from '#/store';
import { message, Modal } from 'ant-design-vue';

const saving = ref(false);
const authStore = useAuthStore();

const captchaModalOpen = ref(false);
const captchaId = ref('');
const captcha = ref<AuthApi.CaptchaResult | null>(null);
const captchaModalKey = ref(0);
let pendingValues: Record<string, any> | null = null;

async function loadAndShowCaptcha() {
  try {
    const res = await getCaptchaApi();
    captcha.value = res;
    captchaId.value = res.captchaId;
    captchaModalKey.value++;
    captchaModalOpen.value = true;
  } catch {
    message.error('验证码加载失败，请重试');
  }
}

async function onSliderSuccess(values: CaptchaVerifyPassingData) {
  if (!captcha.value || !pendingValues) return;
  try {
    await verifyCaptchaApi(captcha.value, String(values.time));
  } catch {
    captchaModalOpen.value = false;
    captcha.value = null;
    pendingValues = null;
    return;
  }
  captchaModalOpen.value = false;
  const valuesToSubmit = pendingValues;
  pendingValues = null;
  await doChangePassword(valuesToSubmit);
}

function closeCaptchaModal() {
  captchaModalOpen.value = false;
  captcha.value = null;
  pendingValues = null;
}

const formSchema = computed((): VbenFormSchema[] => {
  return [
    {
      fieldName: 'oldPassword',
      label: '当前密码',
      component: 'VbenInputPassword',
      componentProps: { placeholder: '请输入当前密码' },
      rules: 'required',
    },
    {
      fieldName: 'newPassword',
      label: '新密码',
      component: 'VbenInputPassword',
      componentProps: {
        passwordStrength: true,
        placeholder: '请输入新密码，至少6位',
      },
      rules: z.string().min(6, '新密码至少6位'),
    },
    {
      fieldName: 'confirmPassword',
      label: '确认密码',
      component: 'VbenInputPassword',
      componentProps: { placeholder: '请再次输入新密码' },
      dependencies: {
        rules(values) {
          const { newPassword } = values;
          return z
            .string({ required_error: '请再次输入新密码' })
            .min(1, { message: '请再次输入新密码' })
            .refine((value) => value === newPassword, {
              message: '两次输入的密码不一致',
            });
        },
        triggerFields: ['newPassword'],
      },
    },
  ];
});

async function handleSubmit(values: Record<string, any>) {
  pendingValues = values;
  loadAndShowCaptcha();
}

async function doChangePassword(values: Record<string, any>) {
  saving.value = true;
  try {
    await changePasswordApi({
      captchaId: captchaId.value,
      confirmPassword: values.confirmPassword,
      newPassword: values.newPassword,
      oldPassword: values.oldPassword,
    });
    saving.value = false;
    Modal.success({
      title: '密码修改成功',
      content: '请使用新密码重新登录',
      okText: '确定',
      onOk: () => {
        authStore.logout(false);
      },
    });
  } catch {
    saving.value = false;
  }
}
</script>
<template>
  <ProfilePasswordSetting
    class="w-full md:w-1/2 lg:w-1/3"
    :form-schema="formSchema"
    @submit="handleSubmit"
  />
  <Modal
    :open="captchaModalOpen"
    :closable="false"
    :mask-closable="false"
    title="安全验证"
    :footer="null"
    width="380px"
    @cancel="closeCaptchaModal"
  >
    <div class="space-y-4 py-2">
      <p class="text-sm text-gray-500">请完成滑块验证以确认修改密码</p>
      <SliderCaptcha
        :key="captchaModalKey"
        @success="onSliderSuccess"
      />
    </div>
  </Modal>
</template>
