<script lang="ts" setup>
import type { EchartsUIType } from '@vben/plugins/echarts';

import type {
  AdminWorkbenchStats,
  UserCallTrendKey,
  UserCallTrendStats,
  UserWorkbenchStats,
} from '#/api/core/user';
import type { NoticeApi } from '#/api/notice';
import type { RechargeApi } from '#/api/payment';

import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue';
import { useRouter } from 'vue-router';

import { useVbenDrawer, WorkbenchHeader } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { EchartsUI, useEcharts } from '@vben/plugins/echarts';
import { useUserStore } from '@vben/stores';
import { openWindow } from '@vben/utils';

import {
  Button,
  InputNumber,
  message,
  Modal,
  QRCode,
  Radio,
  RadioGroup,
  Spin,
  TabPane,
  Tabs,
  Tag,
} from 'ant-design-vue';

import {
  getAdminWorkbenchStatsApi,
  getUserWorkbenchStatsApi,
} from '#/api/core/user';
import {
  getUserNoticeDetail,
  getUserNoticeList,
  getUserPopupNotices,
} from '#/api/notice';
import {
  createRechargeOrder,
  getRechargeCapabilities,
  syncRechargeOrder,
} from '#/api/payment';
import RichTextPreview from '#/components/rich-text-preview/index.vue';
import RedeemModal from '#/views/redeem-card/user/modules/redeem-modal.vue';

const router = useRouter();
const userStore = useUserStore();
const DEFAULT_LOCAL_AVATAR = '/logo.png';

type HeaderAssetAction = 'balanceRecharge' | 'cardRedeem' | 'packageDetail';

interface HeaderAssetItem {
  action?: HeaderAssetAction | undefined;
  icon: string;
  label: string;
  secondaryAction?: HeaderAssetAction | undefined;
  value: string;
}

interface UserQuickActionItem {
  accent: string;
  badge?: string;
  description: string;
  icon: string;
  title: string;
  url: string;
}

interface QuickNavItem {
  color?: string;
  icon: string;
  title: string;
  url?: string;
}

type PackageDetailTab = 'global' | 'interface';

function emptyCallTrend(): UserCallTrendStats {
  return {
    labels: [],
    total: 0,
    values: [],
  };
}

function defaultUserStats(): UserWorkbenchStats {
  return {
    callTrends: {
      oneYear: emptyCallTrend(),
      sevenDays: emptyCallTrend(),
      thirtyDays: emptyCallTrend(),
    },
    balance: '0.0000',
    currentPackageName: '普通用户',
    currentPackageType: '基础账户',
    dailyLimit: 0,
    dailyLimitUnlimited: false,
    failedCalls: 0,
    failedRate: '0%',
    hasAnyPackage: false,
    hasMemberPackage: false,
    interfacePackageCount: 0,
    interfacePackages: [],
    memberPackage: null,
    points: 0,
    qpsLimit: 1,
    qpsLimitUnlimited: false,
    remainingCalls: 0,
    remainingUnlimited: false,
    successCalls: 0,
    successRate: '0%',
    todayCalls: 0,
  };
}

function emptyAdminCallTrend() {
  return {
    billableCalls: [],
    chargeAmounts: [],
    chargeTotal: '0.00',
    failedCalls: [],
    labels: [],
    successCalls: [],
    total: 0,
    totalCalls: [],
  };
}

function emptyAdminRevenueTrend() {
  return {
    labels: [],
    orderCounts: [],
    paidAmounts: [],
    totalAmount: '0.00',
    totalOrders: 0,
  };
}

function defaultAdminStats(): AdminWorkbenchStats {
  return {
    activeUsers: [],
    alerts: [],
    callTrend7d: emptyAdminCallTrend(),
    hotApis: [],
    overview: {
      apiEnabled: 0,
      apiTotal: 0,
      keyEnabled: 0,
      keyTotal: 0,
      pendingFriendLinks: 0,
      pendingOrders: 0,
      todayBillableCalls: 0,
      todayCalls: 0,
      todayChargeAmount: '0.00',
      todayFailedCalls: 0,
      todayNewUsers: 0,
      todayRevenue: '0.00',
      todaySuccessCalls: 0,
      todaySuccessRate: '0%',
      totalRevenue: '0.00',
      totalUsers: 0,
    },
    revenueTrend7d: emptyAdminRevenueTrend(),
  };
}

const userStats = ref<UserWorkbenchStats>(defaultUserStats());
const adminStats = ref<AdminWorkbenchStats>(defaultAdminStats());
const adminStatsLoading = ref(false);
const packageDetailTab = ref<PackageDetailTab>('global');
const [PackageDetailDrawer, packageDetailDrawerApi] = useVbenDrawer({
  cancelText: '关闭',
  onCancel() {
    packageDetailDrawerApi.close();
  },
  showConfirmButton: false,
});
const rechargeVisible = ref(false);
const redeemVisible = ref(false);
const rechargeAmount = ref<number>(50);
const rechargeLoading = ref(false);
const rechargeSyncLoading = ref(false);
const rechargeCapabilities = ref<null | RechargeApi.Capabilities>(null);
const rechargeOrder = ref<null | RechargeApi.RechargeOrder>(null);
const rechargePayChannel =
  ref<Exclude<RechargeApi.PayChannel, 'BALANCE'>>('ALIPAY');
const rechargePreferredProduct = ref<RechargeApi.PayProduct>('AUTO');
let rechargeTimer: number | undefined;

const dailyNoticeVisible = ref(false);
const dailyNoticeLoading = ref(false);
const dailyPopupNotices = ref<NoticeApi.NoticeItem[]>([]);
const activeDailyNoticeId = ref<string>();
const workspaceNoticeLoading = ref(false);
const workspaceNoticeDetailLoading = ref(false);
const workspaceNoticeVisible = ref(false);
const workspaceNotices = ref<NoticeApi.NoticeItem[]>([]);
const currentWorkspaceNotice = ref<NoticeApi.NoticeItem>();

const isUserWorkspace = computed(
  () => !(userStore.userInfo?.roles ?? []).includes('admin'),
);

const activeDailyNotice = computed(
  () =>
    dailyPopupNotices.value.find(
      (item) => item.id === activeDailyNoticeId.value,
    ) ?? dailyPopupNotices.value[0],
);

const activeDailyNoticeContent = computed(
  () => activeDailyNotice.value?.contentHtml ?? '',
);

const currentWorkspaceNoticeContent = computed(
  () => currentWorkspaceNotice.value?.contentHtml ?? '',
);

const rechargeClientType = computed<RechargeApi.ClientType>(() =>
  isMobileDevice() ? 'MOBILE' : 'DESKTOP',
);

const rechargeDefaultProduct = computed(() => {
  if (!rechargeCapabilities.value) {
    return '';
  }
  return rechargeClientType.value === 'MOBILE'
    ? rechargeCapabilities.value.mobileDefault
    : rechargeCapabilities.value.desktopDefault;
});

const rechargeDefaultProductName = computed(() =>
  payProductName(rechargeDefaultProduct.value),
);

const rechargeAlipayUsable = computed(() => {
  const capabilities = rechargeCapabilities.value;
  return (
    !!capabilities?.alipayEnabled &&
    (capabilities.websitePayEnabled ||
      capabilities.wapPayEnabled ||
      capabilities.facePayEnabled)
  );
});

const rechargeWechatUsable = computed(
  () => !!rechargeCapabilities.value?.wechatNativePayEnabled,
);

const rechargeChannelOptions = computed(() => {
  const options: Array<{
    description: string;
    label: string;
    value: Exclude<RechargeApi.PayChannel, 'BALANCE'>;
  }> = [];
  if (rechargeAlipayUsable.value) {
    options.push({
      description: '支持网站、手机或支付宝扫码支付',
      label: '支付宝',
      value: 'ALIPAY',
    });
  }
  if (rechargeWechatUsable.value) {
    options.push({
      description: '生成微信二维码，使用微信扫码支付',
      label: '微信支付',
      value: 'WECHAT',
    });
  }
  return options;
});

const rechargeProductOptions = computed(() => {
  const capabilities = rechargeCapabilities.value;
  if (!capabilities) {
    return [{ label: '自动选择', value: 'AUTO' as const }];
  }
  const options: Array<{ label: string; value: RechargeApi.PayProduct }> = [
    {
      label: `自动选择${rechargeDefaultProductName.value ? `（${rechargeDefaultProductName.value}）` : ''}`,
      value: 'AUTO',
    },
  ];
  if (
    rechargeClientType.value === 'DESKTOP' &&
    capabilities.websitePayEnabled
  ) {
    options.push({ label: '网站支付', value: 'PAGE' });
  }
  if (rechargeClientType.value === 'MOBILE' && capabilities.wapPayEnabled) {
    options.push({ label: '手机支付', value: 'WAP' });
  }
  if (capabilities.facePayEnabled) {
    options.push({ label: '扫码支付', value: 'FACE' });
  }
  return options;
});

const rechargeAmountOptions = computed(() =>
  (rechargeCapabilities.value?.amountOptions ?? [])
    .map((item) => ({
      ...item,
      amount: normalizeMoneyNumber(item.amount),
      giftAmount: normalizeMoneyNumber(item.giftAmount),
    }))
    .filter((item) => item.amount >= 0.01),
);

const selectedRechargeAmountOption = computed(() =>
  rechargeAmountOptions.value.find((item) =>
    isSameMoneyValue(item.amount, rechargeAmount.value),
  ),
);

const selectedRechargeGiftAmount = computed(
  () => selectedRechargeAmountOption.value?.giftAmount ?? 0,
);

const selectedRechargeCreditAmount = computed(
  () =>
    normalizeMoneyNumber(rechargeAmount.value) +
    selectedRechargeGiftAmount.value,
);

const welcomeDescription = computed(() =>
  isUserWorkspace.value
    ? '这里汇总今日接口调用情况和当前套餐额度。'
    : '这里汇总接口调用、收入订单、用户增长和运营告警。',
);

const adminOverview = computed(() => adminStats.value.overview);

const adminMetricCards = computed(() => [
  {
    icon: 'lucide:activity',
    meta: `成功率 ${adminOverview.value.todaySuccessRate}`,
    tone: 'blue',
    title: '今日调用',
    value: formatCount(adminOverview.value.todayCalls),
  },
  {
    icon: 'lucide:wallet',
    meta: `累计收入 ${formatMoney(adminOverview.value.totalRevenue)}`,
    tone: 'green',
    title: '今日收入',
    value: formatMoney(adminOverview.value.todayRevenue),
  },
  {
    icon: 'lucide:users',
    meta: `今日新增 ${formatCount(adminOverview.value.todayNewUsers)}`,
    tone: 'violet',
    title: '平台用户',
    value: formatCount(adminOverview.value.totalUsers),
  },
  {
    icon: 'lucide:plug-zap',
    meta: `启用 ${formatCount(adminOverview.value.apiEnabled)} / ${formatCount(adminOverview.value.apiTotal)}`,
    tone: 'orange',
    title: '接口总数',
    value: formatCount(adminOverview.value.apiTotal),
  },
  {
    icon: 'lucide:key-round',
    meta: `启用 ${formatCount(adminOverview.value.keyEnabled)} / ${formatCount(adminOverview.value.keyTotal)}`,
    tone: 'cyan',
    title: '用户密钥',
    value: formatCount(adminOverview.value.keyTotal),
  },
  {
    icon: 'lucide:receipt',
    meta: `友链待审 ${formatCount(adminOverview.value.pendingFriendLinks)}`,
    tone: 'rose',
    title: '待支付订单',
    value: formatCount(adminOverview.value.pendingOrders),
  },
]);

const adminHotApis = computed(() => adminStats.value.hotApis ?? []);
const adminActiveUsers = computed(() => adminStats.value.activeUsers ?? []);
const adminAlerts = computed(() => adminStats.value.alerts ?? []);

const hasBoundEmail = computed(() =>
  Boolean(String(userStore.userInfo?.email ?? '').trim()),
);
const shouldShowBindEmailWarning = computed(
  () => isUserWorkspace.value && !hasBoundEmail.value,
);

const memberPackage = computed(() => userStats.value.memberPackage ?? null);

const hasPackageDetail = computed(
  () =>
    Boolean(memberPackage.value) ||
    (userStats.value.interfacePackages?.length ?? 0) > 0 ||
    userStats.value.interfacePackageCount > 0,
);

const headerAssets = computed<HeaderAssetItem[]>(() => [
  {
    action: 'balanceRecharge',
    icon: 'lucide:wallet-cards',
    label: '账户余额',
    secondaryAction: 'cardRedeem',
    value: formatMoney(userStats.value.balance),
  },
  {
    icon: 'lucide:coins',
    label: '账户点数',
    value: formatCount(userStats.value.points),
  },
  {
    action: hasPackageDetail.value ? 'packageDetail' : undefined,
    icon: 'lucide:badge-check',
    label: userStats.value.currentPackageType || '当前套餐',
    value: userStats.value.currentPackageName || '普通用户',
  },
]);

const interfacePackages = computed(
  () => userStats.value.interfacePackages ?? [],
);
const interfacePackageTabText = computed(
  () => `接口套餐 (${userStats.value.interfacePackageCount})`,
);

const usePerInterfaceQuota = computed(
  () =>
    !userStats.value.hasMemberPackage &&
    userStats.value.interfacePackageCount > 1,
);

const metricCards = computed(() => [
  {
    accent: '#2563eb',
    footerLabel: '剩余次数',
    footerValue: usePerInterfaceQuota.value
      ? '见明细'
      : userStats.value.remainingUnlimited
        ? '无限'
        : formatCount(userStats.value.remainingCalls),
    icon: 'lucide:activity',
    title: '今日调用',
    value: formatCount(userStats.value.todayCalls),
  },
  {
    accent: '#16a34a',
    footerLabel: '成功率',
    footerValue: userStats.value.successRate,
    icon: 'lucide:circle-check-big',
    title: '解析成功',
    value: formatCount(userStats.value.successCalls),
  },
  {
    accent: '#f97316',
    footerLabel: '失败率',
    footerValue: userStats.value.failedRate,
    icon: 'lucide:circle-x',
    title: '解析失败',
    value: formatCount(userStats.value.failedCalls),
  },
  {
    accent: '#4f46e5',
    footerLabel: 'QPS',
    footerValue: usePerInterfaceQuota.value
      ? '见明细'
      : userStats.value.qpsLimitUnlimited
        ? '不限'
        : formatCount(userStats.value.qpsLimit),
    icon: 'lucide:gauge',
    title: '每日限额',
    value: usePerInterfaceQuota.value
      ? '分接口'
      : userStats.value.dailyLimitUnlimited
        ? '不限'
        : formatCount(userStats.value.dailyLimit),
  },
]);

const userQuickActions = computed<UserQuickActionItem[]>(() => [
  {
    accent: '#2563eb',
    badge: userStats.value.hasAnyPackage ? '续费' : '推荐',
    description: userStats.value.hasAnyPackage
      ? '查看全站套餐、接口套餐和点数套餐'
      : '先开通套餐或点数，接口调用更稳定',
    icon: 'lucide:shopping-bag',
    title: '购买套餐',
    url: userStats.value.hasAnyPackage
      ? '/purchase/interface'
      : '/purchase/global',
  },
  {
    accent: '#14b8a6',
    description: '创建或查看接口调用 Key',
    icon: 'lucide:key-round',
    title: '密钥管理',
    url: '/key',
  },
  {
    accent: '#f97316',
    description: '查看可调用接口和文档',
    icon: 'lucide:braces',
    title: '接口列表',
    url: '/interface/list',
  },
  {
    accent: '#7c3aed',
    description: '追踪成功率、失败原因和耗时',
    icon: 'lucide:clipboard-list',
    title: '调用日志',
    url: '/interface/log',
  },
]);

const callTrendChartRef = ref<EchartsUIType>();
const { renderEcharts: renderUserCallTrendEcharts } =
  useEcharts(callTrendChartRef);
const adminCallTrendChartRef = ref<EchartsUIType>();
const adminRevenueTrendChartRef = ref<EchartsUIType>();
const { renderEcharts: renderAdminCallTrendEcharts } = useEcharts(
  adminCallTrendChartRef,
);
const { renderEcharts: renderAdminRevenueTrendEcharts } = useEcharts(
  adminRevenueTrendChartRef,
);
const activeCallTrendKey = ref<UserCallTrendKey>('sevenDays');
const callTrendOptions: Array<{
  description: string;
  label: string;
  value: UserCallTrendKey;
}> = [
  {
    description: '按日汇总',
    label: '近7日',
    value: 'sevenDays',
  },
  {
    description: '按周汇总',
    label: '近30日',
    value: 'thirtyDays',
  },
  {
    description: '按月汇总',
    label: '近1年',
    value: 'oneYear',
  },
];
const defaultCallTrendOption = callTrendOptions[0] ?? {
  description: '按日汇总',
  label: '近7日',
  value: 'sevenDays',
};

const activeCallTrend = computed(
  () =>
    userStats.value.callTrends?.[activeCallTrendKey.value] ?? emptyCallTrend(),
);

const activeCallTrendOption = computed(
  () =>
    callTrendOptions.find((item) => item.value === activeCallTrendKey.value) ??
    defaultCallTrendOption,
);

const callTrendTotalText = computed(
  () => `${formatCount(activeCallTrend.value.total)} 次`,
);

const quickNavItems: QuickNavItem[] = [
  {
    color: '#1677ff',
    icon: 'mdi:view-dashboard-outline',
    title: '工作台',
    url: '/workspace',
  },
  {
    color: '#14b8a6',
    icon: 'mdi:api',
    title: '接口列表',
    url: '/interface/list',
  },
  {
    color: '#f59e0b',
    icon: 'mdi:key-chain',
    title: '密钥管理',
    url: '/key',
  },
  {
    color: '#8b5cf6',
    icon: 'mdi:account-cog',
    title: '用户列表',
    url: '/user/list',
  },
  {
    color: '#22c55e',
    icon: 'mdi:account-group',
    title: '角色管理',
    url: '/user/role',
  },
  {
    color: '#64748b',
    icon: 'mdi:menu',
    title: '菜单管理',
    url: '/system/menu',
  },
];

function navTo(nav: QuickNavItem) {
  if (nav.url?.startsWith('http')) {
    openWindow(nav.url);
    return;
  }
  if (nav.url?.startsWith('/')) {
    router.push(nav.url).catch((error) => {
      console.error('Navigation failed:', error);
    });
  }
}

function navToUrl(url?: string) {
  if (!url) {
    return;
  }
  if (url.startsWith('http')) {
    openWindow(url);
    return;
  }
  if (url.startsWith('/')) {
    router.push(url).catch((error) => {
      console.error('Navigation failed:', error);
    });
  }
}

function formatCount(value: number | string) {
  const numberValue = Number(value ?? 0);
  if (!Number.isFinite(numberValue)) {
    return '0';
  }
  return numberValue.toLocaleString();
}

function formatMoney(value: number | string) {
  const numberValue = Number(value ?? 0);
  if (!Number.isFinite(numberValue)) {
    return '¥0.00';
  }
  return `¥${numberValue.toLocaleString(undefined, {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  })}`;
}

function paymentStatusColor(status?: RechargeApi.RechargeStatus) {
  if (status === 'PAID') {
    return 'success';
  }
  if (status === 'FAILED') {
    return 'error';
  }
  if (status === 'CLOSED') {
    return 'default';
  }
  return 'processing';
}

function paymentStatusText(status?: RechargeApi.RechargeStatus) {
  if (status === 'PAID') {
    return '已支付';
  }
  if (status === 'FAILED') {
    return '支付失败';
  }
  if (status === 'CLOSED') {
    return '已取消';
  }
  return '待支付';
}

function normalizeMoneyNumber(value: number | string | undefined) {
  const numberValue = Number(value ?? 0);
  if (!Number.isFinite(numberValue)) {
    return 0;
  }
  return Math.round(numberValue * 100) / 100;
}

function moneyCentValue(value: number | string | undefined) {
  return Math.round(normalizeMoneyNumber(value) * 100);
}

function isSameMoneyValue(
  left: number | string | undefined,
  right: number | string | undefined,
) {
  return moneyCentValue(left) === moneyCentValue(right);
}

function formatRechargeAmount(value: number | string | undefined) {
  const numberValue = normalizeMoneyNumber(value);
  return Number.isInteger(numberValue)
    ? String(numberValue)
    : numberValue.toFixed(2);
}

function limitText(value: number | string) {
  return Number(value ?? 0) === 0 ? '不限' : formatCount(value);
}

function remainingText(remainingUnlimited: boolean, value: number | string) {
  return remainingUnlimited ? '不限' : formatCount(value);
}

function expireText(value?: string) {
  return value?.trim() || '长期有效';
}

function renderCallTrendChart() {
  if (!isUserWorkspace.value || !callTrendChartRef.value) {
    return;
  }
  const trend = activeCallTrend.value;
  const values = trend.values.map((value) => Number(value ?? 0));
  renderUserCallTrendEcharts({
    grid: {
      bottom: 8,
      containLabel: true,
      left: 8,
      right: 12,
      top: 24,
    },
    series: [
      {
        areaStyle: {
          color: {
            colorStops: [
              { color: 'rgba(37, 99, 235, 0.2)', offset: 0 },
              { color: 'rgba(37, 99, 235, 0.02)', offset: 1 },
            ],
            type: 'linear',
            x: 0,
            x2: 0,
            y: 0,
            y2: 1,
          },
        },
        data: values,
        itemStyle: {
          color: '#2563eb',
        },
        lineStyle: {
          color: '#2563eb',
          width: 3,
        },
        name: '调用次数',
        showSymbol: values.length <= 12,
        smooth: true,
        symbol: 'circle',
        symbolSize: 7,
        type: 'line',
      },
    ],
    tooltip: {
      backgroundColor: 'rgba(15, 23, 42, 0.92)',
      borderWidth: 0,
      textStyle: {
        color: '#fff',
      },
      trigger: 'axis',
    },
    xAxis: {
      axisLabel: {
        color: '#64748b',
      },
      axisLine: {
        lineStyle: {
          color: '#e2e8f0',
        },
      },
      axisTick: {
        show: false,
      },
      boundaryGap: false,
      data: trend.labels,
      type: 'category',
    },
    yAxis: {
      axisLabel: {
        color: '#64748b',
      },
      minInterval: 1,
      splitLine: {
        lineStyle: {
          color: '#e2e8f0',
          type: 'dashed',
        },
      },
      splitNumber: 4,
      type: 'value',
    },
  });
}

function renderAdminCallTrendChart() {
  if (isUserWorkspace.value || !adminCallTrendChartRef.value) {
    return;
  }
  const trend = adminStats.value.callTrend7d ?? emptyAdminCallTrend();
  renderAdminCallTrendEcharts({
    grid: {
      bottom: 8,
      containLabel: true,
      left: 8,
      right: 12,
      top: 36,
    },
    legend: {
      icon: 'roundRect',
      itemHeight: 8,
      itemWidth: 14,
      top: 0,
    },
    series: [
      {
        data: trend.totalCalls.map((value) => Number(value ?? 0)),
        itemStyle: { color: '#2563eb' },
        name: '总调用',
        smooth: true,
        symbolSize: 6,
        type: 'line',
      },
      {
        data: trend.successCalls.map((value) => Number(value ?? 0)),
        itemStyle: { color: '#16a34a' },
        name: '成功',
        smooth: true,
        symbolSize: 6,
        type: 'line',
      },
      {
        data: trend.failedCalls.map((value) => Number(value ?? 0)),
        itemStyle: { color: '#ef4444' },
        name: '失败',
        smooth: true,
        symbolSize: 6,
        type: 'line',
      },
    ],
    tooltip: {
      trigger: 'axis',
    },
    xAxis: {
      axisLabel: { color: '#64748b' },
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisTick: { show: false },
      boundaryGap: false,
      data: trend.labels,
      type: 'category',
    },
    yAxis: {
      axisLabel: { color: '#64748b' },
      minInterval: 1,
      splitLine: { lineStyle: { color: '#e2e8f0', type: 'dashed' } },
      type: 'value',
    },
  });
}

function renderAdminRevenueTrendChart() {
  if (isUserWorkspace.value || !adminRevenueTrendChartRef.value) {
    return;
  }
  const trend = adminStats.value.revenueTrend7d ?? emptyAdminRevenueTrend();
  renderAdminRevenueTrendEcharts({
    grid: {
      bottom: 8,
      containLabel: true,
      left: 8,
      right: 12,
      top: 36,
    },
    legend: {
      icon: 'roundRect',
      itemHeight: 8,
      itemWidth: 14,
      top: 0,
    },
    series: [
      {
        barMaxWidth: 28,
        data: trend.paidAmounts.map((value) => normalizeMoneyNumber(value)),
        itemStyle: {
          borderRadius: [5, 5, 0, 0],
          color: '#14b8a6',
        },
        name: '收入',
        type: 'bar',
      },
      {
        data: trend.orderCounts.map((value) => Number(value ?? 0)),
        itemStyle: { color: '#f97316' },
        name: '订单',
        smooth: true,
        symbolSize: 6,
        type: 'line',
        yAxisIndex: 1,
      },
    ],
    tooltip: {
      trigger: 'axis',
    },
    xAxis: {
      axisLabel: { color: '#64748b' },
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisTick: { show: false },
      data: trend.labels,
      type: 'category',
    },
    yAxis: [
      {
        axisLabel: {
          color: '#64748b',
          formatter: '¥{value}',
        },
        splitLine: { lineStyle: { color: '#e2e8f0', type: 'dashed' } },
        type: 'value',
      },
      {
        axisLabel: { color: '#64748b' },
        minInterval: 1,
        splitLine: { show: false },
        type: 'value',
      },
    ],
  });
}

function renderAdminCharts() {
  renderAdminCallTrendChart();
  renderAdminRevenueTrendChart();
}

function setCallTrendKey(value: UserCallTrendKey) {
  activeCallTrendKey.value = value;
}

async function refreshWorkbenchStats() {
  userStats.value = await getUserWorkbenchStatsApi();
  await nextTick();
  renderCallTrendChart();
}

async function refreshAdminWorkbenchStats() {
  adminStatsLoading.value = true;
  try {
    adminStats.value = await getAdminWorkbenchStatsApi();
    await nextTick();
    renderAdminCharts();
  } finally {
    adminStatsLoading.value = false;
  }
}

function todayStorageKey() {
  const now = new Date();
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  const day = `${now.getDate()}`.padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

function dailyNoticeFingerprint(items: NoticeApi.NoticeItem[]) {
  return items.map((item) => item.id).join(',');
}

function dailyNoticeStorageKey() {
  const username =
    userStore.userInfo?.username ?? userStore.userInfo?.realName ?? 'anonymous';
  return `nanfeng:daily-popup-notice:${username}:${todayStorageKey()}`;
}

function hasReadTodayDailyNotice(items: NoticeApi.NoticeItem[]) {
  if (typeof window === 'undefined') {
    return true;
  }
  return (
    window.localStorage.getItem(dailyNoticeStorageKey()) ===
    dailyNoticeFingerprint(items)
  );
}

function markDailyNoticeRead() {
  if (typeof window === 'undefined' || dailyPopupNotices.value.length === 0) {
    return;
  }
  window.localStorage.setItem(
    dailyNoticeStorageKey(),
    dailyNoticeFingerprint(dailyPopupNotices.value),
  );
}

async function loadDailyPopupNotices() {
  dailyNoticeLoading.value = true;
  try {
    const items = await getUserPopupNotices();
    dailyPopupNotices.value = items;
    activeDailyNoticeId.value = items[0]?.id;
    if (items.length > 0 && !hasReadTodayDailyNotice(items)) {
      dailyNoticeVisible.value = true;
    }
  } catch (error) {
    console.error('Failed to load daily popup notices:', error);
  } finally {
    dailyNoticeLoading.value = false;
  }
}

async function loadWorkspaceNotices() {
  workspaceNoticeLoading.value = true;
  try {
    const result = await getUserNoticeList({
      page: 1,
      pageSize: 3,
    });
    workspaceNotices.value = (result.items ?? []).slice(0, 3);
  } catch (error) {
    console.error('Failed to load workspace notices:', error);
  } finally {
    workspaceNoticeLoading.value = false;
  }
}

async function openWorkspaceNotice(row: NoticeApi.NoticeItem) {
  workspaceNoticeVisible.value = true;
  workspaceNoticeDetailLoading.value = true;
  currentWorkspaceNotice.value = row;
  try {
    currentWorkspaceNotice.value = await getUserNoticeDetail(row.id);
  } catch (error) {
    console.error('Failed to load workspace notice detail:', error);
  } finally {
    workspaceNoticeDetailLoading.value = false;
  }
}

function closeWorkspaceNotice() {
  workspaceNoticeVisible.value = false;
}

function afterWorkspaceNoticeClosed() {
  currentWorkspaceNotice.value = undefined;
}

function closeDailyNotice() {
  markDailyNoticeRead();
  dailyNoticeVisible.value = false;
}

function viewAllNotices(closePopup = false) {
  if (closePopup) {
    closeDailyNotice();
  }
  router.push('/notice').catch((error) => {
    console.error('Navigation failed:', error);
  });
}

function payProductName(value?: string) {
  if (value === 'PAGE') return '电脑网站支付';
  if (value === 'WAP') return '手机网站支付';
  if (value === 'FACE') return '当面付扫码支付';
  if (value === 'NATIVE') return '扫码支付';
  return '';
}

function isMobileDevice() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }
  const ua = navigator.userAgent || '';
  return /Android|iPhone|iPad|iPod|Mobile|Windows Phone/i.test(ua);
}

function stopRechargePolling() {
  if (rechargeTimer) {
    window.clearInterval(rechargeTimer);
    rechargeTimer = undefined;
  }
}

async function loadRechargeCapabilities() {
  rechargeCapabilities.value = await getRechargeCapabilities();
  rechargePayChannel.value =
    rechargeCapabilities.value.defaultPayChannel ??
    (rechargeAlipayUsable.value ? 'ALIPAY' : 'WECHAT');
  rechargePreferredProduct.value = 'AUTO';
}

function defaultRechargeAmount() {
  return rechargeAmountOptions.value[0]?.amount ?? 50;
}

function selectRechargeAmount(option: RechargeApi.RechargeAmountOption) {
  rechargeAmount.value = normalizeMoneyNumber(option.amount);
}

function isRechargeAmountSelected(option: RechargeApi.RechargeAmountOption) {
  return isSameMoneyValue(option.amount, rechargeAmount.value);
}

async function openBalanceRecharge() {
  rechargeOrder.value = null;
  stopRechargePolling();
  try {
    await loadRechargeCapabilities();
    if (!rechargeCapabilities.value?.enabled) {
      message.warning('支付功能未开启，请联系管理员');
      return;
    }
    rechargeAmount.value = defaultRechargeAmount();
    rechargeVisible.value = true;
  } catch (error) {
    console.error('Failed to load recharge capabilities:', error);
    message.warning('支付功能未开启，请联系管理员');
  }
}

function createAndSubmitAlipayForm(
  order: RechargeApi.RechargeOrder,
  target: '_blank' | '_self',
) {
  if (!order.gatewayUrl || !order.formParams) {
    return;
  }
  const form = document.createElement('form');
  form.method = 'post';
  form.acceptCharset = 'utf8';
  form.action = order.formActionUrl || order.gatewayUrl;
  form.target = target;
  form.style.display = 'none';
  Object.entries(order.formParams).forEach(([key, value]) => {
    if (key === 'charset') {
      return;
    }
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = key;
    input.value = value;
    form.append(input);
  });
  document.body.append(form);
  form.submit();
  window.setTimeout(() => form.remove(), 1000);
}

function openAlipayPayment(
  order: RechargeApi.RechargeOrder,
  paymentWindow: null | Window,
) {
  if (order.qrCode) {
    paymentWindow?.close();
    return;
  }

  if (rechargeClientType.value === 'MOBILE') {
    paymentWindow?.close();
    createAndSubmitAlipayForm(order, '_self');
    return;
  }

  if (paymentWindow && order.formHtml) {
    paymentWindow.document.open();
    paymentWindow.document.write(order.formHtml);
    paymentWindow.document.close();
    return;
  }

  createAndSubmitAlipayForm(order, '_blank');
}

function expectedRechargePayProduct(): '' | RechargeApi.PayProduct {
  if (rechargePreferredProduct.value !== 'AUTO') {
    return rechargePreferredProduct.value;
  }
  return rechargeDefaultProduct.value;
}

function shouldPreopenPaymentWindow() {
  return (
    rechargePayChannel.value === 'ALIPAY' &&
    rechargeClientType.value === 'DESKTOP' &&
    expectedRechargePayProduct() !== 'FACE'
  );
}

function startRechargePolling(orderNo: string) {
  stopRechargePolling();
  rechargeTimer = window.setInterval(() => {
    void syncCurrentRechargeOrder(orderNo, false);
  }, 3000);
}

async function syncCurrentRechargeOrder(
  orderNo?: string,
  showPendingMessage = true,
) {
  const currentOrderNo = orderNo ?? rechargeOrder.value?.orderNo;
  if (!currentOrderNo || rechargeSyncLoading.value) {
    return;
  }
  rechargeSyncLoading.value = true;
  try {
    const latestOrder = await syncRechargeOrder(currentOrderNo);
    rechargeOrder.value = {
      ...(rechargeOrder.value ?? latestOrder),
      ...latestOrder,
    };
    if (latestOrder.status === 'PAID') {
      stopRechargePolling();
      message.success('充值成功，余额已到账');
      await refreshWorkbenchStats();
      return;
    }
    if (latestOrder.status === 'CLOSED' || latestOrder.status === 'FAILED') {
      stopRechargePolling();
      message.warning('当前充值订单未完成，请重新发起充值');
      return;
    }
    if (showPendingMessage) {
      message.info('暂未查询到支付成功，请稍后再试');
    }
  } finally {
    rechargeSyncLoading.value = false;
  }
}

async function submitRecharge() {
  if (!rechargeCapabilities.value?.enabled) {
    message.warning('支付功能未开启，请联系管理员');
    return;
  }
  const amount = Number(rechargeAmount.value);
  if (!Number.isFinite(amount) || amount < 0.01) {
    message.warning('请输入正确的充值金额');
    return;
  }

  let paymentWindow: null | Window = null;
  if (shouldPreopenPaymentWindow()) {
    paymentWindow = window.open('', '_blank');
  }

  rechargeLoading.value = true;
  try {
    const order = await createRechargeOrder({
      amount,
      clientType: rechargeClientType.value,
      payChannel: rechargePayChannel.value,
      preferredProduct: rechargePreferredProduct.value,
    });
    rechargeOrder.value = order;
    if (order.payChannel === 'ALIPAY') {
      openAlipayPayment(order, paymentWindow);
    } else {
      paymentWindow?.close();
    }
    if (order.payChannel === 'WECHAT') {
      message.success('请使用微信扫码完成支付');
    } else if (order.payProduct === 'FACE') {
      message.success('请使用支付宝扫码完成支付');
    } else if (
      order.payProduct === 'WAP' &&
      rechargeClientType.value === 'MOBILE'
    ) {
      message.success('正在跳转支付宝支付');
    } else {
      message.success('支付页面已打开，支付完成后会自动刷新余额');
    }
    startRechargePolling(order.orderNo);
  } catch (error) {
    paymentWindow?.close();
    console.error('Failed to create recharge order:', error);
  } finally {
    rechargeLoading.value = false;
  }
}

function openPackageDetail() {
  if (!hasPackageDetail.value) {
    return;
  }
  packageDetailTab.value = memberPackage.value ? 'global' : 'interface';
  packageDetailDrawerApi.open();
}

function handleAssetAction(action?: HeaderAssetAction) {
  if (action === 'balanceRecharge') {
    openBalanceRecharge();
    return;
  }
  if (action === 'cardRedeem') {
    redeemVisible.value = true;
    return;
  }
  if (action === 'packageDetail') {
    openPackageDetail();
  }
}

async function onRedeemSuccess() {
  await refreshWorkbenchStats();
}

onMounted(async () => {
  await nextTick();
  if (!isUserWorkspace.value) {
    try {
      await refreshAdminWorkbenchStats();
    } catch (error) {
      console.error('Failed to load admin workspace stats:', error);
    }
    return;
  }
  renderCallTrendChart();
  try {
    await refreshWorkbenchStats();
  } catch (error) {
    console.error('Failed to load user workspace stats:', error);
  }
  await loadWorkspaceNotices();
  await loadDailyPopupNotices();
});

onBeforeUnmount(() => {
  stopRechargePolling();
});

watch(
  [activeCallTrendKey, activeCallTrend],
  async () => {
    await nextTick();
    renderCallTrendChart();
  },
  { deep: true },
);

watch(
  adminStats,
  async () => {
    if (isUserWorkspace.value) {
      return;
    }
    await nextTick();
    renderAdminCharts();
  },
  { deep: true },
);
</script>

<template>
  <div class="p-5">
    <div
      v-if="shouldShowBindEmailWarning"
      class="bind-email-warning mb-4"
      role="alert"
    >
      <div class="bind-email-warning__body">
        <span class="bind-email-warning__icon">
          <IconifyIcon icon="lucide:circle-alert" />
        </span>
        <div class="min-w-0">
          <div class="bind-email-warning__title">请尽快绑定邮箱</div>
          <div class="bind-email-warning__desc">
            当前账号尚未绑定邮箱，忘记密码时无法接收重置链接。
          </div>
        </div>
      </div>
      <Button danger size="small" type="primary" @click="navToUrl('/profile')">
        去绑定邮箱
      </Button>
    </div>

    <WorkbenchHeader v-if="isUserWorkspace" :avatar="DEFAULT_LOCAL_AVATAR">
      <template #title>
        早安，{{
          userStore.userInfo?.realName || userStore.userInfo?.username
        }}，欢迎回到工作台
      </template>
      <template #description>
        {{ welcomeDescription }}
      </template>
      <template #extra>
        <div class="user-asset-summary">
          <div
            v-for="item in headerAssets"
            :key="item.label"
            class="user-asset-item"
            :class="{ 'has-secondary-action': item.secondaryAction }"
          >
            <div class="user-asset-icon">
              <IconifyIcon :icon="item.icon" />
            </div>
            <div class="user-asset-content min-w-0 text-right">
              <div class="user-asset-label">{{ item.label }}</div>
              <div class="user-asset-value">{{ item.value }}</div>
              <div
                v-if="item.action || item.secondaryAction"
                class="user-asset-actions"
              >
                <button
                  v-if="item.secondaryAction"
                  class="user-asset-detail-btn is-redeem"
                  type="button"
                  @click="handleAssetAction(item.secondaryAction)"
                >
                  <IconifyIcon icon="lucide:ticket-check" />
                  <span>卡密兑换</span>
                </button>
                <button
                  v-if="item.action"
                  class="user-asset-detail-btn"
                  :class="{
                    'is-recharge': item.action === 'balanceRecharge',
                  }"
                  type="button"
                  @click="handleAssetAction(item.action)"
                >
                  <IconifyIcon
                    :icon="
                      item.action === 'balanceRecharge'
                        ? 'lucide:plus'
                        : 'lucide:panel-right-open'
                    "
                  />
                  <span>{{
                    item.action === 'balanceRecharge' ? '充值' : '查看详情'
                  }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </template>
    </WorkbenchHeader>

    <template v-if="isUserWorkspace">
      <div class="user-quick-actions mt-4">
        <button
          v-for="item in userQuickActions"
          :key="item.title"
          class="user-quick-action"
          :style="{ '--user-action-accent': item.accent }"
          type="button"
          @click="navToUrl(item.url)"
        >
          <span class="user-quick-action__icon">
            <IconifyIcon :icon="item.icon" />
          </span>
          <span class="user-quick-action__content">
            <span class="user-quick-action__title">
              {{ item.title }}
              <Tag
                v-if="item.badge"
                class="user-quick-action__badge"
                color="blue"
              >
                {{ item.badge }}
              </Tag>
            </span>
            <span class="user-quick-action__desc">{{ item.description }}</span>
          </span>
          <IconifyIcon
            class="user-quick-action__arrow"
            icon="lucide:arrow-right"
          />
        </button>
      </div>

      <div class="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div
          v-for="item in metricCards"
          :key="item.title"
          class="user-metric-card"
          :style="{ '--user-metric-accent': item.accent }"
        >
          <div class="flex items-start justify-between">
            <div>
              <div
                class="text-base font-medium text-gray-700 dark:text-gray-200"
              >
                {{ item.title }}
              </div>
              <div
                class="mt-7 text-4xl font-semibold leading-none text-gray-950 dark:text-gray-50"
              >
                {{ item.value }}
              </div>
            </div>
            <div class="user-metric-icon" :style="{ color: item.accent }">
              <IconifyIcon :icon="item.icon" />
            </div>
          </div>
          <div class="user-metric-footer">
            <span>{{ item.footerLabel }}</span>
            <span class="font-medium text-gray-900 dark:text-gray-100">
              {{ item.footerValue }}
            </span>
          </div>
        </div>
      </div>

      <div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <section class="user-call-trend-card sm:col-span-2 xl:col-span-2">
          <div class="user-call-trend-head">
            <div>
              <div class="user-call-trend-title">调用记录</div>
              <div class="user-call-trend-desc">
                {{ activeCallTrendOption.description }} · 总计
                {{ callTrendTotalText }}
              </div>
            </div>
            <div class="user-call-trend-tabs" aria-label="调用记录时间范围">
              <button
                v-for="item in callTrendOptions"
                :key="item.value"
                class="user-call-trend-tab"
                :class="{ 'is-active': activeCallTrendKey === item.value }"
                type="button"
                @click="setCallTrendKey(item.value)"
              >
                {{ item.label }}
              </button>
            </div>
          </div>
          <div class="user-call-trend-chart">
            <EchartsUI ref="callTrendChartRef" />
          </div>
        </section>

        <section class="user-notice-card sm:col-span-2 xl:col-span-2">
          <div class="user-notice-card__head">
            <div>
              <div class="user-notice-card__title">公告列表</div>
              <div class="user-notice-card__desc">置顶优先 · 最新发布</div>
            </div>
            <button
              class="user-notice-card__more"
              type="button"
              @click="viewAllNotices()"
            >
              全部
            </button>
          </div>

          <Spin :spinning="workspaceNoticeLoading">
            <div v-if="workspaceNotices.length > 0" class="user-notice-list">
              <button
                v-for="item in workspaceNotices"
                :key="item.id"
                class="user-notice-item"
                type="button"
                @click="openWorkspaceNotice(item)"
              >
                <div class="user-notice-item__main">
                  <div class="user-notice-item__title-row">
                    <Tag v-if="item.isTop === 1" color="blue">置顶</Tag>
                    <span class="user-notice-item__title">{{
                      item.title
                    }}</span>
                  </div>
                  <div class="user-notice-item__summary">
                    {{ item.summary || '暂无摘要' }}
                  </div>
                  <div class="user-notice-item__time">
                    {{ item.publishTime || item.createTime || '暂未发布' }}
                  </div>
                </div>
                <IconifyIcon
                  class="user-notice-item__arrow"
                  icon="lucide:chevron-right"
                />
              </button>
            </div>
            <div v-else class="user-notice-empty">
              <IconifyIcon icon="lucide:megaphone" />
              <span>暂无公告</span>
            </div>
          </Spin>
        </section>
      </div>
    </template>

    <div v-else class="admin-workbench">
      <Spin :spinning="adminStatsLoading">
        <div class="admin-metric-grid">
          <article
            v-for="item in adminMetricCards"
            :key="item.title"
            class="admin-metric-card"
            :data-tone="item.tone"
          >
            <div class="admin-metric-card__icon">
              <IconifyIcon :icon="item.icon" />
            </div>
            <div class="min-w-0">
              <div class="admin-metric-card__title">{{ item.title }}</div>
              <div class="admin-metric-card__value">{{ item.value }}</div>
              <div class="admin-metric-card__meta">{{ item.meta }}</div>
            </div>
          </article>
        </div>

        <div class="admin-grid mt-4">
          <section class="admin-panel admin-panel--wide">
            <div class="admin-panel__head">
              <div>
                <h2>调用趋势</h2>
                <p>近 7 日总调用、成功和失败走势</p>
              </div>
              <Tag color="blue">
                总计 {{ formatCount(adminStats.callTrend7d.total) }} 次
              </Tag>
            </div>
            <EchartsUI ref="adminCallTrendChartRef" class="admin-chart" />
          </section>

          <section class="admin-panel">
            <div class="admin-panel__head">
              <div>
                <h2>收入趋势</h2>
                <p>近 7 日支付收入和订单量</p>
              </div>
              <Tag color="green">
                {{ formatMoney(adminStats.revenueTrend7d.totalAmount) }}
              </Tag>
            </div>
            <EchartsUI ref="adminRevenueTrendChartRef" class="admin-chart" />
          </section>
        </div>

        <div class="admin-grid mt-4">
          <section class="admin-panel admin-panel--wide">
            <div class="admin-panel__head">
              <div>
                <h2>热门接口</h2>
                <p>按今日调用量和扣费金额排序</p>
              </div>
              <Button size="small" @click="navToUrl('/interface/log')">
                查看日志
              </Button>
            </div>
            <div class="admin-table">
              <div class="admin-table__row admin-table__row--head">
                <span>接口</span>
                <span>调用</span>
                <span>成功率</span>
                <span>扣费</span>
                <span>耗时</span>
              </div>
              <button
                v-for="item in adminHotApis"
                :key="item.id"
                class="admin-table__row admin-table__row--clickable"
                type="button"
                @click="navToUrl('/interface/list')"
              >
                <span class="admin-table__main">
                  <strong>{{ item.name }}</strong>
                  <small>{{ item.apiCode }}</small>
                </span>
                <span>{{ formatCount(item.todayCalls) }}</span>
                <span>{{ item.successRate }}</span>
                <span>{{ formatMoney(item.chargeAmount) }}</span>
                <span>{{ formatCount(item.avgElapsedMs) }}ms</span>
              </button>
              <div v-if="adminHotApis.length === 0" class="admin-empty">
                今日暂无接口调用
              </div>
            </div>
          </section>

          <section class="admin-panel">
            <div class="admin-panel__head">
              <div>
                <h2>运营告警</h2>
                <p>失败率、订单、配置和申请待办</p>
              </div>
            </div>
            <div class="admin-alert-list">
              <button
                v-for="item in adminAlerts"
                :key="item.title"
                class="admin-alert"
                :data-level="item.level"
                type="button"
                @click="navToUrl(item.url)"
              >
                <span class="admin-alert__marker"></span>
                <span class="admin-alert__body">
                  <strong>{{ item.title }}</strong>
                  <small>{{ item.content }}</small>
                </span>
                <IconifyIcon icon="lucide:chevron-right" />
              </button>
            </div>
          </section>
        </div>

        <div class="admin-grid mt-4">
          <section class="admin-panel">
            <div class="admin-panel__head">
              <div>
                <h2>活跃用户</h2>
                <p>今日调用最多的用户</p>
              </div>
              <Button size="small" @click="navToUrl('/user/list')">
                用户列表
              </Button>
            </div>
            <div class="admin-user-list">
              <button
                v-for="item in adminActiveUsers"
                :key="item.id"
                class="admin-user"
                type="button"
                @click="navToUrl('/interface/log')"
              >
                <span class="admin-user__avatar">
                  {{ (item.realName || item.username || 'U').slice(0, 1) }}
                </span>
                <span class="admin-user__main">
                  <strong>{{ item.realName || item.username }}</strong>
                  <small>
                    {{ item.username }} · 成功率 {{ item.successRate }}
                  </small>
                </span>
                <span class="admin-user__stat">
                  {{ formatCount(item.todayCalls) }}
                </span>
              </button>
              <div v-if="adminActiveUsers.length === 0" class="admin-empty">
                今日暂无活跃用户
              </div>
            </div>
          </section>

          <section class="admin-panel admin-panel--wide">
            <div class="admin-panel__head">
              <div>
                <h2>快捷入口</h2>
                <p>常用运营页面快速跳转</p>
              </div>
            </div>
            <div class="admin-quick-grid">
              <button
                v-for="item in quickNavItems"
                :key="item.title"
                class="admin-quick"
                type="button"
                @click="navTo(item)"
              >
                <span class="admin-quick__icon" :style="{ color: item.color }">
                  <IconifyIcon :icon="item.icon" />
                </span>
                <span>{{ item.title }}</span>
              </button>
            </div>
          </section>
        </div>
      </Spin>
    </div>

    <PackageDetailDrawer
      class="w-[640px]"
      content-class="package-detail-drawer-content"
      title="套餐详情"
    >
      <div class="package-detail-drawer">
        <Tabs v-model:active-key="packageDetailTab" class="package-detail-tabs">
          <TabPane key="global" tab="全站套餐">
            <section class="package-detail-section">
              <div class="package-detail-section__head">
                <div>
                  <h2>全站套餐</h2>
                  <p>全站套餐只保留一个当前有效套餐。</p>
                </div>
                <span v-if="memberPackage">当前生效</span>
              </div>

              <article v-if="memberPackage" class="package-detail-card">
                <div class="package-detail-card__top">
                  <div class="package-detail-card__icon">
                    <IconifyIcon icon="lucide:badge-check" />
                  </div>
                  <div class="min-w-0">
                    <div class="package-detail-card__name">
                      {{ memberPackage.packageName }}
                    </div>
                    <div class="package-detail-card__desc">
                      到期：{{ expireText(memberPackage.expireTime) }}
                    </div>
                  </div>
                </div>

                <div class="package-detail-stats">
                  <div>
                    <span>每日额度</span>
                    <strong>{{ limitText(memberPackage.dailyLimit) }}</strong>
                  </div>
                  <div>
                    <span>今日已用</span>
                    <strong>{{ formatCount(memberPackage.todayCalls) }}</strong>
                  </div>
                  <div>
                    <span>剩余次数</span>
                    <strong>
                      {{
                        remainingText(
                          memberPackage.remainingUnlimited,
                          memberPackage.remainingCalls,
                        )
                      }}
                    </strong>
                  </div>
                  <div>
                    <span>QPS</span>
                    <strong>{{ limitText(memberPackage.qpsLimit) }}</strong>
                  </div>
                </div>
              </article>
              <div v-else class="package-detail-empty">暂未开通全站套餐</div>
            </section>
          </TabPane>

          <TabPane key="interface" :tab="interfacePackageTabText">
            <section class="package-detail-section">
              <div class="package-detail-section__head">
                <div>
                  <h2>接口套餐</h2>
                  <p>接口套餐可以同时开通多个，并按接口分别计算额度。</p>
                </div>
                <span v-if="interfacePackages.length > 0">
                  已开通 {{ userStats.interfacePackageCount }} 个
                </span>
              </div>

              <div
                v-if="interfacePackages.length > 0"
                class="package-detail-list"
              >
                <article
                  v-for="item in interfacePackages"
                  :key="item.userPackageId"
                  class="package-detail-card"
                >
                  <div class="package-detail-card__top">
                    <div class="package-detail-card__icon">
                      <IconifyIcon icon="mdi:api" />
                    </div>
                    <div class="min-w-0">
                      <div class="package-detail-card__name">
                        {{ item.interfaceName }}
                      </div>
                      <div class="package-detail-card__desc">
                        {{ item.packageName }} / {{ item.specName }}
                      </div>
                    </div>
                  </div>

                  <div class="package-detail-tags">
                    <span>{{ item.apiCode }}</span>
                    <span>到期：{{ expireText(item.expireTime) }}</span>
                  </div>

                  <div class="package-detail-stats">
                    <div>
                      <span>每日额度</span>
                      <strong>{{ limitText(item.dailyLimit) }}</strong>
                    </div>
                    <div>
                      <span>今日已用</span>
                      <strong>{{ formatCount(item.todayCalls) }}</strong>
                    </div>
                    <div>
                      <span>剩余次数</span>
                      <strong>
                        {{
                          remainingText(
                            item.remainingUnlimited,
                            item.remainingCalls,
                          )
                        }}
                      </strong>
                    </div>
                    <div>
                      <span>QPS</span>
                      <strong>{{ limitText(item.qpsLimit) }}</strong>
                    </div>
                  </div>
                </article>
              </div>
              <div v-else class="package-detail-empty">暂未开通接口套餐</div>
            </section>
          </TabPane>
        </Tabs>
      </div>
    </PackageDetailDrawer>

    <RedeemModal v-model:open="redeemVisible" @success="onRedeemSuccess" />

    <Modal
      v-model:open="dailyNoticeVisible"
      :closable="false"
      :footer="null"
      :width="760"
      centered
      destroy-on-close
      wrap-class-name="daily-notice-modal-wrap"
      @cancel="closeDailyNotice"
    >
      <Spin :spinning="dailyNoticeLoading">
        <div v-if="activeDailyNotice" class="daily-notice">
          <div class="daily-notice__modal-head">
            <div class="daily-notice__modal-title-wrap">
              <div class="daily-notice__modal-icon">
                <IconifyIcon icon="lucide:megaphone" />
              </div>
              <div>
                <div class="daily-notice__modal-title">今日公告</div>
                <div class="daily-notice__modal-subtitle">
                  共 {{ dailyPopupNotices.length }} 条公告
                </div>
              </div>
            </div>
            <button
              aria-label="关闭公告"
              class="daily-notice__close"
              type="button"
              @click="closeDailyNotice"
            >
              <IconifyIcon icon="lucide:x" />
            </button>
          </div>

          <div class="daily-notice__body">
            <div v-if="dailyPopupNotices.length > 1" class="daily-notice__tabs">
              <button
                v-for="item in dailyPopupNotices"
                :key="item.id"
                class="daily-notice__tab"
                :class="[item.id === activeDailyNotice?.id && 'is-active']"
                type="button"
                @click="activeDailyNoticeId = item.id"
              >
                {{ item.title }}
              </button>
            </div>

            <article class="daily-notice__article">
              <div class="daily-notice__head">
                <div class="min-w-0">
                  <div class="daily-notice__title">
                    {{ activeDailyNotice.title }}
                  </div>
                  <div class="daily-notice__meta">
                    {{ activeDailyNotice.publishTime || '今日公告' }}
                  </div>
                </div>
                <Tag v-if="activeDailyNotice.isTop === 1" color="blue">
                  置顶
                </Tag>
              </div>

              <div class="daily-notice__content">
                <RichTextPreview :content="activeDailyNoticeContent" />
              </div>
            </article>
          </div>

          <div class="daily-notice__actions">
            <Button @click="viewAllNotices(true)">查看全部公告</Button>
            <Button type="primary" @click="closeDailyNotice">我知道了</Button>
          </div>
        </div>
      </Spin>
    </Modal>

    <Modal
      v-model:open="workspaceNoticeVisible"
      :destroy-on-close="true"
      :footer="null"
      :width="820"
      centered
      class="workspace-notice-detail-modal"
      @after-close="afterWorkspaceNoticeClosed"
      @cancel="closeWorkspaceNotice"
    >
      <Spin :spinning="workspaceNoticeDetailLoading">
        <article v-if="currentWorkspaceNotice" class="workspace-notice-detail">
          <div class="workspace-notice-detail__head">
            <div class="min-w-0">
              <div class="workspace-notice-detail__title">
                {{ currentWorkspaceNotice.title }}
              </div>
              <div class="workspace-notice-detail__meta">
                {{ currentWorkspaceNotice.publishTime || '公告详情' }}
              </div>
            </div>
            <Tag v-if="currentWorkspaceNotice.isTop === 1" color="blue">
              置顶
            </Tag>
          </div>
          <div class="workspace-notice-detail__content">
            <RichTextPreview :content="currentWorkspaceNoticeContent" />
          </div>
        </article>
      </Spin>
    </Modal>

    <Modal
      v-model:open="rechargeVisible"
      :footer="null"
      :mask-closable="!rechargeLoading"
      destroy-on-close
      title="账户充值"
      width="520px"
      @cancel="stopRechargePolling"
    >
      <Spin :spinning="rechargeLoading && !rechargeOrder">
        <div class="recharge-panel">
          <div class="recharge-panel__summary">
            <div>
              <span>当前余额</span>
              <strong>{{ formatMoney(userStats.balance) }}</strong>
            </div>
            <Tag color="blue">
              {{
                rechargeClientType === 'MOBILE'
                  ? '已识别手机端'
                  : '已识别电脑端'
              }}
            </Tag>
          </div>

          <div class="recharge-field">
            <label>充值金额</label>
            <InputNumber
              v-model:value="rechargeAmount"
              class="recharge-amount-input"
              :max="99999.99"
              :min="0.01"
              :precision="2"
              prefix="¥"
            />
            <div
              v-if="rechargeAmountOptions.length > 0"
              class="recharge-quick-amounts"
            >
              <button
                v-for="item in rechargeAmountOptions"
                :key="item.id"
                :class="{ 'is-active': isRechargeAmountSelected(item) }"
                type="button"
                @click="selectRechargeAmount(item)"
              >
                <span>¥{{ formatRechargeAmount(item.amount) }}</span>
                <small v-if="Number(item.giftAmount) > 0">
                  送 {{ formatMoney(item.giftAmount) }}
                </small>
              </button>
            </div>
            <div
              v-if="selectedRechargeGiftAmount > 0"
              class="recharge-gift-tip"
            >
              <IconifyIcon icon="lucide:badge-plus" />
              <span>
                实际到账
                <strong>{{ formatMoney(selectedRechargeCreditAmount) }}</strong>
                ，已含赠送 {{ formatMoney(selectedRechargeGiftAmount) }}
              </span>
            </div>
          </div>

          <div class="recharge-field">
            <label>支付方式</label>
            <RadioGroup
              v-model:value="rechargePayChannel"
              class="recharge-methods"
            >
              <Radio
                v-for="item in rechargeChannelOptions"
                :key="item.value"
                :value="item.value"
              >
                {{ item.label }}
              </Radio>
            </RadioGroup>
            <div class="recharge-capability-tags">
              <Tag v-if="rechargeAlipayUsable" color="processing"> 支付宝 </Tag>
              <Tag v-if="rechargeWechatUsable" color="success"> 微信扫码 </Tag>
            </div>
          </div>

          <div v-if="rechargePayChannel === 'ALIPAY'" class="recharge-field">
            <label>支付宝方式</label>
            <RadioGroup
              v-model:value="rechargePreferredProduct"
              class="recharge-methods"
            >
              <Radio
                v-for="item in rechargeProductOptions"
                :key="item.value"
                :value="item.value"
              >
                {{ item.label }}
              </Radio>
            </RadioGroup>
            <div v-if="rechargeCapabilities" class="recharge-capability-tags">
              <Tag
                v-if="rechargeCapabilities.websitePayEnabled"
                color="processing"
              >
                网站支付
              </Tag>
              <Tag v-if="rechargeCapabilities.wapPayEnabled" color="success">
                手机支付
              </Tag>
              <Tag v-if="rechargeCapabilities.facePayEnabled" color="warning">
                当面付
              </Tag>
            </div>
          </div>

          <div v-if="rechargeOrder" class="recharge-order-box">
            <div class="recharge-order-box__head">
              <div>
                <span>订单号</span>
                <strong>{{ rechargeOrder.orderNo }}</strong>
              </div>
              <Tag :color="paymentStatusColor(rechargeOrder.status)">
                {{ paymentStatusText(rechargeOrder.status) }}
              </Tag>
            </div>
            <div class="recharge-order-amounts">
              <span>支付 {{ formatMoney(rechargeOrder.amount) }}</span>
              <span v-if="Number(rechargeOrder.giftAmount ?? 0) > 0">
                赠送 {{ formatMoney(rechargeOrder.giftAmount ?? 0) }}
              </span>
              <strong>
                到账
                {{
                  formatMoney(
                    rechargeOrder.creditAmount ?? rechargeOrder.amount,
                  )
                }}
              </strong>
            </div>
            <div v-if="rechargeOrder.qrCode" class="recharge-qrcode">
              <QRCode
                :bordered="false"
                :size="180"
                :value="rechargeOrder.qrCode"
              />
              <p>
                {{
                  rechargeOrder.payChannel === 'WECHAT'
                    ? '请使用微信扫码完成支付'
                    : '请使用支付宝扫码完成支付'
                }}
              </p>
            </div>
            <div v-else class="recharge-order-tip">
              支付页面已打开，完成支付后系统会自动刷新余额。
            </div>
          </div>

          <div class="recharge-actions">
            <Button @click="rechargeVisible = false">取消</Button>
            <Button
              v-if="rechargeOrder"
              :loading="rechargeSyncLoading"
              @click="syncCurrentRechargeOrder()"
            >
              我已完成支付
            </Button>
            <Button
              type="primary"
              :loading="rechargeLoading"
              @click="submitRecharge"
            >
              去支付
            </Button>
          </div>
        </div>
      </Spin>
    </Modal>
  </div>
</template>

<style scoped>
.bind-email-warning {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  color: #991b1b;
  background:
    linear-gradient(135deg, rgb(254 242 242 / 96%), rgb(255 247 247 / 88%)),
    hsl(var(--card));
  border: 1px solid rgb(248 113 113 / 62%);
  border-left: 4px solid #ef4444;
  border-radius: 8px;
  box-shadow: 0 12px 30px rgb(239 68 68 / 10%);
}

.bind-email-warning__body {
  display: flex;
  gap: 12px;
  align-items: center;
  min-width: 0;
}

.bind-email-warning__icon {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  font-size: 19px;
  color: #dc2626;
  background: rgb(254 226 226 / 90%);
  border-radius: 8px;
}

.bind-email-warning__title {
  font-size: 15px;
  font-weight: 800;
  line-height: 22px;
}

.bind-email-warning__desc {
  margin-top: 2px;
  font-size: 13px;
  font-weight: 600;
  line-height: 20px;
  color: #b91c1c;
}

.admin-workbench {
  color: hsl(var(--foreground));
}

.admin-metric-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 14px;
}

.admin-metric-card {
  position: relative;
  display: flex;
  gap: 12px;
  align-items: flex-start;
  min-width: 0;
  min-height: 132px;
  padding: 18px;
  overflow: hidden;
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
  box-shadow: 0 10px 28px rgb(15 23 42 / 5%);
}

.admin-metric-card::after {
  position: absolute;
  right: -36px;
  bottom: -42px;
  width: 112px;
  height: 112px;
  content: '';
  background: var(--admin-tone-soft);
  border-radius: 999px;
}

.admin-metric-card[data-tone='blue'] {
  --admin-tone: #2563eb;
  --admin-tone-soft: rgb(37 99 235 / 10%);
}

.admin-metric-card[data-tone='green'] {
  --admin-tone: #16a34a;
  --admin-tone-soft: rgb(22 163 74 / 10%);
}

.admin-metric-card[data-tone='violet'] {
  --admin-tone: #7c3aed;
  --admin-tone-soft: rgb(124 58 237 / 10%);
}

.admin-metric-card[data-tone='orange'] {
  --admin-tone: #ea580c;
  --admin-tone-soft: rgb(234 88 12 / 10%);
}

.admin-metric-card[data-tone='cyan'] {
  --admin-tone: #0891b2;
  --admin-tone-soft: rgb(8 145 178 / 10%);
}

.admin-metric-card[data-tone='rose'] {
  --admin-tone: #e11d48;
  --admin-tone-soft: rgb(225 29 72 / 10%);
}

.admin-metric-card__icon {
  z-index: 1;
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  font-size: 22px;
  color: var(--admin-tone);
  background: var(--admin-tone-soft);
  border-radius: 8px;
}

.admin-metric-card__title {
  font-size: 13px;
  font-weight: 600;
  line-height: 20px;
  color: rgb(100 116 139);
}

.admin-metric-card__value {
  margin-top: 10px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 28px;
  font-weight: 800;
  line-height: 34px;
  color: hsl(var(--foreground));
  white-space: nowrap;
}

.admin-metric-card__meta {
  margin-top: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
  line-height: 18px;
  color: rgb(100 116 139);
  white-space: nowrap;
}

.admin-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(360px, 0.75fr);
  gap: 16px;
}

.admin-panel {
  min-width: 0;
  padding: 18px;
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
  box-shadow: 0 10px 28px rgb(15 23 42 / 5%);
}

.admin-panel--wide {
  min-width: 0;
}

.admin-panel__head {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 16px;
}

.admin-panel__head h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  line-height: 24px;
  color: hsl(var(--foreground));
}

.admin-panel__head p {
  margin: 4px 0 0;
  font-size: 13px;
  line-height: 20px;
  color: rgb(100 116 139);
}

.admin-chart {
  width: 100%;
  height: 300px;
}

.admin-table {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.admin-table__row {
  display: grid;
  grid-template-columns:
    minmax(180px, 1.6fr) minmax(70px, 0.5fr) minmax(80px, 0.6fr)
    minmax(90px, 0.7fr) minmax(80px, 0.5fr);
  gap: 12px;
  align-items: center;
  width: 100%;
  min-height: 54px;
  padding: 10px 12px;
  font-size: 13px;
  line-height: 20px;
  color: hsl(var(--foreground));
  text-align: left;
  background: hsl(var(--muted) / 38%);
  border: 0;
  border-radius: 8px;
}

.admin-table__row--head {
  min-height: 36px;
  padding-bottom: 0;
  font-size: 12px;
  font-weight: 700;
  color: rgb(100 116 139);
  background: transparent;
}

.admin-table__row--clickable {
  cursor: pointer;
  transition:
    background 0.2s ease,
    transform 0.2s ease;
}

.admin-table__row--clickable:hover {
  background: hsl(var(--accent) / 62%);
  transform: translateY(-1px);
}

.admin-table__main {
  min-width: 0;
}

.admin-table__main strong,
.admin-user__main strong {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 800;
  color: hsl(var(--foreground));
  white-space: nowrap;
}

.admin-table__main small,
.admin-user__main small {
  display: block;
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
  line-height: 18px;
  color: rgb(100 116 139);
  white-space: nowrap;
}

.admin-alert-list,
.admin-user-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.admin-alert,
.admin-user {
  display: flex;
  gap: 10px;
  align-items: center;
  width: 100%;
  min-width: 0;
  padding: 12px;
  color: hsl(var(--foreground));
  text-align: left;
  cursor: pointer;
  background: hsl(var(--background));
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
  transition:
    border-color 0.2s ease,
    transform 0.2s ease;
}

.admin-alert:hover,
.admin-user:hover,
.admin-quick:hover {
  border-color: hsl(var(--primary) / 38%);
  transform: translateY(-1px);
}

.admin-alert__marker {
  flex: 0 0 auto;
  width: 9px;
  height: 9px;
  background: var(--alert-color);
  border-radius: 999px;
  box-shadow: 0 0 0 4px var(--alert-soft);
}

.admin-alert[data-level='danger'] {
  --alert-color: #ef4444;
  --alert-soft: rgb(239 68 68 / 12%);
}

.admin-alert[data-level='warning'] {
  --alert-color: #f97316;
  --alert-soft: rgb(249 115 22 / 14%);
}

.admin-alert[data-level='info'] {
  --alert-color: #2563eb;
  --alert-soft: rgb(37 99 235 / 12%);
}

.admin-alert[data-level='success'] {
  --alert-color: #16a34a;
  --alert-soft: rgb(22 163 74 / 12%);
}

.admin-alert__body {
  flex: 1 1 auto;
  min-width: 0;
}

.admin-alert__body strong {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 14px;
  font-weight: 800;
  line-height: 20px;
  white-space: nowrap;
}

.admin-alert__body small {
  display: -webkit-box;
  margin-top: 3px;
  overflow: hidden;
  -webkit-line-clamp: 2;
  font-size: 12px;
  line-height: 18px;
  color: rgb(100 116 139);
  -webkit-box-orient: vertical;
}

.admin-user__avatar {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  font-weight: 800;
  color: white;
  background: linear-gradient(135deg, #2563eb, #14b8a6);
  border-radius: 8px;
}

.admin-user__main {
  flex: 1 1 auto;
  min-width: 0;
}

.admin-user__stat {
  flex: 0 0 auto;
  font-size: 18px;
  font-weight: 800;
  line-height: 24px;
  color: hsl(var(--foreground));
}

.admin-quick-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.admin-quick {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: center;
  min-height: 78px;
  padding: 12px;
  font-weight: 700;
  color: hsl(var(--foreground));
  cursor: pointer;
  background: hsl(var(--background));
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
  transition:
    border-color 0.2s ease,
    transform 0.2s ease;
}

.admin-quick__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.admin-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 96px;
  font-size: 13px;
  color: rgb(100 116 139);
  border: 1px dashed hsl(var(--border));
  border-radius: 8px;
}

.daily-notice {
  display: flex;
  flex-direction: column;
  background: hsl(var(--card));
}

:deep(.daily-notice-modal-wrap .ant-modal-content) {
  padding: 0;
  overflow: hidden;
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: 12px;
  box-shadow: 0 18px 46px rgb(15 23 42 / 18%);
}

:deep(.daily-notice-modal-wrap .ant-modal-body) {
  padding: 0;
}

.daily-notice__modal-head {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px;
  background: linear-gradient(
    180deg,
    hsl(var(--muted) / 42%),
    hsl(var(--card))
  );
  border-bottom: 1px solid hsl(var(--border));
}

.daily-notice__modal-title-wrap {
  display: flex;
  gap: 12px;
  align-items: center;
  min-width: 0;
}

.daily-notice__modal-icon {
  display: inline-flex;
  flex: 0 0 40px;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  font-size: 20px;
  color: hsl(var(--primary));
  background: hsl(var(--primary) / 10%);
  border-radius: 8px;
}

.daily-notice__modal-title {
  font-size: 19px;
  font-weight: 800;
  line-height: 1.35;
  color: hsl(var(--foreground));
}

.daily-notice__modal-subtitle {
  margin-top: 2px;
  font-size: 13px;
  line-height: 1.4;
  color: hsl(var(--muted-foreground));
}

.daily-notice__close {
  display: inline-flex;
  flex: 0 0 34px;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  font-size: 20px;
  color: hsl(var(--muted-foreground));
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 8px;
  transition:
    background 0.2s ease,
    color 0.2s ease;
}

.daily-notice__close:hover {
  color: hsl(var(--foreground));
  background: hsl(var(--muted) / 70%);
}

.daily-notice__body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 20px 0;
}

.daily-notice__tabs {
  display: flex;
  gap: 8px;
  padding: 4px;
  overflow-x: auto;
  background: hsl(var(--muted) / 45%);
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
}

.daily-notice__tab {
  max-width: 180px;
  height: 32px;
  padding: 0 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 13px;
  font-weight: 700;
  line-height: 32px;
  color: rgb(100 116 139);
  white-space: nowrap;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 6px;
}

.daily-notice__tab.is-active {
  color: hsl(var(--primary));
  background: hsl(var(--background));
  box-shadow: 0 6px 16px rgb(15 23 42 / 8%);
}

.daily-notice__article {
  min-width: 0;
}

.daily-notice__head {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  justify-content: space-between;
  padding: 8px 0 16px;
  border-bottom: 1px solid hsl(var(--border));
}

.daily-notice__title {
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 18px;
  font-weight: 800;
  line-height: 26px;
  color: hsl(var(--foreground));
  white-space: nowrap;
}

.daily-notice__meta {
  margin-top: 2px;
  font-size: 13px;
  line-height: 20px;
  color: rgb(100 116 139);
}

.daily-notice__content {
  max-height: min(46vh, 420px);
  padding: 18px 0 0;
  overflow: auto;
  font-size: 15px;
  line-height: 1.8;
  color: hsl(var(--foreground));
}

.daily-notice__content :deep(.ProseMirror),
.daily-notice__content :deep(.tiptap),
.daily-notice__content :deep(.tiptap-preview),
.daily-notice__content :deep(.vben-tiptap-preview) {
  min-height: 0 !important;
}

.daily-notice__content :deep(p:first-child) {
  margin-top: 0;
}

.daily-notice__content :deep(p:last-child) {
  margin-bottom: 0;
}

.daily-notice__actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  padding: 14px 20px 18px;
  background: hsl(var(--card));
  border-top: 1px solid hsl(var(--border));
}

@media (max-width: 640px) {
  .daily-notice__modal-head {
    padding: 16px;
  }

  .daily-notice__body {
    padding: 14px 14px 0;
  }

  .daily-notice__head {
    flex-direction: column;
    align-items: flex-start;
  }

  .daily-notice__actions {
    flex-direction: column-reverse;
    padding: 12px 14px 14px;
  }

  .daily-notice__actions :deep(.ant-btn) {
    width: 100%;
  }
}

:deep(.package-detail-drawer-content) {
  padding: 16px;
}

.package-detail-drawer {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.package-detail-tabs :deep(.ant-tabs-nav) {
  margin-bottom: 14px;
}

.package-detail-tabs :deep(.ant-tabs-tab) {
  font-weight: 700;
}

.package-detail-tabs :deep(.ant-tabs-content-holder) {
  min-width: 0;
}

.package-detail-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.package-detail-section__head {
  display: flex;
  gap: 12px;
  align-items: flex-end;
  justify-content: space-between;
}

.package-detail-section__head h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
  line-height: 24px;
  color: hsl(var(--foreground));
}

.package-detail-section__head p {
  margin: 2px 0 0;
  font-size: 12px;
  line-height: 18px;
  color: rgb(100 116 139);
}

.package-detail-section__head > span {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  height: 28px;
  padding: 0 10px;
  font-size: 12px;
  font-weight: 700;
  color: hsl(var(--primary));
  background: hsl(var(--primary) / 8%);
  border-radius: 6px;
}

.package-detail-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.package-detail-card {
  padding: 16px;
  background: hsl(var(--background));
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
  box-shadow: 0 12px 32px rgb(15 23 42 / 4%);
}

.package-detail-card__top {
  display: flex;
  gap: 12px;
  align-items: center;
  min-width: 0;
}

.package-detail-card__icon {
  display: inline-flex;
  flex: 0 0 42px;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  font-size: 20px;
  color: hsl(var(--primary));
  background: hsl(var(--primary) / 8%);
  border-radius: 8px;
}

.package-detail-card__name {
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 16px;
  font-weight: 800;
  line-height: 24px;
  color: hsl(var(--foreground));
  white-space: nowrap;
}

.package-detail-card__desc {
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 13px;
  line-height: 20px;
  color: rgb(100 116 139);
  white-space: nowrap;
}

.package-detail-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 14px 0;
}

.package-detail-tags span {
  display: inline-flex;
  align-items: center;
  min-height: 26px;
  padding: 5px 10px;
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
  color: rgb(100 116 139);
  background: hsl(var(--accent) / 62%);
  border-radius: 6px;
}

.package-detail-stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 14px;
}

.package-detail-stats div {
  min-width: 0;
  min-height: 58px;
  padding: 10px;
  background: hsl(var(--muted) / 34%);
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
}

.package-detail-stats span {
  display: block;
  font-size: 12px;
  line-height: 16px;
  color: rgb(100 116 139);
}

.package-detail-stats strong {
  display: block;
  margin-top: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 18px;
  font-weight: 800;
  line-height: 22px;
  color: hsl(var(--foreground));
  white-space: nowrap;
}

.package-detail-empty {
  padding: 18px;
  font-size: 13px;
  line-height: 20px;
  color: rgb(100 116 139);
  text-align: center;
  background: hsl(var(--muted) / 28%);
  border: 1px dashed hsl(var(--border));
  border-radius: 8px;
}

.user-quick-actions {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.user-quick-action {
  position: relative;
  display: flex;
  gap: 12px;
  align-items: center;
  min-width: 0;
  min-height: 92px;
  padding: 16px;
  overflow: hidden;
  color: hsl(var(--foreground));
  text-align: left;
  cursor: pointer;
  background:
    linear-gradient(135deg, rgb(255 255 255 / 86%), rgb(255 255 255 / 68%)),
    hsl(var(--background));
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
  box-shadow: 0 12px 30px rgb(15 23 42 / 5%);
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.user-quick-action::after {
  position: absolute;
  right: -34px;
  bottom: -46px;
  width: 106px;
  height: 106px;
  content: '';
  background: color-mix(in srgb, var(--user-action-accent) 12%, transparent);
  border-radius: 999px;
}

.user-quick-action:hover {
  border-color: color-mix(
    in srgb,
    var(--user-action-accent) 32%,
    hsl(var(--border))
  );
  box-shadow: 0 16px 36px rgb(15 23 42 / 8%);
  transform: translateY(-2px);
}

.user-quick-action__icon {
  z-index: 1;
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  font-size: 22px;
  color: var(--user-action-accent);
  background: color-mix(in srgb, var(--user-action-accent) 11%, white);
  border-radius: 8px;
}

.user-quick-action__content {
  z-index: 1;
  flex: 1 1 auto;
  min-width: 0;
}

.user-quick-action__title {
  display: flex;
  gap: 6px;
  align-items: center;
  min-width: 0;
  font-size: 15px;
  font-weight: 800;
  line-height: 22px;
  color: hsl(var(--foreground));
}

.user-quick-action__badge {
  flex: 0 0 auto;
  margin-inline-end: 0;
}

.user-quick-action__desc {
  display: -webkit-box;
  margin-top: 4px;
  overflow: hidden;
  -webkit-line-clamp: 2;
  font-size: 12px;
  line-height: 18px;
  color: rgb(100 116 139);
  -webkit-box-orient: vertical;
}

.user-quick-action__arrow {
  z-index: 1;
  flex: 0 0 auto;
  font-size: 17px;
  color: rgb(148 163 184);
  transition:
    color 0.2s ease,
    transform 0.2s ease;
}

.user-quick-action:hover .user-quick-action__arrow {
  color: var(--user-action-accent);
  transform: translateX(2px);
}

.user-metric-card {
  position: relative;
  min-height: 148px;
  padding: 22px;
  overflow: hidden;
  background:
    radial-gradient(
      circle at 96% 92%,
      color-mix(in srgb, var(--user-metric-accent) 13%, transparent),
      transparent 34%
    ),
    hsl(var(--background));
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
  box-shadow: 0 12px 32px rgb(15 23 42 / 4%);
}

.user-metric-card::before {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 3px;
  content: '';
  background: var(--user-metric-accent);
  opacity: 0.72;
}

.user-metric-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 16px;
  margin-top: 20px;
  font-size: 14px;
  color: rgb(100 116 139);
  border-top: 1px solid hsl(var(--border));
}

.user-metric-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  font-size: 20px;
  background: color-mix(in srgb, currentcolor 10%, hsl(var(--background)));
  border-radius: 8px;
}

.user-call-trend-card {
  min-height: 360px;
  padding: 20px 22px 18px;
  background: hsl(var(--background));
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
  box-shadow: 0 12px 32px rgb(15 23 42 / 4%);
}

.user-call-trend-head {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  justify-content: space-between;
}

.user-call-trend-title {
  font-size: 16px;
  font-weight: 700;
  line-height: 24px;
  color: hsl(var(--foreground));
}

.user-call-trend-desc {
  margin-top: 4px;
  font-size: 13px;
  line-height: 20px;
  color: rgb(100 116 139);
}

.user-call-trend-tabs {
  display: inline-flex;
  flex: 0 0 auto;
  gap: 4px;
  padding: 3px;
  background: hsl(var(--muted) / 58%);
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
}

.user-call-trend-tab {
  min-width: 62px;
  height: 30px;
  padding: 0 10px;
  font-size: 13px;
  font-weight: 700;
  line-height: 30px;
  color: rgb(100 116 139);
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 6px;
  transition:
    background 0.18s ease,
    color 0.18s ease,
    box-shadow 0.18s ease;
}

.user-call-trend-tab.is-active {
  color: hsl(var(--primary));
  background: hsl(var(--background));
  box-shadow: 0 6px 16px rgb(15 23 42 / 8%);
}

.user-call-trend-chart {
  height: 270px;
  margin-top: 18px;
}

.user-notice-card {
  display: flex;
  flex-direction: column;
  min-height: 360px;
  padding: 18px;
  background: hsl(var(--background));
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
  box-shadow: 0 12px 32px rgb(15 23 42 / 4%);
}

.user-notice-card__head {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 14px;
}

.user-notice-card__title {
  font-size: 16px;
  font-weight: 700;
  line-height: 24px;
  color: hsl(var(--foreground));
}

.user-notice-card__desc {
  margin-top: 4px;
  font-size: 13px;
  line-height: 20px;
  color: rgb(100 116 139);
}

.user-notice-card__more {
  flex: 0 0 auto;
  height: 30px;
  padding: 0 10px;
  font-size: 13px;
  font-weight: 700;
  color: hsl(var(--primary));
  cursor: pointer;
  background: hsl(var(--background));
  border: 1px solid hsl(var(--border));
  border-radius: 6px;
  transition:
    background 0.2s ease,
    border-color 0.2s ease;
}

.user-notice-card__more:hover {
  background: hsl(var(--primary) / 7%);
  border-color: hsl(var(--primary) / 38%);
}

.user-notice-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.user-notice-item {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-height: 56px;
  padding: 10px 10px 10px 12px;
  text-align: left;
  cursor: pointer;
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    transform 0.2s ease;
}

.user-notice-item:hover {
  background: hsl(var(--primary) / 5%);
  border-color: hsl(var(--primary) / 32%);
  transform: translateY(-1px);
}

.user-notice-item__main {
  min-width: 0;
}

.user-notice-item__title-row {
  display: flex;
  gap: 6px;
  align-items: center;
  min-width: 0;
}

.user-notice-item__title {
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 14px;
  font-weight: 700;
  line-height: 20px;
  color: hsl(var(--foreground));
  white-space: nowrap;
}

.user-notice-item__summary {
  display: -webkit-box;
  margin-top: 4px;
  overflow: hidden;
  -webkit-line-clamp: 1;
  font-size: 12px;
  line-height: 18px;
  color: rgb(100 116 139);
  -webkit-box-orient: vertical;
}

.user-notice-item__time {
  margin-top: 4px;
  font-size: 12px;
  line-height: 18px;
  color: rgb(100 116 139);
}

.user-notice-item__arrow {
  flex: 0 0 auto;
  font-size: 16px;
  color: rgb(148 163 184);
}

.user-notice-item:hover .user-notice-item__arrow {
  color: hsl(var(--primary));
}

.user-notice-empty {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
  justify-content: center;
  min-height: 250px;
  font-size: 13px;
  color: rgb(100 116 139);
}

.user-notice-empty svg {
  width: 38px;
  height: 38px;
  padding: 9px;
  color: hsl(var(--primary));
  background: hsl(var(--primary) / 8%);
  border-radius: 10px;
}

.workspace-notice-detail {
  padding: 4px 2px 0;
}

.workspace-notice-detail__head {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  justify-content: space-between;
  padding-bottom: 16px;
  border-bottom: 1px solid hsl(var(--border));
}

.workspace-notice-detail__title {
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 24px;
  font-weight: 800;
  line-height: 1.35;
  color: hsl(var(--foreground));
}

.workspace-notice-detail__meta {
  margin-top: 6px;
  font-size: 13px;
  line-height: 20px;
  color: rgb(100 116 139);
}

.workspace-notice-detail__content {
  max-height: min(62vh, 620px);
  padding-top: 18px;
  overflow: auto;
  color: hsl(var(--foreground));
}

.workspace-notice-detail__content :deep(.ProseMirror),
.workspace-notice-detail__content :deep(.tiptap),
.workspace-notice-detail__content :deep(.tiptap-preview),
.workspace-notice-detail__content :deep(.vben-tiptap-preview) {
  min-height: 0 !important;
}

.workspace-notice-detail__content :deep(p:first-child) {
  margin-top: 0;
}

.workspace-notice-detail__content :deep(p:last-child) {
  margin-bottom: 0;
}

.user-asset-summary {
  display: grid;
  grid-template-columns: minmax(230px, 1.2fr) repeat(2, minmax(132px, 0.9fr));
  gap: 14px;
  width: min(720px, 100%);
}

.user-asset-item {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: flex-end;
  min-width: 0;
  padding: 12px 14px;
  background: hsl(var(--accent) / 45%);
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
}

.user-asset-content {
  flex: 1 1 auto;
}

.user-asset-icon {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  font-size: 17px;
  color: hsl(var(--primary));
  background: hsl(var(--background));
  border-radius: 8px;
}

.user-asset-label {
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 13px;
  color: rgb(100 116 139);
  white-space: nowrap;
}

.user-asset-value {
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 20px;
  font-weight: 650;
  line-height: 1.2;
  color: rgb(15 23 42);
  white-space: nowrap;
}

.user-asset-actions {
  display: flex;
  flex-wrap: nowrap;
  gap: 6px;
  justify-content: flex-end;
  margin-top: 8px;
  white-space: nowrap;
}

.user-asset-detail-btn {
  display: inline-flex;
  flex: 0 0 auto;
  gap: 4px;
  align-items: center;
  justify-content: center;
  height: 26px;
  padding: 0 8px;
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
  color: hsl(var(--primary));
  cursor: pointer;
  background: hsl(var(--primary) / 8%);
  border: 1px solid hsl(var(--primary) / 16%);
  border-radius: 6px;
}

.user-asset-item.has-secondary-action {
  min-width: 230px;
}

.user-asset-detail-btn:hover {
  background: hsl(var(--primary) / 13%);
}

.user-asset-detail-btn.is-recharge {
  background: hsl(var(--primary) / 9%);
  border-color: hsl(var(--primary) / 22%);
}

.user-asset-detail-btn.is-recharge:hover {
  background: hsl(var(--primary) / 15%);
}

.user-asset-detail-btn.is-redeem {
  color: #16a34a;
  background: rgb(22 163 74 / 8%);
  border-color: rgb(22 163 74 / 18%);
}

.user-asset-detail-btn.is-redeem:hover {
  background: rgb(22 163 74 / 14%);
}

.recharge-panel {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.recharge-panel__summary {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: hsl(var(--muted) / 35%);
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
}

.recharge-panel__summary span,
.recharge-field label,
.recharge-order-box__head span {
  display: block;
  font-size: 13px;
  line-height: 20px;
  color: rgb(100 116 139);
}

.recharge-panel__summary strong {
  display: block;
  margin-top: 2px;
  font-size: 22px;
  font-weight: 800;
  line-height: 28px;
  color: hsl(var(--foreground));
}

.recharge-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.recharge-amount-input {
  width: 100%;
}

.recharge-quick-amounts,
.recharge-capability-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.recharge-quick-amounts button {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  min-height: 32px;
  padding: 5px 12px;
  font-size: 13px;
  font-weight: 700;
  line-height: 18px;
  color: hsl(var(--foreground));
  cursor: pointer;
  background: hsl(var(--background));
  border: 1px solid hsl(var(--border));
  border-radius: 6px;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease,
    color 0.2s ease;
}

.recharge-quick-amounts button small {
  font-size: 12px;
  font-weight: 700;
  color: #f43f5e;
}

.recharge-quick-amounts button:hover,
.recharge-quick-amounts button.is-active {
  color: hsl(var(--primary));
  background: hsl(var(--primary) / 7%);
  border-color: hsl(var(--primary) / 40%);
}

.recharge-gift-tip {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 9px 11px;
  font-size: 13px;
  line-height: 20px;
  color: rgb(159 18 57);
  background: rgb(255 241 242);
  border: 1px solid rgb(251 113 133 / 45%);
  border-radius: 8px;
}

.recharge-gift-tip svg {
  flex: none;
  font-size: 17px;
  color: rgb(225 29 72);
}

.recharge-gift-tip strong {
  font-weight: 800;
  color: rgb(225 29 72);
}

.recharge-methods {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 12px;
}

.recharge-order-box {
  padding: 14px;
  background: hsl(var(--background));
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
}

.recharge-order-box__head {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;
}

.recharge-order-box__head strong {
  display: block;
  margin-top: 2px;
  font-size: 13px;
  font-weight: 700;
  line-height: 20px;
  color: hsl(var(--foreground));
  word-break: break-all;
}

.recharge-order-amounts {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-top: 12px;
  font-size: 13px;
  color: rgb(100 116 139);
}

.recharge-order-amounts span,
.recharge-order-amounts strong {
  padding: 0 9px;
  line-height: 22px;
  background: hsl(var(--muted));
  border-radius: 999px;
}

.recharge-order-amounts strong {
  font-weight: 800;
  color: hsl(var(--primary));
  background: hsl(var(--primary) / 8%);
}

.recharge-qrcode {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
  margin-top: 14px;
}

.recharge-qrcode p,
.recharge-order-tip {
  margin: 0;
  font-size: 13px;
  line-height: 20px;
  color: rgb(100 116 139);
}

.recharge-order-tip {
  padding: 12px;
  margin-top: 12px;
  background: hsl(var(--primary) / 7%);
  border-radius: 8px;
}

.recharge-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

:global(.dark) .user-asset-label {
  color: rgb(148 163 184);
}

:global(.dark) .user-call-trend-desc,
:global(.dark) .user-call-trend-tab,
:global(.dark) .user-quick-action__desc,
:global(.dark) .user-notice-card__desc,
:global(.dark) .user-notice-empty,
:global(.dark) .user-notice-item__summary,
:global(.dark) .user-notice-item__time,
:global(.dark) .workspace-notice-detail__meta {
  color: rgb(148 163 184);
}

:global(.dark) .package-detail-card__desc,
:global(.dark) .package-detail-empty,
:global(.dark) .package-detail-section__head p,
:global(.dark) .package-detail-stats span,
:global(.dark) .package-detail-tags span,
:global(.dark) .recharge-order-amounts,
:global(.dark) .recharge-order-tip,
:global(.dark) .recharge-panel__summary span,
:global(.dark) .recharge-field label,
:global(.dark) .recharge-order-box__head span,
:global(.dark) .recharge-qrcode p {
  color: rgb(148 163 184);
}

:global(.dark) .recharge-gift-tip {
  color: rgb(253 164 175);
  background: rgb(76 5 25 / 45%);
  border-color: rgb(244 63 94 / 35%);
}

:global(.dark) .recharge-gift-tip strong,
:global(.dark) .recharge-gift-tip svg {
  color: rgb(251 113 133);
}

:global(.dark) .user-asset-value {
  color: rgb(248 250 252);
}

:global(.dark) .user-quick-action,
:global(.dark) .user-metric-card,
:global(.dark) .user-call-trend-card,
:global(.dark) .user-notice-card {
  box-shadow: none;
}

:global(.dark) .user-quick-action {
  background:
    linear-gradient(135deg, rgb(15 23 42 / 76%), rgb(15 23 42 / 52%)),
    hsl(var(--background));
}

:global(.dark) .user-quick-action__icon {
  background: color-mix(in srgb, var(--user-action-accent) 16%, rgb(15 23 42));
}

:global(.dark) .admin-metric-card,
:global(.dark) .admin-panel,
:global(.dark) .admin-alert,
:global(.dark) .admin-user,
:global(.dark) .admin-quick,
:global(.dark) .admin-table__row {
  box-shadow: none;
}

:global(.dark) .admin-metric-card__title,
:global(.dark) .admin-metric-card__meta,
:global(.dark) .admin-panel__head p,
:global(.dark) .admin-table__row--head,
:global(.dark) .admin-table__main small,
:global(.dark) .admin-alert__body small,
:global(.dark) .admin-user__main small,
:global(.dark) .admin-empty {
  color: rgb(148 163 184);
}

@media (max-width: 768px) {
  .package-detail-section__head {
    flex-direction: column;
    align-items: flex-start;
  }

  .admin-panel__head {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 1024px) {
  .admin-metric-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .admin-grid {
    grid-template-columns: 1fr;
  }

  .user-quick-actions {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .user-asset-summary {
    grid-template-columns: minmax(230px, 1.2fr) repeat(2, minmax(132px, 0.9fr));
    width: 100%;
  }
}

@media (max-width: 640px) {
  .bind-email-warning {
    flex-direction: column;
    align-items: stretch;
  }

  .bind-email-warning :deep(.ant-btn) {
    width: fit-content;
  }

  .admin-metric-grid,
  .admin-quick-grid {
    grid-template-columns: 1fr;
  }

  .admin-metric-card {
    min-height: 112px;
  }

  .admin-chart {
    height: 260px;
  }

  .admin-table {
    gap: 10px;
  }

  .admin-table__row {
    grid-template-columns: 1fr 1fr;
  }

  .admin-table__row--head {
    display: none;
  }

  .admin-table__row span:not(.admin-table__main) {
    font-size: 12px;
  }

  .user-quick-actions {
    grid-template-columns: 1fr;
  }

  .user-quick-action {
    min-height: 82px;
  }

  .user-asset-summary {
    grid-template-columns: 1fr;
  }

  .user-asset-item {
    justify-content: space-between;
  }

  .user-call-trend-head {
    flex-direction: column;
  }

  .user-call-trend-tabs {
    width: 100%;
  }

  .user-call-trend-tab {
    flex: 1 1 0;
  }

  .package-detail-stats {
    grid-template-columns: 1fr;
  }

  .recharge-methods {
    grid-template-columns: 1fr;
  }
}
</style>
