<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { InterfaceApi } from '#/api/interface';

import { computed } from 'vue';

import { Page } from '@vben/common-ui';

import { useUserStore } from '@vben/stores';

import { Tag } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getInterfaceCallLogList } from '#/api/interface';
import { $t } from '#/locales';

const userStore = useUserStore();
const isAdmin = computed(() => userStore.userRoles.includes('admin'));

import {
  chargeTypeOptions,
  useCallLogColumns,
  useCallLogGridFormSchema,
} from './log-data';

const chargeTypeColor: Record<InterfaceApi.ChargeType, string> = {
  ADMIN: 'purple',
  BALANCE: 'gold',
  FREE: 'default',
  MEMBER: 'blue',
  POINT: 'green',
};

function isSuccess(value: boolean | number) {
  return value === true || value === 1;
}

function chargeTypeLabel(value: InterfaceApi.ChargeType) {
  return (
    chargeTypeOptions.find((item) => item.value === value)?.label ||
    $t('system.interface.chargeFree')
  );
}

const [Grid] = useVbenVxeGrid({
  formOptions: {
    schema: useCallLogGridFormSchema(),
    submitOnChange: true,
  },
  gridOptions: {
    columns: useCallLogColumns(isAdmin.value),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getInterfaceCallLogList({
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
  } as VxeTableGridOptions<InterfaceApi.CallLogItem>,
});
</script>

<template>
  <Page auto-content-height>
    <Grid :table-title="$t('system.interface.callLogTitle')">
      <template #success="{ row }">
        <Tag :color="isSuccess(row.success) ? 'success' : 'error'">
          {{
            isSuccess(row.success)
              ? $t('system.interface.callSuccess')
              : $t('system.interface.callFailed')
          }}
        </Tag>
      </template>
      <template #chargeType="{ row }">
        <Tag :color="chargeTypeColor[row.chargeType] || 'default'">
          {{ chargeTypeLabel(row.chargeType) }}
        </Tag>
      </template>
    </Grid>
  </Page>
</template>
