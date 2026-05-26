<script lang="ts" setup>
import { useVbenDrawer } from '@vben/common-ui';

import { useVbenForm } from '#/adapter/form';
import { createKey } from '#/api/key';
import { $t } from '#/locales';

import { useFormSchema } from '../data';

const emits = defineEmits(['success']);

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
  },
  layout: 'horizontal',
  schema: useFormSchema(),
  showDefaultActions: false,
});

const [Drawer, drawerApi] = useVbenDrawer({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;

    const values = await formApi.getValues<{
      interfaceId?: string;
      keyScope: 'GLOBAL' | 'INTERFACE';
    }>();
    drawerApi.lock();
    createKey({
      interfaceId: values.keyScope === 'GLOBAL' ? undefined : values.interfaceId,
      keyScope: values.keyScope,
    })
      .then(() => {
        emits('success');
        drawerApi.close();
      })
      .catch(() => {
        drawerApi.unlock();
      });
  },

  onOpenChange(isOpen) {
    if (!isOpen) return;
    formApi.resetForm();
  },
});
</script>

<template>
  <Drawer :title="$t('system.key.createTitle')">
    <Form />
  </Drawer>
</template>
