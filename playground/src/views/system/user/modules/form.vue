<script lang="ts" setup>
import type { SystemRoleApi } from '#/api/system/role';
import type { SystemUserApi } from '#/api/system/user';

import { computed, nextTick, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { createUser, updateUser } from '#/api/system/user';
import { $t } from '#/locales';

import { fetchRoleOptions, useFormSchema } from '../data';

const emits = defineEmits(['success']);

const formData = ref<SystemUserApi.SystemUser>();
const id = ref<string>();

const [Form, formApi] = useVbenForm({
  schema: useFormSchema(),
  showDefaultActions: false,
});

const [Drawer, drawerApi] = useVbenDrawer({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;

    const values = await formApi.getValues<SystemUserApi.SaveUser>();
    if (!id.value && !values.password?.trim()) {
      message.warning($t('authentication.passwordTip'));
      return;
    }
    const payload = { ...values };
    if (id.value && !payload.password) {
      delete payload.password;
    }

    drawerApi.lock();
    (id.value ? updateUser(id.value, payload) : createUser(payload))
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

    const data = drawerApi.getData<SystemUserApi.SystemUser>();
    formApi.resetForm();
    formData.value = data?.id ? data : undefined;
    id.value = data?.id;

    await nextTick();
    if (data?.id) {
      formApi.setValues({
        balance: data.balance ?? 0,
        email: data.email ?? '',
        mobile: data.mobile ?? '',
        password: '',
        points: data.points ?? 0,
        realName: data.realName,
        roleIds: data.roleIds ?? [],
        status: data.status,
        username: data.username,
      });
      return;
    }

    const roleOptions = (await fetchRoleOptions()) as SystemRoleApi.SystemRole[];
    const defaultRoleId = roleOptions.find((role) => role.roleKey === 'user')?.id;
    formApi.setValues({
      balance: 0,
      points: 0,
      roleIds: defaultRoleId ? [Number(defaultRoleId)] : [],
      status: 1,
    });
  },
});

const drawerTitle = computed(() =>
  formData.value?.id
    ? $t('ui.actionTitle.edit', [$t('system.user.listTitle')])
    : $t('ui.actionTitle.create', [$t('system.user.listTitle')]),
);
</script>

<template>
  <Drawer :title="drawerTitle">
    <Form />
  </Drawer>
</template>
