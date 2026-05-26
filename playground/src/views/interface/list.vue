<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { InterfaceApi } from '#/api/interface';

import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { Page, useVbenDrawer } from '@vben/common-ui';
import { IconifyIcon, Plus } from '@vben/icons';
import { useUserStore } from '@vben/stores';

import { Button, Empty, Input, Modal, Pagination, Select, Spin, Tag, message } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteInterface, getInterfaceList } from '#/api/interface';
import { $t } from '#/locales';

import { requestMethodOptions, useColumns, useGridFormSchema } from './data';
import BillingRule from './modules/billing-rule.vue';
import DocConfig from './modules/doc.vue';
import Form from './modules/form.vue';
import PollingConfig from './modules/polling.vue';

const userStore = useUserStore();
const router = useRouter();
const isAdmin = computed(() => userStore.userRoles.includes('admin'));
const cardLoading = ref(false);
const interfaceCards = ref<InterfaceApi.InterfaceItem[]>([]);
const cardFilters = reactive<{
  keyword: string;
  requestMethod?: InterfaceApi.RequestMethod;
}>({
  keyword: '',
  requestMethod: undefined,
});
const cardPagination = reactive({
  current: 1,
  pageSize: 18,
  total: 0,
});

interface FormSuccessPayload {
  mode: 'create' | 'update';
  record?: InterfaceApi.InterfaceItem;
}

const [FormDrawer, formDrawerApi] = useVbenDrawer({
  connectedComponent: Form,
  destroyOnClose: true,
});

const [BillingRuleDrawer, billingRuleDrawerApi] = useVbenDrawer({
  connectedComponent: BillingRule,
  destroyOnClose: true,
});

const [DocDrawer, docDrawerApi] = useVbenDrawer({
  connectedComponent: DocConfig,
  destroyOnClose: true,
});

const [PollingDrawer, pollingDrawerApi] = useVbenDrawer({
  connectedComponent: PollingConfig,
  destroyOnClose: true,
});

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(isAdmin.value),
    submitOnChange: true,
  },
  gridOptions: {
    columns: useColumns(onActionClick, isAdmin.value),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getInterfaceList({
            page: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
        },
      },
    },
    rowConfig: {
      keyField: 'id',
    },
    toolbarConfig: {
      custom: true,
      export: false,
      refresh: true,
      search: true,
      zoom: true,
    },
  } as VxeTableGridOptions<InterfaceApi.InterfaceItem>,
});

function onActionClick({
  code,
  row,
}: OnActionClickParams<InterfaceApi.InterfaceItem>) {
  switch (code) {
    case 'delete': {
      onDelete(row);
      break;
    }
    case 'edit': {
      onEdit(row);
      break;
    }
    case 'billingRule': {
      onBillingRule(row);
      break;
    }
    case 'doc': {
      onDocConfig(row);
      break;
    }
    case 'polling': {
      onPollingConfig(row);
      break;
    }
  }
}

function onCreate() {
  formDrawerApi.setData({}).open();
}

function onEdit(row: InterfaceApi.InterfaceItem) {
  formDrawerApi.setData(row).open();
}

function onBillingRule(row: InterfaceApi.InterfaceItem) {
  billingRuleDrawerApi.setData(row).open();
}

function onDocConfig(row: InterfaceApi.InterfaceItem) {
  docDrawerApi.setData(row).open();
}

function onPollingConfig(row: InterfaceApi.InterfaceItem) {
  pollingDrawerApi.setData(row).open();
}

function onDelete(row: InterfaceApi.InterfaceItem) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.name]),
    duration: 0,
    key: 'action_process_msg',
  });
  deleteInterface(row.id)
    .then(() => {
      message.success({
        content: $t('ui.actionMessage.deleteSuccess', [row.name]),
        key: 'action_process_msg',
      });
      onRefresh();
    })
    .catch(() => {
      hideLoading();
    });
}

function onRefresh() {
  if (isAdmin.value) {
    gridApi.query();
    return;
  }
  queryCards(cardPagination.current);
}

function onFormSuccess(payload?: FormSuccessPayload) {
  onRefresh();
  const record = payload?.record;
  if (payload?.mode !== 'create' || !record?.id) return;

  Modal.confirm({
    cancelText: '取消',
    content: '接口已添加完成，建议继续设置扣费标准，避免接口上线后扣费规则不完整。',
    okText: '确定去设置',
    onOk: () => {
      billingRuleDrawerApi.setData(record).open();
    },
    title: '是否设置扣费标准？',
  });
}

async function queryCards(page = 1) {
  cardLoading.value = true;
  try {
    const result = await getInterfaceList({
      keyword: cardFilters.keyword,
      page,
      pageSize: cardPagination.pageSize,
      requestMethod: cardFilters.requestMethod,
    });
    interfaceCards.value = result.items;
    cardPagination.current = page;
    cardPagination.total = result.total;
  } finally {
    cardLoading.value = false;
  }
}

function goDoc(item: InterfaceApi.InterfaceItem) {
  router.push({ name: 'ApiDocs', params: { id: item.id } });
}

function onCardSearch() {
  queryCards(1);
}

function onCardReset() {
  cardFilters.keyword = '';
  cardFilters.requestMethod = undefined;
  queryCards(1);
}

function onCardPageChange(page: number, pageSize: number) {
  cardPagination.pageSize = pageSize;
  queryCards(page);
}

function methodText(method: InterfaceApi.RequestMethod) {
  return method === 'GET_POST' ? 'GET/POST' : method;
}

function priceText(price: number | string) {
  const value = Number(price ?? 0);
  return value > 0 ? $t('system.interface.paid') : $t('system.interface.free');
}

function priceTagColor(price: number | string) {
  return Number(price ?? 0) > 0 ? 'gold' : 'green';
}

function moneyText(price: number | string) {
  const value = Number(price ?? 0);
  if (!Number.isFinite(value)) {
    return '0';
  }
  return value.toLocaleString('zh-CN', {
    maximumFractionDigits: 4,
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
  });
}

function singleCallPriceText(price: number | string) {
  return $t('system.interface.singleCallPrice', [moneyText(price)]);
}

function pointText(pointPrice: number | string) {
  return $t('system.interface.singleCallPoint', [
    Number(pointPrice ?? 0).toLocaleString(),
  ]);
}

function singleCallCostText(item: InterfaceApi.InterfaceItem) {
  if (Number(item.price ?? 0) <= 0) {
    return singleCallPriceText(0);
  }
  const costs: string[] = [];
  if (Number(item.price ?? 0) > 0) {
    costs.push(singleCallPriceText(item.price));
  }
  if (Number(item.pointPrice ?? 0) > 0) {
    costs.push(pointText(item.pointPrice));
  }
  return costs.length > 0 ? costs.join(' / ') : singleCallPriceText(0);
}

function interfaceAvailable(item: InterfaceApi.InterfaceItem) {
  return Number(item.status) === 1;
}

function interfaceStatusText(item: InterfaceApi.InterfaceItem) {
  return interfaceAvailable(item)
    ? $t('system.interface.statusNormal')
    : $t('system.interface.statusMaintenance');
}

function keyReady(item: InterfaceApi.InterfaceItem) {
  return !!item.secretKey && item.keyStatus === 1;
}

function keyTagText(item: InterfaceApi.InterfaceItem) {
  if (!item.secretKey) {
    return $t('system.interface.keyNotCreated');
  }
  if (item.keyStatus !== 1) {
    return $t('system.interface.keyDisabled');
  }
  return $t('system.interface.needKey');
}

onMounted(() => {
  if (!isAdmin.value) {
    queryCards();
  }
});

watch(isAdmin, (admin) => {
  if (!admin && interfaceCards.value.length === 0) {
    queryCards();
  }
});
</script>

<template>
  <Page auto-content-height content-class="interface-list-page">
    <FormDrawer @success="onFormSuccess" />
    <BillingRuleDrawer />
    <DocDrawer @success="onRefresh" />
    <PollingDrawer @success="onRefresh" />
    <Grid v-if="isAdmin" :table-title="$t('system.interface.listTitle')">
      <template #toolbar-tools>
        <Button v-if="isAdmin" type="primary" @click="onCreate">
          <Plus class="size-5" />
          {{ $t('ui.actionTitle.create', [$t('system.interface.name')]) }}
        </Button>
      </template>
    </Grid>
    <div v-else class="interface-market">
      <div class="interface-market__filter">
        <div class="interface-market__filter-item">
          <span>{{ $t('system.interface.keyword') }}</span>
          <Input
            v-model:value="cardFilters.keyword"
            allow-clear
            :placeholder="$t('system.interface.keywordPlaceholder')"
            @press-enter="onCardSearch"
          />
        </div>
        <div class="interface-market__filter-item">
          <span>{{ $t('system.interface.requestMethod') }}</span>
          <Select
            v-model:value="cardFilters.requestMethod"
            allow-clear
            :options="requestMethodOptions"
            :placeholder="$t('ui.placeholder.select')"
          />
        </div>
        <div class="interface-market__filter-actions">
          <Button @click="onCardReset">{{ $t('system.interface.reset') }}</Button>
          <Button type="primary" @click="onCardSearch">
            {{ $t('system.interface.search') }}
          </Button>
        </div>
      </div>

      <Spin :spinning="cardLoading">
        <div v-if="interfaceCards.length > 0" class="interface-card-grid">
          <div
            v-for="item in interfaceCards"
            :key="item.id"
            class="interface-card"
            @click="goDoc(item)"
          >
            <span
              class="interface-card__status"
              :class="{ 'is-maintenance': !interfaceAvailable(item) }"
              :title="interfaceStatusText(item)"
              :aria-label="interfaceStatusText(item)"
            ></span>
            <div class="interface-card__tags">
              <Tag v-if="Number(item.isTop) === 1" color="processing">
                {{ $t('system.interface.topAction') }}
              </Tag>
              <Tag v-if="Number(item.isFeatured) === 1" color="success">
                {{ $t('system.interface.featuredAction') }}
              </Tag>
              <Tag :color="priceTagColor(item.price)">
                {{ priceText(item.price) }}
              </Tag>
              <Tag :color="keyReady(item) ? undefined : 'warning'">
                {{ keyTagText(item) }}
              </Tag>
            </div>

            <div class="interface-card__body">
              <div v-if="item.avatarUrl" class="interface-card__avatar">
                <img :alt="item.name" :src="item.avatarUrl" />
              </div>
              <div class="interface-card__content">
                <div class="interface-card__name">{{ item.name }}</div>
                <div class="interface-card__desc">
                  {{ item.remark || '' }}
                </div>
              </div>
            </div>

            <div class="interface-card__footer">
              <span class="interface-card__price">
                <IconifyIcon class="size-4" icon="lucide:coins" />
                {{ singleCallCostText(item) }}
              </span>
              <span class="interface-card__method">
                {{ methodText(item.requestMethod) }}
              </span>
            </div>
          </div>
        </div>
        <div v-else class="interface-market__empty">
          <Empty />
        </div>
      </Spin>

      <div class="interface-market__pagination">
        <Pagination
          :current="cardPagination.current"
          :page-size="cardPagination.pageSize"
          :page-size-options="['12', '18', '24', '36']"
          show-size-changer
          :total="cardPagination.total"
          @change="onCardPageChange"
          @show-size-change="onCardPageChange"
        />
      </div>
    </div>
  </Page>
</template>

<style scoped>
.interface-list-page {
  height: 100%;
}

.interface-market {
  display: flex;
  min-height: 100%;
  flex-direction: column;
  gap: 16px;
}

.interface-market__filter {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) minmax(180px, 280px) auto;
  align-items: end;
  gap: 16px;
  border-radius: 6px;
  background: hsl(var(--background));
  padding: 20px;
}

.interface-market__filter-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: hsl(var(--foreground));
  font-size: 14px;
  font-weight: 500;
}

.interface-market__filter-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.interface-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 18px;
}

.interface-card {
  position: relative;
  display: flex;
  min-height: 210px;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
  background: hsl(var(--background));
  color: inherit;
  padding: 18px;
  text-align: left;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.interface-card:hover {
  border-color: hsl(var(--primary) / 45%);
  box-shadow: 0 10px 26px hsl(var(--foreground) / 8%);
  transform: translateY(-2px);
}

.interface-card__status {
  position: absolute;
  right: 18px;
  top: 18px;
  z-index: 1;
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: #22c55e;
  box-shadow: 0 0 0 6px rgb(34 197 94 / 14%);
}

.interface-card__status::after {
  position: absolute;
  inset: -7px;
  border-radius: inherit;
  background: rgb(34 197 94 / 22%);
  content: '';
  animation: interface-status-pulse 1.8s ease-out infinite;
}

.interface-card__status.is-maintenance {
  background: #f59e0b;
  box-shadow: 0 0 0 6px rgb(245 158 11 / 16%);
}

.interface-card__status.is-maintenance::after {
  background: rgb(245 158 11 / 24%);
}

.interface-card__tags {
  display: flex;
  min-height: 28px;
  flex-wrap: wrap;
  gap: 8px;
  padding-right: 26px;
}

.interface-card__tags :deep(.ant-tag) {
  display: inline-flex;
  min-width: 50px;
  height: 28px;
  align-items: center;
  justify-content: center;
  margin-inline-end: 0;
  border-radius: 7px;
  font-size: 13px;
  line-height: 1;
  padding: 0 10px;
}

.interface-card__body {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 12px 0 18px;
}

.interface-card__avatar {
  display: flex;
  width: 64px;
  height: 64px;
  flex: 0 0 64px;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 8px;
  background: hsl(var(--muted));
}

.interface-card__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.interface-card__content {
  min-width: 0;
}

.interface-card__name {
  overflow: hidden;
  color: hsl(var(--foreground));
  font-size: 16px;
  font-weight: 700;
  line-height: 24px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.interface-card__desc {
  display: -webkit-box;
  min-height: 44px;
  overflow: hidden;
  margin-top: 8px;
  color: hsl(var(--muted-foreground));
  font-size: 14px;
  line-height: 22px;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.interface-card__footer {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: space-between;
  border-top: 1px solid hsl(var(--border));
  padding-top: 14px;
}

.interface-card__price {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: hsl(var(--muted-foreground));
  font-size: 13px;
}

.interface-card__price {
  color: #f45d66;
  font-weight: 700;
}

.interface-card__method {
  flex: 0 0 auto;
  border-radius: 5px;
  background: hsl(var(--muted));
  color: hsl(var(--muted-foreground));
  font-size: 12px;
  font-weight: 700;
  line-height: 24px;
  padding: 0 10px;
}

.interface-market__empty {
  display: flex;
  min-height: 360px;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: hsl(var(--background));
}

.interface-market__pagination {
  display: flex;
  justify-content: flex-end;
  padding: 4px 0 12px;
}

@keyframes interface-status-pulse {
  0% {
    opacity: 0.9;
    transform: scale(0.72);
  }

  70% {
    opacity: 0;
    transform: scale(1.55);
  }

  100% {
    opacity: 0;
    transform: scale(1.55);
  }
}

@media (max-width: 768px) {
  .interface-market__filter {
    grid-template-columns: 1fr;
  }

  .interface-market__filter-actions {
    justify-content: flex-start;
  }
}
</style>
