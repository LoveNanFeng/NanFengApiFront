<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { LOGIN_PATH } from '@vben/constants';

import { message, Spin } from 'ant-design-vue';

import { exchangeQqLoginTicketApi } from '#/api';
import { restoreAccessTokenFromCookie } from '#/composables/use-auth-session';
import { useAuthStore } from '#/store';

defineOptions({ name: 'QqCallback' });

const PROFILE_PATH = '/profile';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const statusText = ref('正在完成 QQ 快捷登录...');

async function handleQqBindCallback(qqBind: string) {
  const qqError = String(route.query.qqError || '').trim();
  statusText.value =
    qqBind === 'success'
      ? '正在同步 QQ 绑定状态...'
      : 'QQ绑定失败，正在返回个人中心...';

  if (!(await restoreAccessTokenFromCookie())) {
    message.error(qqError || '登录状态已失效，请重新登录后查看 QQ 绑定状态');
    await router.replace(LOGIN_PATH);
    return;
  }

  await router.replace({
    path: PROFILE_PATH,
    query:
      qqBind === 'success'
        ? { qqBind: 'success' }
        : { qqBind: 'failed', ...(qqError ? { qqError } : {}) },
  });
}

onMounted(async () => {
  const qqBind = String(route.query.qqBind || '').trim();
  if (qqBind) {
    await handleQqBindCallback(qqBind);
    return;
  }

  const ticket = String(route.query.ticket || '').trim();
  if (!ticket) {
    message.error('QQ登录票据不存在，请重新登录');
    await router.replace(LOGIN_PATH);
    return;
  }

  try {
    const { accessToken } = await exchangeQqLoginTicketApi(ticket);
    await authStore.authLoginByAccessToken(accessToken);
  } catch {
    statusText.value = 'QQ快捷登录失败，请重新登录';
    await router.replace(LOGIN_PATH);
  }
});
</script>

<template>
  <div class="flex min-h-[240px] flex-col items-center justify-center gap-4">
    <Spin />
    <div class="text-sm text-muted-foreground">{{ statusText }}</div>
  </div>
</template>
