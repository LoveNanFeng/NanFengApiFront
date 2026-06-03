<script lang="ts" setup>
import type { CaptchaVerifyPassingData, VbenFormSchema } from '@vben/common-ui';

import type { AuthApi } from '#/api';

import { computed, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import {
  AuthenticationForgetPassword,
  SliderCaptcha,
  z,
} from '@vben/common-ui';

import { message, Modal } from 'ant-design-vue';

import {
  checkPasswordResetAccountApi,
  getCaptchaApi,
  resetPasswordApi,
  sendPasswordResetEmailCodeApi,
  verifyCaptchaApi,
  verifyPasswordResetCodeApi,
} from '#/api';

defineOptions({ name: 'ForgetPassword' });

type ResetStep = 'account' | 'reset' | 'verify';

const router = useRouter();
const step = ref<ResetStep>('account');
const loading = ref(false);
const sendingCode = ref(false);
const codeCountdown = ref(0);
const account = ref('');
const maskedEmail = ref('');
const resetToken = ref('');
const captchaModalOpen = ref(false);
const captchaModalKey = ref(0);
const captchaChecking = ref(false);
const captcha = ref<AuthApi.CaptchaResult | null>(null);
let countdownTimer: null | number = null;

const pageTitle = computed(() => {
  if (step.value === 'verify') {
    return '邮箱验证';
  }
  if (step.value === 'reset') {
    return '设置新密码';
  }
  return '找回密码';
});

const pageSubTitle = computed(() => {
  if (step.value === 'verify') {
    return `验证码将发送至 ${maskedEmail.value}`;
  }
  if (step.value === 'reset') {
    return '验证已通过，请设置新的登录密码';
  }
  return '请输入账号，确认后会展示已绑定的安全邮箱';
});

const submitButtonText = computed(() => {
  if (step.value === 'verify') {
    return '验证验证码';
  }
  if (step.value === 'reset') {
    return '确认修改密码';
  }
  return '下一步';
});

const sendCodeText = computed(() => {
  if (codeCountdown.value > 0) {
    return `${codeCountdown.value}s 后重发`;
  }
  return sendingCode.value ? '发送中' : '发送验证码';
});

const formSchema = computed((): VbenFormSchema[] => {
  if (step.value === 'verify') {
    return [
      {
        component: 'VbenInput',
        componentProps: {
          maxlength: 6,
          placeholder: '请输入6位邮箱验证码',
        },
        fieldName: 'code',
        label: '邮箱验证码',
        rules: z
          .string({ required_error: '请输入6位邮箱验证码' })
          .regex(/^\d{6}$/, { message: '请输入6位邮箱验证码' }),
      },
    ];
  }

  if (step.value === 'reset') {
    return [
      {
        component: 'VbenInputPassword',
        componentProps: {
          passwordStrength: true,
          placeholder: '请输入新密码',
        },
        fieldName: 'password',
        label: '新密码',
        rules: z
          .string({ required_error: '请输入新密码' })
          .min(6, { message: '密码长度至少6位' })
          .max(64, { message: '密码长度不能超过64位' }),
      },
      {
        component: 'VbenInputPassword',
        componentProps: {
          placeholder: '请再次输入新密码',
        },
        dependencies: {
          rules(values) {
            const { password } = values;
            return z
              .string({ required_error: '请再次输入新密码' })
              .min(1, { message: '请再次输入新密码' })
              .refine((value) => value === password, {
                message: '两次输入的密码不一致',
              });
          },
          triggerFields: ['password'],
        },
        fieldName: 'confirmPassword',
        label: '确认密码',
      },
    ];
  }

  return [
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: '请输入用户名、邮箱或手机号',
      },
      fieldName: 'account',
      label: '账号',
      rules: z
        .string({ required_error: '请输入账号' })
        .min(1, { message: '请输入账号' })
        .max(128, { message: '账号长度不能超过128位' }),
    },
  ];
});

function startCountdown() {
  codeCountdown.value = 60;
  if (countdownTimer !== null) {
    window.clearInterval(countdownTimer);
  }
  countdownTimer = window.setInterval(() => {
    codeCountdown.value -= 1;
    if (codeCountdown.value <= 0 && countdownTimer !== null) {
      window.clearInterval(countdownTimer);
      countdownTimer = null;
    }
  }, 1000);
}

async function sendCode() {
  if (!account.value || sendingCode.value || codeCountdown.value > 0) {
    return;
  }
  await openSendCodeCaptcha();
}

async function sendPasswordResetCode(captchaId: string) {
  sendingCode.value = true;
  try {
    await sendPasswordResetEmailCodeApi(account.value, captchaId);
    message.success('验证码已发送，请查看邮箱');
    startCountdown();
  } finally {
    sendingCode.value = false;
  }
}

async function openSendCodeCaptcha() {
  try {
    const res = await getCaptchaApi();
    captcha.value = res;
    captchaModalKey.value++;
    captchaModalOpen.value = true;
  } catch {
    captcha.value = null;
    message.error('验证码加载失败，请重试');
  }
}

function closeSendCodeCaptcha() {
  if (captchaChecking.value) {
    return;
  }
  captchaModalOpen.value = false;
  captcha.value = null;
}

async function reloadSendCodeCaptcha() {
  try {
    const res = await getCaptchaApi();
    captcha.value = res;
    captchaModalKey.value++;
  } catch {
    captchaModalOpen.value = false;
    captcha.value = null;
    message.error('验证码加载失败，请重试');
  }
}

async function onSendCodeCaptchaSuccess(values: CaptchaVerifyPassingData) {
  if (!captcha.value || captchaChecking.value) {
    return;
  }
  captchaChecking.value = true;
  const currentCaptcha = captcha.value;
  try {
    await verifyCaptchaApi(currentCaptcha, String(values.time));
  } catch {
    await reloadSendCodeCaptcha();
    captchaChecking.value = false;
    return;
  }

  captchaChecking.value = false;
  captchaModalOpen.value = false;
  captcha.value = null;
  try {
    await sendPasswordResetCode(currentCaptcha.captchaId);
  } catch {
    // 请求拦截器会展示接口返回的错误信息。
  } finally {
    sendingCode.value = false;
  }
}

function backToAccount() {
  step.value = 'account';
  account.value = '';
  maskedEmail.value = '';
  resetToken.value = '';
  codeCountdown.value = 0;
  if (countdownTimer !== null) {
    window.clearInterval(countdownTimer);
    countdownTimer = null;
  }
}

async function handleSubmit(value: Record<string, unknown>) {
  if (loading.value) {
    return;
  }
  loading.value = true;
  try {
    if (step.value === 'account') {
      const nextAccount = String(value.account ?? '').trim();
      const result = await checkPasswordResetAccountApi(nextAccount);
      account.value = nextAccount;
      maskedEmail.value = result.maskedEmail;
      step.value = 'verify';
      message.success('账号已确认，请发送邮箱验证码');
      return;
    }

    if (step.value === 'verify') {
      const code = String(value.code ?? '').trim();
      const result = await verifyPasswordResetCodeApi(account.value, code);
      resetToken.value = result.resetToken;
      step.value = 'reset';
      message.success('邮箱验证通过，请设置新密码');
      return;
    }

    await resetPasswordApi(
      resetToken.value,
      String(value.password ?? ''),
      String(value.confirmPassword ?? ''),
    );
    message.success('密码已修改，请使用新密码登录');
    await router.push('/auth/login');
  } finally {
    loading.value = false;
  }
}

onUnmounted(() => {
  if (countdownTimer !== null) {
    window.clearInterval(countdownTimer);
  }
  captchaModalOpen.value = false;
  captcha.value = null;
});
</script>

<template>
  <AuthenticationForgetPassword
    :key="step"
    :form-schema="formSchema"
    :loading="loading"
    :submit-button-text="submitButtonText"
    :sub-title="pageSubTitle"
    :title="pageTitle"
    @submit="handleSubmit"
  >
    <div v-if="step !== 'account'" class="reset-step-card">
      <div>
        <div class="reset-step-card__label">当前账号</div>
        <div class="reset-step-card__value">{{ account }}</div>
      </div>
      <button
        class="reset-step-card__link"
        type="button"
        @click="backToAccount"
      >
        重新输入
      </button>
    </div>

    <div v-if="step === 'verify'" class="reset-email-card">
      <div>
        <div class="reset-email-card__label">安全邮箱</div>
        <div class="reset-email-card__value">{{ maskedEmail }}</div>
      </div>
      <button
        class="reset-email-card__button"
        :disabled="sendingCode || codeCountdown > 0"
        type="button"
        @click="sendCode"
      >
        {{ sendCodeText }}
      </button>
    </div>
  </AuthenticationForgetPassword>
  <Modal
    :closable="!captchaChecking"
    :footer="null"
    :mask-closable="false"
    :open="captchaModalOpen"
    title="安全验证"
    width="380px"
    @cancel="closeSendCodeCaptcha"
  >
    <div class="space-y-4 py-2">
      <p class="text-sm text-gray-500">
        请完成滑块验证，验证通过后会自动发送验证码。
      </p>
      <SliderCaptcha
        :key="captchaModalKey"
        @success="onSendCodeCaptchaSuccess"
      />
    </div>
  </Modal>
</template>

<style scoped>
.reset-step-card,
.reset-email-card {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  margin-bottom: 14px;
  background: hsl(var(--muted) / 32%);
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
}

.reset-email-card {
  background: hsl(var(--primary) / 6%);
  border-color: hsl(var(--primary) / 18%);
}

.reset-step-card__label,
.reset-email-card__label {
  margin-bottom: 3px;
  font-size: 12px;
  color: hsl(var(--muted-foreground));
}

.reset-step-card__value,
.reset-email-card__value {
  max-width: 240px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 14px;
  font-weight: 700;
  color: hsl(var(--foreground));
  white-space: nowrap;
}

.reset-step-card__link,
.reset-email-card__button {
  flex: 0 0 auto;
  height: 32px;
  padding: 0 12px;
  font-size: 13px;
  font-weight: 700;
  color: hsl(var(--primary));
  cursor: pointer;
  background: hsl(var(--background));
  border: 1px solid hsl(var(--border));
  border-radius: 7px;
}

.reset-email-card__button {
  color: hsl(var(--primary-foreground));
  background: hsl(var(--primary));
  border-color: hsl(var(--primary));
}

.reset-email-card__button:disabled {
  color: hsl(var(--muted-foreground));
  cursor: not-allowed;
  background: hsl(var(--muted));
  border-color: hsl(var(--border));
}
</style>
