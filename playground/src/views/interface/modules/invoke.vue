<script lang="ts" setup>
import type { InterfaceApi } from '#/api/interface';

import { computed, nextTick, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { invokeInterface } from '#/api/interface';
import { $t } from '#/locales';

import { invokeMethodOptions, useInvokeSchema } from '../data';

const current = ref<InterfaceApi.InterfaceItem>();
const result = ref<InterfaceApi.InvokeResult>();

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
  },
  layout: 'horizontal',
  schema: useInvokeSchema(),
  showDefaultActions: false,
});

const [Drawer, drawerApi] = useVbenDrawer({
  async onConfirm() {
    if (!current.value) return;
    const { valid } = await formApi.validate();
    if (!valid) return;

    const values = await formApi.getValues<any>();
    let body: Record<string, any>;
    let queryParams: Record<string, any>;
    try {
      body = parseJsonObject(
        values.bodyText,
        $t('system.interface.bodyParams'),
      );
      queryParams = parseJsonObject(
        values.queryParamsText,
        $t('system.interface.queryParams'),
      );
    } catch {
      return;
    }
    const payload: InterfaceApi.InvokePayload = {
      body,
      method: values.method,
      queryParams,
    };

    drawerApi.lock();
    try {
      result.value = await invokeInterface(current.value.id, payload);
      message.success($t('system.interface.invokeSuccess'));
    } finally {
      drawerApi.unlock();
    }
  },

  async onOpenChange(isOpen) {
    if (!isOpen) return;

    const data = drawerApi.getData<InterfaceApi.InterfaceItem>();
    current.value = data;
    result.value = undefined;
    formApi.resetForm();

    await nextTick();
    const options =
      data.requestMethod === 'GET_POST'
        ? invokeMethodOptions
        : invokeMethodOptions.filter((item) => item.value === data.requestMethod);
    formApi.updateSchema([
      {
        componentProps: {
          disabled: data.requestMethod !== 'GET_POST',
          options,
        },
        fieldName: 'method',
      },
    ]);
    formApi.setValues({
      bodyText: '',
      method: data.requestMethod === 'POST' ? 'POST' : 'GET',
      queryParamsText: buildQueryParamExample(data.requestUrl),
    });
  },
});

const drawerTitle = computed(() =>
  $t('system.interface.invokeTitle', [current.value?.name ?? '']),
);

function parseJsonObject(value: string | undefined, fieldName: string) {
  const text = String(value ?? '').trim();
  if (!text) {
    return {};
  }
  try {
    const parsed = JSON.parse(text);
    if (
      parsed === null ||
      typeof parsed !== 'object' ||
      Array.isArray(parsed)
    ) {
      throw new Error('not object');
    }
    return parsed;
  } catch {
    message.warning($t('system.interface.jsonObjectRequired', [fieldName]));
    throw new Error('invalid json');
  }
}

function buildQueryParamExample(requestUrl?: string) {
  const keys = extractTemplateParamKeys(requestUrl);
  if (keys.length === 0) {
    return '';
  }
  const params = keys.reduce<Record<string, string>>((result, key) => {
    result[key] = key.toLowerCase().includes('url')
      ? 'https://example.com'
      : 'test';
    return result;
  }, {});
  return JSON.stringify(params, null, 2);
}

function extractTemplateParamKeys(requestUrl?: string) {
  const template = String(requestUrl ?? '');
  const keys: string[] = [];
  const placeholderReg = /\{([A-Za-z][\w]*)}/g;
  let match: null | RegExpExecArray;
  while ((match = placeholderReg.exec(template))) {
    const placeholder = match[1];
    const queryKey =
      placeholder === 'text'
        ? queryKeyBeforePlaceholder(template, match.index)
        : placeholder;
    if (queryKey && !keys.includes(queryKey)) {
      keys.push(queryKey);
    }
  }
  return keys;
}

function queryKeyBeforePlaceholder(template: string, placeholderIndex: number) {
  const equalsIndex = template.lastIndexOf('=', placeholderIndex);
  if (equalsIndex < 0) return '';
  const questionIndex = template.lastIndexOf('?', equalsIndex);
  const ampIndex = template.lastIndexOf('&', equalsIndex);
  const startIndex = Math.max(questionIndex, ampIndex) + 1;
  if (startIndex <= 0 || startIndex >= equalsIndex) return '';
  const key = template.slice(startIndex, equalsIndex);
  if (key.includes('=')) return '';
  try {
    return decodeURIComponent(key);
  } catch {
    return key;
  }
}
</script>

<template>
  <Drawer :title="drawerTitle">
    <Form />
    <div v-if="result" class="mt-4 rounded-md border p-4">
      <div class="mb-3 grid grid-cols-4 gap-3 text-sm">
        <div>
          <div class="text-muted-foreground">
            {{ $t('system.interface.statusCode') }}
          </div>
          <div class="font-medium">{{ result.statusCode }}</div>
        </div>
        <div>
          <div class="text-muted-foreground">
            {{ $t('system.interface.elapsedMs') }}
          </div>
          <div class="font-medium">{{ result.elapsedMs }}ms</div>
        </div>
        <div>
          <div class="text-muted-foreground">
            {{ $t('system.interface.price') }}
          </div>
          <div class="font-medium">{{ result.price }}</div>
        </div>
        <div>
          <div class="text-muted-foreground">
            {{ $t('system.interface.pointPrice') }}
          </div>
          <div class="font-medium">{{ result.pointPrice ?? 0 }}</div>
        </div>
      </div>
      <div class="text-muted-foreground mb-2 text-sm">
        {{ $t('system.interface.responseBody') }}
      </div>
      <pre
        class="bg-muted max-h-80 overflow-auto rounded p-3 text-xs leading-5"
      >{{ result.body }}</pre>
    </div>
  </Drawer>
</template>
