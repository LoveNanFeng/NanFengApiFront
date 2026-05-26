<script lang="ts" setup>
import type { NoticeApi } from '#/api/notice';

import { computed, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import { Empty, Spin, Tag } from 'ant-design-vue';

import { getAdminNoticeDetail } from '#/api/notice';
import RichTextPreview from '#/components/rich-text-preview/index.vue';

const loading = ref(false);
const notice = ref<NoticeApi.NoticeItem>();

const [Drawer, drawerApi] = useVbenDrawer({
  async onOpenChange(isOpen) {
    if (!isOpen) return;

    const data = drawerApi.getData<NoticeApi.NoticeItem>();
    if (!data?.id) return;

    loading.value = true;
    try {
      notice.value = await getAdminNoticeDetail(data.id);
    } finally {
      loading.value = false;
    }
  },
});

const previewContent = computed(() => notice.value?.contentHtml ?? '');
</script>

<template>
  <Drawer title="公告预览">
    <Spin :spinning="loading">
      <div v-if="notice" class="notice-preview">
        <div class="notice-preview__header">
          <div>
            <div class="notice-preview__title">{{ notice.title }}</div>
            <div class="notice-preview__time">{{ notice.publishTime }}</div>
          </div>
          <div class="notice-preview__tags">
            <Tag v-if="notice.isTop === 1" color="blue">置顶</Tag>
            <Tag :color="notice.status === 1 ? 'success' : 'default'">
              {{ notice.status === 1 ? '已发布' : '已隐藏' }}
            </Tag>
          </div>
        </div>
        <div class="notice-preview__content">
          <RichTextPreview :content="previewContent" />
        </div>
      </div>
      <Empty v-else description="暂无公告内容" />
    </Spin>
  </Drawer>
</template>

<style scoped>
.notice-preview {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.notice-preview__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid hsl(var(--border));
}

.notice-preview__title {
  color: hsl(var(--foreground));
  font-size: 22px;
  font-weight: 700;
  line-height: 1.35;
}

.notice-preview__time {
  margin-top: 6px;
  color: hsl(var(--muted-foreground));
  font-size: 13px;
}

.notice-preview__tags {
  display: flex;
  flex-shrink: 0;
  gap: 8px;
}

.notice-preview__content {
  min-height: 360px;
}
</style>
