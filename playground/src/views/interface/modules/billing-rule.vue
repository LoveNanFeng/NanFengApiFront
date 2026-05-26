<script lang="ts" setup>
import type { InterfaceApi } from '#/api/interface';

import { computed, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';
import { IconifyIcon, Plus } from '@vben/icons';

import { Alert, Button, Empty, Input, Select, message } from 'ant-design-vue';

import {
  getInterfaceBillingRules,
  saveInterfaceBillingRules,
} from '#/api/interface';
import { $t } from '#/locales';

const emits = defineEmits(['success']);

interface RuleDraft extends InterfaceApi.BillingRule {
  clientId: string;
}

const current = ref<InterfaceApi.InterfaceItem>();
const loading = ref(false);
const rules = ref<RuleDraft[]>([]);

const operatorOptions: Array<{
  label: string;
  value: InterfaceApi.BillingOperator;
}> = [
  { label: $t('system.interface.operatorEq'), value: 'EQ' },
  { label: $t('system.interface.operatorNe'), value: 'NE' },
  { label: $t('system.interface.operatorGt'), value: 'GT' },
  { label: $t('system.interface.operatorLt'), value: 'LT' },
  { label: $t('system.interface.operatorContains'), value: 'CONTAINS' },
];

const [Drawer, drawerApi] = useVbenDrawer({
  async onConfirm() {
    if (!current.value) return;
    if (!validateRules()) return;

    drawerApi.lock();
    try {
      await saveInterfaceBillingRules(
        current.value.id,
        rules.value.map((rule, index) => ({
          expectedValue: rule.expectedValue.trim(),
          fieldName: rule.fieldName.trim(),
          operator: rule.operator,
          sortNo: index + 1,
        })),
      );
      message.success($t('system.interface.billingRuleSaveSuccess'));
      emits('success');
      drawerApi.close();
    } finally {
      drawerApi.unlock();
    }
  },

  async onOpenChange(isOpen) {
    if (!isOpen) return;

    current.value = drawerApi.getData<InterfaceApi.InterfaceItem>();
    rules.value = [];
    if (!current.value?.id) return;

    loading.value = true;
    try {
      const result = await getInterfaceBillingRules(current.value.id);
      rules.value = result.map((rule) => ({
        ...rule,
        clientId: createClientId(),
      }));
    } finally {
      loading.value = false;
    }
  },
});

const drawerTitle = computed(() =>
  $t('system.interface.billingRuleTitle', [current.value?.name ?? '']),
);

function addRule() {
  rules.value.push({
    clientId: createClientId(),
    expectedValue: '',
    fieldName: 'code',
    operator: 'EQ',
  });
}

function removeRule(index: number) {
  rules.value.splice(index, 1);
}

function validateRules() {
  for (const rule of rules.value) {
    if (!rule.fieldName?.trim()) {
      message.warning($t('system.interface.billingFieldRequired'));
      return false;
    }
    if (!rule.operator) {
      message.warning($t('system.interface.billingOperatorRequired'));
      return false;
    }
    if (!rule.expectedValue?.trim()) {
      message.warning($t('system.interface.billingValueRequired'));
      return false;
    }
  }
  return true;
}

function createClientId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2)}`;
}
</script>

<template>
  <Drawer :title="drawerTitle">
    <div class="billing-rule-panel">
      <Alert
        show-icon
        type="info"
        :message="$t('system.interface.billingRuleTip')"
      />

      <div class="billing-rule-toolbar">
        <div>
          <div class="billing-rule-toolbar__title">
            {{ $t('system.interface.billingConditions') }}
          </div>
          <div class="billing-rule-toolbar__desc">
            {{ $t('system.interface.billingDefaultTip') }}
          </div>
        </div>
        <Button type="primary" @click="addRule">
          <Plus class="size-4" />
          {{ $t('system.interface.addBillingRule') }}
        </Button>
      </div>

      <div v-if="loading" class="billing-rule-loading">
        {{ $t('system.interface.billingRuleLoading') }}
      </div>

      <template v-else>
        <div v-if="rules.length > 0" class="billing-rule-list">
          <div
            v-for="(rule, index) in rules"
            :key="rule.clientId"
            class="billing-rule-item"
          >
            <div class="billing-rule-item__index">{{ index + 1 }}</div>
            <div class="billing-rule-item__grid">
              <Input
                class="billing-rule-item__field"
                v-model:value="rule.fieldName"
                :placeholder="$t('system.interface.billingFieldPlaceholder')"
              />
              <Select
                class="billing-rule-item__operator"
                v-model:value="rule.operator"
                :options="operatorOptions"
                :placeholder="$t('system.interface.billingOperator')"
              />
              <Input
                class="billing-rule-item__value"
                v-model:value="rule.expectedValue"
                :placeholder="$t('system.interface.billingValuePlaceholder')"
              />
              <Button
                class="billing-rule-item__delete"
                danger
                type="text"
                :aria-label="$t('common.delete')"
                :title="$t('common.delete')"
                @click="removeRule(index)"
              >
                <IconifyIcon class="size-4" icon="lucide:trash-2" />
              </Button>
            </div>
          </div>
        </div>
        <div v-else class="billing-rule-empty">
          <Empty :description="$t('system.interface.billingRuleEmpty')" />
        </div>
      </template>
    </div>
  </Drawer>
</template>

<style scoped>
.billing-rule-panel {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 18px;
  overflow-x: hidden;
}

.billing-rule-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
  background: hsl(var(--muted) / 35%);
  padding: 16px;
}

.billing-rule-toolbar__title {
  color: hsl(var(--foreground));
  font-size: 16px;
  font-weight: 700;
}

.billing-rule-toolbar__desc {
  margin-top: 4px;
  color: hsl(var(--muted-foreground));
  font-size: 13px;
}

.billing-rule-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.billing-rule-item {
  display: flex;
  gap: 12px;
  min-width: 0;
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
  background: hsl(var(--background));
  padding: 14px;
}

.billing-rule-item__index {
  display: flex;
  width: 28px;
  height: 28px;
  flex: 0 0 28px;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: hsl(var(--primary) / 10%);
  color: hsl(var(--primary));
  font-size: 13px;
  font-weight: 700;
}

.billing-rule-item__grid {
  display: grid;
  flex: 1;
  min-width: 0;
  align-items: center;
  grid-template-columns: minmax(0, 1.05fr) 118px minmax(0, 1.15fr) 34px;
  gap: 8px;
}

.billing-rule-item__grid :deep(.ant-input),
.billing-rule-item__grid :deep(.ant-select) {
  min-width: 0;
  width: 100%;
}

.billing-rule-item__delete {
  width: 34px;
  height: 34px;
  padding: 0;
}

.billing-rule-empty,
.billing-rule-loading {
  display: flex;
  min-height: 220px;
  align-items: center;
  justify-content: center;
  border: 1px dashed hsl(var(--border));
  border-radius: 8px;
  color: hsl(var(--muted-foreground));
}

@media (max-width: 768px) {
  .billing-rule-toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .billing-rule-item__grid {
    grid-template-columns: 1fr;
  }
}
</style>
