<script lang="ts" setup>
import type { PackageApi } from '#/api/package';

import { computed, nextTick, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import { useVbenForm } from '#/adapter/form';
import { createPointPackage, updatePointPackage } from '#/api/package';
import { $t } from '#/locales';

import { useFormSchema } from '../data';

const emits = defineEmits(['success']);

const formData = ref<PackageApi.PointPackage>();
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
    const payload: PackageApi.SavePointPackage = {
      name: values.name,
      pointAmount: Number(values.pointAmount ?? 0),
      price: values.price ?? 0,
      remark: values.remark,
      status: values.status ? 1 : 0,
    };

    drawerApi.lock();
    (id.value
      ? updatePointPackage(id.value, payload)
      : createPointPackage(payload)
    )
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

    const data = drawerApi.getData<PackageApi.PointPackage>();
    formApi.resetForm();
    formData.value = data?.id ? data : undefined;
    id.value = data?.id;

    await nextTick();
    formApi.setValues({
      name: data?.name ?? '',
      pointAmount: data?.pointAmount ?? 100,
      price: data?.price ?? 0,
      remark: data?.remark ?? '',
      status: data?.id ? data.status === 1 : true,
    });
  },
});

const drawerTitle = computed(() =>
  formData.value?.id
    ? $t('ui.actionTitle.edit', [$t('system.package.pointTitle')])
    : $t('ui.actionTitle.create', [$t('system.package.pointTitle')]),
);
</script>

<template>
  <Drawer :title="drawerTitle">
    <Form />
  </Drawer>
</template>
