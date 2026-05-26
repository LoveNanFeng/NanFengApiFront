<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { SystemUserApi } from '#/api/system/user';

import { Page, useVbenDrawer } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { ref } from 'vue';

import { Button, Input, message, Modal, Switch } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteUser,
  getUserList,
  getUserSpecifiedResponse,
  updateUserSpecifiedResponse,
} from '#/api/system/user';
import { $t } from '#/locales';

import { useColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

const [FormDrawer, formDrawerApi] = useVbenDrawer({
  connectedComponent: Form,
  destroyOnClose: true,
});

const specifiedResponseVisible = ref(false);
const specifiedResponseSaving = ref(false);
const specifiedResponseLoading = ref(false);
const currentSpecifiedResponseUser = ref<SystemUserApi.SystemUser>();
const specifiedResponseForm = ref<SystemUserApi.SpecifiedResponseConfig>({
  specifiedResponseBillable: 0,
  specifiedResponseBody: '',
  specifiedResponseEnabled: 0,
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
          return await getUserList({
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
  } as VxeTableGridOptions<SystemUserApi.SystemUser>,
});

function onActionClick({
  code,
  row,
}: OnActionClickParams<SystemUserApi.SystemUser>) {
  switch (code) {
    case 'delete': {
      onDelete(row);
      break;
    }
    case 'edit': {
      onEdit(row);
      break;
    }
    case 'specifiedResponse': {
      onEditSpecifiedResponse(row);
      break;
    }
  }
}

function onCreate() {
  formDrawerApi.setData({}).open();
}

function onEdit(row: SystemUserApi.SystemUser) {
  formDrawerApi.setData(row).open();
}

async function onEditSpecifiedResponse(row: SystemUserApi.SystemUser) {
  currentSpecifiedResponseUser.value = row;
  specifiedResponseForm.value = {
    specifiedResponseBillable: row.specifiedResponseBillable ?? 0,
    specifiedResponseBody: '',
    specifiedResponseEnabled: row.specifiedResponseEnabled ?? 0,
  };
  specifiedResponseVisible.value = true;
  specifiedResponseLoading.value = true;
  try {
    const config = await getUserSpecifiedResponse(row.id);
    specifiedResponseForm.value = {
      specifiedResponseBillable: config.specifiedResponseBillable ?? 0,
      specifiedResponseBody: config.specifiedResponseBody ?? '',
      specifiedResponseEnabled: config.specifiedResponseEnabled ?? 0,
    };
  } finally {
    specifiedResponseLoading.value = false;
  }
}

async function onSaveSpecifiedResponse() {
  const row = currentSpecifiedResponseUser.value;
  if (!row) {
    return;
  }
  if (
    specifiedResponseForm.value.specifiedResponseEnabled === 1 &&
    !specifiedResponseForm.value.specifiedResponseBody.trim()
  ) {
    message.warning($t('system.user.specifiedResponseBodyRequired'));
    return;
  }
  specifiedResponseSaving.value = true;
  try {
    await updateUserSpecifiedResponse(row.id, specifiedResponseForm.value);
    message.success($t('system.user.specifiedResponseSaveSuccess'));
    specifiedResponseVisible.value = false;
    onRefresh();
  } finally {
    specifiedResponseSaving.value = false;
  }
}

function onSpecifiedResponseClosed() {
  currentSpecifiedResponseUser.value = undefined;
  specifiedResponseForm.value = {
    specifiedResponseBillable: 0,
    specifiedResponseBody: '',
    specifiedResponseEnabled: 0,
  };
}

function onDelete(row: SystemUserApi.SystemUser) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.username]),
    duration: 0,
    key: 'action_process_msg',
  });
  deleteUser(row.id)
    .then(() => {
      message.success({
        content: $t('ui.actionMessage.deleteSuccess', [row.username]),
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
    <Grid :table-title="$t('system.user.list')">
      <template #toolbar-tools>
        <Button type="primary" @click="onCreate">
          <Plus class="size-5" />
          {{ $t('ui.actionTitle.create', [$t('system.user.listTitle')]) }}
        </Button>
      </template>
    </Grid>
    <Modal
      v-model:open="specifiedResponseVisible"
      :confirm-loading="specifiedResponseSaving"
      :destroy-on-close="true"
      :title="$t('system.user.specifiedResponseManage')"
      :width="'min(820px, calc(100vw - 32px))'"
      @after-close="onSpecifiedResponseClosed"
      @ok="onSaveSpecifiedResponse"
    >
      <div class="space-y-4">
        <div class="text-[13px] text-[var(--vben-text-secondary-color)]">
          {{ $t('system.user.specifiedResponseHint') }}
        </div>
        <div class="grid gap-3 md:grid-cols-2">
          <div class="specified-response-switch-item">
            <span>{{ $t('system.user.specifiedResponseEnabled') }}</span>
            <Switch
              v-model:checked="specifiedResponseForm.specifiedResponseEnabled"
              :checked-value="1"
              :un-checked-value="0"
            />
          </div>
          <div class="specified-response-switch-item">
            <span>{{ $t('system.user.specifiedResponseBillable') }}</span>
            <Switch
              v-model:checked="specifiedResponseForm.specifiedResponseBillable"
              :checked-value="1"
              :disabled="specifiedResponseForm.specifiedResponseEnabled !== 1"
              :un-checked-value="0"
            />
          </div>
        </div>
        <Input.TextArea
          v-model:value="specifiedResponseForm.specifiedResponseBody"
          class="user-specified-response-editor"
          :disabled="specifiedResponseLoading"
          :placeholder="$t('system.user.specifiedResponsePlaceholder')"
          :rows="16"
        />
      </div>
    </Modal>
  </Page>
</template>

<style scoped>
.specified-response-switch-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 44px;
  padding: 10px 12px;
  border: 1px solid var(--vben-border-color);
  border-radius: 8px;
  color: var(--vben-text-color);
  background: var(--vben-bg-color);
}

:deep(.user-specified-response-editor) {
  min-height: 380px;
  max-height: min(64vh, 620px);
  resize: vertical;
  overflow-y: auto;
  white-space: pre;
  font-family:
    'JetBrains Mono', 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;
  line-height: 1.6;
}

@media (max-width: 767px) {
  :deep(.user-specified-response-editor) {
    min-height: 280px;
    max-height: 52vh;
  }
}
</style>
