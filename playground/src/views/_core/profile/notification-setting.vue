<script setup lang="ts">
import type { Recordable } from '@vben/types';

import { computed, ref } from 'vue';

import { ProfileNotificationSetting } from '@vben/common-ui';

const STORAGE_KEY = 'nanfeng_notification_prefs';

function loadPrefs(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function savePrefs(prefs: Record<string, boolean>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

const prefs = ref<Record<string, boolean>>(loadPrefs());

const formSchema = computed(() => {
  return [
    {
      value: prefs.value.systemMessage !== false,
      fieldName: 'systemMessage',
      label: '系统消息',
      description: '系统消息将以站内信的形式通知',
    },
    {
      value: prefs.value.todoTask !== false,
      fieldName: 'todoTask',
      label: '待办任务',
      description: '待办任务将以站内信的形式通知',
    },
  ];
});

function handleChange(values: Recordable<any>) {
  const fieldName = String(values.fieldName ?? '');
  if (!fieldName) {
    return;
  }
  prefs.value = { ...prefs.value, [fieldName]: Boolean(values.value) };
  savePrefs(prefs.value);
}
</script>
<template>
  <ProfileNotificationSetting
    :form-schema="formSchema"
    @change="handleChange"
  />
</template>
