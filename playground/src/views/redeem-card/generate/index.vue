<script lang="ts" setup>
import type { Dayjs } from 'dayjs';

import type { RedeemCardApi } from '#/api/redeem-card';

import { computed, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import {
  Alert,
  Button,
  DatePicker,
  Input,
  InputNumber,
  message,
  Modal,
  Pagination,
  Select,
  Spin,
  Table,
  Tag,
} from 'ant-design-vue';

import {
  generateRedeemCards,
  getRedeemCardList,
  getRedeemCardOptions,
} from '#/api/redeem-card';

const cardTypeOptions: Array<{
  label: string;
  value: RedeemCardApi.CardType;
}> = [
  { label: '余额卡密', value: 'BALANCE' },
  { label: '全站套餐卡密', value: 'GLOBAL_PACKAGE' },
  { label: '接口套餐卡密', value: 'INTERFACE_PACKAGE' },
  { label: '点数套餐卡密', value: 'POINT_PACKAGE' },
];

const usedOptions = [
  { label: '未使用', value: 0 },
  { label: '已使用', value: 1 },
];

const tableScroll = { x: 1050 };
const resultTableScroll = { x: 680 };

interface GenerateFormState
  extends Omit<RedeemCardApi.GeneratePayload, 'expireTime' | 'remark'> {
  expireTime?: Dayjs;
}

const formState = reactive<GenerateFormState>({
  amount: 10,
  cardType: 'BALANCE',
  count: 1,
  expireTime: undefined,
  packageId: undefined,
  specId: undefined,
});

const filters = reactive<RedeemCardApi.ListParams>({
  cardType: undefined,
  keyword: '',
  page: 1,
  pageSize: 10,
  used: undefined,
});

const cards = ref<RedeemCardApi.CardItem[]>([]);
const generatedCards = ref<RedeemCardApi.GeneratedCard[]>([]);
const generatedResult = ref<RedeemCardApi.GenerateResult>();
const loading = ref(false);
const optionLoading = ref(false);
const resultVisible = ref(false);
const submitting = ref(false);
const total = ref(0);
const options = ref<RedeemCardApi.GenerateOptions>({
  globalPackages: [],
  interfaceSpecs: [],
  pointPackages: [],
});

const cardColumns = [
  { dataIndex: 'cardCode', key: 'cardCode', title: '卡密', width: 250 },
  { dataIndex: 'cardType', key: 'cardType', title: '类型', width: 130 },
  { dataIndex: 'reward', key: 'reward', title: '奖励内容', width: 240 },
  { dataIndex: 'used', key: 'used', title: '使用状态', width: 110 },
  { dataIndex: 'usedUsername', key: 'usedUsername', title: '使用者', width: 140 },
  { dataIndex: 'expireTime', key: 'expireTime', title: '过期时间', width: 170 },
  { dataIndex: 'createTime', key: 'createTime', title: '生成时间', width: 170 },
];

const resultColumns = [
  { dataIndex: 'cardCode', key: 'cardCode', title: '卡密', width: 260 },
  { dataIndex: 'cardType', key: 'cardType', title: '类型', width: 140 },
  { dataIndex: 'reward', key: 'reward', title: '奖励', width: 240 },
];

const packageOptions = computed(() => {
  if (formState.cardType === 'GLOBAL_PACKAGE') {
    return options.value.globalPackages.map((item) => ({
      label: `${item.name} / ${item.validDays}天 / ${formatMoney(item.price)}`,
      value: String(item.id),
    }));
  }
  if (formState.cardType === 'POINT_PACKAGE') {
    return options.value.pointPackages.map((item) => ({
      label: `${item.name} / ${formatCount(item.pointAmount)}点 / ${formatMoney(item.price)}`,
      value: String(item.id),
    }));
  }
  return [];
});

const interfaceSpecOptions = computed(() =>
  options.value.interfaceSpecs.map((item) => ({
    label: `${item.label} / ${item.validDays}天 / ${formatMoney(item.price)}`,
    value: String(item.specId),
  })),
);

function cardTypeText(type?: RedeemCardApi.CardType | string) {
  return (
    cardTypeOptions.find((item) => item.value === type)?.label ??
    String(type || '-')
  );
}

function rewardText(row: Partial<RedeemCardApi.CardItem>) {
  if (row.cardType === 'BALANCE') {
    return `余额 ${formatMoney(row.amount)}`;
  }
  if (row.cardType === 'POINT_PACKAGE') {
    return `点数 ${formatCount(row.pointAmount)} 点`;
  }
  return row.packageName || '-';
}

function formatCount(value?: number | string) {
  return Number(value ?? 0).toLocaleString('zh-CN');
}

function formatMoney(value?: number | string) {
  return `¥${Number(value ?? 0).toFixed(2)}`;
}

function normalizeText(value?: null | string) {
  return value && value.trim() ? value.trim() : undefined;
}

function formatDateTime(value?: Dayjs) {
  return value ? value.format('YYYY-MM-DD HH:mm:ss') : undefined;
}

function onCardTypeChange() {
  formState.packageId = undefined;
  formState.specId = undefined;
  formState.amount = formState.cardType === 'BALANCE' ? 10 : undefined;
}

async function loadOptions() {
  optionLoading.value = true;
  try {
    options.value = await getRedeemCardOptions();
  } finally {
    optionLoading.value = false;
  }
}

async function queryCards(page = filters.page ?? 1) {
  loading.value = true;
  try {
    const result = await getRedeemCardList({
      ...filters,
      keyword: normalizeText(filters.keyword),
      page,
    });
    cards.value = result.items;
    filters.page = page;
    total.value = result.total;
  } finally {
    loading.value = false;
  }
}

function validateGeneratePayload() {
  if (!formState.count || formState.count < 1 || formState.count > 1000) {
    message.warning('单次生成数量必须在 1 到 1000 之间');
    return false;
  }
  if (formState.cardType === 'BALANCE') {
    if (!formState.amount || formState.amount <= 0) {
      message.warning('请输入正确的余额金额');
      return false;
    }
    return true;
  }
  if (formState.cardType === 'INTERFACE_PACKAGE') {
    if (!formState.specId) {
      message.warning('请选择接口套餐规格');
      return false;
    }
    return true;
  }
  if (!formState.packageId) {
    message.warning(
      formState.cardType === 'POINT_PACKAGE'
        ? '请选择点数套餐'
        : '请选择全站套餐',
    );
    return false;
  }
  return true;
}

async function submitGenerate() {
  if (!validateGeneratePayload()) {
    return;
  }
  submitting.value = true;
  try {
    const result = await generateRedeemCards({
      amount: formState.cardType === 'BALANCE' ? formState.amount : undefined,
      cardType: formState.cardType,
      count: formState.count,
      expireTime: formatDateTime(formState.expireTime),
      packageId:
        formState.cardType === 'GLOBAL_PACKAGE' ||
        formState.cardType === 'POINT_PACKAGE'
          ? formState.packageId
          : undefined,
      specId:
        formState.cardType === 'INTERFACE_PACKAGE'
          ? formState.specId
          : undefined,
    });
    generatedResult.value = result;
    generatedCards.value = result.cards ?? [];
    resultVisible.value = true;
    message.success(`已生成 ${result.count} 张卡密`);
    await queryCards(1);
  } finally {
    submitting.value = false;
  }
}

async function copyGeneratedCards() {
  const codes = generatedCards.value.map((item) => item.cardCode).join('\n');
  if (!codes) {
    return;
  }
  await navigator.clipboard.writeText(codes);
  message.success('卡密已复制');
}

function onSearch() {
  queryCards(1);
}

function onReset() {
  filters.keyword = '';
  filters.cardType = undefined;
  filters.used = undefined;
  queryCards(1);
}

function onPageChange(page: number, pageSize: number) {
  filters.pageSize = pageSize;
  queryCards(page);
}

onMounted(async () => {
  await Promise.all([loadOptions(), queryCards(1)]);
});
</script>

<template>
  <Page auto-content-height>
    <div class="redeem-generate-page">
      <Alert
        show-icon
        type="info"
        message="批量生成卡密"
        description="卡密会按当前需求以明文保存，请只发给可信用户；余额卡密直接增加账户余额，套餐卡密会开通或续期对应套餐。"
      />

      <section class="redeem-panel redeem-panel--form">
        <div class="redeem-panel__head">
          <div>
            <h2>生成卡密</h2>
            <p>选择卡密类型、奖励内容和生成数量。</p>
          </div>
          <Button
            type="primary"
            :loading="submitting"
            @click="submitGenerate"
          >
            <IconifyIcon class="size-4" icon="lucide:ticket-plus" />
            生成卡密
          </Button>
        </div>

        <Spin :spinning="optionLoading">
          <div class="redeem-form-grid">
            <label>
              <span>卡密类型</span>
              <Select
                v-model:value="formState.cardType"
                :options="cardTypeOptions"
                @change="onCardTypeChange"
              />
            </label>

            <label>
              <span>生成数量</span>
              <InputNumber
                v-model:value="formState.count"
                class="w-full"
                :max="1000"
                :min="1"
                :precision="0"
              />
            </label>

            <label v-if="formState.cardType === 'BALANCE'">
              <span>余额金额</span>
              <InputNumber
                v-model:value="formState.amount"
                class="w-full"
                :max="999999.99"
                :min="0.01"
                :precision="2"
                prefix="¥"
              />
            </label>

            <label v-if="formState.cardType === 'GLOBAL_PACKAGE'">
              <span>全站套餐</span>
              <Select
                v-model:value="formState.packageId"
                allow-clear
                show-search
                :filter-option="true"
                :options="packageOptions"
                placeholder="请选择全站套餐"
              />
            </label>

            <label v-if="formState.cardType === 'INTERFACE_PACKAGE'">
              <span>接口套餐规格</span>
              <Select
                v-model:value="formState.specId"
                allow-clear
                show-search
                :filter-option="true"
                :options="interfaceSpecOptions"
                placeholder="请选择接口套餐规格"
              />
            </label>

            <label v-if="formState.cardType === 'POINT_PACKAGE'">
              <span>点数套餐</span>
              <Select
                v-model:value="formState.packageId"
                allow-clear
                show-search
                :filter-option="true"
                :options="packageOptions"
                placeholder="请选择点数套餐"
              />
            </label>

            <label>
              <span>过期时间</span>
              <DatePicker
                v-model:value="formState.expireTime"
                allow-clear
                class="w-full"
                format="YYYY-MM-DD HH:mm:ss"
                placeholder="留空不过期"
                show-time
              />
            </label>
          </div>
        </Spin>
      </section>

      <section class="redeem-panel">
        <div class="redeem-panel__head">
          <div>
            <h2>卡密列表</h2>
            <p>按卡密或批次号搜索，便于核对生成结果。</p>
          </div>
        </div>

        <div class="redeem-filter-bar">
          <Input
            v-model:value="filters.keyword"
            allow-clear
            placeholder="搜索卡密、批次号"
            @press-enter="onSearch"
          />
          <Select
            v-model:value="filters.cardType"
            allow-clear
            :options="cardTypeOptions"
            placeholder="卡密类型"
          />
          <Select
            v-model:value="filters.used"
            allow-clear
            :options="usedOptions"
            placeholder="使用状态"
          />
          <Button type="primary" @click="onSearch">搜索</Button>
          <Button @click="onReset">重置</Button>
        </div>

        <div class="redeem-table-wrap">
          <Table
            :columns="cardColumns"
            :data-source="cards"
            :loading="loading"
            :pagination="false"
            :scroll="tableScroll"
            row-key="id"
            size="middle"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'cardCode'">
                <span class="redeem-code">{{ record.cardCode }}</span>
              </template>
              <template v-else-if="column.key === 'cardType'">
                <Tag color="blue">{{ cardTypeText(record.cardType) }}</Tag>
              </template>
              <template v-else-if="column.key === 'reward'">
                {{ rewardText(record) }}
              </template>
              <template v-else-if="column.key === 'used'">
                <Tag :color="record.used === 1 ? 'default' : 'success'">
                  {{ record.used === 1 ? '已使用' : '未使用' }}
                </Tag>
              </template>
              <template v-else-if="column.key === 'usedUsername'">
                {{ record.usedRealName || record.usedUsername || '-' }}
              </template>
            </template>
          </Table>
        </div>

        <Pagination
          v-model:current="filters.page"
          :page-size="filters.pageSize"
          :show-total="(count: number) => `共 ${count} 张卡密`"
          :total="total"
          class="redeem-pagination"
          show-size-changer
          @change="onPageChange"
        />
      </section>

      <Modal
        v-model:open="resultVisible"
        :footer="null"
        :width="860"
        destroy-on-close
        title="生成结果"
      >
        <div class="redeem-result-head">
          <div>
            <span>批次号</span>
            <strong>{{ generatedResult?.batchNo }}</strong>
          </div>
          <Button type="primary" @click="copyGeneratedCards">
            <IconifyIcon class="size-4" icon="lucide:copy" />
            复制全部卡密
          </Button>
        </div>
        <Table
          :columns="resultColumns"
          :data-source="generatedCards"
          :pagination="false"
          :scroll="resultTableScroll"
          row-key="cardCode"
          size="small"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'cardType'">
              <Tag color="blue">{{ cardTypeText(record.cardType) }}</Tag>
            </template>
            <template v-if="column.key === 'cardCode'">
              <span class="redeem-code">{{ record.cardCode }}</span>
            </template>
          </template>
        </Table>
      </Modal>
    </div>
  </Page>
</template>

<style scoped>
.redeem-generate-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
  height: 100%;
  min-height: 0;
}

.redeem-panel {
  min-height: 0;
  padding: 18px;
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
}

.redeem-panel--form {
  flex: 0 0 auto;
}

.redeem-panel__head {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 16px;
}

.redeem-panel__head h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  line-height: 24px;
}

.redeem-panel__head p {
  margin: 4px 0 0;
  color: rgb(100 116 139);
}

.redeem-form-grid,
.redeem-filter-bar {
  display: grid;
  gap: 12px;
}

.redeem-form-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.redeem-form-grid label {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
  font-weight: 600;
}

.redeem-form-grid label > span {
  font-size: 13px;
  color: rgb(71 85 105);
}

.redeem-filter-bar {
  grid-template-columns: minmax(220px, 1fr) 180px 150px 90px 90px;
  margin-bottom: 14px;
}

.redeem-table-wrap {
  width: 100%;
  min-width: 0;
  overflow: hidden;
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
}

.redeem-table-wrap :deep(.ant-table) {
  border-radius: 8px;
}

.redeem-table-wrap :deep(.ant-table-container) {
  border-start-start-radius: 8px;
  border-start-end-radius: 8px;
}

.redeem-table-wrap :deep(.ant-table-placeholder .ant-table-cell) {
  height: 150px;
}

.redeem-code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    'Liberation Mono', 'Courier New', monospace;
  font-size: 13px;
  font-weight: 700;
}

.redeem-pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 14px;
}

.redeem-result-head {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.redeem-result-head span {
  display: block;
  color: rgb(100 116 139);
}

.redeem-result-head strong {
  font-size: 16px;
}

@media (max-width: 960px) {
  .redeem-form-grid,
  .redeem-filter-bar {
    grid-template-columns: 1fr;
  }

  .redeem-panel__head,
  .redeem-result-head {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
