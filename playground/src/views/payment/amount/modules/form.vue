<script lang="ts" setup>
import type { RechargeAmountApi } from '#/api/system/payment';

import { computed, nextTick, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import { useVbenForm } from '#/adapter/form';
import {
  createRechargeAmount,
  updateRechargeAmount,
} from '#/api/system/payment';

import { useFormSchema } from '../data';

const emits = defineEmits(['success']);

const formData = ref<RechargeAmountApi.RechargeAmount>();
const id = ref<string>();

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelWidth: 100,
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
    const payload: RechargeAmountApi.SaveRechargeAmount = {
      amount: values.amount ?? 0,
      giftAmount: values.giftAmount ?? 0,
      remark: values.remark,
      sortNo: Number(values.sortNo ?? 0),
      status: values.status ? 1 : 0,
    };

    drawerApi.lock();
    (id.value
      ? updateRechargeAmount(id.value, payload)
      : createRechargeAmount(payload)
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

    const data = drawerApi.getData<RechargeAmountApi.RechargeAmount>();
    formApi.resetForm();
    formData.value = data?.id ? data : undefined;
    id.value = data?.id;

    await nextTick();
    formApi.setValues({
      amount: data?.amount ?? 10,
      giftAmount: data?.giftAmount ?? 0,
      remark: data?.remark ?? '',
      sortNo: data?.sortNo ?? 0,
      status: data?.id ? data.status === 1 : true,
    });
  },
});

const drawerTitle = computed(() =>
  formData.value?.id ? '编辑金额配置' : '新增金额配置',
);
</script>

<template>
  <Drawer :title="drawerTitle">
    <Form />
  </Drawer>
</template>
