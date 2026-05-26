<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { KeyApi } from '#/api/key';

import { Page, useVbenDrawer } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { h } from 'vue';
import { Button, Input, message, Modal } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteKey,
  getKeyList,
  regenerateKey,
  updateKeyIpWhitelist,
  updateKeyStatus,
} from '#/api/key';
import { $t } from '#/locales';

import { useColumns, useGridFormSchema } from './data';
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
    columns: useColumns(onActionClick, onStatusChange),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getKeyList({
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
  } as VxeTableGridOptions<KeyApi.KeyItem>,
});

function onActionClick({ code, row }: OnActionClickParams<KeyApi.KeyItem>) {
  switch (code) {
    case 'delete': {
      onDelete(row);
      break;
    }
    case 'regenerate': {
      onRegenerate(row);
      break;
    }
    case 'ipWhitelist': {
      onEditIpWhitelist(row);
      break;
    }
  }
}

async function onStatusChange(newStatus: 0 | 1, row: KeyApi.KeyItem) {
  try {
    await updateKeyStatus(row.id, newStatus);
    message.success($t('system.key.statusSuccess'));
    return true;
  } catch {
    return false;
  }
}

function onCreate() {
  formDrawerApi.setData({}).open();
}

function onRegenerate(row: KeyApi.KeyItem) {
  Modal.confirm({
    content: $t('system.key.regenerateConfirm', [row.interfaceName]),
    onOk: async () => {
      await regenerateKey(row.id);
      message.success($t('system.key.regenerateSuccess'));
      onRefresh();
    },
    title: $t('system.key.regenerate'),
  });
}

function onEditIpWhitelist(row: KeyApi.KeyItem) {
  let whitelistValue = row.ipWhitelist ?? '';
  Modal.confirm({
    content: h('div', [
      h(
        'div',
        { class: 'mb-2 text-[13px] text-[var(--vben-text-secondary-color)]' },
        $t('system.key.ipWhitelistHint'),
      ),
      h(Input.TextArea, {
        autoSize: { maxRows: 8, minRows: 6 },
        defaultValue: whitelistValue,
        'onUpdate:value': (value: string) => {
          whitelistValue = value;
        },
        placeholder: $t('system.key.ipWhitelistPlaceholder'),
      }),
    ]),
    onOk: async () => {
      await updateKeyIpWhitelist(row.id, whitelistValue);
      message.success($t('system.key.ipWhitelistSaveSuccess'));
      onRefresh();
    },
    title: $t('system.key.ipWhitelistManage'),
  });
}

function onDelete(row: KeyApi.KeyItem) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.interfaceName]),
    duration: 0,
    key: 'action_process_msg',
  });
  deleteKey(row.id)
    .then(() => {
      message.success({
        content: $t('ui.actionMessage.deleteSuccess', [row.interfaceName]),
        key: 'action_process_msg',
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
    <FormDrawer @success="onRefresh" />
    <Grid :table-title="$t('system.key.listTitle')">
      <template #toolbar-tools>
        <Button type="primary" @click="onCreate">
          <Plus class="size-5" />
          {{ $t('system.key.createTitle') }}
        </Button>
      </template>
    </Grid>
  </Page>
</template>
