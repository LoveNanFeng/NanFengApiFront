<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { NoticeApi } from '#/api/notice';

import { Page, useVbenDrawer } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { Button, Tag, message } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteNotice,
  getAdminNoticeList,
  updateNoticePopup,
  updateNoticeStatus,
  updateNoticeTop,
} from '#/api/notice';

import { useColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';
import Preview from './modules/preview.vue';

const [FormDrawer, formDrawerApi] = useVbenDrawer({
  connectedComponent: Form,
  destroyOnClose: true,
});

const [PreviewDrawer, previewDrawerApi] = useVbenDrawer({
  connectedComponent: Preview,
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
          return await getAdminNoticeList({
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
  } as VxeTableGridOptions<NoticeApi.NoticeItem>,
});

function onActionClick({
  code,
  row,
}: OnActionClickParams<NoticeApi.NoticeItem>) {
  switch (code) {
    case 'delete': {
      onDelete(row);
      break;
    }
    case 'edit': {
      onEdit(row);
      break;
    }
    case 'preview': {
      onPreview(row);
      break;
    }
    case 'popup': {
      onTogglePopup(row);
      break;
    }
    case 'status': {
      onToggleStatus(row);
      break;
    }
    case 'top': {
      onToggleTop(row);
      break;
    }
  }
}

function openEditor(data: Partial<NoticeApi.NoticeItem>) {
  formDrawerApi.setState({ class: 'w-[92vw] max-w-[1080px]' });
  formDrawerApi.setData(data).open();
}

function onCreate() {
  openEditor({});
}

function onEdit(row: NoticeApi.NoticeItem) {
  openEditor(row);
}

function onPreview(row: NoticeApi.NoticeItem) {
  previewDrawerApi.setState({ class: 'w-[90vw] max-w-[960px]' });
  previewDrawerApi.setData(row).open();
}

function onToggleStatus(row: NoticeApi.NoticeItem) {
  const nextStatus = row.status === 1 ? 0 : 1;
  updateNoticeStatus(row.id, nextStatus).then(() => {
    message.success(nextStatus === 1 ? '公告已发布' : '公告已隐藏');
    onRefresh();
  });
}

function onToggleTop(row: NoticeApi.NoticeItem) {
  const nextTop = row.isTop === 1 ? 0 : 1;
  updateNoticeTop(row.id, nextTop).then(() => {
    message.success(nextTop === 1 ? '公告已置顶' : '已取消置顶');
    onRefresh();
  });
}

function onTogglePopup(row: NoticeApi.NoticeItem) {
  const nextPopup = row.isPopup === 1 ? 0 : 1;
  updateNoticePopup(row.id, nextPopup).then(() => {
    message.success(nextPopup === 1 ? '已设为每日弹窗' : '已取消每日弹窗');
    onRefresh();
  });
}

function onDelete(row: NoticeApi.NoticeItem) {
  const hideLoading = message.loading({
    content: `正在删除公告「${row.title}」...`,
    duration: 0,
    key: 'notice_action_msg',
  });
  deleteNotice(row.id)
    .then(() => {
      message.success({
        content: `公告「${row.title}」已删除`,
        key: 'notice_action_msg',
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
    <PreviewDrawer />
    <Grid table-title="公告列表">
      <template #toolbar-tools>
        <Button type="primary" @click="onCreate">
          <Plus class="size-5" />
          发布公告
        </Button>
      </template>

      <template #isTop="{ row }">
        <Tag :color="row.isTop === 1 ? 'processing' : 'default'">
          {{ row.isTop === 1 ? '置顶' : '普通' }}
        </Tag>
      </template>

      <template #isPopup="{ row }">
        <Tag :color="row.isPopup === 1 ? 'warning' : 'default'">
          {{ row.isPopup === 1 ? '弹窗' : '不弹窗' }}
        </Tag>
      </template>

      <template #status="{ row }">
        <Tag :color="row.status === 1 ? 'success' : 'default'">
          {{ row.status === 1 ? '已发布' : '已隐藏' }}
        </Tag>
      </template>
    </Grid>
  </Page>
</template>
