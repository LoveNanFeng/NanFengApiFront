<script lang="ts" setup>
import type { InterfaceApi } from '#/api/interface';

import { computed, reactive, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import { Button, Input, Select, Switch, Tag, message } from 'ant-design-vue';

import { getInterfaceDoc, updateInterfaceDoc } from '#/api/interface';

type DocParameter = {
  description: string;
  exampleValue: string;
  id: string;
  location: 'Body' | 'Header' | 'Path' | 'Query';
  name: string;
  placeholder: string;
  required: boolean;
  type: string;
};

type DocResponseField = {
  description: string;
  id: string;
  name: string;
  type: string;
};

type DocStatusCode = {
  code: string;
  description: string;
  id: string;
};

const emits = defineEmits(['success']);

const Textarea = Input.TextArea;

const rowSeed = ref(0);
const formData = ref<InterfaceApi.InterfaceDocConfig>();
const id = ref<string>();
const requestParams = ref<DocParameter[]>([]);
const responseFields = ref<DocResponseField[]>([]);
const statusCodes = ref<DocStatusCode[]>([]);
const templateParameters = ref<string[]>([]);

const baseForm = reactive({
  docNotice: '',
  docPreferredMethod: '' as '' | InterfaceApi.InvokeMethod,
  docResponseExample: '',
  docResponseType: 'JSON' as NonNullable<
    InterfaceApi.InterfaceDocConfig['docResponseType']
  >,
  docSummary: '',
});

const responseTypeOptions = [
  { label: 'JSON', value: 'JSON' },
  { label: 'TEXT', value: 'TEXT' },
  { label: 'XML', value: 'XML' },
  { label: 'HTML', value: 'HTML' },
  { label: 'FILE', value: 'FILE' },
];

const locationOptions = [
  { label: 'Query 查询参数', value: 'Query' },
  { label: 'Body 请求体', value: 'Body' },
  { label: 'Header 请求头', value: 'Header' },
  { label: 'Path 路径参数', value: 'Path' },
];

const typeOptions = [
  { label: 'string 字符串', value: 'string' },
  { label: 'number 数字', value: 'number' },
  { label: 'boolean 布尔值', value: 'boolean' },
  { label: 'object 对象', value: 'object' },
  { label: 'array 数组', value: 'array' },
  { label: 'file 文件', value: 'file' },
];

const preferredMethodOptions = computed(() => {
  const method = formData.value?.requestMethod;
  const options = [{ label: '跟随接口方式', value: '' }];
  if (method === 'GET_POST') {
    options.push({ label: 'GET', value: 'GET' }, { label: 'POST', value: 'POST' });
    return options;
  }
  if (method === 'GET' || method === 'POST') {
    options.push({ label: method, value: method });
  }
  return options;
});

const interfaceMeta = computed(() => {
  const data = formData.value;
  if (!data) return '';
  const code = data.apiCode ? `编码：${data.apiCode}` : '';
  const method = data.requestMethod
    ? `方式：${data.requestMethod === 'GET_POST' ? 'GET/POST' : data.requestMethod}`
    : '';
  return [code, method].filter(Boolean).join(' / ');
});

const hasTemplateParameters = computed(
  () => templateParameters.value.length > 0,
);

const [Drawer, drawerApi] = useVbenDrawer({
  class: 'w-220! max-w-[calc(100vw-32px)]!',

  async onConfirm() {
    if (!id.value) return;

    const payload = buildPayload();
    if (!payload) return;

    drawerApi.lock();
    updateInterfaceDoc(id.value, payload)
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

    const row = drawerApi.getData<InterfaceApi.InterfaceItem>();
    resetState(row);

    if (!row?.id) return;

    const data = await getInterfaceDoc(row.id);
    formData.value = data;
    baseForm.docSummary = data.docSummary ?? '';
    baseForm.docResponseType = data.docResponseType ?? 'JSON';
    baseForm.docPreferredMethod = data.docPreferredMethod ?? '';
    baseForm.docResponseExample = data.docResponseExample ?? '';
    baseForm.docNotice = data.docNotice ?? '';
    templateParameters.value = normalizeNames(
      data.templateParameters?.length
        ? data.templateParameters
        : parameterNamesFromTemplate(data.requestUrl || row.requestUrl || ''),
    );
    requestParams.value = parseRequestParams(data.docRequestParams);
    responseFields.value = parseResponseFields(data.docResponseFields);
    statusCodes.value = parseStatusCodes(data.docStatusCodes);
    fillTemplateParameters(false);
  },
});

const drawerTitle = computed(() =>
  formData.value?.name ? `接口文档 - ${formData.value.name}` : '接口文档',
);

function resetState(row?: InterfaceApi.InterfaceItem) {
  id.value = row?.id;
  formData.value = row;
  baseForm.docSummary = '';
  baseForm.docResponseType = 'JSON';
  baseForm.docPreferredMethod = '';
  baseForm.docResponseExample = '';
  baseForm.docNotice = '';
  requestParams.value = [];
  responseFields.value = [];
  statusCodes.value = [];
  templateParameters.value = [];
}

function rowId() {
  rowSeed.value += 1;
  return `doc-row-${Date.now()}-${rowSeed.value}`;
}

function createRequestParam(name = ''): DocParameter {
  return {
    description: name ? `${name} 参数` : '',
    exampleValue: '',
    id: rowId(),
    location: 'Query',
    name,
    placeholder: name ? `请输入 ${name}` : '',
    required: true,
    type: 'string',
  };
}

function createResponseField(): DocResponseField {
  return {
    description: '',
    id: rowId(),
    name: '',
    type: 'string',
  };
}

function createStatusCode(code = '', description = ''): DocStatusCode {
  return {
    code,
    description,
    id: rowId(),
  };
}

function addRequestParam() {
  requestParams.value.push(createRequestParam());
}

function addResponseField() {
  responseFields.value.push(createResponseField());
}

function addStatusCode() {
  statusCodes.value.push(createStatusCode());
}

function removeRequestParam(index: number) {
  requestParams.value.splice(index, 1);
}

function removeResponseField(index: number) {
  responseFields.value.splice(index, 1);
}

function removeStatusCode(index: number) {
  statusCodes.value.splice(index, 1);
}

function fillTemplateParameters(showTip = true) {
  const existed = new Set(
    requestParams.value.map((item) => item.name.trim()).filter(Boolean),
  );
  const added = templateParameters.value.filter((name) => !existed.has(name));
  requestParams.value.push(...added.map((name) => createRequestParam(name)));
  if (showTip) {
    message.success(
      added.length > 0
        ? `已添加 ${added.length} 个接口地址占位符参数`
        : '接口地址里的占位符参数已存在',
    );
  }
}

function fillCommonStatusCodes() {
  statusCodes.value = [
    createStatusCode('200', '调用成功'),
    createStatusCode('401', '接口密钥无效'),
    createStatusCode('403', '余额、点数或套餐不足'),
    createStatusCode('429', '调用频率超过限制'),
    createStatusCode('500', '服务异常'),
  ];
}

function fillSuccessExample() {
  baseForm.docResponseExample = JSON.stringify(
    {
      code: 200,
      data: {},
      msg: '请求成功',
    },
    null,
    2,
  );
}

function formatResponseExample() {
  const text = baseForm.docResponseExample.trim();
  if (!text) return;
  try {
    baseForm.docResponseExample = JSON.stringify(JSON.parse(text), null, 2);
    message.success('返回预览已格式化');
  } catch {
    message.warning('返回预览不是合法 JSON，已保持原文');
  }
}

function buildPayload(): InterfaceApi.InterfaceDocConfig | undefined {
  const params = normalizeRequestParams();
  const fields = normalizeResponseFields();
  const codes = normalizeStatusCodes();
  if (!params || !fields || !codes) return undefined;

  return {
    docNotice: blankToUndefined(baseForm.docNotice),
    docPreferredMethod: baseForm.docPreferredMethod || '',
    docRequestParams: params.length > 0 ? JSON.stringify(params, null, 2) : '',
    docResponseExample: blankToUndefined(baseForm.docResponseExample),
    docResponseFields: fields.length > 0 ? JSON.stringify(fields, null, 2) : '',
    docResponseType: baseForm.docResponseType || 'JSON',
    docStatusCodes: codes.length > 0 ? JSON.stringify(codes, null, 2) : '',
    docSummary: blankToUndefined(baseForm.docSummary),
  };
}

function normalizeRequestParams() {
  const result = [];
  for (const item of requestParams.value) {
    const name = item.name.trim();
    const description = item.description.trim();
    const exampleValue = item.exampleValue.trim();
    const placeholder = item.placeholder.trim();
    const touched = name || description || exampleValue || placeholder;
    if (!touched) continue;
    if (!name) {
      message.error('请求参数里有一行缺少参数名');
      return undefined;
    }
    result.push({
      description,
      exampleValue,
      location: item.location || 'Query',
      name,
      placeholder,
      required: !!item.required,
      type: item.type || 'string',
    });
  }
  return result;
}

function normalizeResponseFields() {
  const result = [];
  for (const item of responseFields.value) {
    const name = item.name.trim();
    const description = item.description.trim();
    const touched = name || description;
    if (!touched) continue;
    if (!name) {
      message.error('返回字段里有一行缺少字段名');
      return undefined;
    }
    result.push({
      description,
      name,
      type: item.type || 'string',
    });
  }
  return result;
}

function normalizeStatusCodes() {
  const result = [];
  for (const item of statusCodes.value) {
    const code = item.code.trim();
    const description = item.description.trim();
    const touched = code || description;
    if (!touched) continue;
    if (!code) {
      message.error('状态码里有一行缺少状态码');
      return undefined;
    }
    result.push({
      code: Number.isNaN(Number(code)) ? code : Number(code),
      description,
    });
  }
  return result;
}

function parseRequestParams(text?: string): DocParameter[] {
  return parseArray(text).map((item) => ({
    description: stringValue(item.description),
    exampleValue: stringValue(item.exampleValue),
    id: rowId(),
    location: normalizeLocation(item.location),
    name: stringValue(item.name),
    placeholder: stringValue(item.placeholder),
    required: item.required !== false,
    type: stringValue(item.type) || 'string',
  }));
}

function parseResponseFields(text?: string): DocResponseField[] {
  return parseArray(text).map((item) => ({
    description: stringValue(item.description),
    id: rowId(),
    name: stringValue(item.name),
    type: stringValue(item.type) || 'string',
  }));
}

function parseStatusCodes(text?: string): DocStatusCode[] {
  return parseArray(text).map((item) => ({
    code: stringValue(item.code),
    description: stringValue(item.description),
    id: rowId(),
  }));
}

function parseArray(text?: string): Record<string, any>[] {
  if (!text || !text.trim()) return [];
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parameterNamesFromTemplate(template: string) {
  const names: string[] = [];
  const regex = /\{([A-Za-z][A-Za-z0-9_]*)\}/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(template))) {
    const before = template.slice(0, match.index);
    const queryKey = before.match(/[?&]([^=&?#]+)=$/)?.[1];
    names.push(queryKey ? decodeURIComponent(queryKey) : match[1] || '');
  }
  return normalizeNames(names);
}

function normalizeNames(names: string[] = []) {
  return [...new Set(names.map((name) => name.trim()).filter(Boolean))].filter(
    (name) => name !== 'key',
  );
}

function normalizeLocation(value: any): DocParameter['location'] {
  const text = stringValue(value).toLowerCase();
  if (text === 'body') return 'Body';
  if (text === 'header') return 'Header';
  if (text === 'path') return 'Path';
  return 'Query';
}

function blankToUndefined(value: string) {
  const text = value.trim();
  return text || undefined;
}

function stringValue(value: any) {
  return value === undefined || value === null ? '' : String(value);
}
</script>

<template>
  <Drawer :title="drawerTitle">
    <div class="doc-config">
      <div class="doc-hero">
        <div>
          <div class="doc-hero__title">公开接口文档配置</div>
          <div class="doc-hero__desc">
            这里配置给前台用户看的接口说明，不影响接口真实转发地址和计费规则。
          </div>
          <div v-if="interfaceMeta" class="doc-hero__meta">{{ interfaceMeta }}</div>
        </div>
        <Tag color="blue">可视化填写</Tag>
      </div>

      <section class="doc-section">
        <div class="doc-section__head">
          <div>
            <h3>基础展示</h3>
            <p>控制公开文档顶部的描述、返回类型和推荐请求方式。</p>
          </div>
        </div>
        <div class="doc-form-grid">
          <label class="doc-field doc-field--full">
            <span>文档描述</span>
            <Textarea
              v-model:value="baseForm.docSummary"
              :rows="3"
              placeholder="例如：高精度图片文字识别，支持多语言与多场景。"
            />
          </label>
          <label class="doc-field">
            <span>返回方式</span>
            <Select
              v-model:value="baseForm.docResponseType"
              :options="responseTypeOptions"
            />
          </label>
          <label class="doc-field">
            <span>推荐请求方式</span>
            <Select
              v-model:value="baseForm.docPreferredMethod"
              :options="preferredMethodOptions"
            />
          </label>
        </div>
      </section>

      <section class="doc-section">
        <div class="doc-section__head">
          <div>
            <h3>请求参数</h3>
            <p>用户调用接口时需要传的业务参数；接口密钥 key 会由系统自动展示。</p>
          </div>
          <div class="doc-actions">
            <Button v-if="hasTemplateParameters" @click="fillTemplateParameters()">
              从接口地址识别
            </Button>
            <Button type="primary" @click="addRequestParam">添加参数</Button>
          </div>
        </div>
        <div v-if="hasTemplateParameters" class="doc-tip">
          已识别接口地址占位符：
          <Tag v-for="name in templateParameters" :key="name" color="green">
            {{ name }}
          </Tag>
        </div>
        <div class="visual-table visual-table--params">
          <div class="visual-table__head">
            <span>参数名</span>
            <span>位置</span>
            <span>类型</span>
            <span>必填</span>
            <span></span>
          </div>
          <div
            v-for="(item, index) in requestParams"
            :key="item.id"
            class="visual-table__row"
          >
            <div class="param-main">
              <Input v-model:value="item.name" placeholder="url" />
              <Select v-model:value="item.location" :options="locationOptions" />
              <Select v-model:value="item.type" :options="typeOptions" />
              <Switch v-model:checked="item.required" />
              <Button danger type="link" @click="removeRequestParam(index)">
                删除
              </Button>
            </div>
            <div class="param-extra">
              <label>
                <span>在线测试默认值</span>
                <Input
                  v-model:value="item.exampleValue"
                  placeholder="留空则在线测试不自动填写"
                />
              </label>
              <label>
                <span>输入提示文字</span>
                <Input
                  v-model:value="item.placeholder"
                  placeholder="例如：请输入短视频链接"
                />
              </label>
              <label>
                <span>参数说明</span>
                <Input
                  v-model:value="item.description"
                  placeholder="展示在参数文档里的说明"
                />
              </label>
            </div>
          </div>
          <div v-if="requestParams.length === 0" class="visual-empty">
            暂未配置业务参数。接口只有 key 时可以留空，需要参数时点击“添加参数”。
          </div>
        </div>
      </section>

      <section class="doc-section">
        <div class="doc-section__head">
          <div>
            <h3>返回字段</h3>
            <p>告诉用户响应里的字段含义，只用于文档展示。</p>
          </div>
          <Button type="primary" @click="addResponseField">添加字段</Button>
        </div>
        <div class="visual-table visual-table--fields">
          <div class="visual-table__head">
            <span>字段名</span>
            <span>类型</span>
            <span>说明</span>
            <span></span>
          </div>
          <div
            v-for="(item, index) in responseFields"
            :key="item.id"
            class="visual-table__row"
          >
            <Input v-model:value="item.name" placeholder="data.url" />
            <Select v-model:value="item.type" :options="typeOptions" />
            <Input
              v-model:value="item.description"
              placeholder="返回字段说明"
            />
            <Button danger type="link" @click="removeResponseField(index)">
              删除
            </Button>
          </div>
          <div v-if="responseFields.length === 0" class="visual-empty">
            暂未配置返回字段。公开文档仍会展示基础说明。
          </div>
        </div>
      </section>

      <section class="doc-section">
        <div class="doc-section__head">
          <div>
            <h3>返回预览</h3>
            <p>可以放真实或脱敏后的响应示例，帮助用户快速理解结果。</p>
          </div>
          <div class="doc-actions">
            <Button @click="fillSuccessExample">填入示例</Button>
            <Button @click="formatResponseExample">格式化 JSON</Button>
          </div>
        </div>
        <Textarea
          v-model:value="baseForm.docResponseExample"
          :rows="8"
          placeholder='{"code":200,"msg":"请求成功","data":{}}'
        />
      </section>

      <section class="doc-section">
        <div class="doc-section__head">
          <div>
            <h3>状态码</h3>
            <p>自定义公开文档中的状态码说明，未配置时使用系统通用状态码。</p>
          </div>
          <div class="doc-actions">
            <Button @click="fillCommonStatusCodes">填入常用状态码</Button>
            <Button type="primary" @click="addStatusCode">添加状态码</Button>
          </div>
        </div>
        <div class="visual-table visual-table--status">
          <div class="visual-table__head">
            <span>状态码</span>
            <span>说明</span>
            <span></span>
          </div>
          <div
            v-for="(item, index) in statusCodes"
            :key="item.id"
            class="visual-table__row"
          >
            <Input v-model:value="item.code" placeholder="200" />
            <Input v-model:value="item.description" placeholder="调用成功" />
            <Button danger type="link" @click="removeStatusCode(index)">
              删除
            </Button>
          </div>
          <div v-if="statusCodes.length === 0" class="visual-empty">
            暂未自定义状态码，将使用系统默认状态码说明。
          </div>
        </div>
      </section>

      <section class="doc-section">
        <div class="doc-section__head">
          <div>
            <h3>文档提示</h3>
            <p>可填写免责声明、使用限制或注意事项。</p>
          </div>
        </div>
        <Textarea
          v-model:value="baseForm.docNotice"
          :rows="3"
          placeholder="例如：请勿用于违法用途，调用结果以第三方接口实时返回为准。"
        />
      </section>
    </div>
  </Drawer>
</template>

<style scoped>
.doc-config {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-bottom: 16px;
}

.doc-hero,
.doc-section {
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
  background: hsl(var(--background));
}

.doc-hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 16px;
}

.doc-hero__title {
  color: hsl(var(--foreground));
  font-size: 18px;
  font-weight: 700;
}

.doc-hero__desc,
.doc-hero__meta,
.doc-section__head p,
.doc-tip,
.visual-empty {
  color: hsl(var(--muted-foreground));
  font-size: 13px;
}

.doc-hero__desc {
  margin-top: 6px;
}

.doc-hero__meta {
  margin-top: 8px;
}

.doc-section {
  padding: 16px;
}

.doc-section__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
}

.doc-section__head h3 {
  margin: 0;
  color: hsl(var(--foreground));
  font-size: 16px;
  font-weight: 700;
}

.doc-section__head p {
  margin: 5px 0 0;
}

.doc-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.doc-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.doc-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: hsl(var(--foreground));
  font-size: 14px;
  font-weight: 600;
}

.doc-field--full {
  grid-column: 1 / -1;
}

.doc-tip {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  padding: 10px 12px;
  margin-bottom: 12px;
  border: 1px dashed hsl(var(--primary) / 35%);
  border-radius: 8px;
  background: hsl(var(--primary) / 5%);
}

.visual-table {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.visual-table__head,
.visual-table__row {
  display: grid;
  align-items: center;
  gap: 8px;
}

.visual-table__head {
  color: hsl(var(--muted-foreground));
  font-size: 12px;
  font-weight: 700;
}

.visual-table__row {
  padding: 10px;
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
  background: hsl(var(--muted) / 35%);
}

.visual-table__row > * {
  min-width: 0;
}

.visual-table__row :deep(.ant-btn) {
  white-space: nowrap;
}

.visual-table--params .visual-table__head,
.visual-table--params .visual-table__row {
  grid-template-columns:
    minmax(132px, 1fr) minmax(150px, 1fr) minmax(140px, 0.9fr)
    76px 56px;
}

.visual-table--params .visual-table__row {
  display: block;
}

.param-main {
  display: grid;
  grid-template-columns:
    minmax(132px, 1fr) minmax(150px, 1fr) minmax(140px, 0.9fr)
    76px 56px;
  align-items: center;
  gap: 8px;
}

.param-main > * {
  min-width: 0;
}

.param-extra {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  padding-top: 10px;
  margin-top: 10px;
  border-top: 1px dashed hsl(var(--border));
}

.param-extra label {
  display: grid;
  gap: 6px;
  color: hsl(var(--muted-foreground));
  font-size: 12px;
  font-weight: 700;
}

.visual-table--fields .visual-table__head,
.visual-table--fields .visual-table__row {
  grid-template-columns: minmax(130px, 1fr) 120px minmax(180px, 1.5fr) 48px;
}

.visual-table--status .visual-table__head,
.visual-table--status .visual-table__row {
  grid-template-columns: 120px minmax(180px, 1fr) 48px;
}

.visual-empty {
  padding: 18px;
  border: 1px dashed hsl(var(--border));
  border-radius: 8px;
  text-align: center;
}

.doc-config :deep(.ant-input),
.doc-config :deep(.ant-select),
.doc-config :deep(.ant-select-selector) {
  width: 100%;
}

@media (max-width: 1120px) {
  .doc-form-grid,
  .visual-table__head,
  .visual-table__row,
  .param-extra,
  .param-main {
    grid-template-columns: 1fr !important;
  }

  .visual-table__head {
    display: none;
  }
}
</style>
