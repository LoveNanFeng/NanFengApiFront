<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PaymentOrderApi } from '#/api/system/payment';

import { ref } from 'vue';

import { Page } from '@vben/common-ui';

import { TabPane, Tabs, Tag } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getMyPaymentOrderList } from '#/api/payment';

import {
  orderTypeColor,
  orderTypeLabel,
  orderTypeTabs,
  payChannelColor,
  payChannelLabel,
  statusColor,
  statusLabel,
  useOrderColumns,
  useOrderGridFormSchema,
} from './data';

const activeType = ref<'ALL' | PaymentOrderApi.OrderType>('ALL');

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useOrderGridFormSchema(),
    submitOnChange: true,
  },
  gridOptions: {
    columns: useOrderColumns(false),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getMyPaymentOrderList({
            page: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
            orderType: activeType.value === 'ALL' ? undefined : activeType.value,
          });
        },
      },
    },
    rowConfig: {
      keyField: 'id',
    },
    toolbarConfig: {
      custom: true,
      export: false,
      refresh: true,
      search: true,
      zoom: true,
    },
  } as VxeTableGridOptions<PaymentOrderApi.PaymentOrder>,
});

function onTabChange(key: number | string) {
  activeType.value = String(key) as 'ALL' | PaymentOrderApi.OrderType;
  gridApi.query();
}
</script>

<template>
  <Page auto-content-height>
    <div class="payment-order-page">
      <Tabs
        v-model:active-key="activeType"
        class="payment-order-tabs"
        @change="onTabChange"
      >
        <TabPane
          v-for="item in orderTypeTabs"
          :key="item.value"
          :tab="item.label"
        />
      </Tabs>

      <Grid class="payment-order-grid" table-title="交易记录">
        <template #orderType="{ row }">
          <Tag :color="orderTypeColor[row.orderType] || 'default'">
            {{ orderTypeLabel(row.orderType) }}
          </Tag>
        </template>
        <template #payChannel="{ row }">
          <Tag :color="payChannelColor[row.payChannel] || 'default'">
            {{ payChannelLabel(row.payChannel) }}
          </Tag>
        </template>
        <template #status="{ row }">
          <Tag :color="statusColor[row.status] || 'default'">
            {{ statusLabel(row.status) }}
          </Tag>
        </template>
      </Grid>
    </div>
  </Page>
</template>

<style scoped>
.payment-order-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  min-height: 0;
}

.payment-order-grid {
  flex: 1;
  min-height: 0;
}

.payment-order-tabs {
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
  background: hsl(var(--card));
  padding: 0 16px;
}

.payment-order-tabs :deep(.ant-tabs-nav) {
  margin-bottom: 0;
}
</style>
