<script lang="ts" setup>
import type { InterfaceApi } from '#/api/interface';
import type { UploadFile } from 'ant-design-vue';

import { computed, nextTick, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import { useVbenForm } from '#/adapter/form';
import { createInterface, updateInterface } from '#/api/interface';
import { $t } from '#/locales';

import { useFormSchema } from '../data';

const emits = defineEmits<{
  success: [
    payload: {
      mode: 'create' | 'update';
      record?: InterfaceApi.InterfaceItem;
    },
  ];
}>();

const formData = ref<InterfaceApi.InterfaceItem>();
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
  wrapperClass: 'grid-cols-1',
});

const [Drawer, drawerApi] = useVbenDrawer({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;

    const values = await formApi.getValues<any>();
    const avatarUrl = extractAvatarUrl(values);
    const price = values.price ?? 0;
    const payload: InterfaceApi.SaveInterface = {
      apiCode: values.apiCode,
      avatarUrl,
      isFeatured: values.isFeatured ? 1 : 0,
      isTop: values.isTop ? 1 : 0,
      name: values.name,
      pointPrice: Number(price) <= 0 ? 0 : (values.pointPrice ?? 0),
      price,
      remark: values.remark,
      requestMethod: values.requestMethod,
      requestUrl: values.requestUrl,
      status: values.status ? 1 : 0,
    };

    drawerApi.lock();
    const editingId = id.value;
    const saveRequest = editingId
      ? updateInterface(editingId, payload).then(() => undefined)
      : createInterface(payload);
    saveRequest
      .then((record) => {
        drawerApi.close();
        emits('success', {
          mode: editingId ? 'update' : 'create',
          record,
        });
      })
      .catch(() => {
        drawerApi.unlock();
      });
  },

  async onOpenChange(isOpen) {
    if (!isOpen) return;

    const data = drawerApi.getData<InterfaceApi.InterfaceItem>();
    formApi.resetForm();
    formData.value = data?.id ? data : undefined;
    id.value = data?.id;

    await nextTick();
    formApi.setValues({
      apiCode: data?.apiCode ?? '',
      avatarFile: data?.avatarUrl
        ? [
            {
              name: data.name,
              status: 'done',
              uid: '-1',
              url: data.avatarUrl,
            },
          ]
        : [],
      avatarUrl: data?.avatarUrl ?? '',
      isFeatured: data?.id ? data.isFeatured === 1 : false,
      isTop: data?.id ? data.isTop === 1 : false,
      name: data?.name ?? '',
      pointPrice: data?.pointPrice ?? 0,
      price: data?.price ?? 0,
      remark: data?.remark ?? '',
      requestMethod: data?.requestMethod ?? 'GET',
      requestUrl: data?.requestUrl ?? '',
      status: data?.id ? data.status === 1 : true,
    });
  },
});

const drawerTitle = computed(() =>
  formData.value?.id
    ? $t('ui.actionTitle.edit', [$t('system.interface.name')])
    : $t('ui.actionTitle.create', [$t('system.interface.name')]),
);

function extractAvatarUrl(values: Record<string, any>) {
  const files = (values.avatarFile ?? []) as UploadFile[];
  const uploadedUrl = files[0]?.response?.url;
  const previewUrl = files[0]?.url;
  const inputUrl = String(values.avatarUrl ?? '').trim();
  return uploadedUrl || inputUrl || previewUrl || undefined;
}
</script>

<template>
  <Drawer :title="drawerTitle">
    <Form />
  </Drawer>
</template>
