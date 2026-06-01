<script lang="ts" setup>
import type { CaptchaVerifyPassingData, VbenFormSchema } from '@vben/common-ui';
import type { Recordable } from '@vben/types';

import type { AuthApi } from '#/api';

import { computed, defineComponent, h, markRaw, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { AuthenticationRegister, SliderCaptcha, z } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { Button, Empty, message, Modal, Spin } from 'ant-design-vue';

import {
  getCaptchaApi,
  getRegisterConfigApi,
  sendRegisterEmailCodeApi,
  sendRegisterMobileCodeApi,
  verifyCaptchaApi,
} from '#/api/core/auth';
import { useAuthStore } from '#/store';

defineOptions({ name: 'Register' });

type RegisterType = 'email' | 'mobile';

const authStore = useAuthStore();
const router = useRouter();
const registerConfigLoaded = ref(false);
const registerEnabled = ref(true);
const emailRegisterEnabled = ref(false);
const mobileRegisterEnabled = ref(false);
const activeRegisterType = ref<RegisterType>('email');
const sendingCode = ref(false);
const codeCountdown = ref(0);
const sendingMobileCode = ref(false);
const mobileCodeCountdown = ref(0);
const registerClosedImage = Empty.PRESENTED_IMAGE_SIMPLE;
const captchaModalOpen = ref(false);
const captchaModalKey = ref(0);
const captchaChecking = ref(false);
const captcha = ref<AuthApi.CaptchaResult | null>(null);
const pendingCodeRequest = ref<null | {
  target: string;
  type: 'email' | 'mobile';
}>(null);

const registerTypeOptions = computed<
  Array<{ label: string; value: RegisterType }>
>(() =>
  [
    { label: '邮箱注册', value: 'email' as const },
    { label: '手机号注册', value: 'mobile' as const },
  ].filter((item) =>
    item.value === 'email'
      ? emailRegisterEnabled.value
      : mobileRegisterEnabled.value,
  ),
);

const hasEnabledRegisterMethod = computed(
  () => registerTypeOptions.value.length > 0,
);

const showRegisterTypeSwitch = computed(
  () => registerTypeOptions.value.length > 1,
);

const isEmailRegisterActive = computed(
  () => activeRegisterType.value === 'email' && emailRegisterEnabled.value,
);

const isMobileRegisterActive = computed(
  () => activeRegisterType.value === 'mobile' && mobileRegisterEnabled.value,
);

function syncActiveRegisterType() {
  if (
    (activeRegisterType.value === 'email' && emailRegisterEnabled.value) ||
    (activeRegisterType.value === 'mobile' && mobileRegisterEnabled.value)
  ) {
    return;
  }
  activeRegisterType.value = emailRegisterEnabled.value ? 'email' : 'mobile';
}

function setRegisterType(type: RegisterType) {
  if (type === 'email' && !emailRegisterEnabled.value) {
    return;
  }
  if (type === 'mobile' && !mobileRegisterEnabled.value) {
    return;
  }
  activeRegisterType.value = type;
}

function isValidEmail(value: string) {
  return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(value);
}

function isValidMobile(value: string) {
  return /^1[3-9]\d{9}$/.test(value);
}

function startCountdown() {
  codeCountdown.value = 60;
  const timer = window.setInterval(() => {
    codeCountdown.value -= 1;
    if (codeCountdown.value <= 0) {
      window.clearInterval(timer);
    }
  }, 1000);
}

function startMobileCountdown() {
  mobileCodeCountdown.value = 60;
  const timer = window.setInterval(() => {
    mobileCodeCountdown.value -= 1;
    if (mobileCodeCountdown.value <= 0) {
      window.clearInterval(timer);
    }
  }, 1000);
}

async function handleSendEmailCode(event: Event) {
  event.preventDefault();
  event.stopPropagation();

  if (!registerEnabled.value) {
    message.warning($t('authentication.registerDisabledTip'));
    return;
  }
  const email = (event.currentTarget as HTMLButtonElement).dataset.email ?? '';
  if (!isValidEmail(email)) {
    message.warning($t('authentication.emailValidErrorTip'));
    return;
  }

  await openSendCodeCaptcha({ target: email, type: 'email' });
}

async function sendEmailCode(email: string, captchaId: string) {
  sendingCode.value = true;
  try {
    await sendRegisterEmailCodeApi(email, captchaId);
    message.success($t('authentication.emailCodeSendSuccess'));
    startCountdown();
  } finally {
    sendingCode.value = false;
  }
}

async function handleSendMobileCode(event: Event) {
  event.preventDefault();
  event.stopPropagation();

  if (!registerEnabled.value) {
    message.warning($t('authentication.registerDisabledTip'));
    return;
  }
  const mobile =
    (event.currentTarget as HTMLButtonElement).dataset.mobile ?? '';
  if (!isValidMobile(mobile)) {
    message.warning($t('authentication.mobileErrortip'));
    return;
  }

  await openSendCodeCaptcha({ target: mobile, type: 'mobile' });
}

async function sendMobileCode(mobile: string, captchaId: string) {
  sendingMobileCode.value = true;
  try {
    await sendRegisterMobileCodeApi(mobile, captchaId);
    message.success($t('authentication.mobileCodeSendSuccess'));
    startMobileCountdown();
  } finally {
    sendingMobileCode.value = false;
  }
}

async function openSendCodeCaptcha(request: {
  target: string;
  type: 'email' | 'mobile';
}) {
  pendingCodeRequest.value = request;
  try {
    const res = await getCaptchaApi();
    captcha.value = res;
    captchaModalKey.value++;
    captchaModalOpen.value = true;
  } catch {
    pendingCodeRequest.value = null;
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
  pendingCodeRequest.value = null;
}

async function reloadSendCodeCaptcha() {
  try {
    const res = await getCaptchaApi();
    captcha.value = res;
    captchaModalKey.value++;
  } catch {
    captchaModalOpen.value = false;
    captcha.value = null;
    pendingCodeRequest.value = null;
    message.error('验证码加载失败，请重试');
  }
}

async function onSendCodeCaptchaSuccess(values: CaptchaVerifyPassingData) {
  if (!captcha.value || !pendingCodeRequest.value || captchaChecking.value) {
    return;
  }
  captchaChecking.value = true;
  const currentCaptcha = captcha.value;
  const currentRequest = pendingCodeRequest.value;
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
  pendingCodeRequest.value = null;
  try {
    const sendCode =
      currentRequest.type === 'email' ? sendEmailCode : sendMobileCode;
    await sendCode(currentRequest.target, currentCaptcha.captchaId);
  } catch {
    // 请求拦截器会展示接口返回的错误信息。
  } finally {
    sendingCode.value = false;
    sendingMobileCode.value = false;
  }
}

const EmailCodeInput = markRaw(
  // eslint-disable-next-line vue/one-component-per-file
  defineComponent({
    name: 'EmailCodeInput',
    props: {
      disabled: {
        default: false,
        type: Boolean,
      },
      modelValue: {
        default: '',
        type: [Number, String],
      },
      placeholder: {
        default: '',
        type: String,
      },
    },
    emits: ['update:modelValue'],
    setup(props, { emit }) {
      const emailValue = computed(() => String(props.modelValue ?? '').trim());
      const canSend = computed(
        () =>
          isValidEmail(emailValue.value) &&
          !sendingCode.value &&
          codeCountdown.value <= 0 &&
          !captchaModalOpen.value &&
          !props.disabled,
      );

      function onInput(event: Event) {
        emit('update:modelValue', (event.target as HTMLInputElement).value);
      }

      return () =>
        h(
          'div',
          {
            class:
              'border-input bg-background focus-within:border-primary flex h-10 w-full overflow-hidden rounded-md border transition-colors',
          },
          [
            h('input', {
              class:
                'placeholder:text-muted-foreground/50 h-full min-w-0 flex-1 bg-transparent px-3 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50',
              disabled: props.disabled,
              placeholder: props.placeholder,
              value: props.modelValue,
              onInput,
            }),
            h(
              'button',
              {
                class: [
                  'h-full shrink-0 border-l px-4 text-sm transition-colors',
                  canSend.value
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'bg-muted text-muted-foreground cursor-not-allowed',
                ],
                'data-email': emailValue.value,
                disabled: !canSend.value,
                type: 'button',
                onClick: handleSendEmailCode,
              },
              codeCountdown.value > 0
                ? `${codeCountdown.value}s`
                : sendingCode.value
                  ? $t('authentication.sending')
                  : $t('authentication.sendEmailCode'),
            ),
          ],
        );
    },
  }),
);

const MobileCodeInput = markRaw(
  // eslint-disable-next-line vue/one-component-per-file
  defineComponent({
    name: 'MobileCodeInput',
    props: {
      disabled: {
        default: false,
        type: Boolean,
      },
      modelValue: {
        default: '',
        type: [Number, String],
      },
      placeholder: {
        default: '',
        type: String,
      },
    },
    emits: ['update:modelValue'],
    setup(props, { emit }) {
      const mobileValue = computed(() => String(props.modelValue ?? '').trim());
      const canSend = computed(
        () =>
          isValidMobile(mobileValue.value) &&
          !sendingMobileCode.value &&
          mobileCodeCountdown.value <= 0 &&
          !captchaModalOpen.value &&
          !props.disabled,
      );

      function onInput(event: Event) {
        emit('update:modelValue', (event.target as HTMLInputElement).value);
      }

      return () =>
        h(
          'div',
          {
            class:
              'border-input bg-background focus-within:border-primary flex h-10 w-full overflow-hidden rounded-md border transition-colors',
          },
          [
            h('input', {
              class:
                'placeholder:text-muted-foreground/50 h-full min-w-0 flex-1 bg-transparent px-3 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50',
              disabled: props.disabled,
              maxlength: 11,
              placeholder: props.placeholder,
              value: props.modelValue,
              onInput,
            }),
            h(
              'button',
              {
                class: [
                  'h-full shrink-0 border-l px-4 text-sm transition-colors',
                  canSend.value
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'bg-muted text-muted-foreground cursor-not-allowed',
                ],
                'data-mobile': mobileValue.value,
                disabled: !canSend.value,
                type: 'button',
                onClick: handleSendMobileCode,
              },
              mobileCodeCountdown.value > 0
                ? `${mobileCodeCountdown.value}s`
                : sendingMobileCode.value
                  ? $t('authentication.sending')
                  : $t('authentication.sendCode'),
            ),
          ],
        );
    },
  }),
);

const formSchema = computed((): VbenFormSchema[] => {
  return [
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: $t('authentication.usernameTip'),
      },
      fieldName: 'username',
      label: $t('authentication.username'),
      rules: z
        .string({ required_error: $t('authentication.usernameTip') })
        .min(3, { message: $t('authentication.usernameTip') })
        .max(32)
        .regex(/^[\w-]+$/, { message: $t('authentication.usernameTip') }),
    },
    ...(isEmailRegisterActive.value
      ? [
          {
            component: EmailCodeInput,
            componentProps: {
              placeholder: $t('authentication.emailTip'),
            },
            fieldName: 'email',
            label: $t('authentication.email'),
            rules: z
              .string({ required_error: $t('authentication.emailTip') })
              .min(1, { message: $t('authentication.emailTip') })
              .email({ message: $t('authentication.emailValidErrorTip') }),
          } satisfies VbenFormSchema,
          {
            component: 'VbenInput',
            componentProps: {
              maxlength: 6,
              placeholder: $t('authentication.emailCodeTip'),
            },
            fieldName: 'emailCode',
            label: $t('authentication.emailCode'),
            rules: z
              .string({ required_error: $t('authentication.emailCodeTip') })
              .min(1, { message: $t('authentication.emailCodeTip') })
              .min(6, { message: $t('authentication.emailCodeTip') })
              .max(6, { message: $t('authentication.emailCodeTip') })
              .regex(/^\d{6}$/, {
                message: $t('authentication.emailCodeTip'),
              }),
          } satisfies VbenFormSchema,
        ]
      : []),
    ...(isMobileRegisterActive.value
      ? [
          {
            component: MobileCodeInput,
            componentProps: {
              placeholder: $t('authentication.mobileTip'),
            },
            fieldName: 'mobile',
            label: $t('authentication.mobile'),
            rules: z
              .string({ required_error: $t('authentication.mobileTip') })
              .min(1, { message: $t('authentication.mobileTip') })
              .regex(/^1[3-9]\d{9}$/, {
                message: $t('authentication.mobileErrortip'),
              }),
          } satisfies VbenFormSchema,
          {
            component: 'VbenInput',
            componentProps: {
              maxlength: 6,
              placeholder: $t('authentication.mobileCodeTip'),
            },
            fieldName: 'mobileCode',
            label: $t('authentication.mobileCode'),
            rules: z
              .string({ required_error: $t('authentication.mobileCodeTip') })
              .min(1, { message: $t('authentication.mobileCodeTip') })
              .min(6, { message: $t('authentication.mobileCodeTip') })
              .max(6, { message: $t('authentication.mobileCodeTip') })
              .regex(/^\d{6}$/, {
                message: $t('authentication.mobileCodeTip'),
              }),
          } satisfies VbenFormSchema,
        ]
      : []),
    {
      component: 'VbenInputPassword',
      componentProps: {
        passwordStrength: true,
        placeholder: $t('authentication.password'),
      },
      fieldName: 'password',
      label: $t('authentication.password'),
      renderComponentContent() {
        return {
          strengthText: () => $t('authentication.passwordStrength'),
        };
      },
      rules: z
        .string({ required_error: $t('authentication.passwordTip') })
        .min(6, { message: $t('authentication.passwordTip') }),
    },
    {
      component: 'VbenInputPassword',
      componentProps: {
        placeholder: $t('authentication.confirmPassword'),
      },
      dependencies: {
        rules(values) {
          const { password } = values;
          return z
            .string({ required_error: $t('authentication.passwordTip') })
            .min(1, { message: $t('authentication.passwordTip') })
            .refine((value) => value === password, {
              message: $t('authentication.confirmPasswordTip'),
            });
        },
        triggerFields: ['password'],
      },
      fieldName: 'confirmPassword',
      label: $t('authentication.confirmPassword'),
    },
    {
      component: 'VbenCheckbox',
      fieldName: 'agreePolicy',
      renderComponentContent: () => ({
        default: () =>
          h('span', [
            $t('authentication.agree'),
            h(
              'a',
              {
                class: 'vben-link ml-1 ',
                href: '',
              },
              `${$t('authentication.privacyPolicy')} & ${$t('authentication.terms')}`,
            ),
          ]),
      }),
      rules: z.boolean().refine((value) => !!value, {
        message: $t('authentication.agreeTip'),
      }),
    },
  ];
});

function handleSubmit(value: Recordable<any>) {
  if (!registerEnabled.value) {
    message.warning($t('authentication.registerDisabledTip'));
    return;
  }
  const { agreePolicy: _agreePolicy, ...registerParams } = value;
  if (activeRegisterType.value === 'email') {
    delete registerParams.mobile;
    delete registerParams.mobileCode;
  } else {
    delete registerParams.email;
    delete registerParams.emailCode;
  }
  void authStore.authRegister(registerParams);
}

function goToLogin() {
  router.push('/auth/login');
}

onMounted(async () => {
  try {
    const config = await getRegisterConfigApi();
    registerEnabled.value = !!config.registerEnabled;
    emailRegisterEnabled.value =
      registerEnabled.value && !!config.emailRegisterEnabled;
    mobileRegisterEnabled.value =
      registerEnabled.value && !!config.mobileRegisterEnabled;
    syncActiveRegisterType();
  } catch {
    registerEnabled.value = false;
    emailRegisterEnabled.value = false;
    mobileRegisterEnabled.value = false;
    syncActiveRegisterType();
  } finally {
    registerConfigLoaded.value = true;
  }
});
</script>

<template>
  <div>
    <div
      v-if="!registerConfigLoaded"
      class="flex min-h-[320px] items-center justify-center"
    >
      <Spin />
    </div>
    <div
      v-else-if="!registerEnabled || !hasEnabledRegisterMethod"
      class="flex min-h-[360px] flex-col items-center justify-center text-center"
    >
      <Empty :description="null" :image="registerClosedImage" />
      <div class="-mt-2 text-lg font-semibold text-foreground">
        管理员暂未开启注册功能
      </div>
      <div class="text-muted-foreground mt-2 max-w-[320px] text-sm leading-6">
        当前站点暂未开放新用户注册，请联系管理员开启后再进行注册。
      </div>
      <Button class="mt-6 min-w-[120px]" type="primary" @click="goToLogin">
        {{ $t('authentication.goToLogin') }}
      </Button>
    </div>
    <AuthenticationRegister
      v-else
      :form-schema="formSchema"
      :loading="authStore.loginLoading"
      @submit="handleSubmit"
    >
      <div
        v-if="showRegisterTypeSwitch"
        class="register-type-switch"
        role="tablist"
      >
        <button
          v-for="item in registerTypeOptions"
          :key="item.value"
          :aria-selected="activeRegisterType === item.value"
          class="register-type-switch__item"
          :class="{ 'is-active': activeRegisterType === item.value }"
          role="tab"
          type="button"
          @click="setRegisterType(item.value)"
        >
          {{ item.label }}
        </button>
      </div>
    </AuthenticationRegister>
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
  </div>
</template>

<style scoped>
.register-type-switch {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 3px;
  padding: 3px;
  margin: -10px 0 14px;
  background: hsl(var(--muted) / 45%);
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
}

.register-type-switch__item {
  height: 34px;
  font-size: 14px;
  font-weight: 600;
  line-height: 34px;
  color: hsl(var(--muted-foreground));
  text-align: center;
  cursor: pointer;
  border: 1px solid transparent;
  border-radius: 6px;
  transition:
    border-color 0.2s ease,
    color 0.2s ease,
    background-color 0.2s ease;
}

.register-type-switch__item:hover {
  color: hsl(var(--foreground));
  background: hsl(var(--background) / 70%);
}

.register-type-switch__item.is-active {
  color: hsl(var(--primary));
  background: hsl(var(--primary) / 8%);
  border-color: hsl(var(--primary) / 18%);
}
</style>
