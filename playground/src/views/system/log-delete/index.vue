<script lang="ts" setup>
import type { Dayjs } from 'dayjs';

import { onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Alert,
  Button,
  InputNumber,
  message,
  Switch,
  TimePicker,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  getUserLogCleanupConfig,
  updateUserLogCleanupConfig,
} from '#/api/system/log-cleanup';

defineOptions({ name: 'SystemLogDelete' });

interface CleanupForm {
  cleanupTime?: Dayjs;
  enabled: boolean;
  lastHiddenCount: number;
  lastRunTime: string;
  retentionDays: number;
}

const loading = ref(false);
const saving = ref(false);
const form = reactive<CleanupForm>({
  cleanupTime: dayjs('01:00', 'HH:mm') as Dayjs,
  enabled: false,
  lastHiddenCount: 0,
  lastRunTime: '',
  retentionDays: 30,
});

async function loadConfig() {
  loading.value = true;
  try {
    const config = await getUserLogCleanupConfig();
    form.enabled = (config.enabled ?? 0) === 1;
    form.cleanupTime = dayjs(config.cleanupTime || '01:00', 'HH:mm');
    form.retentionDays = Number(config.retentionDays ?? 30);
    form.lastRunTime = config.lastRunTime || '';
    form.lastHiddenCount = Number(config.lastHiddenCount ?? 0);
  } finally {
    loading.value = false;
  }
}

async function saveConfig() {
  const retentionDays = Number(form.retentionDays);
  if (!form.cleanupTime) {
    message.warning('请选择每日执行时间');
    return;
  }
  if (
    !Number.isFinite(retentionDays) ||
    retentionDays < 1 ||
    retentionDays > 3650
  ) {
    message.warning('用户日志保留天数必须在1到3650之间');
    return;
  }
  saving.value = true;
  try {
    await updateUserLogCleanupConfig({
      cleanupTime: form.cleanupTime.format('HH:mm'),
      enabled: form.enabled ? 1 : 0,
      lastHiddenCount: form.lastHiddenCount,
      lastRunTime: form.lastRunTime || null,
      retentionDays: Math.floor(retentionDays),
    });
    message.success('日志删除配置保存成功');
    await loadConfig();
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  void loadConfig();
});
</script>

<template>
  <Page auto-content-height>
    <div class="bg-card rounded-md p-6">
      <Alert
        class="mb-6"
        message="日志删除只会隐藏用户侧调用日志，管理端仍可查看完整历史记录。"
        show-icon
        type="info"
      />

      <div class="grid max-w-5xl grid-cols-1 gap-6 xl:grid-cols-2">
        <label class="config-item">
          <span class="config-label">启用日志删除</span>
          <div class="flex items-center gap-3">
            <Switch
              v-model:checked="form.enabled"
              checked-children="启用"
              un-checked-children="关闭"
            />
            <span class="text-sm text-muted-foreground">
              {{
                form.enabled
                  ? '已启用，每日按计划隐藏过期用户日志'
                  : '已关闭，不会自动隐藏用户日志'
              }}
            </span>
          </div>
        </label>

        <label class="config-item">
          <span class="config-label">每日执行时间</span>
          <TimePicker
            v-model:value="form.cleanupTime"
            class="w-full"
            format="HH:mm"
            :allow-clear="false"
            :minute-step="5"
          />
        </label>

        <label class="config-item">
          <span class="config-label">用户日志保留天数</span>
          <InputNumber
            v-model:value="form.retentionDays"
            class="w-full"
            :max="3650"
            :min="1"
            :precision="0"
            :step="1"
          />
        </label>

        <div class="config-item">
          <span class="config-label">最近执行</span>
          <div class="rounded-md border border-border px-4 py-3 text-sm">
            <div class="font-medium">
              {{ form.lastRunTime || '暂未执行' }}
            </div>
            <div class="mt-1 text-muted-foreground">
              最近隐藏 {{ form.lastHiddenCount }} 条用户侧调用日志
            </div>
          </div>
        </div>
      </div>

      <div class="mt-6 flex justify-end">
        <Button type="primary" :loading="saving || loading" @click="saveConfig">
          保存配置
        </Button>
      </div>
    </div>
  </Page>
</template>

<style scoped>
.config-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.config-label {
  font-size: 14px;
  font-weight: 600;
}
</style>
