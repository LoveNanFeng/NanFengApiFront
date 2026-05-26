<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { RechargeAmountApi } from '#/api/system/payment';

import { Page, useVbenDrawer } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { Alert, Button, message } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteRechargeAmount,
  getRechargeAmountList,
} from '#/api/system/payment';

import { formatAmount, useColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

const [FormDrawer, formDrawerApi] = useVbenDrawer({
  connectedComponent: Form,
  destroyOnClose: true,
});

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
    submitOnChange: true,
  },
  gridOptions: {
    columns: useColumns(onActionClick),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getRechargeAmountList({
            page: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
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
  } as VxeTableGridOptions<RechargeAmountApi.RechargeAmount>,
});

function onActionClick({
  code,
  row,
}: OnActionClickParams<RechargeAmountApi.RechargeAmount>) {
  switch (code) {
    case 'delete': {
      onDelete(row);
      break;
    }
    case 'edit': {
      onEdit(row);
      break;
    }
  }
}

function onCreate() {
  formDrawerApi.setData({}).open();
}

function onEdit(row: RechargeAmountApi.RechargeAmount) {
  formDrawerApi.setData(row).open();
}

function onDelete(row: RechargeAmountApi.RechargeAmount) {
  const name = formatAmount(row.amount);
  const hideLoading = message.loading({
    content: `正在删除 ${name}`,
    duration: 0,
    key: 'payment_amount_action_msg',
  });
  deleteRechargeAmount(row.id)
    .then(() => {
      message.success({
        content: `${name} 已删除`,
        key: 'payment_amount_action_msg',
      });
      onRefresh();
    })
    .catch(() => {
      hideLoading();
    });
}

function onRefresh() {
  gridApi.query();
}
</script>

<template>
  <Page auto-content-height>
    <div class="payment-amount-page">
      <Alert
        show-icon
        type="info"
        message="充值金额配置"
        description="这里配置用户充值弹窗中的快捷金额。赠送金额可填 0；用户实际到账金额为充值金额加赠送金额，赠送只由后端按启用档位匹配计算。"
      />
      <FormDrawer @success="onRefresh" />
      <Grid table-title="金额配置">
        <template #toolbar-tools>
          <Button type="primary" @click="onCreate">
            <Plus class="size-5" />
            新增金额
          </Button>
        </template>
      </Grid>
    </div>
  </Page>
</template>

<style scoped>
.payment-amount-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  min-height: 0;
}
</style>
