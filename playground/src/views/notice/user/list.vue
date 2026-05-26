<script lang="ts" setup>
import type { NoticeApi } from '#/api/notice';

import { computed, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import {
  Button,
  Empty,
  Input,
  Modal,
  Pagination,
  Spin,
  Tag,
} from 'ant-design-vue';

import { getUserNoticeDetail, getUserNoticeList } from '#/api/notice';
import RichTextPreview from '#/components/rich-text-preview/index.vue';

const loading = ref(false);
const detailLoading = ref(false);
const detailVisible = ref(false);
const notices = ref<NoticeApi.NoticeItem[]>([]);
const currentNotice = ref<NoticeApi.NoticeItem>();
const keyword = ref('');
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
});

const previewContent = computed(() => currentNotice.value?.contentHtml ?? '');

async function queryNotices(page = 1) {
  loading.value = true;
  try {
    const result = await getUserNoticeList({
      keyword: keyword.value,
      page,
      pageSize: pagination.pageSize,
    });
    notices.value = result.items;
    pagination.current = page;
    pagination.total = result.total;
  } finally {
    loading.value = false;
  }
}

async function openNotice(row: NoticeApi.NoticeItem) {
  detailVisible.value = true;
  detailLoading.value = true;
  currentNotice.value = row;

  try {
    currentNotice.value = await getUserNoticeDetail(row.id);
  } finally {
    detailLoading.value = false;
  }
}

function onDetailClosed() {
  currentNotice.value = undefined;
}

function onSearch() {
  queryNotices(1);
}

function onReset() {
  keyword.value = '';
  queryNotices(1);
}

function onPageChange(page: number, pageSize: number) {
  pagination.pageSize = pageSize;
  queryNotices(page);
}

onMounted(() => {
  queryNotices();
});
</script>

<template>
  <Page auto-content-height>
    <div class="notice-list-page">
      <div class="notice-list-page__search">
        <Input
          v-model:value="keyword"
          allow-clear
          placeholder="搜索公告标题或摘要"
          @press-enter="onSearch"
        />
        <Button type="primary" @click="onSearch">
          <IconifyIcon class="size-4" icon="lucide:search" />
          搜索
        </Button>
        <Button @click="onReset">重置</Button>
      </div>

      <section class="notice-list-page__panel">
        <div class="notice-list-page__header">
          <div>
            <h2>公告列表</h2>
            <p>共 {{ pagination.total }} 条公告，点击公告查看详情</p>
          </div>
        </div>

        <Spin :spinning="loading">
          <div v-if="notices.length > 0" class="notice-table">
            <div class="notice-table__head">
              <span>公告内容</span>
              <span>发布时间</span>
              <span>类型</span>
              <span></span>
            </div>
            <button
              v-for="item in notices"
              :key="item.id"
              class="notice-row"
              type="button"
              @click="openNotice(item)"
            >
              <div class="notice-row__main">
                <div class="notice-row__title">{{ item.title }}</div>
                <div class="notice-row__summary">
                  {{ item.summary || '暂无摘要' }}
                </div>
              </div>
              <div class="notice-row__time">{{ item.publishTime }}</div>
              <div class="notice-row__type">
                <Tag v-if="item.isTop === 1" color="blue">置顶</Tag>
                <span v-else>普通</span>
              </div>
              <IconifyIcon
                class="notice-row__arrow"
                icon="lucide:chevron-right"
              />
            </button>
          </div>
          <Empty v-else description="暂无公告" />
        </Spin>

        <Pagination
          v-if="pagination.total > pagination.pageSize"
          v-model:current="pagination.current"
          :page-size="pagination.pageSize"
          :total="pagination.total"
          class="notice-list-page__pagination"
          simple
          @change="onPageChange"
        />
      </section>

      <Modal
        v-model:open="detailVisible"
        :destroy-on-close="true"
        :footer="null"
        :width="860"
        centered
        class="notice-detail-modal"
        @after-close="onDetailClosed"
      >
        <Spin :spinning="detailLoading">
          <article v-if="currentNotice" class="notice-detail">
            <div class="notice-detail__header">
              <div>
                <h1>{{ currentNotice.title }}</h1>
                <p>{{ currentNotice.publishTime }}</p>
              </div>
              <Tag v-if="currentNotice.isTop === 1" color="blue">置顶</Tag>
            </div>
            <div class="notice-detail__content">
              <RichTextPreview :content="previewContent" />
            </div>
          </article>
        </Spin>
      </Modal>
    </div>
  </Page>
</template>

<style scoped>
.notice-list-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
  height: 100%;
  min-height: 0;
}

.notice-list-page__search {
  display: grid;
  grid-template-columns: minmax(260px, 1fr) 120px 120px;
  gap: 10px;
  align-items: center;
  padding: 16px;
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
  background: hsl(var(--card));
}

.notice-list-page__panel {
  min-height: 0;
  flex: 1;
  padding: 24px;
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
  background: hsl(var(--card));
}

.notice-list-page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.notice-list-page__header h2 {
  margin: 0;
  color: hsl(var(--foreground));
  font-size: 20px;
  font-weight: 800;
  line-height: 1.3;
}

.notice-list-page__header p {
  margin: 6px 0 0;
  color: hsl(var(--muted-foreground));
  font-size: 13px;
}

.notice-table {
  overflow: hidden;
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
}

.notice-table__head,
.notice-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 190px 88px 32px;
  column-gap: 18px;
  align-items: center;
}

.notice-table__head {
  min-height: 46px;
  padding: 0 20px;
  color: hsl(var(--muted-foreground));
  font-size: 13px;
  font-weight: 600;
  background: hsl(var(--muted) / 45%);
  border-bottom: 1px solid hsl(var(--border));
}

.notice-row {
  width: 100%;
  min-height: 82px;
  padding: 14px 20px;
  text-align: left;
  cursor: pointer;
  background: hsl(var(--card));
  border: 0;
  border-bottom: 1px solid hsl(var(--border));
  transition:
    background 0.2s ease,
    color 0.2s ease;
}

.notice-row:last-child {
  border-bottom: 0;
}

.notice-row:hover {
  background: hsl(var(--primary) / 6%);
}

.notice-row__main {
  min-width: 0;
}

.notice-row__title {
  overflow: hidden;
  color: hsl(var(--foreground));
  font-size: 15px;
  font-weight: 700;
  line-height: 1.5;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notice-row__summary {
  display: -webkit-box;
  margin-top: 4px;
  overflow: hidden;
  color: hsl(var(--muted-foreground));
  font-size: 13px;
  line-height: 1.5;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
}

.notice-row__time,
.notice-row__type {
  color: hsl(var(--muted-foreground));
  font-size: 13px;
}

.notice-row__type {
  display: flex;
  align-items: center;
}

.notice-row__arrow {
  justify-self: end;
  color: hsl(var(--muted-foreground));
}

.notice-row:hover .notice-row__arrow {
  color: hsl(var(--primary));
}

.notice-list-page__pagination {
  margin-top: 18px;
  text-align: right;
}

.notice-detail {
  padding: 6px 4px 0;
}

.notice-detail__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 18px;
  border-bottom: 1px solid hsl(var(--border));
}

.notice-detail__header h1 {
  margin: 0;
  color: hsl(var(--foreground));
  font-size: 26px;
  font-weight: 800;
  line-height: 1.35;
}

.notice-detail__header p {
  margin: 8px 0 0;
  color: hsl(var(--muted-foreground));
  font-size: 13px;
}

.notice-detail__content {
  max-height: min(62vh, 680px);
  padding-top: 22px;
  overflow: auto;
}

@media (max-width: 900px) {
  .notice-list-page__search {
    grid-template-columns: 1fr;
  }

  .notice-list-page__panel {
    padding: 16px;
  }

  .notice-table__head {
    display: none;
  }

  .notice-row {
    grid-template-columns: minmax(0, 1fr) auto;
    row-gap: 8px;
  }

  .notice-row__main {
    grid-column: 1 / -1;
  }

  .notice-row__time,
  .notice-row__type {
    grid-column: auto;
  }

  .notice-row__arrow {
    display: none;
  }
}
</style>
