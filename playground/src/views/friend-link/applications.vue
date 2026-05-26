<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { FriendLinkApi } from '#/api/friend-link';

import { onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Input, Modal, Space, Switch, Tag, message } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  approveFriendLinkApplication,
  getAdminFriendLinkApplications,
  getAdminFriendLinkConfig,
  rejectFriendLinkApplication,
  updateAdminFriendLinkConfig,
} from '#/api/friend-link';

import { useApplicationColumns, useApplicationGridFormSchema } from './data';

const config = reactive({
  applyEnabled: 1 as 0 | 1,
  applyNotice: '',
});
const configLoading = ref(false);
const savedApplyEnabled = ref<0 | 1>(1);
const rejectModalOpen = ref(false);
const rejectReason = ref('');
const pendingRejectRow = ref<FriendLinkApi.FriendLinkApplication | null>(null);

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useApplicationGridFormSchema(),
    submitOnChange: true,
  },
  gridOptions: {
    columns: useApplicationColumns(onActionClick),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getAdminFriendLinkApplications({
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
  } as VxeTableGridOptions<FriendLinkApi.FriendLinkApplication>,
});

onMounted(() => {
  loadConfig();
});

function onActionClick({
  code,
  row,
}: OnActionClickParams<FriendLinkApi.FriendLinkApplication>) {
  switch (code) {
    case 'approve': {
      onApprove(row);
      break;
    }
    case 'reject': {
      onReject(row);
      break;
    }
  }
}

function loadConfig() {
  configLoading.value = true;
  getAdminFriendLinkConfig()
    .then((data) => {
      config.applyEnabled = data.applyEnabled === 1 ? 1 : 0;
      savedApplyEnabled.value = config.applyEnabled;
      config.applyNotice = data.applyNotice ?? '';
    })
    .finally(() => {
      configLoading.value = false;
    });
}

async function onApplyEnabledChange(checked: boolean | number | string) {
  const nextValue = checked === true || checked === 1 ? 1 : 0;
  const previousValue = savedApplyEnabled.value;
  if (nextValue === previousValue) return;

  configLoading.value = true;
  try {
    await updateAdminFriendLinkConfig({
      applyEnabled: nextValue,
      applyNotice: config.applyNotice,
    });
    savedApplyEnabled.value = nextValue;
    message.success(nextValue === 1 ? '已允许友链申请' : '已关闭友链申请');
  } catch {
    config.applyEnabled = previousValue;
    message.error('友链申请开关保存失败');
  } finally {
    configLoading.value = false;
  }
}

function onApprove(row: FriendLinkApi.FriendLinkApplication) {
  if (row.status !== 'PENDING') {
    message.warning('该申请已审核，无需重复处理');
    return;
  }
  Modal.confirm({
    content: `通过后「${row.siteName}」会自动加入友链列表并在前台展示。`,
    okText: '通过申请',
    onOk: async () => {
      await approveFriendLinkApplication(row.id);
      message.success('友链申请已通过');
      onRefresh();
    },
    title: '确认通过友链申请？',
  });
}

function onReject(row: FriendLinkApi.FriendLinkApplication) {
  if (row.status !== 'PENDING') {
    message.warning('该申请已审核，无需重复处理');
    return;
  }
  pendingRejectRow.value = row;
  rejectReason.value = '';
  rejectModalOpen.value = true;
}

async function confirmReject() {
  if (!pendingRejectRow.value) return;
  await rejectFriendLinkApplication(
    pendingRejectRow.value.id,
    rejectReason.value,
  );
  message.success('友链申请已驳回');
  rejectModalOpen.value = false;
  pendingRejectRow.value = null;
  onRefresh();
}

function onRefresh() {
  gridApi.query();
}

function statusColor(status: FriendLinkApi.ApplicationStatus) {
  if (status === 'APPROVED') return 'success';
  if (status === 'REJECTED') return 'error';
  return 'processing';
}

function statusText(status: FriendLinkApi.ApplicationStatus) {
  if (status === 'APPROVED') return '已通过';
  if (status === 'REJECTED') return '已驳回';
  return '待审核';
}
</script>

<template>
  <Page auto-content-height>
    <div class="friend-link-application-page">
      <Card title="申请开关">
        <div class="friend-link-config">
          <Switch
            v-model:checked="config.applyEnabled"
            :checked-value="1"
            :disabled="configLoading"
            :loading="configLoading"
            checked-children="允许"
            :un-checked-value="0"
            un-checked-children="关闭"
            @change="onApplyEnabledChange"
          />
        </div>
      </Card>

      <Grid table-title="友链申请">
        <template #siteUrl="{ row }">
          <a :href="row.siteUrl" rel="noopener noreferrer" target="_blank">
            {{ row.siteUrl }}
          </a>
        </template>

        <template #backlinkUrl="{ row }">
          <a
            v-if="row.backlinkUrl"
            :href="row.backlinkUrl"
            rel="noopener noreferrer"
            target="_blank"
          >
            {{ row.backlinkUrl }}
          </a>
          <span v-else class="text-gray-400">未填写</span>
        </template>

        <template #status="{ row }">
          <Space direction="vertical" :size="2">
            <Tag :color="statusColor(row.status)">
              {{ statusText(row.status) }}
            </Tag>
            <span
              v-if="row.status === 'REJECTED' && row.rejectReason"
              class="friend-link-reject-reason"
            >
              {{ row.rejectReason }}
            </span>
          </Space>
        </template>
      </Grid>

      <Modal
        v-model:open="rejectModalOpen"
        title="驳回友链申请"
        ok-text="确认驳回"
        ok-type="danger"
        @ok="confirmReject"
      >
        <p class="mb-3 text-sm text-gray-500">
          可以填写驳回原因，方便后续回看审核记录。
        </p>
        <Input.TextArea
          v-model:value="rejectReason"
          placeholder="例如：网站暂时无法访问、未添加本站链接等"
          :rows="4"
          show-count
          :maxlength="255"
        />
      </Modal>
    </div>
  </Page>
</template>

<style scoped>
.friend-link-application-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  min-height: 0;
}

.friend-link-config {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.friend-link-reject-reason {
  color: #ef4444;
  font-size: 12px;
}
</style>
