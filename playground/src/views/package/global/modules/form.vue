<script lang="ts" setup>
import type { PackageApi } from '#/api/package';

import { computed, nextTick, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import { useVbenForm } from '#/adapter/form';
import { createGlobalPackage, updateGlobalPackage } from '#/api/package';
import { $t } from '#/locales';

import { useFormSchema } from '../data';

const emits = defineEmits(['success']);

const formData = ref<PackageApi.GlobalPackage>();
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
    const payload: PackageApi.SaveGlobalPackage = {
      dailyLimit: Number(values.dailyLimit ?? 0),
      name: values.name,
      price: values.price ?? 0,
      qpsLimit: Number(values.qpsLimit ?? 0),
      remark: values.remark,
      status: values.status ? 1 : 0,
      validDays: Number(values.validDays ?? 30),
    };

    drawerApi.lock();
    (id.value
      ? updateGlobalPackage(id.value, payload)
      : createGlobalPackage(payload)
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

    const data = drawerApi.getData<PackageApi.GlobalPackage>();
    formApi.resetForm();
    formData.value = data?.id ? data : undefined;
    id.value = data?.id;

    await nextTick();
    formApi.setValues({
      dailyLimit: data?.dailyLimit ?? 0,
      name: data?.name ?? '',
      price: data?.price ?? 0,
      qpsLimit: data?.qpsLimit ?? 0,
      remark: data?.remark ?? '',
      status: data?.id ? data.status === 1 : true,
      validDays: data?.validDays ?? 30,
    });
  },
});

const drawerTitle = computed(() =>
  formData.value?.id
    ? $t('ui.actionTitle.edit', [$t('system.package.globalTitle')])
    : $t('ui.actionTitle.create', [$t('system.package.globalTitle')]),
);
</script>

<template>
  <Drawer :title="drawerTitle">
    <Form />
  </Drawer>
</template>
