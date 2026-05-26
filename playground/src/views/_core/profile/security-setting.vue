<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import { ProfileSecuritySetting } from '@vben/common-ui';

import { getUserInfoApi } from '#/api';

const email = ref('');
const mobile = ref('');

function maskEmail(val: string): string {
  if (!val) return '';
  const at = val.indexOf('@');
  if (at <= 2) return val;
  return val.substring(0, 2) + '***' + val.substring(at);
}

function maskMobile(val: string): string {
  if (!val || val.length < 7) return val;
  return val.substring(0, 3) + '****' + val.substring(val.length - 4);
}

const formSchema = computed(() => {
  return [
    {
      value: true,
      fieldName: 'accountPassword',
      label: '账户密码',
      description: '已设置登录密码',
    },
    {
      value: !!mobile.value,
      fieldName: 'securityPhone',
      label: '安全手机',
      description: mobile.value
        ? `已绑定手机：${maskMobile(mobile.value)}`
        : '未绑定手机号，可在「基本设置」中绑定',
    },
    {
      value: !!email.value,
      fieldName: 'securityEmail',
      label: '安全邮箱',
      description: email.value
        ? `已绑定邮箱：${maskEmail(email.value)}`
        : '未绑定邮箱，可在「基本设置」中绑定',
    },
    {
      value: false,
      fieldName: 'securityMfa',
      label: 'MFA 设备',
      description: '暂不支持 MFA 设备绑定',
    },
  ];
});

onMounted(async () => {
  const data = await getUserInfoApi();
  email.value = (data as any).email || '';
  mobile.value = (data as any).mobile || '';
});
</script>
<template>
  <ProfileSecuritySetting :form-schema="formSchema" />
</template>
