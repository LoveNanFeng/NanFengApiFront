<script lang="ts" setup>
import { onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import { Button, Card, Empty, Spin, Tag } from 'ant-design-vue';

import { getMarketApiDetail, getMarketApiTestKey } from '#/api';

interface ApiDetail {
  apiCode: string;
  auth: { description: string; location: string; name: string; type: string };
  avatarUrl: string;
  callCount: number;
  callTrend7d: TrendItem[];
  category: string;
  description: string;
  gatewayPath: string;
  gatewayUrlTemplate: string;
  id: number;
  name: string;
  notice: string;
  parameters: ParameterItem[];
  pointPrice: number;
  preferredMethod: string;
  price: number;
  priceLabel: string;
  pricing: { description: string; label: string };
  requestMethod: string;
  responseExample: string;
  responseFields: any[];
  responseType: string;
  statusCodes: StatusCodeItem[];
  templateParameters: string[];
}

interface ParameterItem {
  description: string;
  exampleValue?: string;
  location: string;
  name: string;
  required: boolean;
  type: string;
}

interface StatusCodeItem {
  code: number;
  description: string;
}

interface TrendItem {
  date: string;
  label: string;
  value: number;
}

const route = useRoute();
const router = useRouter();
const detail = ref<ApiDetail | null>(null);
const loading = ref(false);
const testKey = ref('');
const testParams = ref<Record<string, string>>({});
const testMethod = ref('GET');
const testResult = ref('');
const testStatus = ref(0);
const testElapsed = ref(0);
const testLoading = ref(false);

async function loadDetail() {
  const id = Number(route.params.id);
  if (!id) return;
  loading.value = true;
  try {
    const data = (await getMarketApiDetail(id)) as any;
    detail.value = data as ApiDetail;
    testMethod.value = data.preferredMethod || data.requestMethod || 'GET';
    testParams.value = {};
    testResult.value = '';
  } finally {
    loading.value = false;
  }
}

async function loadTestKey() {
  if (!detail.value) return;
  try {
    const res = (await getMarketApiTestKey(detail.value.id)) as any;
    if (res?.hasKey) testKey.value = res.secretKey || '';
  } catch {
    /* ignore */
  }
}

function methodColor(m: string): string {
  if (m === 'GET') return 'green';
  if (m === 'POST') return 'blue';
  return 'purple';
}

function compactNumber(n: number): string {
  if (n >= 10_000) return `${(n / 10_000).toFixed(1)}万`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

async function handleTest() {
  if (!detail.value) return;
  testLoading.value = true;
  testResult.value = '';
  try {
    const queryParts: string[] = [`key=${encodeURIComponent(testKey.value)}`];
    for (const p of detail.value.templateParameters || []) {
      const v = testParams.value[p] || '';
      queryParts.push(`${encodeURIComponent(p)}=${encodeURIComponent(v)}`);
    }
    const url = `${detail.value.gatewayPath}?${queryParts.join('&')}`;
    const start = Date.now();
    const fetchOpts: RequestInit = { method: testMethod.value };
    if (testMethod.value === 'POST') {
      fetchOpts.headers = { 'Content-Type': 'application/json' };
      fetchOpts.body = '{}';
    }
    const resp = await fetch(url, fetchOpts);
    const text = await resp.text();
    testStatus.value = resp.status;
    testElapsed.value = Date.now() - start;
    try {
      testResult.value = JSON.stringify(JSON.parse(text), null, 2);
    } catch {
      testResult.value = text;
    }
  } catch (error: any) {
    testResult.value = `请求失败: ${error.message}`;
    testStatus.value = 0;
  } finally {
    testLoading.value = false;
  }
}

function goBack() {
  router.push({ name: 'InterfaceMarket' });
}

watch(
  () => route.params.id,
  () => {
    if (route.params.id) loadDetail();
  },
);
onMounted(async () => {
  await loadDetail();
  await loadTestKey();
});
</script>

<template>
  <Page auto-content-height>
    <Spin :spinning="loading">
      <template v-if="detail">
        <Button class="mb-4" @click="goBack">← 返回接口列表</Button>

        <!-- basic info -->
        <Card class="mb-4">
          <div class="flex items-start gap-4">
            <div class="flex-1">
              <div class="mb-2 flex items-center gap-2">
                <Tag :color="methodColor(detail.requestMethod)">
                  {{ detail.requestMethod }}
                </Tag>
                <span
                  v-if="detail.preferredMethod"
                  class="text-xs text-gray-400"
                >
                  推荐 {{ detail.preferredMethod }}
                </span>
                <Tag :color="detail.priceLabel === '免费' ? 'green' : 'orange'">
                  {{ detail.priceLabel }}
                </Tag>
              </div>
              <h2 class="text-xl font-bold">{{ detail.name }}</h2>
              <p class="mt-1 text-gray-500">{{ detail.description }}</p>
              <div class="mt-2 text-sm text-gray-400">
                调用次数：{{ compactNumber(detail.callCount) }}
              </div>
            </div>
          </div>
        </Card>

        <!-- gateway info -->
        <Card title="接口地址" class="mb-4">
          <div class="rounded bg-gray-50 p-3 font-mono text-sm">
            {{ detail.gatewayUrlTemplate }}
          </div>
          <p class="mt-2 text-sm text-gray-500">
            {{ detail.auth?.description }}
          </p>
        </Card>

        <!-- pricing -->
        <Card title="计费说明" class="mb-4">
          <p>{{ detail.pricing?.description }}</p>
          <p class="mt-1 text-sm text-gray-500">
            计费顺序：会员套餐 → 接口套餐 → 点数 → 余额
          </p>
        </Card>

        <!-- request params -->
        <Card v-if="detail.parameters?.length" title="请求参数" class="mb-4">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b text-left">
                <th class="py-2">参数名</th>
                <th class="py-2">位置</th>
                <th class="py-2">类型</th>
                <th class="py-2">必填</th>
                <th class="py-2">说明</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in detail.parameters" :key="p.name" class="border-b">
                <td class="py-2 font-mono">{{ p.name }}</td>
                <td class="py-2">{{ p.location }}</td>
                <td class="py-2">{{ p.type }}</td>
                <td class="py-2">
                  <Tag :color="p.required ? 'red' : 'default'">
                    {{ p.required ? '是' : '否' }}
                  </Tag>
                </td>
                <td class="py-2 text-gray-500">{{ p.description }}</td>
              </tr>
            </tbody>
          </table>
        </Card>

        <!-- status codes -->
        <Card v-if="detail.statusCodes?.length" title="状态码" class="mb-4">
          <div
            v-for="sc in detail.statusCodes"
            :key="sc.code"
            class="mb-1 text-sm"
          >
            <Tag
              :color="
                sc.code === 200 ? 'green' : sc.code >= 400 ? 'red' : 'orange'
              "
            >
              {{ sc.code }}
            </Tag>
            <span class="text-gray-500">{{ sc.description }}</span>
          </div>
        </Card>

        <!-- response example -->
        <Card v-if="detail.responseExample" title="返回示例" class="mb-4">
          <pre
            class="max-h-96 overflow-auto rounded bg-gray-900 p-4 text-xs text-green-400"
            >{{ detail.responseExample }}</pre>
        </Card>

        <!-- online test -->
        <Card title="在线测试" class="mb-4">
          <div class="mb-3 flex items-center gap-3">
            <span class="text-sm text-gray-500">请求方式：</span>
            <Tag :color="methodColor(testMethod)">{{ testMethod }}</Tag>
          </div>
          <div v-if="detail.templateParameters?.length" class="mb-3 space-y-2">
            <div
              v-for="p in detail.templateParameters"
              :key="p"
              class="flex items-center gap-2"
            >
              <span class="w-24 text-sm text-gray-500">{{ p }}：</span>
              <input
                v-model="testParams[p]"
                class="flex-1 rounded border px-2 py-1 text-sm"
                :placeholder="`请输入 ${p}`"
              />
            </div>
          </div>
          <Button type="primary" :loading="testLoading" @click="handleTest">
            发送请求
          </Button>
          <div v-if="testResult" class="mt-3">
            <div class="mb-1 text-sm text-gray-500">
              状态: {{ testStatus }} | 耗时: {{ testElapsed }}ms
            </div>
            <pre
              class="max-h-96 overflow-auto rounded bg-gray-900 p-4 text-xs text-green-400"
              >{{ testResult }}</pre>
          </div>
        </Card>

        <!-- notice -->
        <Card v-if="detail.notice" title="注意事项" class="mb-4">
          <p class="text-sm text-gray-500">{{ detail.notice }}</p>
        </Card>
      </template>
      <Empty v-else description="接口不存在" />
    </Spin>
  </Page>
</template>
