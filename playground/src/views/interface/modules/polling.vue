<script lang="ts" setup>
import type { InterfaceApi } from '#/api/interface';

import { computed, nextTick, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';
import { IconifyIcon, Plus } from '@vben/icons';

import { Button, Empty, Input, message, Switch } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import {
  getInterfacePolling,
  updateInterfacePolling,
} from '#/api/interface';

import { pollingModeText, usePollingFormSchema } from '../data';

const emits = defineEmits(['success']);

interface UpstreamDraft {
  clientId: string;
  pollingCheckEnabled: boolean;
  pollingCheckExpected: string;
  pollingCheckField: string;
  url: string;
}

const current = ref<InterfaceApi.PollingConfig>();
const id = ref<string>();
const mainCheckEnabled = ref(false);
const mainCheckExpected = ref('200');
const mainCheckField = ref('code');
const upstreamRows = ref<UpstreamDraft[]>([]);

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
  },
  layout: 'horizontal',
  schema: usePollingFormSchema(),
  showDefaultActions: false,
  wrapperClass: 'grid-cols-1',
});

const [Drawer, drawerApi] = useVbenDrawer({
  class: 'w-160! max-w-[calc(100vw-32px)]!',
  async onConfirm() {
    if (!id.value) return;
    const { valid } = await formApi.validate();
    if (!valid) return;

    const values = await formApi.getValues<any>();
    const upstreamConfigs = normalizeUpstreamConfigs();
    const payload: InterfaceApi.SavePollingConfig = {
      pollingCheckEnabled: mainCheckEnabled.value ? 1 : 0,
      pollingCheckExpected: mainCheckExpected.value.trim() || '200',
      pollingCheckField: mainCheckField.value.trim() || 'code',
      pollingEnabled: values.pollingEnabled ? 1 : 0,
      pollingMode: normalizePollingMode(values.pollingMode),
      upstreamConfigs,
      upstreamUrls: upstreamConfigs.map((item) => item.url),
    };

    drawerApi.lock();
    updateInterfacePolling(id.value, payload)
      .then(() => {
        message.success('接口轮询配置已保存');
        emits('success');
        drawerApi.close();
      })
      .catch(() => {
        drawerApi.unlock();
      });
  },

  async onOpenChange(isOpen) {
    if (!isOpen) return;

    const row = drawerApi.getData<InterfaceApi.InterfaceItem>();
    id.value = row?.id;
    current.value = undefined;
    mainCheckEnabled.value = false;
    mainCheckExpected.value = '200';
    mainCheckField.value = 'code';
    upstreamRows.value = [];
    formApi.resetForm();
    if (!row?.id) return;

    drawerApi.lock();
    try {
      const data = await getInterfacePolling(row.id);
      current.value = data;
      await nextTick();
      formApi.setValues({
        pollingEnabled: data.pollingEnabled === 1,
        pollingMode: data.pollingMode === 'PRIMARY' ? 'PRIMARY' : 'ROUND_ROBIN',
      });
      mainCheckEnabled.value = data.pollingCheckEnabled === 1;
      mainCheckExpected.value = data.pollingCheckExpected ?? '200';
      mainCheckField.value = data.pollingCheckField ?? 'code';
      upstreamRows.value = upstreamRowsFromConfig(data);
    } finally {
      drawerApi.unlock();
    }
  },
});

const drawerTitle = computed(() =>
  current.value?.name ? `接口轮询 - ${current.value.name}` : '接口轮询',
);

const currentNodeText = computed(() => {
  if (!current.value || current.value.pollingEnabled !== 1) return '关闭';
  const total = current.value.upstreamCount || current.value.upstreamUrls.length || 1;
  return `${current.value.currentNode || 1}/${total}`;
});

function addUpstreamUrl(value = '') {
  upstreamRows.value.push({
    clientId: createClientId(),
    pollingCheckEnabled: false,
    pollingCheckExpected: '200',
    pollingCheckField: 'code',
    url: value,
  });
}

function removeUpstreamUrl(index: number) {
  upstreamRows.value.splice(index, 1);
}

function normalizeUpstreamConfigs() {
  const urls = new Set<string>();
  return [
    ...upstreamRows.value
      .map((item) => ({
        pollingCheckEnabled: item.pollingCheckEnabled ? 1 : 0,
        pollingCheckExpected: item.pollingCheckExpected.trim() || '200',
        pollingCheckField: item.pollingCheckField.trim() || 'code',
        url: item.url.trim(),
      }))
      .filter((item) => {
        if (!item.url || urls.has(item.url)) return false;
        urls.add(item.url);
        return true;
      }),
  ] as InterfaceApi.UpstreamConfig[];
}

function normalizePollingMode(value: unknown): InterfaceApi.PollingMode {
  return value === 'PRIMARY' || value === '主接口'
    ? 'PRIMARY'
    : 'ROUND_ROBIN';
}

function upstreamRowsFromConfig(data: InterfaceApi.PollingConfig) {
  const configs = Array.isArray(data.upstreamConfigs) && data.upstreamConfigs.length > 0
    ? data.upstreamConfigs
    : (data.upstreamUrls || []).map((url) => ({
        pollingCheckEnabled: data.pollingCheckEnabled ?? 0,
        pollingCheckExpected: data.pollingCheckExpected ?? '200',
        pollingCheckField: data.pollingCheckField ?? 'code',
        url,
      }));
  return configs.map((item) => ({
    clientId: createClientId(),
    pollingCheckEnabled: item.pollingCheckEnabled === 1,
    pollingCheckExpected: item.pollingCheckExpected ?? '200',
    pollingCheckField: item.pollingCheckField ?? 'code',
    url: item.url,
  }));
}

function createClientId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2)}`;
}
</script>

<template>
  <Drawer :title="drawerTitle">
    <div v-if="current" class="polling-summary">
      <div>
        <span>轮询状态</span>
        <strong>
          {{
            current.pollingEnabled === 1
              ? pollingModeText(current.pollingMode)
              : '关闭'
          }}
        </strong>
      </div>
      <div>
        <span>当前节点</span>
        <strong>{{ currentNodeText }}</strong>
      </div>
      <div>
        <span>当前地址</span>
        <strong>{{ current.currentNodeUrl || '-' }}</strong>
      </div>
    </div>
    <Form />
    <div v-if="current" class="main-upstream-panel">
      <div class="upstream-panel__header">
        <div>
          <div class="upstream-panel__title">主接口</div>
          <div class="upstream-panel__desc">
            主接口模式会先请求接口地址，失败或校验不通过后再切换上游。
          </div>
        </div>
      </div>
      <Input :value="current.requestUrl" disabled />
      <div class="upstream-item__check">
        <div class="upstream-item__switch">
          <span>失败校验</span>
          <Switch
            v-model:checked="mainCheckEnabled"
            checked-children="开启"
            un-checked-children="关闭"
          />
        </div>
        <Input
          v-model:value="mainCheckField"
          :disabled="!mainCheckEnabled"
          placeholder="字段，如 code 或 data.status"
        />
        <span
          :class="{ 'is-disabled': !mainCheckEnabled }"
          class="upstream-item__operator"
        >
          不等于
        </span>
        <Input
          v-model:value="mainCheckExpected"
          :disabled="!mainCheckEnabled"
          placeholder="期望值，如 200"
        />
      </div>
    </div>
    <div class="upstream-panel">
      <div class="upstream-panel__header">
        <div>
          <div class="upstream-panel__title">上游接口列表</div>
          <div class="upstream-panel__desc">
            普通轮询按下方地址顺序切换；开启响应校验后，JSON 字段不等于期望值会继续切换。
          </div>
        </div>
        <Button type="primary" @click="addUpstreamUrl()">
          <Plus class="size-4" />
          添加上游地址
        </Button>
      </div>

      <div v-if="upstreamRows.length > 0" class="upstream-list">
        <div
          v-for="(item, index) in upstreamRows"
          :key="item.clientId"
          class="upstream-item"
        >
          <div class="upstream-item__index">{{ index + 1 }}</div>
          <div class="upstream-item__content">
            <Input
              v-model:value="item.url"
              :placeholder="`请输入第 ${index + 1} 个上游接口地址`"
            />
            <div class="upstream-item__check">
              <div class="upstream-item__switch">
                <span>失败校验</span>
                <Switch
                  v-model:checked="item.pollingCheckEnabled"
                  checked-children="开启"
                  un-checked-children="关闭"
                />
              </div>
              <Input
                v-model:value="item.pollingCheckField"
                :disabled="!item.pollingCheckEnabled"
                placeholder="字段，如 code 或 data.status"
              />
              <span
                :class="{ 'is-disabled': !item.pollingCheckEnabled }"
                class="upstream-item__operator"
              >
                不等于
              </span>
              <Input
                v-model:value="item.pollingCheckExpected"
                :disabled="!item.pollingCheckEnabled"
                placeholder="期望值，如 200"
              />
            </div>
          </div>
          <Button
            danger
            type="text"
            :aria-label="`删除第 ${index + 1} 个上游地址`"
            :title="`删除第 ${index + 1} 个上游地址`"
            @click="removeUpstreamUrl(index)"
          >
            <IconifyIcon class="size-4" icon="lucide:trash-2" />
          </Button>
        </div>
      </div>
      <div v-else class="upstream-empty">
        <Empty description="暂无上游地址" />
      </div>
    </div>
  </Drawer>
</template>

<style scoped>
.polling-summary {
  display: grid;
  gap: 10px;
  margin-bottom: 18px;
  border: 1px solid hsl(var(--border));
  border-radius: 6px;
  padding: 14px;
}

.polling-summary div {
  display: grid;
  grid-template-columns: 84px minmax(0, 1fr);
  gap: 10px;
  align-items: center;
  font-size: 14px;
}

.polling-summary span {
  color: hsl(var(--muted-foreground));
}

.polling-summary strong {
  min-width: 0;
  overflow: hidden;
  color: hsl(var(--foreground));
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.main-upstream-panel {
  display: grid;
  gap: 10px;
  margin-top: 18px;
  border: 1px solid hsl(var(--border));
  border-radius: 6px;
  padding: 14px;
}

.upstream-panel {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 14px;
  margin-top: 18px;
}

.upstream-panel__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.upstream-panel__title {
  color: hsl(var(--foreground));
  font-size: 15px;
  font-weight: 600;
  line-height: 22px;
}

.upstream-panel__desc {
  margin-top: 4px;
  color: hsl(var(--muted-foreground));
  font-size: 13px;
  line-height: 20px;
}

.upstream-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.upstream-item {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) 36px;
  gap: 10px;
  align-items: flex-start;
}

.upstream-item__index {
  display: flex;
  width: 28px;
  height: 28px;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: hsl(var(--muted));
  color: hsl(var(--muted-foreground));
  font-size: 13px;
  font-weight: 600;
}

.upstream-item__content {
  display: grid;
  min-width: 0;
  gap: 8px;
}

.upstream-item__check {
  display: grid;
  grid-template-columns: 126px 160px 52px 150px;
  gap: 8px;
  align-items: center;
}

.upstream-item__switch {
  display: flex;
  align-items: center;
  gap: 8px;
  color: hsl(var(--muted-foreground));
  font-size: 13px;
  white-space: nowrap;
}

.upstream-item__operator {
  color: hsl(var(--foreground));
  font-size: 13px;
  font-weight: 500;
  text-align: center;
  white-space: nowrap;
}

.upstream-item__operator.is-disabled {
  color: hsl(var(--muted-foreground));
}

.upstream-empty {
  border: 1px dashed hsl(var(--border));
  border-radius: 6px;
  padding: 18px;
}
</style>
