<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Profile } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';

import { message } from 'ant-design-vue';

import ProfileBase from './base-setting.vue';
import ProfileNotificationSetting from './notification-setting.vue';
import ProfilePasswordSetting from './password-setting.vue';
import ProfileSecuritySetting from './security-setting.vue';

const userStore = useUserStore();
const route = useRoute();
const router = useRouter();
const DEFAULT_LOCAL_AVATAR = '/logo.png';

const profileUserInfo = computed(() => ({
  ...userStore.userInfo,
  avatar: DEFAULT_LOCAL_AVATAR,
  realName:
    userStore.userInfo?.realName || userStore.userInfo?.username || '用户',
  userId: userStore.userInfo?.userId || '',
  username: userStore.userInfo?.username || '',
}));

const tabsValue = ref<string>('basic');

const tabs = ref([
  {
    label: '基本设置',
    value: 'basic',
  },
  {
    label: '安全设置',
    value: 'security',
  },
  {
    label: '修改密码',
    value: 'password',
  },
  {
    label: '新消息提醒',
    value: 'notice',
  },
]);

onMounted(() => {
  if (route.query.qqBind === 'success') {
    tabsValue.value = 'security';
    message.success('QQ绑定成功');
    void router.replace({ path: route.path, query: {} });
    return;
  }
  const qqError = String(route.query.qqError || '').trim();
  if (route.query.qqBind === 'failed' || qqError) {
    tabsValue.value = 'security';
    message.error(qqError || 'QQ绑定失败，请重新绑定');
    void router.replace({ path: route.path, query: {} });
  }
});
</script>
<template>
  <Profile
    v-model:model-value="tabsValue"
    title="个人中心"
    :user-info="profileUserInfo"
    :tabs="tabs"
  >
    <template #content>
      <ProfileBase v-if="tabsValue === 'basic'" />
      <ProfileSecuritySetting v-if="tabsValue === 'security'" />
      <ProfilePasswordSetting v-if="tabsValue === 'password'" />
      <ProfileNotificationSetting v-if="tabsValue === 'notice'" />
    </template>
  </Profile>
</template>
