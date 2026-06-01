<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { LOGIN_PATH } from '@vben/constants';

import { message, Spin } from 'ant-design-vue';

import { exchangeQqLoginTicketApi } from '#/api';
import { useAuthStore } from '#/store';

defineOptions({ name: 'QqCallback' });

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const statusText = ref('正在完成 QQ 快捷登录...');

onMounted(async () => {
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
