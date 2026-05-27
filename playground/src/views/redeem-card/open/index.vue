<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';

import type { RedeemCardApi } from '#/api/redeem-card';

import { computed, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import {
  Alert,
  Button,
  Input,
  message,
  Modal,
  Pagination,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tag,
} from 'ant-design-vue';

import {
  createRedeemCardOpenKey,
  deleteRedeemCardOpenKey,
  getRedeemCardOpenKeys,
  regenerateRedeemCardOpenKey,
  updateRedeemCardOpenKey,
} from '#/api/redeem-card';

const cardTypeOptions: Array<{
  label: string;
  value: RedeemCardApi.OpenKeyCardType;
}> = [
  { label: '余额卡密', value: 'BALANCE' },
  { label: '全站套餐', value: 'GLOBAL' },
  { label: '接口套餐', value: 'INTERFACE' },
  { label: '点数套餐', value: 'POINT' },
];

const statusOptions = [
  { label: '启用', value: 1 },
  { label: '禁用', value: 0 },
];

const tableScroll = { x: 1550 };

const filters = reactive<RedeemCardApi.OpenKeyListParams>({
  cardType: undefined,
  keyword: '',
  page: 1,
  pageSize: 10,
  status: undefined,
});

const formState = reactive<RedeemCardApi.OpenKeyPayload>({
  cardType: 'BALANCE',
  keyName: '',
  status: 1,
});

const editingId = ref<string>();
const keys = ref<RedeemCardApi.OpenKeyItem[]>([]);
const loading = ref(false);
const modalVisible = ref(false);
const submitting = ref(false);
const helpExpanded = ref(false);
const total = ref(0);

const modalTitle = computed(() =>
  editingId.value ? '编辑公开接口 Key' : '新增公开接口 Key',
);

const openKmEndpoint = computed(() => withCurrentOrigin('/open/v1/km'));

type OpenKeyRecord = Record<string, any> | RedeemCardApi.OpenKeyItem;

const columns: TableColumnsType<RedeemCardApi.OpenKeyItem> = [
  { key: 'keyInfo', title: 'Key 信息', width: 260 },
  { dataIndex: 'kmKey', key: 'kmKey', title: 'kmkey', width: 340 },
  {
    dataIndex: 'lastUsedTime',
    key: 'lastUsedTime',
    title: '最后调用',
    width: 190,
  },
  { dataIndex: 'example', key: 'example', title: '调用示例', width: 560 },
  {
    align: 'center',
    dataIndex: 'operation',
    fixed: 'right',
    key: 'operation',
    title: '操作',
    width: 200,
  },
];

function cardTypeText(type?: RedeemCardApi.OpenKeyCardType | string) {
  return (
    cardTypeOptions.find((item) => item.value === type)?.label ??
    String(type || '-')
  );
}

function normalizeText(value?: null | string) {
  return value && value.trim() ? value.trim() : undefined;
}

function withCurrentOrigin(pathOrUrl: string) {
  if (!pathOrUrl) return '';
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const normalizedPath = pathOrUrl.startsWith('/')
    ? pathOrUrl
    : `/${pathOrUrl}`;
  if (typeof window === 'undefined') return normalizedPath;
  return `${window.location.origin}${normalizedPath}`;
}

function asOpenKeyItem(record: OpenKeyRecord) {
  return record as RedeemCardApi.OpenKeyItem;
}

function buildExample(record: OpenKeyRecord) {
  const item = asOpenKeyItem(record);
  const params = new URLSearchParams({
    kmkey: item.kmKey,
    type: item.cardType,
    user: 'user001',
  });
  if (item.cardType === 'BALANCE') {
    params.set('money', '10.00');
  } else {
    params.set('member', '1');
  }
  params.set('time', '1');
  params.set('count', '1');
  return `${openKmEndpoint.value}?${params.toString()}`;
}

async function copyText(text: string) {
  await navigator.clipboard.writeText(text);
  message.success('已复制');
}

async function queryKeys(page = filters.page ?? 1) {
  loading.value = true;
  try {
    const result = await getRedeemCardOpenKeys({
      ...filters,
      keyword: normalizeText(filters.keyword),
      page,
    });
    keys.value = result.items;
    filters.page = page;
    total.value = result.total;
  } finally {
    loading.value = false;
  }
}

function resetForm() {
  editingId.value = undefined;
  formState.cardType = 'BALANCE';
  formState.keyName = '';
  formState.status = 1;
}

function openCreate() {
  resetForm();
  modalVisible.value = true;
}

function openEdit(record: OpenKeyRecord) {
  const item = asOpenKeyItem(record);
  editingId.value = item.id;
  formState.cardType = item.cardType;
  formState.keyName = item.keyName;
  formState.status = item.status;
  modalVisible.value = true;
}

async function submitForm() {
  submitting.value = true;
  try {
    const payload: RedeemCardApi.OpenKeyPayload = {
      cardType: formState.cardType,
      keyName: normalizeText(formState.keyName),
      status: formState.status,
    };
    if (editingId.value) {
      await updateRedeemCardOpenKey(editingId.value, payload);
      message.success('已保存');
    } else {
      await createRedeemCardOpenKey(payload);
      message.success('已创建');
    }
    modalVisible.value = false;
    await queryKeys(editingId.value ? filters.page : 1);
  } finally {
    submitting.value = false;
  }
}

async function toggleStatus(record: OpenKeyRecord, checked: boolean) {
  const item = asOpenKeyItem(record);
  await updateRedeemCardOpenKey(item.id, {
    cardType: item.cardType,
    keyName: item.keyName,
    status: checked ? 1 : 0,
  });
  message.success(checked ? '已启用' : '已禁用');
  await queryKeys(filters.page);
}

async function regenerateKey(record: OpenKeyRecord) {
  const item = asOpenKeyItem(record);
  const result = await regenerateRedeemCardOpenKey(item.id);
  await copyText(result.kmKey);
  await queryKeys(filters.page);
}

async function removeKey(record: OpenKeyRecord) {
  const item = asOpenKeyItem(record);
  await deleteRedeemCardOpenKey(item.id);
  message.success('已删除');
  await queryKeys(1);
}

function onSearch() {
  queryKeys(1);
}

function onReset() {
  filters.keyword = '';
  filters.cardType = undefined;
  filters.status = undefined;
  queryKeys(1);
}

function onPageChange(page: number, pageSize: number) {
  filters.pageSize = pageSize;
  queryKeys(page);
}

onMounted(() => {
  queryKeys(1);
});
</script>

<template>
  <Page auto-content-height>
    <div class="redeem-open-page">
      <Alert show-icon type="info" message="公开接口生成卡密">
        <template #description>
          <div class="redeem-open-help">
            <div class="redeem-open-help__summary">
              <p>
                外部系统可通过 GET 或 POST 调用
                <code>/open/v1/km</code> 生成指定用户独属卡密。
              </p>
              <Button
                class="redeem-open-help__toggle"
                size="small"
                type="link"
                @click="helpExpanded = !helpExpanded"
              >
                <IconifyIcon
                  class="size-4"
                  :icon="
                    helpExpanded ? 'lucide:chevron-up' : 'lucide:chevron-down'
                  "
                />
                {{ helpExpanded ? '收起参数详情' : '展开参数详情' }}
              </Button>
            </div>
            <div v-if="helpExpanded" class="redeem-open-help__detail">
              <div class="redeem-open-help__grid">
                <div>
                  <code>kmkey</code>
                  <span>管理员在本页创建的公开接口 Key。</span>
                </div>
                <div>
                  <code>user</code>
                  <span>用户账号，生成后的卡密只允许该用户兑换。</span>
                </div>
                <div>
                  <code>type</code>
                  <span>
                    卡密类型：GLOBAL=全站套餐、INTERFACE=接口套餐、POINT=点数套餐、BALANCE=余额。
                  </span>
                </div>
                <div>
                  <code>time</code>
                  <span>过期天数，0 表示不过期，1 表示当前时间加 1 天。</span>
                </div>
                <div>
                  <code>member</code>
                  <span>套餐 ID；接口套餐填写规格 ID；余额卡密不传。</span>
                </div>
                <div>
                  <code>money</code>
                  <span>余额卡密金额，只在 type=BALANCE 时填写。</span>
                </div>
                <div>
                  <code>count</code>
                  <span>生成数量，建议按实际发放批次填写。</span>
                </div>
              </div>
              <p>
                全站套餐和点数套餐传对应套餐 ID，接口套餐传规格 ID；余额卡密不传
                member， 需要传 money。
              </p>
            </div>
          </div>
        </template>
      </Alert>

      <section class="redeem-open-panel">
        <div class="redeem-open-panel__head">
          <div>
            <h2>公开接口 Key</h2>
            <p>创建后把 kmkey 和调用示例交给可信系统使用。</p>
          </div>
          <Button type="primary" @click="openCreate">
            <IconifyIcon class="size-4" icon="lucide:plus" />
            新增 Key
          </Button>
        </div>

        <div class="redeem-open-doc">
          <span>示例</span>
          <code>
            {{
              openKmEndpoint
            }}?kmkey=xxx&user=user001&type=BALANCE&money=10.00&time=1&count=1
          </code>
        </div>

        <div class="redeem-filter-bar">
          <Input
            v-model:value="filters.keyword"
            allow-clear
            placeholder="搜索名称、kmkey"
            @press-enter="onSearch"
          />
          <Select
            v-model:value="filters.cardType"
            allow-clear
            :options="cardTypeOptions"
            placeholder="卡密类型"
          />
          <Select
            v-model:value="filters.status"
            allow-clear
            :options="statusOptions"
            placeholder="状态"
          />
          <Button type="primary" @click="onSearch">搜索</Button>
          <Button @click="onReset">重置</Button>
        </div>

        <div class="redeem-table-wrap">
          <Table
            class="redeem-open-table"
            :columns="columns"
            :data-source="keys"
            :loading="loading"
            :pagination="false"
            :scroll="tableScroll"
            row-key="id"
            size="middle"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'keyInfo'">
                <div class="redeem-key-info">
                  <div
                    class="redeem-key-info__name"
                    :title="record.keyName || '未命名 Key'"
                  >
                    {{ record.keyName || '未命名 Key' }}
                  </div>
                  <div class="redeem-key-info__meta">
                    <Tag color="blue">{{ cardTypeText(record.cardType) }}</Tag>
                    <Switch
                      class="redeem-status-switch"
                      :checked="record.status === 1"
                      checked-children="启用"
                      un-checked-children="禁用"
                      @change="
                        (checked) => toggleStatus(record, Boolean(checked))
                      "
                    />
                  </div>
                </div>
              </template>
              <template v-else-if="column.key === 'kmKey'">
                <button
                  class="redeem-copy-chip"
                  :title="`点击复制：${record.kmKey}`"
                  @click="copyText(record.kmKey)"
                >
                  <span>{{ record.kmKey }}</span>
                  <IconifyIcon
                    class="redeem-copy-chip__icon"
                    icon="lucide:copy"
                  />
                </button>
              </template>
              <template v-else-if="column.key === 'lastUsedTime'">
                <span class="redeem-time">
                  {{ record.lastUsedTime || '暂未调用' }}
                </span>
              </template>
              <template v-else-if="column.key === 'example'">
                <button
                  class="redeem-example-chip"
                  :title="`点击复制：${buildExample(record)}`"
                  @click="copyText(buildExample(record))"
                >
                  <code>{{ buildExample(record) }}</code>
                  <IconifyIcon
                    class="redeem-copy-chip__icon"
                    icon="lucide:copy"
                  />
                </button>
              </template>
              <template v-else-if="column.key === 'operation'">
                <Space class="redeem-action-space" :size="6">
                  <Button size="small" type="link" @click="openEdit(record)">
                    编辑
                  </Button>
                  <Popconfirm
                    title="重新生成后旧 kmkey 会立即失效，确认继续？"
                    @confirm="regenerateKey(record)"
                  >
                    <Button size="small" type="link">重新生成</Button>
                  </Popconfirm>
                  <Popconfirm
                    title="删除后该公开接口不可再调用，确认删除？"
                    @confirm="removeKey(record)"
                  >
                    <Button danger size="small" type="link">删除</Button>
                  </Popconfirm>
                </Space>
              </template>
            </template>
          </Table>
        </div>

        <Pagination
          v-model:current="filters.page"
          :page-size="filters.pageSize"
          :show-total="(count: number) => `共 ${count} 个 Key`"
          :total="total"
          class="redeem-pagination"
          show-size-changer
          @change="onPageChange"
        />
      </section>

      <Modal
        v-model:open="modalVisible"
        :confirm-loading="submitting"
        :title="modalTitle"
        destroy-on-close
        @ok="submitForm"
      >
        <div class="redeem-open-form">
          <label>
            <span>名称</span>
            <Input
              v-model:value="formState.keyName"
              allow-clear
              placeholder="例如：合作方全站套餐发卡"
            />
          </label>

          <label>
            <span>卡密类型</span>
            <Select
              v-model:value="formState.cardType"
              :options="cardTypeOptions"
            />
          </label>

          <label>
            <span>状态</span>
            <Select v-model:value="formState.status" :options="statusOptions" />
          </label>
        </div>
      </Modal>
    </div>
  </Page>
</template>

<style scoped>
.redeem-open-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
  height: 100%;
  min-height: 0;
}

.redeem-open-panel {
  min-height: 0;
  padding: 18px;
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
}

.redeem-open-panel__head {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 16px;
}

.redeem-open-panel__head h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  line-height: 24px;
}

.redeem-open-panel__head p {
  margin: 4px 0 0;
  color: rgb(100 116 139);
}

.redeem-open-help {
  display: grid;
  gap: 8px;
}

.redeem-open-help p {
  margin: 0;
}

.redeem-open-help code {
  padding: 1px 6px;
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
  font-size: 13px;
  font-weight: 800;
  color: rgb(30 64 175);
  background: rgb(219 234 254 / 70%);
  border-radius: 5px;
}

.redeem-open-help__summary {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
}

.redeem-open-help__summary p {
  min-width: 0;
}

.redeem-open-help__toggle {
  display: inline-flex;
  flex: 0 0 auto;
  gap: 4px;
  align-items: center;
  padding: 0;
  font-weight: 700;
}

.redeem-open-help__detail {
  display: grid;
  gap: 10px;
  padding-top: 2px;
}

.redeem-open-help__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 16px;
}

.redeem-open-help__grid > div {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  min-width: 0;
}

.redeem-open-help__grid span {
  min-width: 0;
  color: rgb(71 85 105);
}

.redeem-open-doc {
  display: flex;
  gap: 10px;
  align-items: center;
  min-width: 0;
  padding: 10px 12px;
  margin-bottom: 14px;
  background: rgb(248 250 252);
  border: 1px solid rgb(226 232 240);
  border-radius: 8px;
}

.redeem-open-doc span {
  flex: 0 0 auto;
  font-weight: 800;
  color: rgb(51 65 85);
}

.redeem-open-doc code {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  color: rgb(15 23 42);
  white-space: nowrap;
}

.redeem-filter-bar {
  display: grid;
  grid-template-columns: minmax(240px, 1fr) 180px 140px 90px 90px;
  gap: 12px;
  margin-bottom: 14px;
}

.redeem-table-wrap {
  width: 100%;
  min-width: 0;
  overflow: hidden;
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
}

.redeem-key-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.redeem-key-info__name {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 800;
  line-height: 20px;
  color: rgb(15 23 42);
  word-break: keep-all;
  white-space: nowrap;
}

.redeem-key-info__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.redeem-status-switch {
  flex: 0 0 auto;
  min-width: 56px;
}

:global(.redeem-status-switch.ant-switch .ant-switch-inner) {
  font-size: 12px;
  font-weight: 700;
}

.redeem-copy-chip,
.redeem-example-chip {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  width: 100%;
  min-width: 0;
  height: 34px;
  padding: 0 10px;
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
  font-size: 13px;
  font-weight: 700;
  color: hsl(var(--primary));
  text-align: left;
  cursor: pointer;
  background: rgb(239 246 255 / 80%);
  border: 1px solid rgb(191 219 254);
  border-radius: 7px;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease,
    color 0.2s ease;
}

.redeem-copy-chip:hover,
.redeem-example-chip:hover {
  color: rgb(29 78 216);
  background: rgb(219 234 254 / 80%);
  border-color: rgb(96 165 250);
}

.redeem-copy-chip span,
.redeem-example-chip code {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.redeem-example-chip {
  color: rgb(71 85 105);
  background: rgb(248 250 252);
  border-color: rgb(226 232 240);
}

.redeem-example-chip:hover {
  color: rgb(30 64 175);
  background: rgb(241 245 249);
  border-color: rgb(203 213 225);
}

.redeem-copy-chip__icon {
  flex: 0 0 auto;
  color: rgb(100 116 139);
}

.redeem-time {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 3px 9px;
  font-size: 13px;
  font-weight: 600;
  color: rgb(71 85 105);
  white-space: nowrap;
  background: rgb(248 250 252);
  border: 1px solid rgb(226 232 240);
  border-radius: 999px;
}

.redeem-action-space {
  flex-wrap: nowrap;
}

.redeem-pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 14px;
}

.redeem-open-form {
  display: grid;
  gap: 14px;
}

.redeem-open-form label {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-weight: 600;
}

.redeem-open-form label > span {
  font-size: 13px;
  color: rgb(71 85 105);
}

:global(.dark) .redeem-open-doc {
  background: rgb(15 23 42 / 50%);
  border-color: rgb(51 65 85);
}

:global(.dark) .redeem-open-doc span,
:global(.dark) .redeem-open-doc code,
:global(.dark) .redeem-example-chip {
  color: rgb(226 232 240);
}

:global(.dark) .redeem-key-info__name {
  color: rgb(241 245 249);
}

:global(.dark) .redeem-copy-chip {
  color: rgb(191 219 254);
  background: rgb(30 64 175 / 28%);
  border-color: rgb(37 99 235 / 45%);
}

:global(.dark) .redeem-example-chip,
:global(.dark) .redeem-time {
  color: rgb(203 213 225);
  background: rgb(15 23 42 / 50%);
  border-color: rgb(51 65 85);
}

:global(.dark) .redeem-open-help code {
  color: rgb(191 219 254);
  background: rgb(30 64 175 / 40%);
}

:global(.dark) .redeem-open-help__grid span {
  color: rgb(203 213 225);
}

:global(.redeem-open-table .ant-table) {
  background: transparent;
}

:global(.redeem-open-table .ant-table-thead > tr > th) {
  font-weight: 800;
  color: rgb(51 65 85);
  white-space: nowrap;
  background: rgb(248 250 252);
}

:global(.redeem-open-table .ant-table-cell) {
  vertical-align: middle;
}

:global(.redeem-open-table .ant-table-tbody > tr > td) {
  padding-top: 14px;
  padding-bottom: 14px;
}

:global(.redeem-open-table .ant-table-tbody > tr:hover > td) {
  background: rgb(248 250 252 / 70%);
}

:global(.dark) :global(.redeem-open-table .ant-table-thead > tr > th) {
  color: rgb(226 232 240);
  background: rgb(15 23 42 / 65%);
}

:global(.dark) :global(.redeem-open-table .ant-table-tbody > tr:hover > td) {
  background: rgb(15 23 42 / 35%);
}

@media (max-width: 960px) {
  .redeem-filter-bar {
    grid-template-columns: 1fr;
  }

  .redeem-open-help__summary {
    align-items: flex-start;
  }

  .redeem-open-help__grid {
    grid-template-columns: 1fr;
  }

  .redeem-open-panel__head {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
