<script lang="ts" setup>
import type { NoticeApi } from '#/api/notice';

import { computed, nextTick, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import { useVbenForm } from '#/adapter/form';
import {
  createNotice,
  getAdminNoticeDetail,
  updateNotice,
} from '#/api/notice';

import { useFormSchema } from '../data';

const emits = defineEmits(['success']);

const formData = ref<NoticeApi.NoticeItem>();
const id = ref<string>();

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
  },
  layout: 'horizontal',
  schema: useFormSchema(),
  showDefaultActions: false,
  wrapperClass: 'grid-cols-1 lg:grid-cols-2',
});

const [Drawer, drawerApi] = useVbenDrawer({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;

    const values = await formApi.getValues<any>();
    const payload: NoticeApi.SaveNoticePayload = {
      contentHtml: values.contentHtml ?? '',
      isPopup: values.isPopup ? 1 : 0,
      isTop: values.isTop ? 1 : 0,
      status: values.status ? 1 : 0,
      title: values.title,
    };

    drawerApi.lock();
    (id.value ? updateNotice(id.value, payload) : createNotice(payload))
      .then(() => {
        emits('success');
        drawerApi.close();
      })
      .catch(() => {
        drawerApi.unlock();
      });
  },

  async onOpenChange(isOpen) {
    if (!isOpen) return;

    const data = drawerApi.getData<NoticeApi.NoticeItem>();
    formApi.resetForm();
    formData.value = data?.id ? data : undefined;
    id.value = data?.id;

    let detail = data;
    if (data?.id) {
      detail = await getAdminNoticeDetail(data.id);
      formData.value = detail;
    }

    await nextTick();
    formApi.setValues({
      contentHtml:
        detail?.contentHtml ??
        '<p>请在这里填写公告内容，可以使用标题、列表、引用、图片等富文本格式。</p>',
      isTop: detail?.id ? detail.isTop === 1 : false,
      isPopup: detail?.id ? detail.isPopup === 1 : false,
      status: detail?.id ? detail.status === 1 : true,
      title: detail?.title ?? '',
    });
  },
});

const drawerTitle = computed(() =>
  formData.value?.id ? '编辑公告' : '发布公告',
);
</script>

<template>
  <Drawer :title="drawerTitle">
    <Form />
  </Drawer>
</template>

<style scoped>
:deep(.notice-rich-editor-item) {
  min-height: 420px;
}

:deep(.notice-rich-editor-item .vben-tiptap) {
  min-height: 360px;
}
</style>
