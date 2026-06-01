<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import { ProfileSecuritySetting } from '@vben/common-ui';

import { Button, message, Modal, Tag } from 'ant-design-vue';

import {
  getQqBindingAuthorizeApi,
  getQqBindingStatusApi,
  getUserInfoApi,
  unbindQqApi,
} from '#/api';

const email = ref('');
const mobile = ref('');
const qqEnabled = ref(false);
const qqBound = ref(false);
const qqNickname = ref('');
const qqAvatar = ref('');
const qqBindTime = ref('');
const qqLoading = ref(false);

function maskEmail(val: string): string {
  if (!val) return '';
  const at = val.indexOf('@');
  if (at <= 2) return val;
  return `${val.substring(0, 2)}***${val.substring(at)}`;
}

function maskMobile(val: string): string {
  if (!val || val.length < 7) return val;
  return `${val.substring(0, 3)}****${val.substring(val.length - 4)}`;
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
      value: qqBound.value,
      fieldName: 'securityQq',
      label: 'QQ 快捷登录',
      description: qqBound.value
        ? `已绑定 QQ：${qqNickname.value || 'QQ用户'}`
        : qqEnabled.value
          ? '未绑定 QQ，可在下方绑定后使用快捷登录'
          : '管理员未启用 QQ 快捷登录',
    },
  ];
});

async function loadQqBinding() {
  try {
    const status = await getQqBindingStatusApi();
    qqEnabled.value = !!status.enabled;
    qqBound.value = !!status.bound;
    qqNickname.value = status.nickname || '';
    qqAvatar.value = status.avatar || '';
    qqBindTime.value = status.bindTime || '';
  } catch {
    qqEnabled.value = false;
    qqBound.value = false;
  }
}

async function bindQq() {
  if (!qqEnabled.value || qqLoading.value) return;
  qqLoading.value = true;
  try {
    const { url } = await getQqBindingAuthorizeApi();
    if (!url) {
      message.warning('QQ绑定暂不可用');
      return;
    }
    window.location.href = url;
  } finally {
    qqLoading.value = false;
  }
}

function confirmUnbindQq() {
  Modal.confirm({
    content: '解绑后将无法通过 QQ 快捷登录当前账号，确认继续吗？',
    okText: '确认解绑',
    onOk: async () => {
      await unbindQqApi();
      message.success('QQ已解绑');
      await loadQqBinding();
    },
    title: '解绑 QQ',
  });
}

onMounted(async () => {
  const [data] = await Promise.all([getUserInfoApi(), loadQqBinding()]);
  email.value = (data as any).email || '';
  mobile.value = (data as any).mobile || '';
});
</script>
<template>
  <div class="space-y-4">
    <ProfileSecuritySetting :form-schema="formSchema" />

    <div class="rounded-md border bg-card p-5">
      <div
        class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
      >
        <div class="flex items-center gap-3">
          <img
            v-if="qqAvatar"
            :src="qqAvatar"
            alt="QQ"
            class="size-12 rounded-full object-cover"
          />
          <div
            v-else
            class="flex size-12 items-center justify-center rounded-full bg-blue-50 text-blue-600"
          >
            QQ
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="font-semibold">QQ 快捷登录</span>
              <Tag :color="qqBound ? 'green' : qqEnabled ? 'blue' : 'default'">
                {{ qqBound ? '已绑定' : qqEnabled ? '可绑定' : '未启用' }}
              </Tag>
            </div>
            <p class="mt-1 text-sm text-muted-foreground">
              {{
                qqBound
                  ? `绑定账号：${qqNickname || 'QQ用户'}，绑定时间：${qqBindTime || '-'}`
                  : qqEnabled
                    ? '绑定后，下次登录可直接使用 QQ 授权进入系统。'
                    : '管理员开启 QQ 快捷登录后，这里可以绑定 QQ。'
              }}
            </p>
          </div>
        </div>

        <div class="flex gap-2">
          <Button :disabled="!qqEnabled" :loading="qqLoading" @click="bindQq">
            {{ qqBound ? '重新绑定' : '绑定 QQ' }}
          </Button>
          <Button v-if="qqBound" danger @click="confirmUnbindQq"> 解绑 </Button>
        </div>
      </div>
    </div>
  </div>
</template>
