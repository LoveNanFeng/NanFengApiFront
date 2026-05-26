<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { FriendLinkApi } from '#/api/friend-link';

import { Page, useVbenDrawer } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { Button, Tag, message } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteFriendLink,
  getAdminFriendLinkList,
  updateFriendLinkStatus,
} from '#/api/friend-link';

import { useLinkColumns, useLinkGridFormSchema } from './data';
import Form from './modules/form.vue';

const [FormDrawer, formDrawerApi] = useVbenDrawer({
  connectedComponent: Form,
  destroyOnClose: true,
});

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useLinkGridFormSchema(),
    submitOnChange: true,
  },
  gridOptions: {
    columns: useLinkColumns(onActionClick),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getAdminFriendLinkList({
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
  } as VxeTableGridOptions<FriendLinkApi.FriendLinkItem>,
});

function onActionClick({
  code,
  row,
}: OnActionClickParams<FriendLinkApi.FriendLinkItem>) {
  switch (code) {
    case 'delete': {
      onDelete(row);
      break;
    }
    case 'edit': {
      onEdit(row);
      break;
    }
    case 'status': {
      onToggleStatus(row);
      break;
    }
  }
}

function onCreate() {
  formDrawerApi.setData({}).open();
}

function onEdit(row: FriendLinkApi.FriendLinkItem) {
  formDrawerApi.setData(row).open();
}

function onToggleStatus(row: FriendLinkApi.FriendLinkItem) {
  const nextStatus = row.status === 1 ? 0 : 1;
  updateFriendLinkStatus(row.id, nextStatus).then(() => {
    message.success(nextStatus === 1 ? '友链已展示' : '友链已隐藏');
    onRefresh();
  });
}

function onDelete(row: FriendLinkApi.FriendLinkItem) {
  const hideLoading = message.loading({
    content: `正在删除友链「${row.siteName}」...`,
    duration: 0,
    key: 'friend_link_action_msg',
  });
  deleteFriendLink(row.id)
    .then(() => {
      message.success({
        content: `友链「${row.siteName}」已删除`,
        key: 'friend_link_action_msg',
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
    <Grid table-title="友链列表">
      <template #toolbar-tools>
        <Button type="primary" @click="onCreate">
          <Plus class="size-5" />
          新增友链
        </Button>
      </template>

      <template #logo="{ row }">
        <img
          v-if="row.logoUrl"
          :alt="row.siteName"
          :src="row.logoUrl"
          class="friend-link-logo"
        />
        <span v-else class="friend-link-logo friend-link-logo--text">
          {{ row.siteName?.slice(0, 1) || '友' }}
        </span>
      </template>

      <template #siteUrl="{ row }">
        <a :href="row.siteUrl" rel="noopener noreferrer" target="_blank">
          {{ row.siteUrl }}
        </a>
      </template>

      <template #status="{ row }">
        <Tag :color="row.status === 1 ? 'success' : 'default'">
          {{ row.status === 1 ? '展示中' : '已隐藏' }}
        </Tag>
      </template>
    </Grid>
  </Page>
</template>

<style scoped>
.friend-link-logo {
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #f8fafc;
  object-fit: cover;
}

.friend-link-logo--text {
  color: #3867f4;
  font-weight: 900;
}
</style>

