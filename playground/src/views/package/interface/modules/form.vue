<script lang="ts" setup>
import type { PackageApi } from '#/api/package';

import { computed, nextTick, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';
import { IconifyIcon, Plus } from '@vben/icons';

import { Button, Input, InputNumber, Switch, message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { createInterfacePackage, updateInterfacePackage } from '#/api/package';
import { $t } from '#/locales';

import { useFormSchema } from '../data';

interface SpecForm {
  dailyLimit: number;
  price: number | string;
  qpsLimit: number;
  remark?: string;
  sortNo: number;
  specName: string;
  status: 0 | 1;
  validDays: number;
}

const emits = defineEmits(['success']);

const formData = ref<PackageApi.InterfacePackage>();
const id = ref<string>();
const specs = ref<SpecForm[]>([]);

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
    const specPayload = normalizeSpecs();
    if (!specPayload) return;

    const values = await formApi.getValues<any>();
    const payload: PackageApi.SaveInterfacePackage = {
      interfaceId: values.interfaceId,
      name: values.name,
      remark: values.remark,
      specs: specPayload,
      status: values.status ? 1 : 0,
    };

    drawerApi.lock();
    (id.value
      ? updateInterfacePackage(id.value, payload)
      : createInterfacePackage(payload)
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

    const data = drawerApi.getData<PackageApi.InterfacePackage>();
    formApi.resetForm();
    formData.value = data?.id ? data : undefined;
    id.value = data?.id;
    specs.value = normalizeInitialSpecs(data?.specs);

    await nextTick();
    formApi.setValues({
      interfaceId: data?.interfaceId,
      name: data?.name ?? '',
      remark: data?.remark ?? '',
      status: data?.id ? data.status === 1 : true,
    });
  },
});

const drawerTitle = computed(() =>
  formData.value?.id
    ? $t('ui.actionTitle.edit', [$t('system.package.interfaceTitle')])
    : $t('ui.actionTitle.create', [$t('system.package.interfaceTitle')]),
);

function addSpec() {
  specs.value.push({
    dailyLimit: 0,
    price: 0,
    qpsLimit: 0,
    remark: '',
    sortNo: specs.value.length + 1,
    specName: '',
    status: 1,
    validDays: 30,
  });
}

function removeSpec(index: number) {
  if (specs.value.length <= 1) {
    message.warning($t('system.package.specRequired'));
    return;
  }
  specs.value.splice(index, 1);
}

function normalizeInitialSpecs(
  rows?: PackageApi.InterfacePackageSpec[],
): SpecForm[] {
  if (!rows || rows.length === 0) {
    return [
      {
        dailyLimit: 0,
        price: 0,
        qpsLimit: 0,
        remark: '',
        sortNo: 1,
        specName: '',
        status: 1,
        validDays: 30,
      },
    ];
  }
  return rows.map((item, index) => ({
    dailyLimit: Number(item.dailyLimit ?? 0),
    price: item.price ?? 0,
    qpsLimit: Number(item.qpsLimit ?? 0),
    remark: item.remark ?? '',
    sortNo: item.sortNo ?? index + 1,
    specName: item.specName ?? '',
    status: item.status ?? 1,
    validDays: Number(item.validDays ?? 30),
  }));
}

function normalizeSpecs() {
  if (specs.value.length === 0) {
    message.warning($t('system.package.specRequired'));
    return false;
  }
  const result: PackageApi.InterfacePackageSpec[] = [];
  for (const [index, item] of specs.value.entries()) {
    if (!item.specName?.trim()) {
      message.warning($t('system.package.specNameRequired'));
      return false;
    }
    result.push({
      dailyLimit: Number(item.dailyLimit ?? 0),
      price: item.price ?? 0,
      qpsLimit: Number(item.qpsLimit ?? 0),
      remark: item.remark,
      sortNo: item.sortNo || index + 1,
      specName: item.specName.trim(),
      status: item.status,
      validDays: Number(item.validDays ?? 30),
    });
  }
  return result;
}
</script>

<template>
  <Drawer :title="drawerTitle">
    <div class="interface-package-form">
      <Form />

      <div class="spec-section">
        <div class="spec-section__header">
          <span>{{ $t('system.package.specs') }}</span>
          <Button size="small" type="primary" @click="addSpec">
            <Plus class="size-4" />
            {{ $t('system.package.addSpec') }}
          </Button>
        </div>

        <div
          v-for="(item, index) in specs"
          :key="index"
          class="spec-card"
        >
          <div class="spec-card__title">
            <span>{{ $t('system.package.spec') }} {{ index + 1 }}</span>
            <Button danger size="small" type="link" @click="removeSpec(index)">
              <IconifyIcon class="size-4" icon="lucide:trash-2" />
              {{ $t('common.delete') }}
            </Button>
          </div>
          <div class="spec-card__grid">
            <label>
              <span>{{ $t('system.package.specName') }}</span>
              <Input
                v-model:value="item.specName"
                :placeholder="$t('ui.placeholder.input')"
              />
            </label>
            <label>
              <span>{{ $t('system.package.price') }}</span>
              <InputNumber
                v-model:value="item.price"
                class="w-full"
                :min="0"
                :precision="4"
              />
            </label>
            <label>
              <span>{{ $t('system.package.dailyLimit') }}</span>
              <InputNumber
                v-model:value="item.dailyLimit"
                class="w-full"
                :min="0"
                :precision="0"
              />
            </label>
            <label>
              <span>{{ $t('system.package.validDays') }}</span>
              <InputNumber
                v-model:value="item.validDays"
                class="w-full"
                :min="1"
                :precision="0"
              />
            </label>
            <label>
              <span>{{ $t('system.package.qpsLimit') }}</span>
              <InputNumber
                v-model:value="item.qpsLimit"
                class="w-full"
                :min="0"
                :precision="0"
              />
            </label>
            <label>
              <span>{{ $t('system.package.status') }}</span>
              <Switch
                :checked="item.status === 1"
                :checked-children="$t('system.register.enableAction')"
                :un-checked-children="$t('system.register.disableAction')"
                @change="(checked) => (item.status = checked ? 1 : 0)"
              />
            </label>
            <label>
              <span>{{ $t('system.package.sortNo') }}</span>
              <InputNumber
                v-model:value="item.sortNo"
                class="w-full"
                :min="0"
                :precision="0"
              />
            </label>
            <label class="spec-card__remark">
              <span>{{ $t('system.package.remark') }}</span>
              <Input
                v-model:value="item.remark"
                :placeholder="$t('ui.placeholder.input')"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  </Drawer>
</template>

<style scoped>
.interface-package-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.spec-section {
  border-top: 1px solid hsl(var(--border));
  padding-top: 18px;
}

.spec-section__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  color: hsl(var(--foreground));
  font-weight: 600;
}

.spec-card {
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
  padding: 14px;
}

.spec-card + .spec-card {
  margin-top: 12px;
}

.spec-card__title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  font-weight: 600;
}

.spec-card__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.spec-card__grid label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: hsl(var(--foreground));
  font-size: 13px;
}

.spec-card__remark {
  grid-column: 1 / -1;
}

@media (max-width: 768px) {
  .spec-card__grid {
    grid-template-columns: 1fr;
  }
}
</style>
