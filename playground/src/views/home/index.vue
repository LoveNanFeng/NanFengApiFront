<script lang="ts" setup>
import type { EchartsUIType } from '@vben/plugins/echarts';

import type { HomeApi } from '#/api/home';

import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue';
import { RouterLink } from 'vue-router';

import { IconifyIcon } from '@vben/icons';
import { echarts, EchartsUI, useEcharts } from '@vben/plugins/echarts';
import { useAccessStore, useUserStore } from '@vben/stores';

import { getHomeOverview } from '#/api/home';
import PublicSiteFooter from '#/components/public-site-footer.vue';
import PublicSiteHeader from '#/components/public-site-header.vue';
import { usePublicSiteTheme } from '#/composables/use-public-site-theme';

interface FeatureCard {
  desc: string;
  icon: string;
  tags: string[];
  title: string;
}

interface ScenarioCard {
  desc: string;
  icon: string;
  title: string;
}

interface SystemFlowItem {
  desc: string;
  icon: string;
  label: string;
  title: string;
}

interface ApiDisplayCard extends HomeApi.HotApiItem {
  desc: string;
  icon: string;
  tags: string[];
}

const defaultSiteConfig: HomeApi.SiteConfig = {
  contactAddress: '',
  contactEmail: '',
  contactPhone: '',
  contactQq: '',
  contactWechat: '',
  copyright: '© 2026 NanFengAPI. All rights reserved.',
  description: '统一管理接口、Key、套餐、计费与调用日志。',
  icp: '',
  logoUrl: '',
  siteName: 'NanFengAPI',
  slogan: '清晰接入、调用可查、计费透明的 API 服务平台',
  updateTime: null,
};

const emptyOverview: HomeApi.Overview = {
  callTrend7d: [],
  homeNotice: {
    content: '',
    enabled: 0,
    id: 1,
    updateTime: null,
  },
  hotApis: [],
  regionRanking: [],
  siteConfig: defaultSiteConfig,
  stats: {
    activeRegions24h: 0,
    activeRegions24hDelta: 0,
    apiTotal: 0,
    availabilityPercent: 0,
    availabilitySource: 'API_STATUS',
    calls24h: 0,
    calls24hDeltaPercent: 0,
    enabledApiTotal: 0,
    peakQps24h: 0,
    peakQps24hDelta: 0,
    requestTotal: 0,
    userTotal: 0,
  },
};

const API_MARKET_PATH = '/apilist';
const CONSOLE_FALLBACK_PATH = '/workspace';
const REGISTER_PATH = '/auth/register';

const featureCards: FeatureCard[] = [
  {
    desc: '接口列表、文档、调试、Key、套餐和调用记录集中在一个入口，接入和查询都更省事。',
    icon: 'lucide:layout-dashboard',
    tags: ['接口查询', '在线调试', '调用记录'],
    title: '统一 API 服务入口',
  },
  {
    desc: '支持全站 Key 与单接口 Key，按套餐、点数或余额结算，调用前规则清楚，调用后账单可查。',
    icon: 'lucide:key-round',
    tags: ['Key 管理', '鉴权', '扣费规则'],
    title: 'Key 授权与计费',
  },
  {
    desc: '调用趋势、峰值 QPS 和成功率来自真实日志，方便判断接口是否稳定、请求是否正常。',
    icon: 'lucide:activity',
    tags: ['趋势统计', '成功率', 'QPS'],
    title: '调用状态可观察',
  },
  {
    desc: '接口状态、精选展示、排序和套餐配置分离，用户能更快找到可用接口。',
    icon: 'lucide:badge-check',
    tags: ['精选接口', '状态控制', '套餐配置'],
    title: '清晰的接口展示',
  },
];

const scenarioCards: ScenarioCard[] = [
  {
    desc: '把通用 API 做成可搜索、可调试、可购买的接口市场。',
    icon: 'lucide:store',
    title: '开发者接口市场',
  },
  {
    desc: '给内部或客户系统提供统一网关、调用记录和费用核算。',
    icon: 'lucide:building-2',
    title: '企业系统集成',
  },
  {
    desc: '按接口、Key、套餐和点数查看使用量，便于核对费用。',
    icon: 'lucide:receipt-text',
    title: '用量费用核对',
  },
  {
    desc: '通过趋势、状态码和调用日志观察异常请求，快速定位接口问题。',
    icon: 'lucide:radar',
    title: '调用监控分析',
  },
];

const systemFlowItems: SystemFlowItem[] = [
  {
    desc: '接口详情展示请求方式、价格、参数说明和返回示例，接入前先把规则看明白。',
    icon: 'lucide:file-text',
    label: '公开文档',
    title: '参数示例清楚',
  },
  {
    desc: 'Key、账号状态、接口权限和来源 IP 都会校验，正式调用边界更明确。',
    icon: 'lucide:shield-check',
    label: '权限校验',
    title: '调用边界明确',
  },
  {
    desc: '会员、套餐、点数和余额按规则扣费，调用后可以追踪每笔费用来源。',
    icon: 'lucide:receipt-text',
    label: '计费规则',
    title: '费用来源可查',
  },
  {
    desc: '每次请求的状态、耗时和错误信息可查，接口失败时能更快定位原因。',
    icon: 'lucide:logs',
    label: '调用记录',
    title: '问题定位更快',
  },
];

const integrationSteps = [
  {
    desc: '在接口市场查看接口详情、价格、请求方式、参数和返回示例。',
    icon: 'lucide:store',
    title: '选择接口',
  },
  {
    desc: '按接口规则准备会员、接口会员、点数或余额，避免正式调用被拦截。',
    icon: 'lucide:badge-check',
    title: '准备权益',
  },
  {
    desc: '在控制台创建全站 Key 或接口专属 Key，并按需配置 IP 白名单。',
    icon: 'lucide:key-round',
    title: '创建 Key',
  },
  {
    desc: '通过公开网关调用接口，之后在控制台查看调用日志和扣费记录。',
    icon: 'lucide:activity',
    title: '调用观察',
  },
] as const;

const keyAuthRules = [
  {
    desc: '所有公开接口都需要在 Query 中携带 key，例如 ?key=YOUR_API_KEY。',
    label: '认证位置',
  },
  {
    desc: 'Key 需要属于启用状态的账号，且必须有该接口的调用权限。',
    label: '账号状态',
  },
  {
    desc: '如果开启了 IP 白名单，调用来源 IP 必须在白名单范围内。',
    label: '访问来源',
  },
  {
    desc: '不要把 Key 写进前端页面或小程序源码，正式业务建议从服务端转发调用。',
    label: '密钥保管',
    warn: true,
  },
] as const;

const apiIconPool = [
  'lucide:play-square',
  'lucide:scan-text',
  'lucide:image',
  'lucide:sparkles',
  'lucide:smartphone',
  'lucide:database-zap',
];

const callTrendRef = ref<EchartsUIType>();
const heroTrendPanelRef = ref<HTMLElement>();
const hotStripRef = ref<HTMLElement>();
const { renderEcharts: renderCallTrend } = useEcharts(callTrendRef);

const accessStore = useAccessStore();
const userStore = useUserStore();
const overview = ref<HomeApi.Overview>(emptyOverview);
const trendPanelSink = ref(0);

const callTrend = computed(() => overview.value.callTrend7d ?? []);
const hotApis = computed(() => overview.value.hotApis ?? []);
const homeNotice = computed(
  () =>
    overview.value.homeNotice ?? {
      content: '',
      enabled: 0,
      id: 1,
      updateTime: null,
    },
);
const siteConfig = computed<HomeApi.SiteConfig>(
  () => overview.value.siteConfig ?? defaultSiteConfig,
);
const siteName = computed(
  () =>
    String(siteConfig.value.siteName || 'NanFengAPI').trim() || 'NanFengAPI',
);
const heroSlogan = computed(() => formatHeroSlogan(siteConfig.value.slogan));
const isSignedIn = computed(() => Boolean(accessStore.accessToken));
const consolePath = computed(() => {
  const homePath = String(
    userStore.userInfo?.homePath || CONSOLE_FALLBACK_PATH,
  ).trim();
  return homePath || CONSOLE_FALLBACK_PATH;
});
const registerPath = REGISTER_PATH;
const apiMarketPath = API_MARKET_PATH;
const primaryActionPath = computed(() =>
  isSignedIn.value ? consolePath.value : registerPath,
);
const primaryActionLabel = computed(() =>
  isSignedIn.value ? '前往控制台' : '开始使用',
);
const quickStartActionLabel = computed(() =>
  isSignedIn.value ? '前往控制台' : '免费注册',
);
const { activeTheme, siteThemeVars } = usePublicSiteTheme();
const trendItems = computed(() => {
  if (callTrend.value.length > 0) {
    return callTrend.value;
  }
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    return {
      date: formatDate(date),
      label: formatTrendLabel(date),
      value: 0,
    };
  });
});
const noticeText = computed(() => {
  if (Number(homeNotice.value.enabled || 0) !== 1) {
    return '';
  }
  return String(homeNotice.value.content || '').trim();
});

const realApiCards = computed<ApiDisplayCard[]>(() =>
  hotApis.value.map((item, index) => ({
    ...item,
    desc:
      item.description?.trim() ||
      `${item.requestMethod || 'HTTP'} 接口，累计调用 ${formatNumber(
        item.callCount,
      )} 次。`,
    icon: apiIconPool[index % apiIconPool.length] ?? 'lucide:box',
    tags: apiTags(item),
  })),
);

const trendPanelStyle = computed(() => ({
  '--trend-sink': `${trendPanelSink.value}px`,
}));

let trendScrollFrame = 0;

onMounted(() => {
  void loadOverview();
  void nextTick(() => {
    updateTrendPanelSink();
    window.addEventListener('scroll', requestTrendPanelSinkUpdate, {
      passive: true,
    });
    window.addEventListener('resize', requestTrendPanelSinkUpdate);
  });
});

onBeforeUnmount(() => {
  window.removeEventListener('scroll', requestTrendPanelSinkUpdate);
  window.removeEventListener('resize', requestTrendPanelSinkUpdate);
  if (trendScrollFrame) {
    window.cancelAnimationFrame(trendScrollFrame);
  }
});

watch(
  () => trendItems.value,
  () => {
    void renderCallTrendChart();
  },
  { deep: true },
);

watch(
  () => activeTheme.value.key,
  () => {
    void renderCallTrendChart();
  },
);

watch(
  siteName,
  (name) => {
    if (typeof document !== 'undefined') {
      document.title = name;
    }
  },
  { immediate: true },
);

async function loadOverview() {
  try {
    overview.value = await getHomeOverview();
  } catch {
    overview.value = emptyOverview;
  } finally {
    void renderCallTrendChart();
    requestTrendPanelSinkUpdate();
  }
}

function requestTrendPanelSinkUpdate() {
  if (trendScrollFrame) {
    return;
  }
  trendScrollFrame = window.requestAnimationFrame(() => {
    trendScrollFrame = 0;
    updateTrendPanelSink();
  });
}

function updateTrendPanelSink() {
  const panel = heroTrendPanelRef.value;
  const hotStrip = hotStripRef.value;
  if (!panel || !hotStrip || window.innerWidth <= 1280) {
    trendPanelSink.value = 0;
    return;
  }

  const currentSink = trendPanelSink.value;
  const panelRect = panel.getBoundingClientRect();
  const hotStripRect = hotStrip.getBoundingClientRect();
  const panelOriginalBottom =
    panelRect.top + window.scrollY - currentSink + panelRect.height;
  const hotStripBottom =
    hotStripRect.top + window.scrollY + hotStripRect.height;
  const maxSink = Math.max(
    0,
    Math.min(180, hotStripBottom - panelOriginalBottom),
  );
  trendPanelSink.value = Math.min(maxSink, Math.max(0, window.scrollY * 0.32));
}

function apiTags(item: HomeApi.HotApiItem) {
  const methodTag = item.requestMethod
    ? String(item.requestMethod).replace('_', '/')
    : '';
  const baseTags = [
    `${formatNumber(item.callCount)} 次调用`,
    formatApiPrice(item),
  ];
  return methodTag ? [methodTag, ...baseTags] : baseTags;
}

function formatApiPrice(item: HomeApi.HotApiItem) {
  if (Number(item.pointPrice || 0) > 0) {
    return `${item.pointPrice} 点/次`;
  }
  if (Number(item.price || 0) > 0) {
    return `¥${Number(item.price).toFixed(2)}/次`;
  }
  return '免费';
}

function formatHeroSlogan(value: null | string | undefined) {
  const slogan = String(value || defaultSiteConfig.slogan)
    .replace(/[，,、]+/g, ' · ')
    .replace(/\s+/g, ' ')
    .trim();
  return slogan || defaultSiteConfig.slogan;
}

function formatNumber(value: number | string | undefined) {
  const number = Number(value || 0);
  return new Intl.NumberFormat('zh-CN').format(number);
}

async function renderCallTrendChart() {
  const theme = activeTheme.value;
  const labels = trendItems.value.map((item) => item.label);
  const values = trendItems.value.map((item) => Number(item.value || 0));
  const maxValue = Math.max(0, ...values);
  const yMax = maxValue > 0 ? Math.ceil(maxValue * 1.18) : 10;

  await renderCallTrend({
    animation: false,
    animationDuration: 0,
    animationDurationUpdate: 0,
    color: [theme.color],
    grid: {
      bottom: 20,
      containLabel: true,
      left: 14,
      right: 46,
      top: 30,
    },
    series: [
      {
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { color: `rgb(${theme.rgb} / 22%)`, offset: 0 },
            { color: `rgb(${theme.rgb} / 0%)`, offset: 1 },
          ]),
          opacity: 1,
        },
        blur: {
          areaStyle: {
            opacity: 1,
          },
          itemStyle: {
            opacity: 1,
          },
          lineStyle: {
            opacity: 1,
          },
        },
        data: values,
        emphasis: {
          areaStyle: {
            opacity: 1,
          },
          disabled: true,
          focus: 'none',
          itemStyle: {
            borderColor: '#fff',
            borderWidth: 2,
            color: theme.color,
            opacity: 1,
          },
          lineStyle: {
            color: theme.color,
            opacity: 1,
            width: 3,
          },
        },
        itemStyle: {
          borderColor: '#fff',
          borderWidth: 2,
          color: theme.color,
          opacity: 1,
        },
        lineStyle: {
          color: theme.color,
          opacity: 1,
          shadowBlur: 12,
          shadowColor: `rgb(${theme.rgb} / 20%)`,
          width: 3,
        },
        name: '调用量',
        showSymbol: true,
        smooth: true,
        symbol: 'circle',
        symbolSize: 7,
        type: 'line',
        z: 3,
      },
    ],
    tooltip: {
      axisPointer: {
        lineStyle: {
          color: 'rgb(148 163 184 / 55%)',
          type: 'dashed',
          width: 1,
        },
        snap: true,
        type: 'line',
      },
      backgroundColor: 'rgb(255 255 255 / 96%)',
      borderColor: '#d8e2f0',
      borderWidth: 1,
      confine: true,
      formatter: (params: any) => {
        const item = Array.isArray(params) ? params[0] : params;
        return `<strong>${item?.axisValue ?? ''}</strong><br/><span>调用量：${formatNumber(item?.data ?? 0)}</span>`;
      },
      padding: [10, 12],
      textStyle: {
        color: '#0f172a',
        fontSize: 13,
        fontWeight: 700,
      },
      trigger: 'axis',
    },
    xAxis: {
      axisLabel: {
        color: '#94a3b8',
        fontSize: 12,
        fontWeight: 700,
        hideOverlap: false,
        interval: 0,
        showMaxLabel: true,
        showMinLabel: true,
      },
      axisLine: {
        lineStyle: {
          color: '#dbe5f2',
        },
      },
      axisTick: {
        show: false,
      },
      boundaryGap: false,
      data: labels,
      type: 'category',
    },
    yAxis: {
      axisLabel: {
        color: '#94a3b8',
        fontSize: 12,
        formatter: (value: number) => compactNumber(value),
      },
      max: yMax,
      min: 0,
      splitLine: {
        lineStyle: {
          color: '#edf2f7',
        },
      },
      splitNumber: 4,
      type: 'value',
    },
  } as any);
}

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatTrendLabel(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${month}-${day}`;
}

function compactNumber(value: number | string | undefined) {
  const number = Number(value || 0);
  if (number >= 10_000) {
    return `${(number / 10_000).toFixed(number >= 100_000 ? 0 : 1)}w`;
  }
  if (number >= 1000) {
    return `${(number / 1000).toFixed(number >= 10_000 ? 0 : 1)}k`;
  }
  return String(number);
}
</script>

<template>
  <main id="hero" class="home-page" :style="siteThemeVars">
    <PublicSiteHeader active-key="home" />

    <section v-if="noticeText" class="notice-wrap" aria-label="首页滚动公告">
      <div class="notice-bar">
        <IconifyIcon icon="lucide:megaphone" />
        <div class="notice-marquee">
          <div class="notice-track">
            <span>{{ noticeText }}</span>
          </div>
        </div>
      </div>
    </section>

    <section class="hero-shell">
      <div class="hero-copy">
        <div class="eyebrow">
          <span></span>
          面向开发者的 API 服务与分发平台
        </div>

        <h1>稳定提供 API 服务网站</h1>

        <div class="hero-slogan">
          <IconifyIcon icon="lucide:sparkles" />
          <span>{{ heroSlogan }}</span>
        </div>

        <p>
          {{ siteName }} 提供统一的 API 列表、详情调试、Key
          管理、套餐购买、调用记录与计费入口，
          让接口接入更快、调用更稳、用量更清楚。
        </p>

        <div class="hero-actions">
          <RouterLink class="primary-button" :to="primaryActionPath">
            {{ primaryActionLabel }}
          </RouterLink>
          <RouterLink class="secondary-button" :to="apiMarketPath">
            查看接口市场
          </RouterLink>
        </div>

        <section ref="hotStripRef" class="hot-strip">
          <div class="strip-head">
            <span>当前精选接口</span>
            <RouterLink :to="apiMarketPath">查看全部</RouterLink>
          </div>
          <div v-if="realApiCards.length > 0" class="hot-tags">
            <RouterLink
              v-for="item in realApiCards.slice(0, 8)"
              :key="item.id"
              :to="{ path: apiMarketPath, query: { keyword: item.name } }"
            >
              {{ item.name }}
              <small>{{ compactNumber(item.callCount) }}</small>
            </RouterLink>
          </div>
          <p v-else>暂无精选接口，请稍后查看接口市场。</p>
        </section>
      </div>

      <aside
        ref="heroTrendPanelRef"
        class="hero-panel"
        :style="trendPanelStyle"
      >
        <section class="trend-card">
          <div class="card-head">
            <div>
              <h2>近7日接口调用总量</h2>
              <p>全部接口请求按日统计</p>
            </div>
            <span>实时</span>
          </div>

          <EchartsUI
            ref="callTrendRef"
            class="trend-chart"
            height="280px"
            width="100%"
          />
        </section>
      </aside>
    </section>

    <section id="quickstart" class="content-section access-guide-section">
      <div class="section-head">
        <span>接入流程</span>
        <h2>四步完成接入</h2>
        <p>先确认接口和权益，再创建 Key，最后接入生产调用。</p>
      </div>

      <div class="integration-step-grid">
        <article
          v-for="(item, index) in integrationSteps"
          :key="item.title"
          class="integration-step-card"
        >
          <div class="integration-step-card__head">
            <b>{{ index + 1 }}</b>
            <span>
              <IconifyIcon :icon="item.icon" />
            </span>
          </div>
          <h3>{{ item.title }}</h3>
          <p>{{ item.desc }}</p>
        </article>
      </div>
    </section>

    <section id="key-auth" class="content-section key-auth-section">
      <div class="section-head">
        <span>Key 认证</span>
        <h2>Key 认证规则</h2>
        <p>
          公开接口通过 Query 参数 key
          完成认证，系统会继续校验账号、接口权限和来源 IP。
        </p>
      </div>

      <div class="auth-rule-grid">
        <article
          v-for="item in keyAuthRules"
          :key="item.label"
          class="auth-rule-card"
          :class="{ 'auth-rule-card--warn': item.warn }"
        >
          <div>
            <IconifyIcon
              :icon="item.warn ? 'lucide:shield-alert' : 'lucide:shield-check'"
            />
            <strong>{{ item.label }}</strong>
          </div>
          <p>{{ item.desc }}</p>
        </article>
      </div>
    </section>

    <section id="system-flow" class="content-section system-flow-section">
      <div class="section-head">
        <span>服务保障</span>
        <h2>接入后也能看清每一次调用</h2>
        <p>
          围绕客户持续使用 API
          的关键问题展示：权限是否清楚、费用是否透明、日志是否可查。
        </p>
      </div>

      <div class="system-flow-list">
        <article
          v-for="(item, index) in systemFlowItems"
          :key="item.title"
          class="system-flow-item"
        >
          <div class="system-flow-item__head">
            <span class="system-flow-item__meta">
              <span class="system-flow-item__icon">
                <IconifyIcon :icon="item.icon" />
              </span>
              <em>{{ item.label }}</em>
            </span>
            <b>{{ String(index + 1).padStart(2, '0') }}</b>
          </div>
          <div class="system-flow-item__body">
            <h3>{{ item.title }}</h3>
            <p>{{ item.desc }}</p>
          </div>
        </article>
      </div>
    </section>

    <section id="features" class="content-section">
      <div class="section-head">
        <span>系统能力</span>
        <h2>平台能力</h2>
        <p>围绕接口查询、授权、计费和日志追踪，提供一套完整的 API 服务能力。</p>
      </div>

      <div class="feature-grid">
        <article
          v-for="item in featureCards"
          :key="item.title"
          class="feature-card"
        >
          <span>
            <IconifyIcon :icon="item.icon" />
          </span>
          <div>
            <h3>{{ item.title }}</h3>
            <p>{{ item.desc }}</p>
            <div>
              <em v-for="tag in item.tags" :key="tag">{{ tag }}</em>
            </div>
          </div>
        </article>
      </div>
    </section>

    <section class="content-section">
      <div class="section-head">
        <span>场景覆盖</span>
        <h2>适用场景</h2>
        <p>
          同一套接口、Key、套餐、调用记录与计费能力，覆盖不同角色的使用方式。
        </p>
      </div>

      <div class="scenario-grid">
        <article v-for="(item, index) in scenarioCards" :key="item.title">
          <b>{{ String(index + 1).padStart(2, '0') }}</b>
          <IconifyIcon :icon="item.icon" />
          <h3>{{ item.title }}</h3>
          <p>{{ item.desc }}</p>
        </article>
      </div>
    </section>

    <section id="ready" class="quickstart-section">
      <div>
        <span>开始接入</span>
        <h2>准备好了就开始</h2>
        <p>从接口市场选择接口，进入详情调试，创建 Key 后复制示例接入。</p>
      </div>
      <RouterLink :to="primaryActionPath">
        {{ quickStartActionLabel }}
      </RouterLink>
    </section>

    <PublicSiteFooter :site-config="siteConfig" />
  </main>
</template>

<style scoped>
.home-page {
  --home-accent: #4f46e5;
  --home-primary: #2563eb;
  --home-primary-rgb: 37 99 235;
  --home-soft: #eff6ff;

  position: relative;
  min-height: 100vh;
  padding-top: 72px;
  overflow-x: hidden;
  font-family:
    'HarmonyOS Sans SC', MiSans, 'Microsoft YaHei UI', 'PingFang SC', sans-serif;
  color: #0f172a;
  background:
    linear-gradient(
      180deg,
      rgb(var(--home-primary-rgb) / 8%) 0%,
      rgb(248 250 252) 32%,
      #f8fafc 100%
    ),
    repeating-linear-gradient(
      90deg,
      rgb(15 23 42 / 3%) 0,
      rgb(15 23 42 / 3%) 1px,
      transparent 1px,
      transparent 80px
    );
}

.home-page::before {
  position: fixed;
  inset: 72px 0 0;
  z-index: 0;
  pointer-events: none;
  content: '';
  background:
    repeating-linear-gradient(
      90deg,
      transparent 0,
      transparent 96px,
      rgb(var(--home-primary-rgb) / 4%) 96px,
      rgb(var(--home-primary-rgb) / 4%) 97px
    ),
    repeating-linear-gradient(
      0deg,
      transparent 0,
      transparent 72px,
      rgb(var(--home-primary-rgb) / 3.6%) 72px,
      rgb(var(--home-primary-rgb) / 3.6%) 73px
    );
  mask-image: linear-gradient(
    180deg,
    transparent 0%,
    #000 18%,
    #000 70%,
    transparent 100%
  );
  animation: grid-drift 26s linear infinite;
}

.site-header {
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  z-index: 50;
  display: grid;
  grid-template-columns: 260px 1fr auto;
  gap: 28px;
  align-items: center;
  height: 72px;
  padding: 0 clamp(24px, 4vw, 64px);
  background: rgb(255 255 255 / 92%);
  border-bottom: 1px solid #e2e8f0;
  backdrop-filter: blur(18px);
}

.notice-wrap {
  position: relative;
  z-index: 1;
  width: min(1440px, calc(100% - 96px));
  margin: 12px auto 0;
}

.notice-bar {
  display: flex;
  gap: 10px;
  align-items: center;
  height: 34px;
  padding: 0 16px;
  overflow: hidden;
  color: #475569;
  background: rgb(255 255 255 / 70%);
  border: 1px solid rgb(var(--home-primary-rgb) / 14%);
  border-radius: 999px;
  box-shadow: 0 12px 28px rgb(15 23 42 / 4%);
  animation: fade-up 0.48s ease 0.08s both;
}

.notice-bar svg {
  flex: 0 0 auto;
  font-size: 16px;
  color: var(--home-primary);
  animation: notice-icon-pulse 2.8s ease-in-out infinite;
}

.notice-marquee {
  position: relative;
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.notice-track {
  display: inline-block;
  min-width: 100%;
  padding-left: 100%;
  white-space: nowrap;
  animation: notice-scroll 26s linear infinite;
}

.notice-track span {
  font-size: 13px;
  font-weight: 750;
  color: #475569;
}

@keyframes notice-scroll {
  from {
    transform: translateX(0);
  }

  to {
    transform: translateX(-100%);
  }
}

.brand,
.site-nav,
.site-actions,
.hero-actions,
.card-head,
.strip-head,
.api-card a,
.quickstart-section {
  display: flex;
  align-items: center;
}

.brand {
  gap: 12px;
  min-width: 0;
  font-size: 22px;
  font-weight: 900;
  color: #0f172a;
  text-decoration: none;
}

.brand-logo {
  flex: 0 0 auto;
  width: 56px;
  height: 48px;
  object-fit: contain;
  border-radius: 10px;
}

.brand > span:last-child {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.brand-mark {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 40px;
}

.brand-mark::before {
  position: absolute;
  inset: 0;
  content: '';
  background: linear-gradient(
    145deg,
    #22d3ee 0%,
    var(--home-primary) 58%,
    var(--home-accent) 100%
  );
  border-radius: 12px;
  clip-path: polygon(
    46% 3%,
    60% 3%,
    100% 96%,
    75% 96%,
    51% 43%,
    26% 96%,
    0 96%
  );
}

.brand-mark::after {
  position: absolute;
  bottom: 5px;
  left: 17px;
  width: 11px;
  height: 12px;
  content: '';
  background: rgb(255 255 255 / 88%);
  clip-path: polygon(50% 0, 100% 100%, 0 100%);
}

.site-nav {
  gap: clamp(18px, 3vw, 42px);
  justify-content: center;
}

.site-nav a {
  position: relative;
  font-size: 15px;
  font-weight: 800;
  color: #334155;
  text-decoration: none;
}

.site-nav a.active,
.site-nav a:hover {
  color: var(--home-primary);
}

.site-nav a.active::after,
.site-nav a:hover::after {
  position: absolute;
  right: 0;
  bottom: -25px;
  left: 0;
  height: 3px;
  content: '';
  background: var(--home-primary);
  border-radius: 999px;
}

.site-actions {
  gap: 12px;
  align-items: center;
}

.theme-switcher {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  padding: 7px 9px;
  background: rgb(15 23 42 / 4%);
  border-radius: 999px;
}

.theme-switcher button {
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  padding: 0;
  font-size: 13px;
  color: #fff;
  cursor: pointer;
  background: var(--theme-color);
  border: 0;
  border-radius: 50%;
}

.theme-switcher button.active {
  box-shadow:
    0 0 0 3px #fff,
    0 0 0 5px rgb(var(--home-primary-rgb) / 22%);
  animation: theme-pulse 2.4s ease-in-out infinite;
}

.login-link,
.register-link,
.primary-button,
.secondary-button,
.quickstart-section a {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 850;
  text-decoration: none;
  border-radius: 8px;
}

.login-link,
.register-link {
  min-width: 86px;
  height: 42px;
}

.login-link {
  color: #0f172a;
  background: #fff;
  border: 1px solid #cbd5e1;
}

.register-link,
.primary-button,
.quickstart-section a {
  color: #fff;
  background: var(--home-primary);
  border: 1px solid var(--home-primary);
  box-shadow: 0 14px 28px rgb(var(--home-primary-rgb) / 18%);
}

.hero-shell,
.content-section,
.quickstart-section {
  position: relative;
  z-index: 1;
  width: min(1440px, calc(100% - 96px));
  margin: 0 auto;
}

.hero-shell {
  display: grid;
  grid-template-columns: minmax(520px, 1.1fr) minmax(520px, 0.9fr);
  gap: 28px;
  align-items: start;
  padding: 36px 0 38px;
}

.hero-copy {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  min-width: 0;
}

.eyebrow {
  display: inline-flex;
  gap: 9px;
  align-items: center;
  width: fit-content;
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 800;
  color: #475569;
  background: rgb(255 255 255 / 74%);
  border: 1px solid rgb(var(--home-primary-rgb) / 16%);
  border-radius: 999px;
  animation: fade-up 0.58s ease 0.12s both;
}

.eyebrow span {
  width: 8px;
  height: 8px;
  background: #22c55e;
  border-radius: 50%;
}

.hero-copy h1 {
  max-width: 680px;
  margin: 28px 0 14px;
  font-size: 46px;
  font-weight: 950;
  line-height: 1.16;
  color: #0f172a;
  text-wrap: balance;
  animation: fade-up 0.64s ease 0.2s both;
}

.hero-slogan {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  width: fit-content;
  max-width: min(100%, 680px);
  padding: 9px 14px;
  margin: 0 0 16px;
  font-size: 18px;
  font-weight: 850;
  line-height: 1.45;
  color: var(--home-primary);
  background: rgb(var(--home-primary-rgb) / 8%);
  border: 1px solid rgb(var(--home-primary-rgb) / 14%);
  border-radius: 12px;
  box-shadow: 0 14px 30px rgb(var(--home-primary-rgb) / 8%);
  animation: fade-up 0.64s ease 0.24s both;
}

.hero-slogan svg {
  flex: 0 0 auto;
  margin-top: 1px;
  font-size: 18px;
}

.hero-slogan span {
  min-width: 0;
  overflow-wrap: anywhere;
}

.hero-copy p {
  max-width: 650px;
  margin: 0;
  font-size: 16px;
  font-weight: 650;
  line-height: 1.8;
  color: #475569;
  animation: fade-up 0.64s ease 0.28s both;
}

.hero-actions {
  gap: 12px;
  margin-top: 30px;
  animation: fade-up 0.64s ease 0.36s both;
}

.primary-button,
.secondary-button {
  min-width: 140px;
  height: 46px;
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.primary-button:hover,
.secondary-button:hover,
.login-link:hover,
.register-link:hover,
.quickstart-section a:hover {
  box-shadow: 0 16px 30px rgb(var(--home-primary-rgb) / 16%);
  transform: translateY(-2px);
}

.secondary-button {
  color: #0f172a;
  background: #fff;
  border: 1px solid #cbd5e1;
}

.card-head p,
.strip-head span,
.section-head span,
.section-head p {
  color: #64748b;
}

.hot-strip {
  max-width: 760px;
  padding: 16px;
  margin-top: 18px;
  background: rgb(255 255 255 / 82%);
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  animation: fade-up 0.64s ease 0.44s both;
}

.strip-head {
  justify-content: space-between;
  margin-bottom: 12px;
}

.strip-head span {
  font-size: 13px;
  font-weight: 850;
}

.strip-head a {
  font-size: 13px;
  font-weight: 850;
  color: #0f172a;
  text-decoration: none;
}

.hot-tags,
.api-tags,
.feature-card div div {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.hot-tags a,
.api-tags span,
.feature-card em {
  padding: 7px 10px;
  font-size: 12px;
  font-weight: 800;
  color: #334155;
  text-decoration: none;
  background: #f1f5f9;
  border-radius: 7px;
  transition:
    background 0.2s ease,
    color 0.2s ease,
    transform 0.2s ease;
}

.hot-tags a:hover {
  color: var(--home-primary);
  background: var(--home-soft);
  transform: translateY(-2px);
}

.hot-tags small {
  margin-left: 5px;
  font-weight: 900;
  color: var(--home-primary);
}

.hot-strip p {
  margin: 0;
  font-size: 13px;
  font-weight: 750;
  color: #64748b;
}

.hero-panel {
  display: grid;
  gap: 16px;
  align-content: start;
  transform: translateY(var(--trend-sink, 0));
  will-change: transform;
}

.trend-card,
.api-card,
.auth-rule-card,
.feature-card,
.integration-step-card,
.scenario-grid article,
.empty-card {
  position: relative;
  overflow: hidden;
  background: rgb(255 255 255 / 88%);
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 18px 50px rgb(15 23 42 / 7%);
  transition:
    transform 0.24s ease,
    border-color 0.24s ease,
    box-shadow 0.24s ease;
}

.trend-card::before,
.quickstart-section::before {
  position: absolute;
  inset: 0;
  pointer-events: none;
  content: '';
  background: linear-gradient(
    110deg,
    transparent 0%,
    transparent 34%,
    rgb(var(--home-primary-rgb) / 8%) 48%,
    transparent 62%,
    transparent 100%
  );
  transform: translateX(-110%);
  animation: card-sheen 7s ease-in-out infinite;
}

.api-card:hover,
.auth-rule-card:hover,
.feature-card:hover,
.integration-step-card:hover,
.scenario-grid article:hover,
.trend-card:hover {
  border-color: rgb(var(--home-primary-rgb) / 22%);
  box-shadow: 0 22px 58px rgb(15 23 42 / 10%);
  transform: translateY(-3px);
}

.trend-card {
  padding: 24px;
  animation: fade-up 0.68s ease 0.3s both;
}

.card-head {
  gap: 18px;
  justify-content: space-between;
}

.card-head h2,
.section-head h2,
.quickstart-section h2 {
  margin: 0;
  font-weight: 950;
  color: #0f172a;
}

.card-head h2 {
  font-size: 22px;
}

.card-head p,
.section-head p,
.quickstart-section p {
  margin: 8px 0 0;
  font-size: 14px;
  font-weight: 700;
}

.card-head > span {
  padding: 7px 10px;
  font-size: 12px;
  font-weight: 900;
  color: var(--home-primary);
  background: var(--home-soft);
  border-radius: 7px;
}

.trend-chart {
  height: 280px;
  margin-top: 22px;
}

.content-section {
  padding: 48px 0;
}

.section-head {
  max-width: 720px;
  margin-bottom: 24px;
}

.section-head span,
.quickstart-section span {
  display: block;
  font-size: 12px;
  font-weight: 950;
  color: var(--home-primary);
  letter-spacing: 0.08em;
}

.section-head h2,
.quickstart-section h2 {
  margin-top: 8px;
  font-size: 30px;
}

.integration-step-grid,
.auth-rule-grid {
  display: grid;
  gap: 16px;
}

.integration-step-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.integration-step-card {
  display: grid;
  align-content: start;
  min-height: 208px;
  padding: 24px;
  animation: fade-up 0.58s ease both;
}

.integration-step-card__head {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
}

.integration-step-card b {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  font-size: 15px;
  font-weight: 950;
  color: #fff;
  background: #0f172a;
  border-radius: 10px;
}

.integration-step-card__head span {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  color: var(--home-primary);
  background: var(--home-soft);
  border: 1px solid rgb(var(--home-primary-rgb) / 12%);
  border-radius: 12px;
}

.integration-step-card svg {
  font-size: 30px;
}

.integration-step-card h3,
.auth-rule-card strong {
  margin: 24px 0 8px;
  font-size: 18px;
  font-weight: 950;
  color: #0f172a;
}

.integration-step-card p,
.auth-rule-card p {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.75;
  color: #64748b;
}

.auth-rule-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.auth-rule-card {
  display: grid;
  align-content: start;
  min-height: 174px;
  padding: 22px;
  border-top: 4px solid var(--home-primary);
  animation: fade-up 0.58s ease both;
}

.auth-rule-card--warn {
  border-top-color: #f59e0b;
}

.auth-rule-card > div {
  display: flex;
  gap: 10px;
  align-items: center;
}

.auth-rule-card svg {
  flex: 0 0 auto;
  font-size: 22px;
  color: var(--home-primary);
}

.auth-rule-card--warn svg,
.auth-rule-card--warn strong {
  color: #92400e;
}

.auth-rule-card strong {
  margin: 0;
}

.auth-rule-card p {
  margin-top: 18px;
}

.api-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.api-card {
  display: grid;
  grid-template-columns: 56px minmax(0, 1fr);
  gap: 16px;
  align-content: start;
  height: 240px;
  padding: 20px;
  animation: fade-up 0.58s ease both;
}

.api-card:nth-child(2),
.auth-rule-card:nth-child(2),
.feature-card:nth-child(2),
.integration-step-card:nth-child(2),
.scenario-grid article:nth-child(2) {
  animation-delay: 0.08s;
}

.api-card:nth-child(3),
.auth-rule-card:nth-child(3),
.feature-card:nth-child(3),
.integration-step-card:nth-child(3),
.scenario-grid article:nth-child(3) {
  animation-delay: 0.16s;
}

.api-card:nth-child(4),
.auth-rule-card:nth-child(4),
.feature-card:nth-child(4),
.integration-step-card:nth-child(4),
.scenario-grid article:nth-child(4) {
  animation-delay: 0.24s;
}

.api-icon {
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  font-size: 28px;
  color: var(--home-primary);
  background: var(--home-soft);
  border-radius: 12px;
  transition: transform 0.24s ease;
}

.api-card:hover .api-icon,
.feature-card:hover > span {
  transform: scale(1.06) rotate(-2deg);
}

.api-icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 12px;
}

.api-card h3,
.feature-card h3,
.scenario-grid h3,
.system-flow-item h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 950;
  color: #0f172a;
}

.api-card h3 {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.api-card > div:not(.api-tags) {
  min-width: 0;
}

.api-card p,
.feature-card p,
.scenario-grid p,
.system-flow-item p {
  margin: 8px 0 0;
  font-size: 14px;
  font-weight: 650;
  line-height: 1.7;
  color: #64748b;
}

.api-card p {
  display: -webkit-box;
  height: 48px;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow-wrap: anywhere;
}

.api-tags,
.api-card a {
  grid-column: 1 / -1;
}

.api-tags {
  align-items: flex-start;
}

.api-tags span {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  height: 40px;
  line-height: 1.2;
  white-space: nowrap;
}

.api-card a {
  gap: 7px;
  width: fit-content;
  font-size: 14px;
  font-weight: 950;
  color: #0f172a;
  text-decoration: none;
}

.empty-card {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: center;
  min-height: 150px;
  font-size: 15px;
  font-weight: 800;
  color: #64748b;
}

.system-flow-section {
  padding-top: 54px;
}

.system-flow-list {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px;
}

.system-flow-item {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 22px;
  min-height: 218px;
  padding: 24px;
  overflow: hidden;
  background:
    linear-gradient(180deg, rgb(255 255 255 / 96%), rgb(248 250 252 / 90%)),
    radial-gradient(
      circle at 88% 14%,
      rgb(var(--home-primary-rgb) / 11%),
      transparent 30%
    );
  border: 1px solid rgb(var(--home-primary-rgb) / 14%);
  border-radius: 12px;
  box-shadow: 0 18px 42px rgb(15 23 42 / 6%);
  transition:
    border-color 0.24s ease,
    box-shadow 0.24s ease,
    transform 0.24s ease;
  animation: fade-up 0.58s ease both;
}

.system-flow-item:hover {
  border-color: rgb(var(--home-primary-rgb) / 24%);
  box-shadow: 0 22px 52px rgb(15 23 42 / 9%);
  transform: translateY(-3px);
}

.system-flow-item__head {
  display: flex;
  gap: 14px;
  align-items: center;
  justify-content: space-between;
}

.system-flow-item__meta {
  display: inline-flex;
  gap: 10px;
  align-items: center;
  min-width: 0;
}

.system-flow-item b {
  flex: 0 0 auto;
  padding: 6px 8px;
  font-size: 13px;
  font-weight: 950;
  line-height: 1;
  color: var(--home-primary);
  background: var(--home-soft);
  border: 1px solid rgb(var(--home-primary-rgb) / 10%);
  border-radius: 8px;
}

.system-flow-item__icon {
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  width: 44px;
  height: 44px;
  font-size: 22px;
  color: var(--home-primary);
  background: linear-gradient(145deg, #fff, var(--home-soft));
  border: 1px solid rgb(var(--home-primary-rgb) / 12%);
  border-radius: 11px;
  box-shadow: 0 12px 24px rgb(var(--home-primary-rgb) / 8%);
}

.system-flow-item em {
  display: inline-flex;
  width: fit-content;
  min-width: 0;
  padding: 5px 9px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
  font-style: normal;
  font-weight: 900;
  color: var(--home-primary);
  white-space: nowrap;
  background: rgb(var(--home-primary-rgb) / 7%);
  border: 1px solid rgb(var(--home-primary-rgb) / 10%);
  border-radius: 7px;
}

.system-flow-item__body {
  min-width: 0;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.feature-card {
  display: grid;
  grid-template-columns: 76px minmax(0, 1fr);
  gap: 20px;
  min-height: 184px;
  padding: 28px;
  background:
    radial-gradient(
      circle at 94% 16%,
      rgb(var(--home-primary-rgb) / 10%),
      transparent 28%
    ),
    linear-gradient(135deg, rgb(255 255 255 / 96%), rgb(248 250 252 / 88%));
  border-color: rgb(var(--home-primary-rgb) / 16%);
  animation: fade-up 0.58s ease both;
}

.feature-card::after {
  position: absolute;
  inset: auto 24px 0;
  height: 3px;
  content: '';
  background: linear-gradient(90deg, var(--home-primary), transparent);
  border-radius: 999px 999px 0 0;
  opacity: 0.42;
}

.feature-card > span {
  position: relative;
  z-index: 1;
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  font-size: 30px;
  color: var(--home-primary);
  background: linear-gradient(145deg, #fff, var(--home-soft)), var(--home-soft);
  border: 1px solid rgb(var(--home-primary-rgb) / 18%);
  border-radius: 16px;
  box-shadow: 0 14px 30px rgb(var(--home-primary-rgb) / 10%);
  transition:
    box-shadow 0.24s ease,
    transform 0.24s ease;
}

.feature-card > div {
  position: relative;
  z-index: 1;
}

.feature-card div div {
  margin-top: 16px;
}

.feature-card em {
  font-style: normal;
  color: var(--home-primary);
  background: rgb(var(--home-primary-rgb) / 7%);
  border: 1px solid rgb(var(--home-primary-rgb) / 10%);
}

.scenario-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px;
}

.scenario-grid article {
  position: relative;
  min-height: 230px;
  padding: 26px;
  background:
    radial-gradient(
      circle at 88% 18%,
      rgb(var(--home-primary-rgb) / 12%),
      transparent 24%
    ),
    linear-gradient(180deg, #fff 0%, rgb(248 250 252 / 92%) 100%);
  border-color: rgb(var(--home-primary-rgb) / 14%);
  animation: fade-up 0.58s ease both;
}

.scenario-grid article::after {
  position: absolute;
  right: 22px;
  bottom: 20px;
  left: 22px;
  height: 1px;
  content: '';
  background: linear-gradient(
    90deg,
    transparent,
    rgb(var(--home-primary-rgb) / 22%),
    transparent
  );
}

.scenario-grid b {
  font-size: 46px;
  font-weight: 950;
  line-height: 1;
  color: rgb(var(--home-primary-rgb) / 16%);
  transition: color 0.24s ease;
}

.scenario-grid svg {
  position: absolute;
  top: 24px;
  right: 24px;
  display: grid;
  width: 42px;
  height: 42px;
  padding: 9px;
  font-size: 24px;
  color: var(--home-primary);
  background: var(--home-soft);
  border: 1px solid rgb(var(--home-primary-rgb) / 12%);
  border-radius: 14px;
  box-shadow: 0 12px 26px rgb(var(--home-primary-rgb) / 9%);
  transition:
    box-shadow 0.24s ease,
    transform 0.24s ease;
}

.scenario-grid h3 {
  margin-top: 58px;
}

.scenario-grid article:hover b {
  color: rgb(var(--home-primary-rgb) / 28%);
}

.scenario-grid article:hover svg {
  box-shadow: 0 16px 32px rgb(var(--home-primary-rgb) / 14%);
  transform: translateY(-3px) rotate(-4deg);
}

.quickstart-section {
  gap: 24px;
  justify-content: space-between;
  padding: 30px 34px;
  margin-top: 30px;
  margin-bottom: 56px;
  overflow: hidden;
  color: #fff;
  background: linear-gradient(
    135deg,
    #0f172a,
    var(--home-primary) 58%,
    #0f766e
  );
  border: 1px solid var(--home-primary);
  border-radius: 16px;
  animation: fade-up 0.6s ease both;
}

.quickstart-section h2 {
  color: #fff;
}

.quickstart-section span {
  color: rgb(255 255 255 / 74%);
}

.quickstart-section p {
  color: rgb(255 255 255 / 76%);
}

.quickstart-section a {
  flex: 0 0 auto;
  height: 44px;
  padding: 0 22px;
  color: var(--home-primary);
  background: #fff;
}

@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(16px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes grid-drift {
  from {
    background-position:
      0 0,
      0 0;
  }

  to {
    background-position:
      96px 0,
      0 72px;
  }
}

@keyframes card-sheen {
  0%,
  42% {
    transform: translateX(-110%);
  }

  64%,
  100% {
    transform: translateX(110%);
  }
}

@keyframes notice-icon-pulse {
  0%,
  100% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.12);
  }
}

@keyframes theme-pulse {
  0%,
  100% {
    box-shadow:
      0 0 0 3px #fff,
      0 0 0 5px rgb(var(--home-primary-rgb) / 22%);
  }

  50% {
    box-shadow:
      0 0 0 3px #fff,
      0 0 0 7px rgb(var(--home-primary-rgb) / 12%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .home-page *,
  .home-page::before,
  .quickstart-section::before {
    scroll-behavior: auto !important;
    transition-duration: 0.001ms !important;
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
  }
}

@media (max-width: 1280px) {
  .site-header {
    grid-template-columns: 220px 1fr auto;
  }

  .hero-shell {
    grid-template-columns: 1fr;
  }

  .hero-panel {
    align-content: stretch;
  }
}

@media (max-width: 960px) {
  .site-header {
    grid-template-columns: 1fr auto;
    height: auto;
    padding: 16px 20px;
  }

  .site-nav {
    display: none;
  }

  .hero-shell,
  .notice-wrap,
  .content-section,
  .quickstart-section {
    width: min(100% - 28px, 760px);
  }

  .hero-shell {
    min-height: auto;
    padding: 26px 0 28px;
  }

  .hero-copy h1 {
    font-size: 34px;
  }

  .hero-slogan {
    font-size: 16px;
  }

  .hero-actions,
  .quickstart-section {
    flex-direction: column;
    align-items: stretch;
  }

  .primary-button,
  .secondary-button {
    width: 100%;
  }

  .api-grid,
  .auth-rule-grid,
  .feature-grid,
  .integration-step-grid,
  .scenario-grid,
  .system-flow-list {
    grid-template-columns: 1fr;
  }

  .auth-rule-grid,
  .integration-step-grid,
  .system-flow-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .trend-card {
    padding: 20px;
  }

  .trend-chart {
    height: 260px !important;
  }
}

@media (max-width: 720px) {
  .hero-shell,
  .notice-wrap,
  .content-section,
  .quickstart-section {
    width: min(100% - 24px, 760px);
  }

  .hero-shell {
    gap: 22px;
    padding: 20px 0 24px;
  }

  .eyebrow {
    padding: 7px 12px;
    font-size: 12px;
  }

  .hero-copy h1 {
    margin: 22px 0 14px;
    font-size: 30px;
    line-height: 1.16;
  }

  .hero-slogan {
    padding: 8px 12px;
    margin-bottom: 14px;
    font-size: 15px;
    border-radius: 10px;
  }

  .hero-copy p {
    font-size: 15px;
    line-height: 1.72;
  }

  .hero-actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    margin-top: 22px;
  }

  .primary-button,
  .secondary-button {
    width: auto;
  }

  .hot-strip {
    padding: 14px;
    margin-top: 16px;
  }

  .trend-card {
    padding: 18px;
  }

  .card-head h2 {
    font-size: 20px;
  }

  .trend-chart {
    height: 232px !important;
    margin-top: 18px;
  }

  .content-section {
    padding: 36px 0;
  }
}

@media (max-width: 560px) {
  .brand {
    font-size: 18px;
  }

  .brand-mark {
    width: 36px;
    height: 34px;
  }

  .brand-mark::after {
    bottom: 4px;
    left: 13px;
    width: 10px;
    height: 11px;
  }

  .login-link {
    min-width: 68px;
  }

  .register-link {
    display: none;
  }

  .theme-switcher {
    gap: 6px;
    padding: 6px 7px;
  }

  .theme-switcher button {
    width: 18px;
    height: 18px;
  }

  .hero-copy h1 {
    font-size: 26px;
  }

  .hero-slogan {
    display: flex;
    width: 100%;
    font-size: 14px;
  }

  .hero-copy p {
    font-size: 14px;
  }

  .trend-chart {
    height: 216px !important;
  }

  .api-card,
  .auth-rule-card,
  .feature-card,
  .integration-step-card,
  .scenario-grid article,
  .system-flow-item {
    padding: 18px;
  }

  .auth-rule-grid,
  .integration-step-grid,
  .system-flow-list {
    grid-template-columns: 1fr;
  }
}
</style>
