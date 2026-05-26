<script lang="ts" setup>
import type { Dayjs } from 'dayjs';

import type { PackageApi } from '#/api/package';

import { computed, reactive, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import { DatePicker, Select, Switch, message } from 'ant-design-vue';

import {
  getPackageUserOptions,
  openGlobalPackage,
} from '#/api/package';
import { $t } from '#/locales';

const emits = defineEmits(['success']);

const packageData = ref<PackageApi.GlobalPackage>();
const users = ref<PackageApi.UserOption[]>([]);
const formState = reactive<{
  expireTime?: Dayjs;
  startTime?: Dayjs;
  status: 0 | 1;
  userId?: string;
}>({
  status: 1,
});

const [Drawer, drawerApi] = useVbenDrawer({
  async onConfirm() {
    if (!packageData.value?.id) return;
    if (!formState.userId) {
      message.warning($t('system.package.userRequired'));
      return;
    }

    drawerApi.lock();
    openGlobalPackage(packageData.value.id, {
      expireTime: formatTime(formState.expireTime),
      startTime: formatTime(formState.startTime),
      status: formState.status,
      userId: formState.userId,
    })
      .then(() => {
        message.success($t('system.package.openSuccess'));
        emits('success');
        drawerApi.close();
      })
      .catch(() => {
        drawerApi.unlock();
      });
  },

  async onOpenChange(isOpen) {
    if (!isOpen) return;
    packageData.value = drawerApi.getData<PackageApi.GlobalPackage>();
    formState.userId = undefined;
    formState.startTime = undefined;
    formState.expireTime = undefined;
    formState.status = 1;
    users.value = await getPackageUserOptions();
  },
});

const drawerTitle = computed(() =>
  $t('system.package.openPackageTitle', [packageData.value?.name ?? '']),
);

const userOptions = computed(() =>
  users.value.map((item) => ({
    label: item.label,
    value: item.id,
  })),
);

function formatTime(value?: Dayjs) {
  return value ? value.format('YYYY-MM-DD HH:mm:ss') : undefined;
}
</script>

<template>
  <Drawer :title="drawerTitle">
    <div class="open-package-form">
      <label>
        <span>{{ $t('system.package.user') }}</span>
        <Select
          v-model:value="formState.userId"
          show-search
          :filter-option="true"
          :options="userOptions"
          :placeholder="$t('ui.placeholder.select')"
        />
      </label>
      <label>
        <span>{{ $t('system.package.startTime') }}</span>
        <DatePicker
          v-model:value="formState.startTime"
          class="w-full"
          show-time
        />
      </label>
      <label>
        <span>{{ $t('system.package.expireTime') }}</span>
        <DatePicker
          v-model:value="formState.expireTime"
          class="w-full"
          show-time
        />
      </label>
      <label class="open-package-form__switch">
        <span>{{ $t('system.package.status') }}</span>
        <Switch
          :checked="formState.status === 1"
          :checked-children="$t('system.register.enableAction')"
          :un-checked-children="$t('system.register.disableAction')"
          @change="(checked) => (formState.status = checked ? 1 : 0)"
        />
      </label>
    </div>
  </Drawer>
</template>

<style scoped>
.open-package-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.open-package-form label {
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: hsl(var(--foreground));
  font-size: 14px;
  font-weight: 500;
}

.open-package-form__switch {
  align-items: flex-start;
}
</style>
