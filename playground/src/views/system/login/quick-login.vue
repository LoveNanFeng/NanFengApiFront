<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Alert, Button, Input, message, Switch, Tag } from 'ant-design-vue';

import { getQqLoginConfig, updateQqLoginConfig } from '#/api/system/register';

defineOptions({ name: 'QuickLoginConfig' });

const loading = ref(false);
const saving = ref(false);

const form = reactive({
  appId: '',
  appKey: '',
  enabled: false,
  frontendBaseUrl: '',
  redirectUri: '',
  suggestedRedirectUri: '',
});

async function loadConfig() {
  loading.value = true;
  try {
    const config = await getQqLoginConfig();
    form.enabled = (config.enabled ?? 0) === 1;
    form.appId = config.appId ?? '';
    form.appKey = config.appKey ?? '';
    form.redirectUri = config.redirectUri ?? '';
    form.frontendBaseUrl = config.frontendBaseUrl ?? 'http://localhost:5555';
    form.suggestedRedirectUri = config.suggestedRedirectUri ?? '';
  } finally {
    loading.value = false;
  }
}

function useSuggestedRedirectUri() {
  if (!form.suggestedRedirectUri) return;
  form.redirectUri = form.suggestedRedirectUri;
}

function normalizeFrontendUrl() {
  form.frontendBaseUrl = form.frontendBaseUrl.trim().replace(/\/+$/, '');
}

async function saveConfig() {
  if (form.enabled) {
    if (!form.appId.trim()) {
      message.warning('请填写 QQ互联 AppID');
      return;
    }
    if (!form.appKey.trim()) {
      message.warning('请填写 QQ互联 AppKey');
      return;
    }
    if (!form.redirectUri.trim()) {
      message.warning('请填写回调地址');
      return;
    }
    if (!form.frontendBaseUrl.trim()) {
      message.warning('请填写前端地址');
      return;
    }
  }

  saving.value = true;
  try {
    normalizeFrontendUrl();
    await updateQqLoginConfig({
      appId: form.appId.trim(),
      appKey: form.appKey.trim(),
      enabled: form.enabled ? 1 : 0,
      frontendBaseUrl: form.frontendBaseUrl.trim(),
      redirectUri: form.redirectUri.trim(),
    });
    message.success('快捷登录配置保存成功');
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
    <div class="space-y-4">
      <Alert
        show-icon
        type="info"
        message="QQ 快捷登录"
        description="用户先用账号密码登录，在个人中心绑定 QQ；后续可在登录页通过 QQ 授权快捷进入系统。回调地址必须和 QQ互联后台配置完全一致。"
      />

      <div class="bg-card rounded-md p-6" :class="{ 'opacity-70': loading }">
        <div class="mb-6 flex items-center justify-between">
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-xl font-semibold">快捷登录配置</h2>
              <Tag :color="form.enabled ? 'green' : 'default'">
                {{ form.enabled ? '已启用' : '未启用' }}
              </Tag>
            </div>
            <p class="mt-1 text-sm text-muted-foreground">
              保存 QQ互联网站应用参数后，登录页会自动展示 QQ 快捷登录入口。
            </p>
          </div>
          <Button type="primary" :loading="saving" @click="saveConfig">
            保存配置
          </Button>
        </div>

        <div class="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <label class="config-item">
            <span class="config-label">启用 QQ 快捷登录</span>
            <Switch
              v-model:checked="form.enabled"
              checked-children="启用"
              un-checked-children="禁用"
            />
          </label>

          <label class="config-item">
            <span class="config-label">AppID</span>
            <Input v-model:value="form.appId" placeholder="填写 QQ互联 AppID" />
          </label>

          <label class="config-item">
            <span class="config-label">AppKey</span>
            <Input
              v-model:value="form.appKey"
              placeholder="填写 QQ互联 AppKey，已保存时会脱敏显示"
              type="password"
            />
          </label>

          <label class="config-item">
            <span class="config-label">前端地址</span>
            <Input
              v-model:value="form.frontendBaseUrl"
              placeholder="例如：https://你的域名 或 https://你的域名/#"
              @blur="normalizeFrontendUrl"
            />
          </label>

          <label class="config-item xl:col-span-2">
            <span class="config-label">回调地址</span>
            <Input
              v-model:value="form.redirectUri"
              placeholder="例如：https://你的域名/api/auth/qq/callback"
            >
              <template #addonAfter>
                <Button
                  type="link"
                  size="small"
                  @click="useSuggestedRedirectUri"
                >
                  使用建议地址
                </Button>
              </template>
            </Input>
            <span v-if="form.suggestedRedirectUri" class="config-tip">
              当前后端识别的建议回调地址：{{ form.suggestedRedirectUri }}
            </span>
          </label>
        </div>
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

.config-tip {
  font-size: 12px;
  color: hsl(var(--muted-foreground));
}
</style>
