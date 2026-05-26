<script lang="ts" setup>
import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Button, message } from 'ant-design-vue';

import { useVbenForm, z } from '#/adapter/form';
import {
  getHomeNoticeConfig,
  updateHomeNoticeConfig,
} from '#/api/notice/home-notice';

const loading = ref(false);
const updateTime = ref<null | string>(null);

const [NoticeForm, noticeFormApi] = useVbenForm({
  commonConfig: {
    colon: true,
    componentProps: {
      class: 'w-full',
    },
    formItemClass: 'col-span-1',
    labelWidth: 112,
  },
  layout: 'horizontal',
  schema: [
    {
      component: 'Switch',
      componentProps: {
        checkedChildren: '启用',
        class: 'w-auto',
        unCheckedChildren: '关闭',
      },
      defaultValue: false,
      fieldName: 'enabled',
      label: '滚动公告',
    },
    {
      component: 'Textarea',
      componentProps: {
        maxlength: 300,
        placeholder: '请输入首页顶部滚动公告内容，全站仅此一条',
        rows: 4,
        showCount: true,
      },
      fieldName: 'content',
      label: '公告内容',
      rules: z.string().max(300, '首页滚动公告不能超过300个字符'),
    },
  ],
  showDefaultActions: false,
  wrapperClass: 'grid-cols-1 gap-x-4 gap-y-2',
});

async function loadConfig() {
  loading.value = true;
  try {
    const config = await getHomeNoticeConfig();
    updateTime.value = config.updateTime ?? null;
    await noticeFormApi.setValues({
      content: config.content ?? '',
      enabled: (config.enabled ?? 0) === 1,
    });
  } finally {
    loading.value = false;
  }
}

async function onSubmit() {
  const { valid } = await noticeFormApi.validate();
  if (!valid) return;

  const values = await noticeFormApi.getValues();
  const content = String(values.content ?? '').trim();
  if (values.enabled && !content) {
    message.warning('启用首页滚动公告时内容不能为空');
    return;
  }

  loading.value = true;
  try {
    await updateHomeNoticeConfig({
      content,
      enabled: values.enabled ? 1 : 0,
    });
    message.success('保存成功');
    await loadConfig();
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  void loadConfig();
});
</script>

<template>
  <Page auto-content-height>
    <div class="bg-card rounded-md p-6">
      <div class="mb-5">
        <h2 class="home-notice-title">首页滚动公告</h2>
        <p class="home-notice-desc">
          这里单独控制首页顶部滚动公告，不复用登录后的用户公告。系统固定只保留这一条配置。
        </p>
      </div>

      <NoticeForm />

      <div class="mt-5 flex items-center justify-between gap-4">
        <span class="text-muted-foreground text-sm">
          最近更新：{{ updateTime || '暂无' }}
        </span>
        <Button type="primary" :loading="loading" @click="onSubmit">
          保存配置
        </Button>
      </div>
    </div>
  </Page>
</template>

<style scoped>
.home-notice-title {
  margin: 0;
  color: hsl(var(--foreground));
  font-size: 20px;
  font-weight: 700;
}

.home-notice-desc {
  margin: 8px 0 0;
  color: hsl(var(--muted-foreground));
  font-size: 14px;
}
</style>
