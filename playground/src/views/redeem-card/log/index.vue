<script lang="ts" setup>
import type { RedeemCardApi } from '#/api/redeem-card';

import { onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Button, Input, Pagination, Select, Table, Tag } from 'ant-design-vue';

import { getRedeemCardLogs } from '#/api/redeem-card';

const cardTypeOptions: Array<{
  label: string;
  value: RedeemCardApi.CardType;
}> = [
  { label: '余额卡密', value: 'BALANCE' },
  { label: '全站套餐卡密', value: 'GLOBAL_PACKAGE' },
  { label: '接口套餐卡密', value: 'INTERFACE_PACKAGE' },
  { label: '点数套餐卡密', value: 'POINT_PACKAGE' },
];

const tableScroll = { x: 1060 };

const filters = reactive<RedeemCardApi.LogParams>({
  cardType: undefined,
  keyword: '',
  page: 1,
  pageSize: 10,
});

const logs = ref<RedeemCardApi.LogItem[]>([]);
const loading = ref(false);
const total = ref(0);

const columns = [
  { dataIndex: 'cardCode', key: 'cardCode', title: '卡密', width: 250 },
  { dataIndex: 'cardType', key: 'cardType', title: '类型', width: 130 },
  {
    dataIndex: 'rewardSummary',
    key: 'rewardSummary',
    title: '奖励内容',
    width: 260,
  },
  { dataIndex: 'user', key: 'user', title: '使用者', width: 170 },
  { dataIndex: 'clientIp', key: 'clientIp', title: '来源IP', width: 150 },
  { dataIndex: 'createTime', key: 'createTime', title: '使用时间', width: 180 },
];

function cardTypeText(type?: RedeemCardApi.CardType | string) {
  return (
    cardTypeOptions.find((item) => item.value === type)?.label ??
    String(type || '-')
  );
}

function normalizeText(value?: null | string) {
  return value && value.trim() ? value.trim() : undefined;
}

async function queryLogs(page = filters.page ?? 1) {
  loading.value = true;
  try {
    const result = await getRedeemCardLogs({
      ...filters,
      keyword: normalizeText(filters.keyword),
      page,
    });
    logs.value = result.items;
    filters.page = page;
    total.value = result.total;
  } finally {
    loading.value = false;
  }
}

function onSearch() {
  queryLogs(1);
}

function onReset() {
  filters.keyword = '';
  filters.cardType = undefined;
  queryLogs(1);
}

function onPageChange(page: number, pageSize: number) {
  filters.pageSize = pageSize;
  queryLogs(page);
}

onMounted(() => {
  queryLogs(1);
});
</script>

<template>
  <Page auto-content-height>
    <div class="redeem-log-page">
      <section class="redeem-panel">
        <div class="redeem-panel__head">
          <div>
            <h2>卡密日志</h2>
            <p>记录卡密使用者、兑换时间、来源 IP 和到账内容。</p>
          </div>
        </div>

        <div class="redeem-filter-bar">
          <Input
            v-model:value="filters.keyword"
            allow-clear
            placeholder="搜索卡密、用户、奖励内容"
            @press-enter="onSearch"
          />
          <Select
            v-model:value="filters.cardType"
            allow-clear
            :options="cardTypeOptions"
            placeholder="卡密类型"
          />
          <Button type="primary" @click="onSearch">
            <IconifyIcon class="size-4" icon="lucide:search" />
            搜索
          </Button>
          <Button @click="onReset">重置</Button>
        </div>

        <Table
          :columns="columns"
          :data-source="logs"
          :loading="loading"
          :pagination="false"
          :scroll="tableScroll"
          row-key="id"
          size="middle"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'cardCode'">
              <span class="redeem-code">{{ record.cardCode }}</span>
            </template>
            <template v-else-if="column.key === 'cardType'">
              <Tag color="blue">{{ cardTypeText(record.cardType) }}</Tag>
            </template>
            <template v-else-if="column.key === 'user'">
              <div class="redeem-user">
                <strong>{{ record.realName || record.username }}</strong>
                <span>{{ record.username }}</span>
              </div>
            </template>
          </template>
        </Table>

        <Pagination
          v-model:current="filters.page"
          :page-size="filters.pageSize"
          :show-total="(count: number) => `共 ${count} 条日志`"
          :total="total"
          class="redeem-pagination"
          show-size-changer
          @change="onPageChange"
        />
      </section>
    </div>
  </Page>
</template>

<style scoped>
.redeem-log-page {
  height: 100%;
  min-height: 0;
}

.redeem-panel {
  min-height: 0;
  padding: 18px;
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
}

.redeem-panel__head {
  margin-bottom: 16px;
}

.redeem-panel__head h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  line-height: 24px;
}

.redeem-panel__head p {
  margin: 4px 0 0;
  color: rgb(100 116 139);
}

.redeem-filter-bar {
  display: grid;
  grid-template-columns: minmax(240px, 1fr) 190px 96px 96px;
  gap: 12px;
  margin-bottom: 14px;
}

.redeem-code {
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
  font-size: 13px;
  font-weight: 700;
}

.redeem-user strong,
.redeem-user span {
  display: block;
}

.redeem-user span {
  margin-top: 2px;
  font-size: 12px;
  color: rgb(100 116 139);
}

.redeem-pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 14px;
}

@media (max-width: 860px) {
  .redeem-filter-bar {
    grid-template-columns: 1fr;
  }
}
</style>
