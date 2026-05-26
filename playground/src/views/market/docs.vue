<script lang="ts" setup>
import type { MarketApi } from '#/api/market';

import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { IconifyIcon } from '@vben/icons';
import { useAccessStore } from '@vben/stores';

import { getMarketApiDetail, getMarketApiTestKey } from '#/api/market';
import PublicSiteHeader from '#/components/public-site-header.vue';
import { usePublicSiteTheme } from '#/composables/use-public-site-theme';

const MARKET_PATH = '/apilist';
const DOC_NAV_ITEMS = [
  { icon: 'lucide:info', id: 'api-info', label: '基础信息' },
  { icon: 'lucide:coins', id: 'pricing', label: '计费标准' },
  { icon: 'lucide:lock-keyhole', id: 'config', label: '安全认证' },
  { icon: 'lucide:hash', id: 'params', label: '参数文档' },
  { icon: 'lucide:badge-check', id: 'status-code', label: '状态码' },
  { icon: 'lucide:zap', id: 'online-test', label: '在线测试' },
  { icon: 'lucide:code-2', id: 'examples', label: '示例代码' },
] as const;

type DocSectionId = (typeof DOC_NAV_ITEMS)[number]['id'];
type ExampleLanguage =
  | 'c'
  | 'cpp'
  | 'csharp'
  | 'go'
  | 'java'
  | 'javascript'
  | 'node'
  | 'php'
  | 'python'
  | 'yiyu';

const EXAMPLE_LANGUAGES: Array<{ key: ExampleLanguage; label: string }> = [
  { key: 'php', label: 'PHP' },
  { key: 'javascript', label: 'JavaScript' },
  { key: 'node', label: 'NodeJs' },
  { key: 'python', label: 'Python' },
  { key: 'go', label: 'Go' },
  { key: 'java', label: 'Java' },
  { key: 'csharp', label: 'C#' },
  { key: 'c', label: 'C' },
  { key: 'cpp', label: 'C++' },
  { key: 'yiyu', label: '易语言' },
];
const DEFAULT_EXAMPLE_LANGUAGE = EXAMPLE_LANGUAGES[0]!;
const API_KEY_PLACEHOLDER = '你的密钥KEY';

const route = useRoute();
const accessStore = useAccessStore();
const { siteThemeVars } = usePublicSiteTheme();

const detail = ref<MarketApi.ApiDetail | null>(null);
const loading = ref(false);
const errorMessage = ref('');
const copiedKey = ref('');
const testing = ref(false);
const testMethod = ref<'GET' | 'POST'>('GET');
const testKey = ref('');
const testKeyLoading = ref(false);
const testKeyMessage = ref('');
const testResult = ref('');
const testError = ref('');
const testStatus = ref<number | null>(null);
const testElapsedMs = ref<number | null>(null);
const activeDocSection = ref<DocSectionId>('api-info');
const mobileDocNavOpen = ref(false);
const docsToolbarRef = ref<HTMLElement | null>(null);
const docsToolbarStuck = ref(false);
const activeExampleLanguage = ref<ExampleLanguage>('php');
const responseFieldsExpanded = ref(true);
const expandedResponseFieldNodes = ref<Set<string>>(new Set());
const testParams = reactive<Record<string, string>>({});
let scrollSpyFrame = 0;

const pageTitle = computed(() => detail.value?.name || '接口文档');
const gatewayPath = computed(() => String(detail.value?.gatewayPath || '').trim());
const apiEndpoint = computed(() => withCurrentOrigin(gatewayPath.value));
const isSignedIn = computed(() => Boolean(accessStore.accessToken));
const hasUsableTestKey = computed(() => Boolean(testKey.value.trim()));
const testKeyPlaceholder = computed(() => {
  if (testKeyLoading.value) return '正在读取当前账号可用密钥';
  if (!isSignedIn.value) return '请登录并创建密钥';
  return testKeyMessage.value || '请先创建全站接口密钥或当前接口专属密钥';
});
const availableMethods = computed<Array<'GET' | 'POST'>>(() => {
  if (detail.value?.requestMethod === 'GET_POST') return ['GET', 'POST'];
  return detail.value?.requestMethod === 'POST' ? ['POST'] : ['GET'];
});
const preferredMethod = computed<'GET' | 'POST'>(() => {
  const method = detail.value?.preferredMethod;
  return method === 'POST' && availableMethods.value.includes('POST') ? 'POST' : availableMethods.value[0] ?? 'GET';
});
const activeExampleLanguageItem = computed(
  () => EXAMPLE_LANGUAGES.find((item) => item.key === activeExampleLanguage.value) ?? DEFAULT_EXAMPLE_LANGUAGE,
);
const businessParams = computed<MarketApi.ApiParameter[]>(() => {
  const params = new Map<string, MarketApi.ApiParameter>();
  for (const item of detail.value?.parameters ?? []) {
    if (item.location === 'Query' && item.name !== 'key' && item.name !== 'body') {
      params.set(item.name, item);
    }
  }
  for (const name of detail.value?.templateParameters ?? []) {
    if (!params.has(name)) {
      params.set(name, {
        description: `接口地址里的 {${name}} 占位符参数`,
        location: 'Query',
        name,
        required: true,
        type: 'string',
      });
    }
  }
  return [...params.values()];
});
const weekTotal = computed(() =>
  (detail.value?.callTrend7d ?? []).reduce((sum, item) => sum + Number(item.value || 0), 0),
);
const weekAverage = computed(() =>
  detail.value?.callTrend7d?.length ? Math.round(weekTotal.value / detail.value.callTrend7d.length) : 0,
);
const maxTrendValue = computed(() =>
  Math.max(1, ...(detail.value?.callTrend7d ?? []).map((item) => Number(item.value || 0))),
);
const apiTypeLabel = computed(() => {
  if (!detail.value) return '公开接口';
  if (Number(detail.value.pointPrice || 0) > 0) return '点数计费接口';
  if (Number(detail.value.price || 0) <= 0) return '免费接口';
  return '余额计费接口';
});
const moneyPriceText = computed(() => `${formatAmount(detail.value?.price)} 元/次`);
const pointPriceText = computed(() => `${formatAmount(detail.value?.pointPrice)} 点/次`);
const primaryPriceText = computed(() => {
  if (!detail.value) return '0 点/次';
  if (Number(detail.value.pointPrice || 0) > 0) return pointPriceText.value;
  if (Number(detail.value.price || 0) <= 0) return '免费';
  return moneyPriceText.value;
});
const hasPointPrice = computed(() => Number(detail.value?.pointPrice || 0) > 0);
const hasMoneyPrice = computed(() => Number(detail.value?.price || 0) > 0);
const hasPaidPrice = computed(() => hasPointPrice.value || hasMoneyPrice.value);
const pricingLabelText = computed(() => {
  const label = String(detail.value?.pricing?.label || '').trim();
  if (!label) return '';
  const duplicateLabels = new Set([primaryPriceText.value, pointPriceText.value, moneyPriceText.value]);
  return duplicateLabels.has(label) ? '' : label;
});
const methodLabel = computed(() => availableMethods.value.join('/'));
const deductionSteps = ['会员', '接口会员', '点数', '余额'];
const summaryCards = computed(() => [
  {
    desc: '由接口价格配置自动判断',
    icon: 'lucide:shield-check',
    label: '接口类型',
    value: apiTypeLabel.value,
  },
  {
    desc: '调用时请按推荐方式优先接入',
    icon: 'lucide:send',
    label: '请求方式',
    value: methodLabel.value || 'GET',
  },
  {
    desc: '响应体由平台网关透传',
    icon: 'lucide:file-json-2',
    label: '返回方式',
    value: detail.value?.responseType || 'JSON',
  },
]);
const limitCards = computed(() => [
  {
    desc: '触发频率限制时会返回 429，请降低并发或稍后重试。',
    label: '调用频率',
    value: '按密钥限流',
  },
  {
    desc: '可用次数受套餐、余额、点数和密钥状态共同影响。',
    label: '可用额度',
    value: '按账号配置',
  },
  {
    desc: '平台只展示公开说明，不暴露第三方地址、密钥和内部参数模板。',
    label: '安全边界',
    value: '公开脱敏',
  },
]);
const billingRules = computed(() => {
  if (!detail.value) return [];
  if (Number(detail.value.pointPrice || 0) > 0) {
    return ['命中会员或接口会员权益时，本次调用免费。', '未命中会员权益时，调用成功后按后台配置扣除点数。', '点数不足时继续校验余额，余额也不足或密钥无权限则拒绝调用。'];
  }
  if (Number(detail.value.price || 0) <= 0) {
    return ['接口本身为免费接口，仍需要有效接口密钥才能在线测试和正式调用。', '实际可调用次数受账号、套餐和系统限流配置影响。'];
  }
  return ['调用成功后按后台配置扣除余额。', '余额不足或密钥无权限时，平台会拒绝本次调用。'];
});
const authGuideCards = [
  {
    desc: '使用账号密码进入控制台，密钥只在登录状态下创建和管理。',
    title: '登录账户',
  },
  {
    desc: '优先创建全站接口密钥，也可以为当前接口单独创建专属密钥。',
    title: '创建密钥',
  },
  {
    desc: '调用公开网关时在 Query 中携带 key，在线测试会自动选择可用密钥。',
    title: '携带 key',
  },
  {
    desc: '发现密钥泄露请立即停用或重新生成，避免额度被异常消耗。',
    title: '保管密钥',
    warn: true,
  },
];
const authSecretCards = computed(() => [
  {
    desc: detail.value?.auth.description || '接口密钥请登录控制台生成，公开文档不会返回任何密钥内容',
    name: `${detail.value?.auth.location || 'Query'} / ${detail.value?.auth.name || 'key'}`,
    title: detail.value?.auth.type || 'API Key',
  },
  {
    desc: '全站接口密钥优先级最高；没有全站密钥时，系统会尝试使用当前接口专属密钥。',
    name: '全站密钥 / 接口密钥',
    title: '密钥优先级',
  },
]);
const visibleResponseFields = computed(() => detail.value?.responseFields ?? []);
const visibleParameters = computed(() =>
  (detail.value?.parameters ?? []).filter((item) => !['body', 'key'].includes(item.name)),
);
const responseFieldRows = computed(() => {
  const rows = visibleResponseFields.value.map((item) => {
    const rawName = String(item.name || '').trim();
    const parts = rawName.split('.').filter(Boolean);
    return {
      ...item,
      depth: Math.max(0, parts.length - 1),
      displayName: parts[parts.length - 1] || rawName,
      parts,
      rawName,
    };
  });
  const paths = new Set(rows.map((item) => item.rawName).filter(Boolean));
  return rows
    .map((item) => ({
      ...item,
      hasChildren: rows.some((child) => child.rawName.startsWith(`${item.rawName}.`)),
    }))
    .filter((item) => {
      if (item.depth === 0) return true;
      for (let index = 1; index < item.parts.length; index += 1) {
        const ancestor = item.parts.slice(0, index).join('.');
        if (paths.has(ancestor) && !expandedResponseFieldNodes.value.has(ancestor)) {
          return false;
        }
      }
      return true;
    });
});
const responseExample = computed(() => {
  const value = String(detail.value?.responseExample || '').trim();
  if (!value) return '';
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
});
const apiRequestTemplate = computed(() => {
  const template = String(detail.value?.gatewayUrlTemplate || '').trim();
  if (template) return withCurrentOrigin(template);
  if (!apiEndpoint.value) return '';
  const query = [
    'key={用户创建的key}',
    ...businessParams.value.map((item) => `${encodeURIComponent(item.name)}={${item.name}}`),
  ];
  return `${apiEndpoint.value}?${query.join('&')}`;
});
const exampleUrl = computed(() => buildReadableUrl(API_KEY_PLACEHOLDER, true));
const activeExampleCode = computed(() => codeSample(activeExampleLanguage.value));
const highlightedExampleLines = computed(() =>
  highlightCode(activeExampleCode.value, activeExampleLanguage.value),
);
const testResultMeta = computed(() => {
  if (testing.value) return '请求中';
  if (testStatus.value !== null && testElapsedMs.value !== null) {
    return `HTTP ${testStatus.value} · ${testElapsedMs.value}ms`;
  }
  return '--';
});
const hasTestOutput = computed(() =>
  testing.value || Boolean(testResult.value || testError.value) || testStatus.value !== null,
);

watch(
  () => route.params.id,
  () => {
    void loadDetail();
  },
  { immediate: true },
);

watch(detail, () => {
  responseFieldsExpanded.value = true;
  expandedResponseFieldNodes.value = new Set();
  testMethod.value = preferredMethod.value;
  for (const key of Object.keys(testParams)) {
    delete testParams[key];
  }
  for (const item of businessParams.value) {
    testParams[item.name] = paramExampleValue(item);
  }
  void loadTestKey();
  void nextTick(() => {
    requestActiveSectionUpdate();
  });
});

watch(
  () => accessStore.accessToken,
  () => {
    void loadTestKey();
  },
);

onMounted(() => {
  window.addEventListener('scroll', requestActiveSectionUpdate, { passive: true });
  window.addEventListener('resize', requestActiveSectionUpdate);
  window.addEventListener('resize', closeMobileDocNavOnDesktop);
  clearLocationHash();
  requestActiveSectionUpdate();
});

onBeforeUnmount(() => {
  window.removeEventListener('scroll', requestActiveSectionUpdate);
  window.removeEventListener('resize', requestActiveSectionUpdate);
  window.removeEventListener('resize', closeMobileDocNavOnDesktop);
  if (scrollSpyFrame) {
    window.cancelAnimationFrame(scrollSpyFrame);
    scrollSpyFrame = 0;
  }
});

function closeMobileDocNavOnDesktop() {
  if (window.innerWidth > 680) {
    mobileDocNavOpen.value = false;
  }
}

function clearLocationHash() {
  if (typeof window === 'undefined' || !window.location.hash) return;
  window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
}

function updateDocsToolbarState() {
  if (typeof window === 'undefined') return;
  const toolbar = docsToolbarRef.value;
  if (!toolbar || window.innerWidth > 680) {
    docsToolbarStuck.value = false;
    return;
  }

  docsToolbarStuck.value = toolbar.getBoundingClientRect().top <= 71;
}

function requestActiveSectionUpdate() {
  if (typeof window === 'undefined' || scrollSpyFrame) return;
  scrollSpyFrame = window.requestAnimationFrame(() => {
    scrollSpyFrame = 0;
    updateActiveSection();
    updateDocsToolbarState();
  });
}

function updateActiveSection() {
  if (typeof window === 'undefined') return;
  const sections = DOC_NAV_ITEMS.map((item) => document.getElementById(item.id)).filter(
    (item): item is HTMLElement => Boolean(item),
  );
  const firstSection = sections[0];
  if (!firstSection) return;

  const activeLine = Math.min(260, Math.max(132, window.innerHeight * 0.32));
  let current = firstSection.id as DocSectionId;
  for (const section of sections) {
    if (section.getBoundingClientRect().top <= activeLine) {
      current = section.id as DocSectionId;
    } else {
      break;
    }
  }

  const documentElement = document.documentElement;
  const isNearBottom = window.innerHeight + window.scrollY >= documentElement.scrollHeight - 8;
  const lastSection = sections[sections.length - 1];
  activeDocSection.value = isNearBottom && lastSection ? (lastSection.id as DocSectionId) : current;
}

function scrollToDocSection(id: DocSectionId) {
  activeDocSection.value = id;
  clearLocationHash();
  const target = document.getElementById(id);
  if (!target) return;
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  mobileDocNavOpen.value = false;
}

async function loadDetail() {
  const id = Array.isArray(route.params.id) ? route.params.id[0] : route.params.id;
  if (!id) {
    errorMessage.value = '接口编号不存在';
    detail.value = null;
    return;
  }
  loading.value = true;
  errorMessage.value = '';
  try {
    detail.value = await getMarketApiDetail(id);
  } catch {
    detail.value = null;
    errorMessage.value = '接口文档加载失败，接口可能已下线或不存在';
  } finally {
    loading.value = false;
  }
}

async function loadTestKey() {
  testKey.value = '';
  testKeyMessage.value = '';
  if (!detail.value) {
    return;
  }
  if (!isSignedIn.value) {
    testKeyMessage.value = '请登录并创建密钥';
    return;
  }

  testKeyLoading.value = true;
  try {
    const result = await getMarketApiTestKey(detail.value.id);
    testKey.value = result.hasKey ? result.secretKey : '';
    testKeyMessage.value = result.message || (result.hasKey ? '' : '请先创建全站接口密钥或当前接口专属密钥');
  } catch {
    testKey.value = '';
    testKeyMessage.value = '请登录并创建密钥';
  } finally {
    testKeyLoading.value = false;
  }
}

function compactNumber(value: number | string | undefined) {
  const number = Number(value || 0);
  if (number >= 10_000) return `${(number / 10_000).toFixed(number >= 100_000 ? 0 : 1)}w`;
  if (number >= 1000) return `${(number / 1000).toFixed(number >= 10_000 ? 0 : 1)}k`;
  return String(number);
}

function trendHeight(value: number | string) {
  return `${Math.max(8, Math.round((Number(value || 0) / maxTrendValue.value) * 92))}%`;
}

function priceClass() {
  if (!detail.value) return 'free';
  if (Number(detail.value.pointPrice || 0) > 0) return 'point';
  return Number(detail.value.price || 0) <= 0 ? 'free' : 'paid';
}

function formatAmount(value: number | string | undefined) {
  const number = Number(value || 0);
  if (!Number.isFinite(number)) return '0';
  return number.toFixed(4).replace(/\.?0+$/, '');
}

function toggleResponseFields() {
  responseFieldsExpanded.value = !responseFieldsExpanded.value;
}

function isResponseFieldNodeExpanded(rawName: string) {
  return expandedResponseFieldNodes.value.has(rawName);
}

function toggleResponseFieldNode(rawName: string) {
  const next = new Set(expandedResponseFieldNodes.value);
  if (next.has(rawName)) {
    next.delete(rawName);
  } else {
    next.add(rawName);
  }
  expandedResponseFieldNodes.value = next;
}

function hasField(item: MarketApi.ApiParameter, key: keyof MarketApi.ApiParameter) {
  return Object.prototype.hasOwnProperty.call(item, key);
}

function paramExampleValue(item: MarketApi.ApiParameter) {
  return String(item.exampleValue ?? '').trim();
}

function codeSampleValue(item: MarketApi.ApiParameter) {
  const exampleValue = paramExampleValue(item);
  if (exampleValue) return exampleValue;
  const name = item.name.toLowerCase();
  if (name.includes('url') || name.includes('link')) return `{${item.name}}`;
  if (name.includes('phone') || name.includes('mobile')) return '13800138000';
  if (name.includes('id')) return 'demo_id';
  return `{${item.name}}`;
}

function paramPlaceholder(item: MarketApi.ApiParameter) {
  const placeholder = String(item.placeholder ?? '').trim();
  if (placeholder || hasField(item, 'placeholder')) {
    return placeholder;
  }
  return item.description || `请输入 ${item.name}`;
}

function withCurrentOrigin(pathOrUrl: string) {
  if (!pathOrUrl) return '';
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const normalizedPath = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  if (typeof window === 'undefined') return normalizedPath;
  return `${window.location.origin}${normalizedPath}`;
}

function buildUrl(key: string, useSampleValue = false) {
  if (!apiEndpoint.value) return '';
  const params = new URLSearchParams();
  params.set('key', key);
  for (const item of businessParams.value) {
    const value = useSampleValue ? codeSampleValue(item) : String(testParams[item.name] || '').trim();
    if (value) params.set(item.name, value);
  }
  const query = params.toString();
  return query ? `${apiEndpoint.value}?${query}` : apiEndpoint.value;
}

function readableQueryValue(value: string) {
  return value
    .replaceAll('%', '%25')
    .replaceAll('&', '%26')
    .replaceAll('#', '%23')
    .replaceAll(' ', '%20');
}

function buildReadableUrl(key: string, useSampleValue = false) {
  if (!apiEndpoint.value) return '';
  const params: Array<[string, string]> = [['key', key]];
  for (const item of businessParams.value) {
    const value = useSampleValue ? codeSampleValue(item) : String(testParams[item.name] || '').trim();
    if (value) params.push([item.name, value]);
  }
  const query = params
    .map(([name, value]) => `${encodeURIComponent(name)}=${readableQueryValue(value)}`)
    .join('&');
  return query ? `${apiEndpoint.value}?${query}` : apiEndpoint.value;
}

function quoteJsKey(key: string) {
  return /^[A-Za-z_$][\w$]*$/.test(key) ? key : JSON.stringify(key);
}

function phpQuote(value: string) {
  return value.replaceAll('\\', '\\\\').replaceAll("'", "\\'");
}

function jsParamLines() {
  const lines = ['  key: API_KEY'];
  for (const item of businessParams.value) {
    lines.push(`  ${quoteJsKey(item.name)}: ${JSON.stringify(codeSampleValue(item))}`);
  }
  return lines.join(',\n');
}

function pythonParamLines() {
  const lines = ['    "key": API_KEY'];
  for (const item of businessParams.value) {
    lines.push(`    ${JSON.stringify(item.name)}: ${JSON.stringify(codeSampleValue(item))}`);
  }
  return lines.join(',\n');
}

function phpParamLines() {
  const lines = [`    'key' => $apiKey`];
  for (const item of businessParams.value) {
    lines.push(`    '${phpQuote(item.name)}' => '${phpQuote(codeSampleValue(item))}'`);
  }
  return lines.join(",\n");
}

function javaParamLines() {
  const lines = [`params.put("key", apiKey);`];
  for (const item of businessParams.value) {
    lines.push(`params.put(${JSON.stringify(item.name)}, ${JSON.stringify(codeSampleValue(item))});`);
  }
  return lines.map((line) => `        ${line}`).join('\n');
}

function goParamLines() {
  const lines = [`params.Set("key", apiKey)`];
  for (const item of businessParams.value) {
    lines.push(`params.Set(${JSON.stringify(item.name)}, ${JSON.stringify(codeSampleValue(item))})`);
  }
  return lines.map((line) => `\t${line}`).join('\n');
}

function csharpParamLines() {
  const lines = [`["key"] = apiKey`];
  for (const item of businessParams.value) {
    lines.push(`[${JSON.stringify(item.name)}] = ${JSON.stringify(codeSampleValue(item))}`);
  }
  return lines.map((line) => `            ${line},`).join('\n');
}

function cParamLines() {
  const lines = [`append_param(curl, url, sizeof(url), "key", API_KEY, 1);`];
  for (const item of businessParams.value) {
    lines.push(`append_param(curl, url, sizeof(url), ${JSON.stringify(item.name)}, ${JSON.stringify(codeSampleValue(item))}, 0);`);
  }
  return lines.map((line) => `    ${line}`).join('\n');
}

function cppParamLines() {
  const lines = [`appendParam(curl, requestUrl, "key", apiKey, true);`];
  for (const item of businessParams.value) {
    lines.push(`appendParam(curl, requestUrl, ${JSON.stringify(item.name)}, ${JSON.stringify(codeSampleValue(item))}, false);`);
  }
  return lines.map((line) => `    ${line}`).join('\n');
}

function yiParamLines() {
  const lines = [`请求地址 ＝ API_URL ＋ “?key=” ＋ 编码_URL编码(API_KEY, 真)`];
  for (const item of businessParams.value) {
    lines.push(
      `请求地址 ＝ 请求地址 ＋ “&${item.name}=” ＋ 编码_URL编码（“${codeSampleValue(item).replaceAll('“', '').replaceAll('”', '')}”, 真）`,
    );
  }
  return lines.join('\n');
}

function jsSample(method: 'GET' | 'POST') {
  const url = apiEndpoint.value;
  const options =
    method === 'POST'
      ? `, {\n  method: 'POST',\n}`
      : '';
  return `const API_URL = ${JSON.stringify(url)};\nconst API_KEY = ${JSON.stringify(API_KEY_PLACEHOLDER)};\n\nconst params = new URLSearchParams({\n${jsParamLines()},\n});\n\nconst response = await fetch(\`\${API_URL}?\${params.toString()}\`${options});\nconst data = await response.json();\nconsole.log(data);`;
}

function nodeSample(method: 'GET' | 'POST') {
  return `const API_URL = ${JSON.stringify(apiEndpoint.value)};\nconst API_KEY = ${JSON.stringify(API_KEY_PLACEHOLDER)};\n\nconst params = new URLSearchParams({\n${jsParamLines()},\n});\n\nconst response = await fetch(\`\${API_URL}?\${params.toString()}\`, {\n  method: '${method}',\n});\n\nif (!response.ok) {\n  throw new Error(\`HTTP \${response.status}: \${await response.text()}\`);\n}\n\nconsole.log(await response.json());`;
}

function pythonSample(method: 'GET' | 'POST') {
  return `import requests\n\nAPI_URL = ${JSON.stringify(apiEndpoint.value)}\nAPI_KEY = ${JSON.stringify(API_KEY_PLACEHOLDER)}\n\nparams = {\n${pythonParamLines()},\n}\n\nresponse = requests.request("${method}", API_URL, params=params, timeout=30)\nresponse.raise_for_status()\nprint(response.json())`;
}

function phpSample(method: 'GET' | 'POST') {
  return `<?php\n\n$apiUrl = '${phpQuote(apiEndpoint.value)}';\n$apiKey = '${phpQuote(API_KEY_PLACEHOLDER)}';\n\n$params = [\n${phpParamLines()},\n];\n\n$ch = curl_init($apiUrl . '?' . http_build_query($params));\ncurl_setopt_array($ch, [\n    CURLOPT_RETURNTRANSFER => true,\n    CURLOPT_CUSTOMREQUEST => '${method}',\n    CURLOPT_TIMEOUT => 30,\n]);\n\n$response = curl_exec($ch);\nif ($response === false) {\n    throw new RuntimeException(curl_error($ch));\n}\n\ncurl_close($ch);\necho $response;`;
}

function javaSample(method: 'GET' | 'POST') {
  return `import java.net.URI;\nimport java.net.URLEncoder;\nimport java.net.http.HttpClient;\nimport java.net.http.HttpRequest;\nimport java.net.http.HttpResponse;\nimport java.nio.charset.StandardCharsets;\nimport java.util.LinkedHashMap;\nimport java.util.Map;\nimport java.util.stream.Collectors;\n\npublic class ApiDemo {\n    public static void main(String[] args) throws Exception {\n        String apiUrl = ${JSON.stringify(apiEndpoint.value)};\n        String apiKey = ${JSON.stringify(API_KEY_PLACEHOLDER)};\n\n        Map<String, String> params = new LinkedHashMap<>();\n${javaParamLines()}\n\n        String query = params.entrySet().stream()\n            .map(entry -> encode(entry.getKey()) + "=" + encode(entry.getValue()))\n            .collect(Collectors.joining("&"));\n\n        HttpRequest request = HttpRequest.newBuilder()\n            .uri(URI.create(apiUrl + "?" + query))\n            .method("${method}", HttpRequest.BodyPublishers.noBody())\n            .build();\n\n        HttpResponse<String> response = HttpClient.newHttpClient()\n            .send(request, HttpResponse.BodyHandlers.ofString());\n\n        System.out.println(response.body());\n    }\n\n    private static String encode(String value) {\n        return URLEncoder.encode(value, StandardCharsets.UTF_8);\n    }\n}`;
}

function goSample(method: 'GET' | 'POST') {
  return `package main\n\nimport (\n\t"fmt"\n\t"io"\n\t"net/http"\n\t"net/url"\n)\n\nfunc main() {\n\tapiURL := ${JSON.stringify(apiEndpoint.value)}\n\tapiKey := ${JSON.stringify(API_KEY_PLACEHOLDER)}\n\n\tparams := url.Values{}\n${goParamLines()}\n\n\trequestURL := apiURL + "?" + params.Encode()\n\treq, err := http.NewRequest("${method}", requestURL, nil)\n\tif err != nil {\n\t\tpanic(err)\n\t}\n\n\tresp, err := http.DefaultClient.Do(req)\n\tif err != nil {\n\t\tpanic(err)\n\t}\n\tdefer resp.Body.Close()\n\n\tbody, err := io.ReadAll(resp.Body)\n\tif err != nil {\n\t\tpanic(err)\n\t}\n\n\tfmt.Println(string(body))\n}`;
}

function csharpSample(method: 'GET' | 'POST') {
  return `using System;\nusing System.Collections.Generic;\nusing System.Linq;\nusing System.Net.Http;\nusing System.Threading.Tasks;\n\nclass ApiDemo\n{\n    static async Task Main()\n    {\n        string apiUrl = ${JSON.stringify(apiEndpoint.value)};\n        string apiKey = ${JSON.stringify(API_KEY_PLACEHOLDER)};\n\n        var parameters = new Dictionary<string, string>\n        {\n${csharpParamLines()}\n        };\n\n        string query = string.Join("&", parameters.Select(item =>\n            Uri.EscapeDataString(item.Key) + "=" + Uri.EscapeDataString(item.Value)));\n\n        using var client = new HttpClient();\n        using var request = new HttpRequestMessage(new HttpMethod("${method}"), apiUrl + "?" + query);\n        using var response = await client.SendAsync(request);\n\n        string body = await response.Content.ReadAsStringAsync();\n        Console.WriteLine(body);\n    }\n}`;
}

function cSample(method: 'GET' | 'POST') {
  const methodOption = method === 'POST' ? `\n    curl_easy_setopt(curl, CURLOPT_CUSTOMREQUEST, "POST");` : '';
  return `#include <curl/curl.h>\n#include <stdio.h>\n#include <string.h>\n\n#define API_URL ${JSON.stringify(apiEndpoint.value)}\n#define API_KEY ${JSON.stringify(API_KEY_PLACEHOLDER)}\n\nstatic void append_param(CURL *curl, char *url, size_t size, const char *name, const char *value, int first) {\n    char *escaped = curl_easy_escape(curl, value, 0);\n    size_t length = strlen(url);\n    snprintf(url + length, size - length, "%s%s=%s", first ? "?" : "&", name, escaped ? escaped : "");\n    if (escaped) curl_free(escaped);\n}\n\nint main(void) {\n    CURL *curl = curl_easy_init();\n    if (!curl) return 1;\n\n    char url[4096] = API_URL;\n${cParamLines()}\n\n    curl_easy_setopt(curl, CURLOPT_URL, url);\n    curl_easy_setopt(curl, CURLOPT_TIMEOUT, 30L);${methodOption}\n\n    CURLcode result = curl_easy_perform(curl);\n    curl_easy_cleanup(curl);\n\n    return result == CURLE_OK ? 0 : 1;\n}`;
}

function cppSample(method: 'GET' | 'POST') {
  const methodOption = method === 'POST' ? `\n    curl_easy_setopt(curl, CURLOPT_CUSTOMREQUEST, "POST");` : '';
  return `#include <curl/curl.h>\n#include <iostream>\n#include <string>\n\nstatic void appendParam(CURL* curl, std::string& requestUrl, const std::string& name, const std::string& value, bool first) {\n    char* escaped = curl_easy_escape(curl, value.c_str(), 0);\n    requestUrl += first ? "?" : "&";\n    requestUrl += name + "=" + (escaped ? escaped : "");\n    if (escaped) curl_free(escaped);\n}\n\nint main() {\n    std::string apiUrl = ${JSON.stringify(apiEndpoint.value)};\n    std::string apiKey = ${JSON.stringify(API_KEY_PLACEHOLDER)};\n\n    CURL* curl = curl_easy_init();\n    if (!curl) return 1;\n\n    std::string requestUrl = apiUrl;\n${cppParamLines()}\n\n    curl_easy_setopt(curl, CURLOPT_URL, requestUrl.c_str());\n    curl_easy_setopt(curl, CURLOPT_TIMEOUT, 30L);${methodOption}\n\n    CURLcode result = curl_easy_perform(curl);\n    curl_easy_cleanup(curl);\n\n    return result == CURLE_OK ? 0 : 1;\n}`;
}

function yiSample(method: 'GET' | 'POST') {
  const methodFlag = method === 'POST' ? '1' : '0';
  return `.版本 2\n.支持库 spec\n\n' 示例使用精易模块：网页_访问、编码_URL编码\n.子程序 _启动子程序, 整数型\n.局部变量 API_URL, 文本型\n.局部变量 API_KEY, 文本型\n.局部变量 请求地址, 文本型\n.局部变量 返回文本, 文本型\n\nAPI_URL ＝ ${JSON.stringify(apiEndpoint.value)}\nAPI_KEY ＝ ${JSON.stringify(API_KEY_PLACEHOLDER)}\n\n${yiParamLines()}\n\n返回文本 ＝ 网页_访问 (请求地址, ${methodFlag})\n调试输出 (返回文本)\n返回 (0)`;
}

function codeSample(language: ExampleLanguage) {
  const method = preferredMethod.value;
  if (language === 'c') return cSample(method);
  if (language === 'cpp') return cppSample(method);
  if (language === 'csharp') return csharpSample(method);
  if (language === 'go') return goSample(method);
  if (language === 'javascript') return jsSample(method);
  if (language === 'node') return nodeSample(method);
  if (language === 'python') return pythonSample(method);
  if (language === 'php') return phpSample(method);
  if (language === 'yiyu') return yiSample(method);
  return javaSample(method);
}

const EXAMPLE_KEYWORDS: Record<ExampleLanguage, Set<string>> = {
  c: new Set(['char', 'const', 'define', 'if', 'include', 'int', 'return', 'sizeof', 'static', 'void']),
  cpp: new Set(['bool', 'char', 'const', 'false', 'if', 'include', 'int', 'namespace', 'return', 'static', 'std', 'string', 'true']),
  csharp: new Set(['async', 'await', 'class', 'new', 'static', 'string', 'using', 'var']),
  go: new Set(['defer', 'err', 'func', 'if', 'import', 'main', 'nil', 'package', 'panic', 'return']),
  java: new Set(['class', 'import', 'new', 'private', 'public', 'return', 'static', 'throws', 'void']),
  javascript: new Set(['await', 'const', 'if', 'new', 'throw']),
  node: new Set(['await', 'const', 'if', 'new', 'throw']),
  php: new Set(['array', 'echo', 'false', 'if', 'new', 'throw', 'true']),
  python: new Set(['import', 'print']),
  yiyu: new Set(['API_KEY', 'API_URL']),
};

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function tokenHtml(value: string, className = '') {
  const escaped = escapeHtml(value);
  return className ? `<span class="${className}">${escaped}</span>` : escaped;
}

function isIdentifierStart(char: string) {
  return /[A-Za-z_$]/.test(char);
}

function isIdentifierPart(char: string) {
  return /[\w$]/.test(char);
}

function findCommentStart(line: string, language: ExampleLanguage) {
  const markers = language === 'python' ? ['#'] : language === 'yiyu' ? ["'"] : ['//'];
  if (language === 'php') markers.push('#');

  let quote = '';
  let escaped = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]!;
    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === quote) {
        quote = '';
      }
      continue;
    }

    if (char === '"' || char === "'" || char === '`') {
      quote = char;
      continue;
    }

    if (markers.some((marker) => line.startsWith(marker, index))) {
      return index;
    }
  }
  return -1;
}

function highlightSnippet(snippet: string, language: ExampleLanguage) {
  const keywords = EXAMPLE_KEYWORDS[language] ?? new Set<string>();
  const output: string[] = [];
  let index = 0;

  while (index < snippet.length) {
    const char = snippet[index]!;

    if (/\s/.test(char)) {
      output.push(escapeHtml(char));
      index += 1;
      continue;
    }

    if (char === '"' || char === "'" || char === '`') {
      const quote = char;
      let end = index + 1;
      let escaped = false;
      while (end < snippet.length) {
        const next = snippet[end]!;
        end += 1;
        if (escaped) {
          escaped = false;
        } else if (next === '\\') {
          escaped = true;
        } else if (next === quote) {
          break;
        }
      }
      output.push(tokenHtml(snippet.slice(index, end), 'tok-string'));
      index = end;
      continue;
    }

    if (char === '$' && isIdentifierStart(snippet[index + 1] || '')) {
      let end = index + 2;
      while (end < snippet.length && isIdentifierPart(snippet[end]!)) end += 1;
      output.push(tokenHtml(snippet.slice(index, end), 'tok-variable'));
      index = end;
      continue;
    }

    if (/\d/.test(char)) {
      let end = index + 1;
      while (end < snippet.length && /[\d.]/.test(snippet[end]!)) end += 1;
      output.push(tokenHtml(snippet.slice(index, end), 'tok-number'));
      index = end;
      continue;
    }

    if (isIdentifierStart(char)) {
      let end = index + 1;
      while (end < snippet.length && isIdentifierPart(snippet[end]!)) end += 1;
      const word = snippet.slice(index, end);
      const nextNonSpace = snippet.slice(end).trimStart()[0];
      if (keywords.has(word)) {
        output.push(tokenHtml(word, 'tok-keyword'));
      } else if (/^[A-Z0-9_]+$/.test(word) && word.length > 1) {
        output.push(tokenHtml(word, 'tok-constant'));
      } else if (nextNonSpace === '(') {
        output.push(tokenHtml(word, 'tok-function'));
      } else {
        output.push(tokenHtml(word));
      }
      index = end;
      continue;
    }

    output.push(tokenHtml(char, /[{}()[\].,;:+\-*/=&|<>!?]/.test(char) ? 'tok-punctuation' : ''));
    index += 1;
  }

  return output.join('');
}

function highlightLine(line: string, language: ExampleLanguage) {
  const commentStart = findCommentStart(line, language);
  if (commentStart >= 0) {
    return `${highlightSnippet(line.slice(0, commentStart), language)}${tokenHtml(line.slice(commentStart), 'tok-comment')}`;
  }
  return highlightSnippet(line, language);
}

function highlightCode(code: string, language: ExampleLanguage) {
  return code.split('\n').map((line, index) => ({
    html: highlightLine(line, language) || '&nbsp;',
    number: index + 1,
  }));
}

async function copyText(value: string, key: string) {
  if (!value || typeof navigator === 'undefined') return;
  await navigator.clipboard.writeText(value);
  copiedKey.value = key;
  window.setTimeout(() => {
    if (copiedKey.value === key) copiedKey.value = '';
  }, 1400);
}

async function sendTest() {
  testError.value = '';
  testResult.value = '';
  testStatus.value = null;
  testElapsedMs.value = null;
  const selectedKey = testKey.value.trim();
  if (!isSignedIn.value) {
    testError.value = '请先登录并创建密钥';
    return;
  }
  if (!selectedKey) {
    testError.value = testKeyMessage.value || '请先在控制台创建全站接口密钥或当前接口专属密钥';
    return;
  }
  const missingParam = businessParams.value.find(
    (item) => item.required && !String(testParams[item.name] || '').trim(),
  );
  if (missingParam) {
    testError.value = `请先填写参数 ${missingParam.name}`;
    return;
  }
  testing.value = true;
  const startedAt = Date.now();
  try {
    const response = await fetch(buildUrl(selectedKey), {
      method: testMethod.value,
    });
    const text = await response.text();
    testStatus.value = response.status;
    testResult.value = formatMaybeJson(text) || '(空响应)';
  } catch (error) {
    testError.value = error instanceof Error ? error.message : '接口测试失败';
  } finally {
    testElapsedMs.value = Date.now() - startedAt;
    testing.value = false;
  }
}

function copyTestResult() {
  void copyText(testResult.value || testError.value, 'test-result');
}

function formatMaybeJson(value: string) {
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
}
</script>

<template>
  <main class="docs-page" :style="siteThemeVars">
    <PublicSiteHeader active-key="market" />

    <section v-if="loading" class="docs-state">
      <IconifyIcon class="loading-icon" icon="lucide:loader-2" />
      <span>正在加载接口文档</span>
    </section>

    <section v-else-if="errorMessage" class="docs-state">
      <IconifyIcon icon="lucide:file-warning" />
      <span>{{ errorMessage }}</span>
      <RouterLink :to="MARKET_PATH">返回接口市场</RouterLink>
    </section>

    <template v-else-if="detail">
      <section
        ref="docsToolbarRef"
        class="docs-toolbar"
        :class="{ 'is-stuck': docsToolbarStuck }"
      >
        <nav>
          <RouterLink to="/">主页</RouterLink>
          <RouterLink :to="MARKET_PATH">接口市场</RouterLink>
          <span>{{ pageTitle }}</span>
        </nav>
        <div class="docs-toolbar-actions">
          <RouterLink class="back-button" :to="MARKET_PATH">
            <IconifyIcon icon="lucide:arrow-left" />
            <span>返回列表</span>
          </RouterLink>
          <button
            class="mobile-doc-nav-trigger"
            aria-label="打开文档导航"
            type="button"
            @click="mobileDocNavOpen = true"
          >
            <IconifyIcon icon="lucide:menu" />
          </button>
        </div>
      </section>

      <section class="docs-shell">
        <aside class="docs-sidebar" :class="{ open: mobileDocNavOpen }">
          <div class="docs-sidebar-head">
            <h3>文档导航</h3>
            <button
              class="mobile-sidebar-close"
              aria-label="关闭文档导航"
              type="button"
              @click="mobileDocNavOpen = false"
            >
              <IconifyIcon icon="lucide:x" />
            </button>
          </div>
          <button
            v-for="item in DOC_NAV_ITEMS"
            :key="item.id"
            :class="{ active: activeDocSection === item.id }"
            type="button"
            @click="scrollToDocSection(item.id)"
          >
            <IconifyIcon :icon="item.icon" />
            {{ item.label }}
          </button>
        </aside>
        <button
          v-if="mobileDocNavOpen"
          class="mobile-doc-mask"
          aria-label="关闭文档导航"
          type="button"
          @click="mobileDocNavOpen = false"
        ></button>

        <section class="docs-content">
          <article id="api-info" class="doc-section">
            <header>
              <IconifyIcon icon="lucide:info" />
              <div>
                <h1>基础信息</h1>
                <p>查看接口基本信息和返回格式</p>
              </div>
            </header>

            <div v-if="detail.notice" class="notice-box">
              <IconifyIcon icon="lucide:triangle-alert" />
              <div>
                <strong>免责声明</strong>
                <p>{{ detail.notice }}</p>
              </div>
            </div>

            <div class="api-summary-grid">
              <div v-for="item in summaryCards" :key="item.label" class="summary-card">
                <IconifyIcon :icon="item.icon" />
                <span>{{ item.label }}</span>
                <strong>{{ item.value }}</strong>
                <p>{{ item.desc }}</p>
              </div>
            </div>

            <div class="info-card">
              <h3>接口描述</h3>
              <p>{{ detail.description || '后台未配置接口描述' }}</p>
            </div>

            <div class="info-card">
              <h3>七日请求统计</h3>
              <div class="trend-summary">
                <span>本周请求：<strong>{{ compactNumber(weekTotal) }}</strong></span>
                <span>日均：<strong>{{ compactNumber(weekAverage) }}</strong></span>
              </div>
              <div class="trend-bars">
                <div v-for="item in detail.callTrend7d" :key="item.date">
                  <span>{{ compactNumber(item.value) }}</span>
                  <i :style="{ height: trendHeight(item.value) }"></i>
                  <em>{{ item.label }}</em>
                </div>
              </div>
            </div>

            <div class="info-card">
              <h3>接口地址</h3>
              <div class="copy-line">
                <code>{{ apiRequestTemplate }}</code>
                <button type="button" @click="copyText(apiRequestTemplate, 'endpoint')">
                  <IconifyIcon icon="lucide:copy" />
                  {{ copiedKey === 'endpoint' ? '已复制' : '复制' }}
                </button>
              </div>
            </div>

            <div class="info-grid">
              <div class="info-card">
                <h3>请求方式</h3>
                <div class="method-tags">
                  <span
                    v-for="method in availableMethods"
                    :key="method"
                    :class="{ recommend: method === preferredMethod }"
                  >
                    {{ method }}
                    <em v-if="method === preferredMethod">推荐</em>
                  </span>
                </div>
              </div>
              <div class="info-card">
                <h3>返回方式</h3>
                <div class="return-type">
                  <strong>{{ detail.responseType }}</strong>
                  <span>接口响应由平台网关透传，返回结构以后台配置和实际接口能力为准。</span>
                </div>
              </div>
            </div>
          </article>

          <article id="pricing" class="doc-section">
            <header>
              <IconifyIcon icon="lucide:coins" />
              <div>
                <h2>计费标准</h2>
                <p>由后台接口价格、点数和密钥权限共同决定</p>
              </div>
            </header>
            <div class="pricing-layout">
              <div class="pricing-card pricing-card--main">
                <span class="card-eyebrow">接口扣费</span>
                <strong :class="priceClass()">{{ primaryPriceText }}</strong>
                <div class="pricing-subline">
                  <span v-if="hasMoneyPrice">余额价格 <b>{{ moneyPriceText }}</b></span>
                  <span v-if="hasPaidPrice" class="member-free">会员免费</span>
                  <span v-if="pricingLabelText">{{ pricingLabelText }}</span>
                </div>
                <p>{{ detail.pricing.description }}</p>
              </div>
              <div class="billing-rules">
                <h3>计费规则</h3>
                <div v-for="rule in billingRules" :key="rule">
                  <IconifyIcon icon="lucide:check" />
                  <span>{{ rule }}</span>
                </div>
              </div>
            </div>
            <div class="billing-flow">
              <strong>扣费顺序</strong>
              <span v-for="step in deductionSteps" :key="step">{{ step }}</span>
            </div>
            <div class="limit-grid">
              <div v-for="item in limitCards" :key="item.label" class="limit-card">
                <span>{{ item.label }}</span>
                <strong>{{ item.value }}</strong>
                <p>{{ item.desc }}</p>
              </div>
            </div>
          </article>

          <article id="config" class="doc-section">
            <header>
              <IconifyIcon icon="lucide:lock-keyhole" />
              <div>
                <h2>安全认证</h2>
                <p>由接口调用代码读取 Query 参数 key 完成密钥校验</p>
              </div>
            </header>
            <div class="auth-layout">
              <div class="auth-doc-card auth-doc-card--steps">
                <div class="doc-card-title">
                  <IconifyIcon icon="lucide:key-round" />
                  <h3>密钥管理</h3>
                </div>
                <div class="auth-process">
                  <div
                    v-for="(item, index) in authGuideCards"
                    :key="item.title"
                    :class="{ warn: item.warn }"
                    class="auth-process-item"
                  >
                    <em>{{ index + 1 }}</em>
                    <div>
                      <strong>{{ item.title }}</strong>
                      <p>{{ item.desc }}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div class="auth-doc-card">
                <div class="doc-card-title">
                  <IconifyIcon icon="lucide:shield-check" />
                  <h3>密钥说明</h3>
                </div>
                <div class="secret-list">
                  <div v-for="item in authSecretCards" :key="item.title">
                    <strong>{{ item.title }}</strong>
                    <code>{{ item.name }}</code>
                    <p>{{ item.desc }}</p>
                  </div>
                </div>
                <div class="security-advice">
                  <strong>安全建议</strong>
                  <p>不要把密钥写入前端公开代码或截图中；如需上线使用，请在服务端保存并转发调用。</p>
                </div>
              </div>
            </div>
          </article>

          <article id="params" class="doc-section">
            <header>
              <IconifyIcon icon="lucide:hash" />
              <div>
                <h2>参数文档</h2>
                <p>参数来自后台文档配置；未配置的占位符会从接口地址模板自动识别</p>
              </div>
            </header>
            <div class="param-doc-panel">
              <div class="param-panel-title">
                <IconifyIcon icon="lucide:file-text" />
                <div>
                  <h3>请求参数</h3>
                  <p>只展示用户调用时需要填写的业务参数；接口密钥 key 由系统在认证区单独说明。</p>
                </div>
              </div>
              <div class="param-table">
                <div class="param-row param-head">
                  <span>参数名</span>
                  <span>位置</span>
                  <span>类型</span>
                  <span>必填</span>
                  <span>说明</span>
                </div>
                <div v-for="item in visibleParameters" :key="`${item.location}-${item.name}`" class="param-row">
                  <span><code>{{ item.name }}</code></span>
                  <span>{{ item.location }}</span>
                  <span>{{ item.type }}</span>
                  <span>
                    <em class="required-tag" :class="{ optional: !item.required }">{{ item.required ? '是' : '否' }}</em>
                  </span>
                  <span>{{ item.description }}</span>
                </div>
                <div v-if="visibleParameters.length === 0" class="param-empty">
                  后台未配置业务参数，公开文档仅展示系统密钥说明。
                </div>
              </div>
            </div>

            <div class="response-fields collapsible-panel">
              <button class="collapse-head" type="button" @click="toggleResponseFields">
                <span>
                  <IconifyIcon icon="lucide:terminal-square" />
                  返回字段
                </span>
                <em>
                  <IconifyIcon :icon="responseFieldsExpanded ? 'lucide:minimize-2' : 'lucide:maximize-2'" />
                  {{ responseFieldsExpanded ? '收起' : '展开' }}
                </em>
              </button>
              <div v-show="responseFieldsExpanded" class="collapse-body">
                <div v-if="responseFieldRows.length > 0" class="field-tree">
                  <div class="field-tree-row field-tree-head">
                    <span>字段名</span>
                    <span>类型</span>
                    <span>说明</span>
                  </div>
                  <div v-for="item in responseFieldRows" :key="item.rawName" class="field-tree-row">
                    <span class="field-name" :style="{ paddingLeft: `${item.depth * 24}px` }">
                      <i v-if="item.depth"></i>
                      <button
                        v-if="item.hasChildren"
                        class="field-toggle"
                        type="button"
                        :aria-label="`${isResponseFieldNodeExpanded(item.rawName) ? '收起' : '展开'} ${item.displayName}`"
                        @click="toggleResponseFieldNode(item.rawName)"
                      >
                        <IconifyIcon
                          :icon="isResponseFieldNodeExpanded(item.rawName) ? 'lucide:chevron-down' : 'lucide:chevron-right'"
                        />
                      </button>
                      <span v-else class="field-toggle-placeholder"></span>
                      <code>{{ item.displayName }}</code>
                    </span>
                    <span><em class="type-tag">{{ item.type }}</em></span>
                    <p>{{ item.description }}</p>
                  </div>
                </div>
                <div v-else class="empty-doc">
                  后台未配置返回字段，返回结构以实际接口响应为准。
                </div>
              </div>
            </div>

            <div class="info-card response-preview-card">
              <h3>返回预览</h3>
              <div class="doc-code-panel">
                <div class="doc-code-head">
                  <strong>{{ detail.responseType || 'JSON' }}</strong>
                  <button type="button" :disabled="!responseExample" @click="copyText(responseExample, 'response-preview')">
                    <IconifyIcon icon="lucide:copy" />
                    {{ copiedKey === 'response-preview' ? '已复制' : '复制' }}
                  </button>
                </div>
                <div class="doc-code-body">
                  <pre v-if="responseExample"><code>{{ responseExample }}</code></pre>
                  <div v-else class="doc-code-empty">后台未配置返回预览</div>
                </div>
              </div>
            </div>
          </article>

          <article id="status-code" class="doc-section">
            <header>
              <IconifyIcon icon="lucide:badge-check" />
              <div>
                <h2>状态码</h2>
                <p>后台未配置时使用调用代码中真实存在的通用状态码</p>
              </div>
            </header>
            <div class="status-list">
              <div v-for="item in detail.statusCodes" :key="item.code">
                <code>{{ item.code }}</code>
                <span>{{ item.description }}</span>
              </div>
            </div>
            <p class="section-note">
              状态码说明来自后台文档配置；未单独配置时，系统会展示公开网关真实存在的通用状态码。
            </p>
          </article>

          <article id="online-test" class="doc-section">
            <header>
              <IconifyIcon icon="lucide:zap" />
              <div>
                <h2>在线测试</h2>
                <p>直接调用当前接口的真实网关地址</p>
              </div>
            </header>

            <div class="test-lab">
              <section class="debug-card">
                <h3>调试参数</h3>
                <div class="debug-form">
                  <label>
                    请求方式
                    <select v-model="testMethod">
                      <option v-for="method in availableMethods" :key="method" :value="method">{{ method }}</option>
                    </select>
                  </label>
                  <label>
                    接口地址
                    <input :value="apiEndpoint" readonly />
                  </label>
                  <label>
                    <span class="field-title">接口密钥 key <em>*</em></span>
                    <input
                      :placeholder="testKeyPlaceholder"
                      :value="testKey"
                      readonly
                      type="password"
                    />
                    <small class="key-helper" :class="{ warn: !hasUsableTestKey }">
                      {{ testKeyMessage || '接口密钥由系统按优先级自动选择，在线测试不可手动修改' }}
                    </small>
                  </label>
                  <label v-for="item in businessParams" :key="item.name">
                    <span class="field-title">
                      {{ item.name }}
                      <em v-if="item.required">*</em>
                    </span>
                    <input
                      v-model="testParams[item.name]"
                      :placeholder="paramPlaceholder(item)"
                    />
                  </label>
                  <button class="test-submit" :disabled="testing || testKeyLoading" type="button" @click="sendTest">
                    <IconifyIcon icon="lucide:send" />
                    {{ testing ? '请求中' : '发送请求' }}
                  </button>
                </div>
              </section>

              <section v-if="hasTestOutput" class="result-card">
                <div class="result-head">
                  <h3>响应结果</h3>
                  <div class="result-toolbar">
                    <span><IconifyIcon icon="lucide:clock-3" />{{ testResultMeta }}</span>
                    <button
                      type="button"
                      :aria-label="copiedKey === 'test-result' ? '已复制响应结果' : '复制响应结果'"
                      :title="copiedKey === 'test-result' ? '已复制' : '复制响应结果'"
                      @click="copyTestResult"
                    >
                      <IconifyIcon :icon="copiedKey === 'test-result' ? 'lucide:check' : 'lucide:copy'" />
                    </button>
                  </div>
                </div>
                <div class="result-screen">
                  <pre v-if="testResult"><code>{{ testResult }}</code></pre>
                  <pre v-else-if="testError" class="error-result"><code>{{ testError }}</code></pre>
                  <p v-else>
                    请求中，请稍候...
                  </p>
                </div>
              </section>
            </div>
          </article>

          <article id="examples" class="doc-section">
            <header>
              <IconifyIcon icon="lucide:code-2" />
              <div>
                <h2>示例代码</h2>
                <p>按当前接口真实网关地址生成，替换密钥和业务参数后即可调用</p>
              </div>
            </header>
            <div class="example-overview">
              <div>
                <span>请求方式</span>
                <strong>{{ preferredMethod }}</strong>
              </div>
              <div>
                <span>网关地址</span>
                <code>{{ apiEndpoint }}</code>
              </div>
              <div>
                <span>示例 URL</span>
                <code>{{ exampleUrl }}</code>
              </div>
            </div>
            <div class="example-tabs" role="tablist">
              <button
                v-for="item in EXAMPLE_LANGUAGES"
                :key="item.key"
                :class="{ active: activeExampleLanguage === item.key }"
                type="button"
                @click="activeExampleLanguage = item.key"
              >
                <span>{{ item.label }}</span>
              </button>
            </div>
            <div class="doc-code-panel example-code-panel">
              <div class="doc-code-head">
                <strong>{{ activeExampleLanguageItem.label }} 调用示例</strong>
                <button type="button" @click="copyText(activeExampleCode, `example-${activeExampleLanguage}`)">
                  <IconifyIcon icon="lucide:copy" />
                  {{ copiedKey === `example-${activeExampleLanguage}` ? '已复制' : '复制' }}
                </button>
              </div>
              <div class="doc-code-body example-code-body">
                <div class="syntax-code-table" role="code">
                  <div v-for="line in highlightedExampleLines" :key="line.number" class="syntax-code-line">
                    <span class="syntax-line-number">{{ line.number }}</span>
                    <span class="syntax-line-content" v-html="line.html"></span>
                  </div>
                </div>
              </div>
            </div>
          </article>
        </section>
      </section>
    </template>
  </main>
</template>

<style scoped>
.docs-page {
  --home-accent: #4f46e5;
  --home-primary: #2563eb;
  --home-primary-rgb: 37 99 235;
  --home-soft: #eff6ff;

  min-height: 100vh;
  padding-top: 72px;
  background: #f5f6f8;
  color: #111827;
  font-family:
    'HarmonyOS Sans SC', 'MiSans', 'Microsoft YaHei UI', 'PingFang SC',
    sans-serif;
}

.docs-state {
  width: min(100% - 40px, 760px);
  min-height: 280px;
  display: grid;
  place-items: center;
  gap: 14px;
  margin: 96px auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  color: #64748b;
  font-weight: 850;
  padding: 32px;
}

.docs-state svg {
  color: var(--home-primary);
  font-size: 34px;
}

.loading-icon {
  animation: spin 1s linear infinite;
}

.docs-toolbar,
.docs-shell {
  width: min(100% - 40px, 1320px);
  margin: 0 auto;
}

.docs-toolbar {
  min-height: 72px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  margin-top: 28px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 18px 42px rgb(15 23 42 / 6%);
  padding: 14px 20px;
  transition:
    width 220ms ease,
    border-radius 220ms ease,
    box-shadow 220ms ease,
    background-color 220ms ease;
}

.docs-toolbar nav,
.back-button,
.docs-toolbar-actions,
.copy-line,
.method-tags,
.status-list,
.trend-summary {
  display: flex;
  align-items: center;
}

.docs-toolbar nav {
  gap: 30px;
}

.docs-toolbar a,
.docs-toolbar span,
.back-button {
  color: #374151;
  font-weight: 850;
  text-decoration: none;
}

.docs-toolbar span {
  border-bottom: 3px solid var(--home-primary, #2563eb);
  color: var(--home-primary, #2563eb);
  padding: 10px 0;
}

.docs-toolbar-actions {
  gap: 10px;
}

.back-button {
  gap: 8px;
  border-radius: 8px;
  background: #f3f4f6;
  padding: 12px 16px;
}

.mobile-doc-nav-trigger,
.mobile-sidebar-close,
.mobile-doc-mask {
  display: none;
}

.docs-shell {
  min-width: 0;
  display: grid;
  grid-template-columns: 248px minmax(0, 1fr);
  gap: 28px;
  padding: 34px 0 70px;
}

.docs-sidebar {
  position: sticky;
  top: 104px;
  align-self: start;
  display: grid;
  gap: 8px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 18px 42px rgb(15 23 42 / 6%);
  padding: 18px;
}

.docs-sidebar-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.docs-sidebar h3 {
  margin: 0 0 12px;
  border-bottom: 1px solid #e5e7eb;
  font-size: 18px;
  font-weight: 950;
  padding-bottom: 14px;
}

.docs-sidebar button:not(.mobile-sidebar-close) {
  min-height: 52px;
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #64748b;
  cursor: pointer;
  font: inherit;
  font-weight: 850;
  padding: 0 14px;
  text-decoration: none;
  text-align: left;
  transition:
    background-color 0.18s ease,
    box-shadow 0.18s ease,
    color 0.18s ease,
    transform 0.18s ease;
}

.docs-sidebar button:not(.mobile-sidebar-close) svg {
  color: inherit;
}

.docs-sidebar button:not(.mobile-sidebar-close):hover {
  background: rgb(var(--home-primary-rgb, 37 99 235) / 8%);
  color: var(--home-primary, #2563eb);
}

.docs-sidebar button:not(.mobile-sidebar-close).active {
  background: var(--home-primary, #2563eb);
  color: #fff;
  box-shadow: 0 14px 26px rgb(var(--home-primary-rgb, 37 99 235) / 24%);
  transform: translateX(2px);
}

.docs-sidebar button:not(.mobile-sidebar-close).active:hover {
  background: var(--home-primary, #2563eb);
  color: #fff;
}

.docs-content {
  min-width: 0;
  display: grid;
  gap: 22px;
}

.doc-section {
  min-width: 0;
  overflow: hidden;
  scroll-margin-top: 98px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 18px 42px rgb(15 23 42 / 6%);
  padding: 28px 40px;
}

.doc-section > header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 22px;
  border-bottom: 2px solid var(--home-primary, #2563eb);
  padding-bottom: 18px;
}

.doc-section > header > svg {
  width: 26px;
  height: 26px;
}

.doc-section h1,
.doc-section h2 {
  margin: 0;
  font-size: 26px;
  font-weight: 950;
}

.doc-section header p,
.info-card p,
.auth-card p,
.return-type span {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 14px;
  font-weight: 720;
  line-height: 1.8;
}

.notice-box {
  width: min(100%, 460px);
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr);
  gap: 12px;
  margin-bottom: 20px;
  border: 1px solid #fecaca;
  border-radius: 8px;
  background: #fff1f2;
  color: #991b1b;
  padding: 16px;
}

.notice-box svg {
  color: #ef4444;
  font-size: 24px;
}

.notice-box strong {
  display: block;
  margin-bottom: 6px;
}

.notice-box p {
  margin: 0;
  line-height: 1.7;
}

.api-summary-grid,
.limit-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.summary-card,
.limit-card {
  min-width: 0;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: linear-gradient(180deg, #fff, #f8fafc);
  padding: 16px;
}

.summary-card {
  display: grid;
  gap: 8px;
}

.summary-card svg {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: var(--home-soft);
  color: var(--home-primary);
  padding: 7px;
}

.summary-card span,
.limit-card span,
.card-eyebrow {
  color: #64748b;
  font-size: 12px;
  font-weight: 850;
}

.summary-card strong,
.limit-card strong {
  color: #111827;
  font-size: 18px;
  font-weight: 950;
}

.summary-card p,
.limit-card p {
  margin: 0;
  color: #64748b;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.7;
}

.info-card,
.pricing-card,
.auth-card {
  min-width: 0;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f9fafb;
  margin-top: 16px;
  padding: 18px 20px;
}

.info-card h3 {
  margin: 0 0 12px;
  font-size: 17px;
  font-weight: 950;
}

.response-preview-card {
  max-width: 100%;
  overflow: hidden;
}

.response-preview-card .doc-code-body {
  height: 360px;
  overflow: auto;
}

.response-preview-card .doc-code-empty {
  height: 100%;
  min-height: 0;
}

.pricing-layout,
.auth-layout {
  display: grid;
  grid-template-columns: minmax(260px, 0.8fr) minmax(0, 1.2fr);
  align-items: stretch;
  gap: 16px;
}

.pricing-card {
  display: grid;
  align-content: center;
}

.pricing-layout .pricing-card {
  margin-top: 0;
}

.pricing-card--main {
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(circle at 88% 12%, rgb(var(--home-primary-rgb) / 12%), transparent 34%),
    linear-gradient(180deg, #fff, #f8fafc);
  border-color: rgb(var(--home-primary-rgb) / 20%);
}

.pricing-card--main::after {
  position: absolute;
  right: -44px;
  bottom: -56px;
  width: 148px;
  height: 148px;
  border-radius: 999px;
  background: rgb(var(--home-primary-rgb) / 8%);
  content: '';
}

.pricing-card--main > * {
  position: relative;
  z-index: 1;
}

.billing-rules,
.auth-steps {
  display: grid;
  gap: 10px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  padding: 18px 20px;
}

.billing-rules {
  align-content: center;
}

.billing-rules h3 {
  margin: 0 0 4px;
  font-size: 17px;
  font-weight: 950;
}

.billing-rules div,
.auth-steps div {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  color: #475569;
  font-weight: 780;
  line-height: 1.7;
}

.billing-rules svg {
  margin-top: 4px;
  color: #16a34a;
}

.pricing-subline {
  position: relative;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}

.pricing-subline span {
  border-radius: 999px;
  background: #f1f5f9;
  color: #475569;
  font-size: 12px;
  font-weight: 900;
  padding: 6px 10px;
}

.pricing-subline b {
  color: #ea580c;
}

.pricing-subline .member-free {
  background: #dcfce7;
  color: #16a34a;
}

.pricing-card--main p {
  position: relative;
  z-index: 1;
  margin: 0;
  color: #475569;
  font-weight: 820;
  line-height: 1.8;
}

.billing-flow {
  display: grid;
  grid-template-columns: 0.9fr repeat(4, minmax(0, 1fr));
  align-items: center;
  gap: 10px;
  margin-top: 16px;
  border: 1px dashed rgb(var(--home-primary-rgb) / 28%);
  border-radius: 8px;
  background: rgb(var(--home-primary-rgb) / 4%);
  padding: 14px;
}

.billing-flow strong {
  color: var(--home-primary);
  font-size: 14px;
  font-weight: 950;
  text-align: center;
}

.billing-flow span {
  min-height: 38px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  background: #fff;
  color: #334155;
  font-size: 13px;
  font-weight: 900;
  text-align: center;
}

.limit-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin-top: 16px;
}

.auth-steps em {
  width: 24px;
  height: 24px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: #111827;
  color: #fff;
  font-size: 12px;
  font-style: normal;
  font-weight: 950;
}

.trend-summary {
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 12px;
}

.trend-summary strong {
  color: #111827;
}

.trend-bars {
  height: 190px;
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  align-items: end;
  gap: 12px;
  border-top: 1px solid #e5e7eb;
  padding-top: 18px;
}

.trend-bars div {
  height: 100%;
  display: grid;
  grid-template-rows: 24px 1fr 24px;
  justify-items: center;
  color: #475569;
  font-size: 12px;
  font-weight: 800;
}

.trend-bars i {
  width: 100%;
  max-width: 34px;
  align-self: end;
  border-radius: 8px 8px 0 0;
  background: linear-gradient(180deg, var(--home-primary), var(--home-soft));
}

.copy-line {
  gap: 12px;
}

.copy-line code,
code {
  min-width: 0;
  border-radius: 6px;
  background: #f3f4f6;
  color: #111827;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 13px;
  padding: 8px 10px;
}

.copy-line code {
  flex: 1;
  overflow-x: auto;
}

.example-overview {
  display: grid;
  grid-template-columns: 160px minmax(0, 1fr);
  gap: 12px;
  margin-bottom: 18px;
}

.example-overview > div {
  min-width: 0;
  display: grid;
  gap: 8px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f8fafc;
  padding: 14px 16px;
}

.example-overview > div:nth-child(3) {
  grid-column: 1 / -1;
}

.example-overview span {
  color: #64748b;
  font-size: 12px;
  font-weight: 900;
}

.example-overview strong {
  color: var(--home-primary);
  font-size: 18px;
  font-weight: 950;
}

.example-overview code {
  overflow-x: auto;
  white-space: nowrap;
}

.example-tabs {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 16px;
  padding-bottom: 14px;
}

.example-tabs button {
  min-width: max-content;
  display: inline-flex;
  align-items: center;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  color: #64748b;
  cursor: pointer;
  font-weight: 950;
  padding: 12px 20px;
  transition:
    background-color 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    color 0.18s ease;
}

.example-tabs button:hover {
  background: rgb(var(--home-primary-rgb) / 8%);
  color: var(--home-primary);
}

.example-tabs button.active {
  border-color: var(--home-primary);
  background: rgb(var(--home-primary-rgb) / 10%);
  color: var(--home-primary);
  box-shadow: 0 12px 24px rgb(var(--home-primary-rgb) / 24%);
}

.example-code-panel {
  margin-top: 0;
}

.example-code-body {
  height: 520px;
  padding: 0;
}

.syntax-code-table {
  min-width: max-content;
  min-height: 100%;
  display: table;
  border-collapse: collapse;
  background: #1f2937;
  color: #e5e7eb;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 14px;
  line-height: 1.8;
}

.syntax-code-line {
  display: table-row;
}

.syntax-line-number,
.syntax-line-content {
  display: table-cell;
  vertical-align: top;
}

.syntax-line-number {
  width: 46px;
  min-width: 46px;
  user-select: none;
  border-right: 1px solid rgb(148 163 184 / 16%);
  background: rgb(15 23 42 / 32%);
  color: #718096;
  font-size: 12px;
  font-weight: 800;
  padding: 0 14px 0 10px;
  text-align: right;
}

.syntax-line-content {
  white-space: pre;
  padding: 0 28px 0 20px;
}

.syntax-code-line:first-child .syntax-line-number,
.syntax-code-line:first-child .syntax-line-content {
  padding-top: 22px;
}

.syntax-code-line:last-child .syntax-line-number,
.syntax-code-line:last-child .syntax-line-content {
  padding-bottom: 22px;
}

:deep(.tok-keyword) {
  color: #ff6b6b;
  font-weight: 850;
}

:deep(.tok-string) {
  color: #98c379;
}

:deep(.tok-comment) {
  color: #7f8ea3;
  font-style: italic;
}

:deep(.tok-number) {
  color: #f6c177;
}

:deep(.tok-variable) {
  color: #61afef;
}

:deep(.tok-constant) {
  color: #f6c177;
  font-weight: 850;
}

:deep(.tok-function) {
  color: #61afef;
}

:deep(.tok-punctuation) {
  color: #cbd5e1;
}

.copy-line button,
.result-toolbar button,
.test-submit,
.code-grid button {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  color: #111827;
  cursor: pointer;
  font-weight: 900;
  padding: 10px 12px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.method-tags {
  gap: 10px;
}

.method-tags span {
  border-radius: 8px;
  background: #f3f4f6;
  color: #374151;
  font-weight: 950;
  padding: 10px 16px;
}

.method-tags .recommend {
  background: #dcfce7;
  color: #16a34a;
}

.method-tags em {
  margin-left: 8px;
  border-radius: 999px;
  background: #22c55e;
  color: #fff;
  font-size: 12px;
  font-style: normal;
  padding: 4px 8px;
}

.return-type {
  display: flex;
  gap: 12px;
  align-items: center;
}

.return-type strong {
  border-radius: 8px;
  background: var(--home-soft);
  color: var(--home-primary);
  padding: 10px 16px;
}

pre {
  overflow: auto;
  margin: 0;
  border-radius: 8px;
  background: #151515;
  color: #e5e7eb;
  line-height: 1.7;
  padding: 18px;
}

pre code {
  background: transparent;
  color: inherit;
  padding: 0;
}

.empty-doc {
  display: grid;
  min-height: 110px;
  place-items: center;
  border: 1px dashed #d1d5db;
  border-radius: 8px;
  color: #94a3b8;
  font-weight: 850;
}

.doc-code-panel {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
  contain: inline-size;
  overflow: hidden;
  border: 1px solid #111827;
  border-radius: 8px;
  background: #171717;
}

.doc-code-head {
  min-height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid #343434;
  background: #262626;
  color: #fff;
  padding: 0 18px;
}

.doc-code-head strong {
  font-size: 16px;
  font-weight: 950;
}

.doc-code-head button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1px solid #4b5563;
  border-radius: 8px;
  background: #262626;
  color: #e5e7eb;
  cursor: pointer;
  font-weight: 850;
  padding: 8px 12px;
}

.doc-code-head button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.doc-code-body {
  height: 520px;
  width: 100%;
  box-sizing: border-box;
  max-width: 100%;
  min-width: 0;
  overflow: scroll;
  background: #171717;
  padding: 24px;
  scrollbar-color: #4b5563 #171717;
  scrollbar-width: thin;
}

.doc-code-body pre {
  display: inline-block;
  width: max-content;
  max-width: none;
  min-width: 100%;
  min-height: 100%;
  border-radius: 0;
  background: transparent;
  color: #e5e7eb;
  overflow: visible;
  padding: 0;
  overflow-wrap: normal;
  white-space: pre;
  word-break: normal;
}

.example-code-panel {
  border: 1px solid #d6dee9;
  border-radius: 8px;
  background: #1f2937;
  box-shadow: 0 18px 36px rgb(15 23 42 / 12%);
}

.example-code-panel .doc-code-head {
  min-height: 56px;
  border-bottom: 1px solid #334155;
  background: #242b36;
  color: #f8fafc;
  padding: 0 18px;
}

.example-code-panel .doc-code-head strong {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  letter-spacing: 0;
}

.example-code-panel .doc-code-head strong::before {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: var(--home-primary);
  box-shadow: 0 0 0 4px rgb(var(--home-primary-rgb) / 14%);
  content: '';
}

.example-code-panel .doc-code-head button {
  border-color: #475569;
  background: #1f2937;
  color: #e5e7eb;
}

.example-code-panel .doc-code-head button:hover {
  border-color: var(--home-primary);
  color: #fff;
}

.example-code-panel .doc-code-body {
  height: 540px;
  width: 100%;
  overflow: auto;
  background: #1f2937;
  padding: 0;
  scrollbar-color: #64748b #1f2937;
  scrollbar-width: thin;
}

.example-code-panel .syntax-code-table {
  width: max-content;
  min-width: 100%;
  min-height: 100%;
  background: #1f2937;
}

.example-code-panel .syntax-line-number {
  background: #182231;
}

.example-code-panel .syntax-line-content {
  background: #1f2937;
}

.doc-code-empty {
  min-height: 360px;
  display: grid;
  place-items: center;
  border: 1px dashed #4b5563;
  border-radius: 8px;
  color: #94a3b8;
  font-weight: 850;
}

.pricing-card strong {
  display: block;
  margin-bottom: 8px;
  font-size: 28px;
  font-weight: 950;
}

.pricing-card .free {
  color: #059669;
}

.pricing-card .point {
  color: #ea580c;
}

.pricing-card .paid {
  color: #dc2626;
}

.auth-card {
  display: grid;
  gap: 12px;
}

.auth-card span {
  color: var(--home-primary);
  font-weight: 950;
}

.auth-doc-card {
  min-width: 0;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  padding: 18px;
}

.doc-card-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}

.doc-card-title svg {
  width: 20px;
  height: 20px;
  color: #111827;
}

.doc-card-title h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 950;
}

.auth-process {
  display: grid;
  gap: 12px;
}

.auth-process-item {
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr);
  gap: 14px;
  align-items: center;
  border-radius: 8px;
  background: #f8fafc;
  padding: 14px;
}

.auth-process-item em {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  background: #111827;
  color: #fff;
  font-style: normal;
  font-weight: 950;
}

.auth-process-item strong,
.secret-list strong,
.security-advice strong {
  display: block;
  color: #111827;
  font-weight: 950;
}

.auth-process-item p,
.secret-list p,
.security-advice p {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 13px;
  font-weight: 760;
  line-height: 1.7;
}

.auth-process-item.warn p {
  color: #dc2626;
}

.secret-list {
  display: grid;
  gap: 12px;
}

.secret-list > div {
  border-radius: 8px;
  background: #f8fafc;
  padding: 14px;
}

.secret-list code {
  display: inline-flex;
  margin-top: 8px;
  color: var(--home-primary);
  font-weight: 900;
}

.security-advice {
  margin-top: 14px;
  border: 1px solid #fde68a;
  border-radius: 8px;
  background: #fffbeb;
  padding: 14px;
}

.security-advice strong {
  color: #92400e;
}

.param-doc-panel,
.collapsible-panel {
  overflow: hidden;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
}

.param-panel-title {
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid #e5e7eb;
  background: #f8fafc;
  padding: 16px 18px;
}

.param-panel-title svg {
  width: 22px;
  height: 22px;
  color: #111827;
}

.param-panel-title h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 950;
}

.param-panel-title p {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 13px;
  font-weight: 760;
}

.param-table {
  overflow: hidden;
}

.param-row {
  display: grid;
  grid-template-columns: 1fr 100px 120px 80px 1.5fr;
  gap: 12px;
  align-items: center;
  border-top: 1px solid #eef2f7;
  color: #475569;
  font-size: 14px;
  font-weight: 760;
  padding: 13px 14px;
}

.param-row:first-child {
  border-top: 0;
}

.param-head {
  background: #f9fafb;
  color: #111827;
  font-weight: 950;
}

.required-tag,
.type-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 34px;
  border-radius: 6px;
  background: #fee2e2;
  color: #dc2626;
  font-size: 12px;
  font-style: normal;
  font-weight: 950;
  padding: 5px 8px;
}

.required-tag.optional {
  background: #f1f5f9;
  color: #64748b;
}

.type-tag {
  background: #f1f5f9;
  color: #475569;
}

.param-empty {
  min-height: 86px;
  display: grid;
  place-items: center;
  color: #94a3b8;
  font-weight: 850;
}

.response-fields {
  margin-top: 18px;
}

.collapse-head {
  width: 100%;
  min-height: 62px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border: 0;
  border-bottom: 1px solid #e5e7eb;
  background: #f8fafc;
  color: #111827;
  cursor: pointer;
  font-weight: 950;
  padding: 0 18px;
  text-align: left;
}

.collapse-head span,
.collapse-head em {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.collapse-head em {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  color: #475569;
  font-size: 13px;
  font-style: normal;
  padding: 8px 12px;
}

.collapse-body {
  padding: 16px 18px 18px;
}

.field-tree {
  overflow: hidden;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.field-tree-row {
  display: grid;
  grid-template-columns: minmax(160px, 0.8fr) 140px minmax(0, 1.4fr);
  gap: 16px;
  align-items: center;
  border-top: 1px solid #eef2f7;
  color: #475569;
  font-weight: 760;
  padding: 14px 16px;
}

.field-tree-row:first-child {
  border-top: 0;
}

.field-tree-head {
  background: #f9fafb;
  color: #111827;
  font-weight: 950;
}

.field-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.field-name i {
  width: 16px;
  height: 20px;
  flex: 0 0 auto;
  border-bottom: 1px solid #cbd5e1;
  border-left: 1px solid #cbd5e1;
}

.field-toggle,
.field-toggle-placeholder {
  width: 24px;
  height: 24px;
  flex: 0 0 auto;
}

.field-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  color: #111827;
  cursor: pointer;
  padding: 0;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease;
}

.field-toggle:hover {
  border-color: #dbe3ef;
  background: #f8fafc;
  color: var(--home-primary);
}

.field-toggle svg {
  width: 17px;
  height: 17px;
}

.field-tree-row p {
  margin: 0;
  line-height: 1.7;
}

.status-list div {
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f9fafb;
  padding: 12px;
}

.status-list span {
  margin: 0;
  color: #475569;
  font-weight: 760;
}

.status-list {
  flex-direction: column;
  align-items: stretch;
  gap: 10px;
}

.status-list code {
  color: var(--home-primary);
  font-weight: 950;
}

.section-note {
  margin: 14px 0 0;
  color: #64748b;
  font-size: 13px;
  font-weight: 760;
}

.test-lab {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0;
  align-items: start;
  overflow: hidden;
  border: 1px solid #dbe1ea;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 18px 42px rgb(15 23 42 / 6%);
}

.debug-card,
.result-card {
  min-width: 0;
}

.debug-card {
  border-bottom: 1px solid #dbe1ea;
  background: #fff;
}

.debug-card h3,
.result-head {
  min-height: 62px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin: 0;
  background: #f4f6f9;
  padding: 0 24px;
}

.debug-card h3,
.result-card h3 {
  margin: 0;
  color: #111827;
  font-size: 22px;
  font-weight: 950;
}

.debug-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
  padding: 24px;
}

.debug-form label {
  min-width: 0;
  display: grid;
  align-content: start;
  gap: 8px;
  color: #1f2937;
  font-size: 16px;
  font-weight: 850;
}

.field-title {
  color: #1f2937;
}

.field-title em {
  color: #dc2626;
  font-style: normal;
}

.key-helper {
  color: #64748b;
  font-size: 12px;
  font-weight: 760;
  line-height: 1.6;
}

.key-helper.warn {
  color: #dc2626;
}

.debug-form input,
.debug-form select,
.debug-form textarea {
  width: 100%;
  min-height: 48px;
  box-sizing: border-box;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #fff;
  color: #111827;
  outline: none;
  padding: 11px 12px;
}

.debug-form input[readonly] {
  background: #f9fafb;
  color: #475569;
}

.debug-form input:focus,
.debug-form select:focus,
.debug-form textarea:focus {
  border-color: var(--home-primary);
  box-shadow: 0 0 0 3px rgb(var(--home-primary-rgb) / 12%);
}

.debug-form .full {
  grid-column: 1 / -1;
}

.test-submit {
  width: 100%;
  grid-column: 1 / -1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: var(--home-primary);
  color: #fff;
  font-size: 16px;
}

.test-submit:disabled {
  cursor: wait;
  opacity: 0.72;
}

.result-card {
  display: flex;
  height: 420px;
  max-width: 100%;
  min-width: 0;
  flex-direction: column;
  background: #30363d;
}

.result-head {
  color: #111827;
}

.result-head h3 {
  flex: 0 0 auto;
  white-space: nowrap;
}

.result-toolbar {
  display: inline-flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
  color: #64748b;
  font-weight: 850;
}

.result-toolbar span,
.result-toolbar button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.result-toolbar span {
  white-space: nowrap;
}

.result-toolbar button {
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
  justify-content: center;
  padding: 0;
}

.result-screen {
  flex: 1;
  max-width: 100%;
  min-height: 0;
  min-width: 0;
  overflow: auto;
  background: #30363d;
  padding: 24px;
  scrollbar-color: #64748b #252a32;
  scrollbar-width: thin;
}

.result-screen pre,
.result-screen p {
  min-width: 100%;
  min-height: 100%;
  margin: 0;
  border-radius: 4px;
  background: #252a32;
  color: #cbd5e1;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  line-height: 1.8;
  overflow: visible;
  padding: 20px;
}

.result-screen pre {
  width: max-content;
  white-space: pre;
}

.result-screen strong {
  color: #86efac;
}

.error-result code {
  color: #fecaca;
}

.code-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.code-grid section > div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 1040px) {
  .docs-shell {
    grid-template-columns: 1fr;
  }

  .docs-sidebar {
    position: static;
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .api-summary-grid,
  .limit-grid,
  .billing-flow {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .billing-flow strong {
    grid-column: 1 / -1;
  }

  .pricing-layout,
  .auth-layout {
    grid-template-columns: 1fr;
  }

  .code-grid,
  .info-grid,
  .test-lab {
    grid-template-columns: 1fr;
  }

  .debug-card {
    border-right: 0;
    border-bottom: 1px solid #dbe1ea;
  }
}

@media (max-width: 680px) {
  .docs-toolbar,
  .docs-shell {
    width: min(100% - 24px, 1320px);
  }

  .docs-page {
    padding-top: 70px;
  }

  .docs-toolbar {
    position: sticky;
    z-index: 45;
    top: 70px;
    min-height: 58px;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 12px;
    margin-top: 16px;
    border-radius: 12px;
    box-shadow: 0 12px 28px rgb(15 23 42 / 5%);
    padding: 12px 14px;
  }

  .docs-toolbar.is-stuck {
    width: 100%;
    border-radius: 0;
    background: rgb(255 255 255 / 96%);
    box-shadow: 0 16px 30px rgb(15 23 42 / 10%);
    backdrop-filter: blur(12px);
  }

  .copy-line {
    align-items: stretch;
    flex-direction: column;
  }

  .docs-toolbar nav {
    width: auto;
    gap: 0;
  }

  .docs-toolbar nav a {
    display: none;
  }

  .docs-toolbar nav span {
    width: fit-content;
    max-width: 100%;
    overflow: hidden;
    border-bottom-width: 2px;
    padding: 0 0 8px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .back-button {
    width: 42px;
    min-width: 42px;
    min-height: 42px;
    align-self: center;
    justify-content: center;
    padding: 0;
  }

  .back-button span {
    display: none;
  }

  .docs-toolbar-actions {
    gap: 8px;
  }

  .mobile-doc-nav-trigger {
    width: 42px;
    height: 42px;
    display: inline-grid;
    cursor: pointer;
    place-items: center;
    border: 0;
    border-radius: 8px;
    background: #f3f4f6;
    color: #374151;
    font-size: 18px;
  }

  .docs-shell {
    gap: 0;
    padding: 16px 0 36px;
  }

  .docs-sidebar {
    position: fixed;
    z-index: 70;
    inset: 0 0 0 auto;
    width: min(78vw, 360px);
    height: 100dvh;
    min-height: 100vh;
    box-sizing: border-box;
    display: grid;
    grid-template-columns: 1fr;
    align-content: start;
    gap: 10px;
    border: 0;
    border-radius: 0;
    background: #fff;
    box-shadow: -18px 0 42px rgb(15 23 42 / 18%);
    opacity: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: 24px 20px calc(24px + env(safe-area-inset-bottom));
    pointer-events: none;
    transform: translateX(100%);
    transition:
      opacity 0.2s ease,
      transform 0.2s ease;
  }

  .docs-sidebar.open {
    opacity: 1;
    pointer-events: auto;
    transform: translateX(0);
  }

  .docs-sidebar-head {
    min-width: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    margin-bottom: 16px;
  }

  .docs-sidebar h3 {
    min-width: 0;
    flex: 1 1 auto;
    margin: 0;
    border-bottom: 0;
    font-size: 18px;
    line-height: 1.25;
    padding-bottom: 0;
    white-space: nowrap;
  }

  .mobile-sidebar-close {
    width: 38px;
    min-width: 38px;
    height: 38px;
    min-height: 38px;
    flex: 0 0 38px;
    display: inline-grid;
    cursor: pointer;
    place-items: center;
    border: 0;
    border-radius: 10px;
    background: #f3f4f6;
    color: #64748b;
    font-size: 18px;
  }

  .mobile-sidebar-close:hover {
    background: rgb(var(--home-primary-rgb, 37 99 235) / 10%);
    color: var(--home-primary, #2563eb);
  }

  .docs-sidebar button:not(.mobile-sidebar-close) {
    min-height: 54px;
    gap: 12px;
    border-radius: 12px;
    color: #475569;
    font-size: 15px;
    padding: 0 14px;
    white-space: nowrap;
  }

  .docs-sidebar button:not(.mobile-sidebar-close).active {
    background: var(--home-primary, #2563eb);
    color: #fff;
    box-shadow: 0 14px 26px rgb(var(--home-primary-rgb, 37 99 235) / 24%);
    transform: none;
  }

  .mobile-doc-mask {
    position: fixed;
    z-index: 60;
    inset: 0;
    display: block;
    border: 0;
    background: rgb(0 0 0 / 48%);
  }

  .docs-content {
    gap: 14px;
  }

  .api-summary-grid {
    display: none;
  }

  .limit-grid,
  .billing-flow {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .doc-section {
    border-radius: 12px;
    box-shadow: 0 12px 28px rgb(15 23 42 / 5%);
    padding: 18px 14px;
  }

  .doc-section > header {
    align-items: flex-start;
    gap: 10px;
    margin-bottom: 16px;
    border-bottom-width: 1px;
    padding-bottom: 14px;
  }

  .doc-section > header > svg {
    width: 20px;
    height: 20px;
    margin-top: 2px;
  }

  .doc-section h1,
  .doc-section h2 {
    font-size: 20px;
  }

  .doc-section header p,
  .info-card p,
  .auth-card p,
  .return-type span {
    font-size: 13px;
    line-height: 1.7;
  }

  .notice-box {
    width: 100%;
    grid-template-columns: 24px minmax(0, 1fr);
    gap: 10px;
    border-radius: 12px;
    padding: 14px;
  }

  .notice-box svg {
    font-size: 20px;
  }

  .summary-card,
  .limit-card {
    border-radius: 12px;
    padding: 14px;
  }

  .summary-card strong,
  .limit-card strong {
    font-size: 16px;
  }

  .info-card,
  .pricing-card,
  .auth-card {
    border-radius: 12px;
    margin-top: 12px;
    padding: 16px;
  }

  .info-card h3 {
    margin-bottom: 10px;
    font-size: 16px;
  }

  .trend-summary {
    align-items: flex-start;
    flex-direction: column;
    gap: 6px;
  }

  .trend-bars {
    height: 156px;
    gap: 8px;
    padding-top: 14px;
  }

  .trend-bars div {
    grid-template-rows: 20px 1fr 20px;
    font-size: 11px;
  }

  .trend-bars i {
    max-width: 24px;
  }

  .copy-line code {
    width: 100%;
  }

  .copy-line button {
    width: fit-content;
  }

  .debug-form {
    grid-template-columns: 1fr;
  }

  .example-overview {
    grid-template-columns: 1fr;
  }

  .example-overview > div:nth-child(3) {
    grid-column: auto;
  }

  .result-card {
    height: 380px;
  }

  .result-head {
    gap: 10px;
    padding: 0 16px;
  }

  .result-toolbar {
    gap: 10px;
  }

  .result-toolbar span {
    font-size: 13px;
  }

  .response-preview-card .doc-code-body {
    height: 320px;
  }

  .param-table {
    overflow-x: auto;
    scrollbar-width: thin;
  }

  .param-row {
    min-width: 480px;
    grid-template-columns: 84px 64px 64px 48px minmax(180px, 1fr);
    gap: 10px;
    font-size: 13px;
    padding: 12px;
  }

  .param-head {
    display: grid;
  }

  .field-tree {
    overflow-x: auto;
    background: transparent;
    scrollbar-width: thin;
  }

  .field-tree-row {
    min-width: 480px;
    grid-template-columns: minmax(180px, 0.9fr) 72px minmax(180px, 1.2fr);
    gap: 10px;
    font-size: 13px;
    padding: 12px;
  }

  .field-tree-head {
    display: grid;
  }

  .collapse-head {
    align-items: stretch;
    flex-direction: column;
    padding: 14px 18px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .docs-toolbar {
    transition: none;
  }
}
</style>
