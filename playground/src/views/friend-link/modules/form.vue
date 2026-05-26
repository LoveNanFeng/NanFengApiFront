<script lang="ts" setup>
import type { FriendLinkApi } from '#/api/friend-link';

import { computed, nextTick, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import { useVbenForm } from '#/adapter/form';
import {
  createFriendLink,
  getAdminFriendLinkDetail,
  updateFriendLink,
} from '#/api/friend-link';

import { useLinkFormSchema } from '../data';

const emits = defineEmits(['success']);

const formData = ref<FriendLinkApi.FriendLinkItem>();
const id = ref<string>();

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelWidth: 100,
  },
  layout: 'horizontal',
  schema: useLinkFormSchema(),
  showDefaultActions: false,
  wrapperClass: 'grid-cols-1',
});

const [Drawer, drawerApi] = useVbenDrawer({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;

    const values = await formApi.getValues<any>();
    const payload: FriendLinkApi.SaveLinkPayload = {
      description: values.description ?? '',
      logoUrl: values.logoUrl ?? '',
      siteName: values.siteName,
      siteUrl: values.siteUrl,
      sortNo: Number(values.sortNo ?? 0),
      status: values.status ? 1 : 0,
    };

    drawerApi.lock();
    (id.value ? updateFriendLink(id.value, payload) : createFriendLink(payload))
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

    const data = drawerApi.getData<FriendLinkApi.FriendLinkItem>();
    formApi.resetForm();
    formData.value = data?.id ? data : undefined;
    id.value = data?.id;

    let detail = data;
    if (data?.id) {
      detail = await getAdminFriendLinkDetail(data.id);
      formData.value = detail;
    }

    await nextTick();
    formApi.setValues({
      description: detail?.description ?? '',
      logoUrl: detail?.logoUrl ?? '',
      siteName: detail?.siteName ?? '',
      siteUrl: detail?.siteUrl ?? '',
      sortNo: detail?.sortNo ?? 0,
      status: detail?.id ? detail.status === 1 : true,
    });
  },
});

const drawerTitle = computed(() =>
  formData.value?.id ? '编辑友链' : '新增友链',
);
</script>

<template>
  <Drawer :title="drawerTitle">
    <Form />
  </Drawer>
</template>

