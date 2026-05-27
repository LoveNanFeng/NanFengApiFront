<script lang="ts" setup>
import type { RedeemCardApi } from '#/api/redeem-card';

import { onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Button, Empty, Pagination, Spin, Table, Tag } from 'ant-design-vue';

import { getMyRedeemCardLogs } from '#/api/redeem-card';

import RedeemModal from './modules/redeem-modal.vue';

const cardTypeOptions: Array<{
  label: string;
  value: RedeemCardApi.CardType;
}> = [
  { label: '余额卡密', value: 'BALANCE' },
  { label: '全站套餐卡密', value: 'GLOBAL_PACKAGE' },
  { label: '接口套餐卡密', value: 'INTERFACE_PACKAGE' },
  { label: '点数套餐卡密', value: 'POINT_PACKAGE' },
];

const tableScroll = { x: 820 };

const logs = ref<RedeemCardApi.LogItem[]>([]);
const loading = ref(false);
const redeemVisible = ref(false);
const total = ref(0);
const pagination = reactive({
  current: 1,
  pageSize: 10,
});

const columns = [
  { dataIndex: 'cardCode', key: 'cardCode', title: '卡密', width: 240 },
  { dataIndex: 'cardType', key: 'cardType', title: '类型', width: 140 },
  {
    dataIndex: 'rewardSummary',
    key: 'rewardSummary',
    title: '到账内容',
    width: 260,
  },
  { dataIndex: 'createTime', key: 'createTime', title: '兑换时间', width: 180 },
];

function cardTypeText(type?: RedeemCardApi.CardType | string) {
  return (
    cardTypeOptions.find((item) => item.value === type)?.label ??
    String(type || '-')
  );
}

async function queryLogs(page = pagination.current) {
  loading.value = true;
  try {
    const result = await getMyRedeemCardLogs({
      page,
      pageSize: pagination.pageSize,
    });
    logs.value = result.items;
    pagination.current = page;
    total.value = result.total;
  } finally {
    loading.value = false;
  }
}

function onPageChange(page: number, pageSize: number) {
  pagination.pageSize = pageSize;
  queryLogs(page);
}

async function onRedeemSuccess() {
  await queryLogs(1);
}

onMounted(() => {
  queryLogs(1);
});
</script>

<template>
  <Page auto-content-height>
    <div class="redeem-user-page">
      <section class="redeem-hero-panel">
        <div class="redeem-hero-panel__icon">
          <IconifyIcon icon="lucide:ticket-check" />
        </div>
        <div class="redeem-hero-panel__content">
          <h2>卡密兑换</h2>
          <p>兑换管理员发放的余额、点数或套餐卡密，成功后立即到账。</p>
        </div>
        <Button type="primary" size="large" @click="redeemVisible = true">
          <IconifyIcon class="size-5" icon="lucide:ticket-plus" />
          立即兑换
        </Button>
      </section>

      <section class="redeem-panel">
        <div class="redeem-panel__head">
          <div>
            <h2>兑换记录</h2>
            <p>共 {{ total }} 条记录，可用于核对到账时间和奖励内容。</p>
          </div>
        </div>

        <Spin :spinning="loading">
          <Table
            v-if="logs.length > 0"
            :columns="columns"
            :data-source="logs"
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
            </template>
          </Table>
          <Empty v-else description="暂无兑换记录" />
        </Spin>

        <Pagination
          v-if="total > pagination.pageSize"
          v-model:current="pagination.current"
          :page-size="pagination.pageSize"
          :total="total"
          class="redeem-pagination"
          simple
          @change="onPageChange"
        />
      </section>

      <RedeemModal v-model:open="redeemVisible" @success="onRedeemSuccess" />
    </div>
  </Page>
</template>

<style scoped>
.redeem-user-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
  height: 100%;
  min-height: 0;
}

.redeem-hero-panel,
.redeem-panel {
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
}

.redeem-hero-panel {
  display: flex;
  gap: 18px;
  align-items: center;
  padding: 24px;
}

.redeem-hero-panel__icon {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  font-size: 30px;
  color: #2563eb;
  background: rgb(37 99 235 / 10%);
  border-radius: 8px;
}

.redeem-hero-panel__content {
  flex: 1;
  min-width: 0;
}

.redeem-hero-panel h2,
.redeem-panel__head h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  line-height: 24px;
}

.redeem-hero-panel p,
.redeem-panel__head p {
  margin: 4px 0 0;
  color: rgb(100 116 139);
}

.redeem-panel {
  min-height: 0;
  padding: 18px;
}

.redeem-panel__head {
  margin-bottom: 16px;
}

.redeem-code {
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
  font-size: 13px;
  font-weight: 700;
}

.redeem-pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 14px;
}

@media (max-width: 720px) {
  .redeem-hero-panel {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
