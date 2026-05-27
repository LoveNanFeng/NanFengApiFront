<script lang="ts" setup>
import type { RedeemCardApi } from '#/api/redeem-card';

import { computed, ref, watch } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Alert, Button, Input, message, Modal, Spin } from 'ant-design-vue';

import { redeemCard } from '#/api/redeem-card';

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  success: [Record<string, unknown> | RedeemCardApi.GeneratedCard];
  'update:open': [boolean];
}>();

const cardCode = ref('');
const submitting = ref(false);

const visible = computed({
  get: () => props.open,
  set: (value: boolean) => emit('update:open', value),
});

watch(
  () => props.open,
  (open) => {
    if (!open) {
      cardCode.value = '';
    }
  },
);

async function submitRedeem() {
  const code = cardCode.value.trim();
  if (!code) {
    message.warning('请输入卡密');
    return;
  }
  submitting.value = true;
  try {
    const result = await redeemCard(code);
    message.success(result.reward || '兑换成功');
    emit('success', result);
    visible.value = false;
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <Modal
    v-model:open="visible"
    :footer="null"
    :mask-closable="!submitting"
    destroy-on-close
    title="卡密兑换"
    width="520px"
  >
    <Spin :spinning="submitting">
      <div class="redeem-modal">
        <Alert
          show-icon
          type="info"
          message="输入管理员发放的卡密，兑换后会立即到账。"
        />
        <Alert
          show-icon
          type="warning"
          message="套餐卡密提示：如果当前已有套餐，兑换相同套餐会续期；兑换不同套餐或不同规格会从当前时间重新覆盖生效。"
        />

        <label class="redeem-modal__field">
          <span>卡密</span>
          <Input
            v-model:value="cardCode"
            allow-clear
            placeholder="请输入卡密"
            size="large"
            @press-enter="submitRedeem"
          />
        </label>

        <div class="redeem-modal__actions">
          <Button @click="visible = false">取消</Button>
          <Button type="primary" :loading="submitting" @click="submitRedeem">
            <IconifyIcon class="size-4" icon="lucide:ticket-check" />
            立即兑换
          </Button>
        </div>
      </div>
    </Spin>
  </Modal>
</template>

<style scoped>
.redeem-modal {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.redeem-modal__field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-weight: 700;
}

.redeem-modal__field span {
  color: rgb(71 85 105);
}

.redeem-modal__actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}
</style>
