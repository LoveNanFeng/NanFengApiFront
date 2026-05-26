<script lang="ts" setup>
import type { UploadFile } from 'ant-design-vue';

import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Button, message } from 'ant-design-vue';

import { useVbenForm, z } from '#/adapter/form';
import {
  getSiteConfig,
  updateSiteConfig,
  uploadSiteLogo,
} from '#/api/system/site';
import { applySiteBrand } from '#/site-brand';

const loading = ref(false);
const updateTime = ref<null | string>(null);

const [SiteForm, siteFormApi] = useVbenForm({
  commonConfig: {
    colon: true,
    componentProps: {
      class: 'w-full',
    },
    formItemClass: 'col-span-2 md:col-span-1',
    labelWidth: 108,
  },
  layout: 'horizontal',
  schema: [
    {
      component: 'Input',
      componentProps: {
        maxlength: 64,
        placeholder: '例如：NanFengAPI',
      },
      fieldName: 'siteName',
      label: '网站名称',
      rules: z.string().min(1, '网站名称不能为空').max(64),
    },
    {
      component: 'Input',
      componentProps: {
        maxlength: 1024,
        placeholder: '可填写图片地址，也可以上传 Logo',
      },
      fieldName: 'logoUrl',
      label: '网站 Logo',
    },
    {
      component: 'Upload',
      componentProps: {
        accept: '.png,.jpg,.jpeg,.webp,.gif',
        customRequest: uploadSiteLogo,
        listType: 'picture-card',
        maxCount: 1,
        maxSize: 2,
        multiple: false,
        showUploadList: true,
      },
      fieldName: 'logoFile',
      label: '上传 Logo',
      renderComponentContent: () => ({
        default: () => '上传图片',
      }),
    },
    {
      component: 'Input',
      componentProps: {
        maxlength: 120,
        placeholder: '例如：稳定、清晰、可运营的 API 服务平台',
      },
      fieldName: 'slogan',
      label: '网站标语',
    },
    {
      component: 'Textarea',
      componentProps: {
        maxlength: 255,
        rows: 3,
        showCount: true,
      },
      fieldName: 'description',
      formItemClass: 'col-span-2',
      label: '网站描述',
    },
    {
      component: 'Input',
      componentProps: {
        maxlength: 128,
        placeholder: 'contact@example.com',
      },
      fieldName: 'contactEmail',
      label: '联系邮箱',
    },
    {
      component: 'Input',
      componentProps: {
        maxlength: 64,
        placeholder: '客服电话或手机号',
      },
      fieldName: 'contactPhone',
      label: '联系电话',
    },
    {
      component: 'Input',
      componentProps: {
        maxlength: 64,
      },
      fieldName: 'contactQq',
      label: '联系 QQ',
    },
    {
      component: 'Input',
      componentProps: {
        maxlength: 64,
      },
      fieldName: 'contactWechat',
      label: '联系微信',
    },
    {
      component: 'Input',
      componentProps: {
        maxlength: 255,
      },
      fieldName: 'contactAddress',
      formItemClass: 'col-span-2',
      label: '联系地址',
    },
    {
      component: 'Input',
      componentProps: {
        maxlength: 128,
      },
      fieldName: 'icp',
      label: '备案信息',
    },
    {
      component: 'Input',
      componentProps: {
        maxlength: 128,
      },
      fieldName: 'copyright',
      label: '版权信息',
    },
  ],
  showDefaultActions: false,
  wrapperClass: 'grid-cols-2 gap-x-4 gap-y-2',
});

async function loadConfig() {
  loading.value = true;
  try {
    const config = await getSiteConfig();
    applySiteBrand(config);
    updateTime.value = config.updateTime ?? null;
    await siteFormApi.setValues({
      ...config,
      logoFile: config.logoUrl
        ? [
            {
              name: 'site-logo',
              status: 'done',
              uid: '-1',
              url: config.logoUrl,
            },
          ]
        : [],
    });
  } finally {
    loading.value = false;
  }
}

async function onSubmit() {
  const { valid } = await siteFormApi.validate();
  if (!valid) return;

  const values = await siteFormApi.getValues<Record<string, any>>();
  loading.value = true;
  try {
    await updateSiteConfig({
      contactAddress: stringValue(values.contactAddress),
      contactEmail: stringValue(values.contactEmail),
      contactPhone: stringValue(values.contactPhone),
      contactQq: stringValue(values.contactQq),
      contactWechat: stringValue(values.contactWechat),
      copyright: stringValue(values.copyright),
      description: stringValue(values.description),
      icp: stringValue(values.icp),
      logoUrl: extractLogoUrl(values),
      siteName: stringValue(values.siteName),
      slogan: stringValue(values.slogan),
    });
    message.success('站点配置保存成功');
    await loadConfig();
  } finally {
    loading.value = false;
  }
}

function extractLogoUrl(values: Record<string, any>) {
  const files = (values.logoFile ?? []) as UploadFile[];
  const uploadedUrl = (files[0]?.response as { url?: string } | undefined)?.url;
  const inputUrl = stringValue(values.logoUrl);
  const previewUrl = files[0]?.url;
  return uploadedUrl || inputUrl || previewUrl || '';
}

function stringValue(value: unknown) {
  return String(value ?? '').trim();
}

onMounted(() => {
  void loadConfig();
});
</script>

<template>
  <Page auto-content-height>
    <div class="bg-card rounded-md p-6">
      <div class="mb-5">
        <h2 class="site-config-title">站点配置</h2>
        <p class="site-config-desc">
          控制首页展示的网站名称、Logo、底部联系方式和版权信息。
        </p>
      </div>

      <SiteForm />

      <div class="mt-5 flex items-center justify-between gap-4">
        <span class="text-muted-foreground text-sm">
          最近更新：{{ updateTime || '暂无' }}
        </span>
        <Button type="primary" :loading="loading" @click="onSubmit">
          保存配置
        </Button>
      </div>
    </div>
  </Page>
</template>

<style scoped>
.site-config-title {
  margin: 0;
  color: hsl(var(--foreground));
  font-size: 20px;
  font-weight: 700;
}

.site-config-desc {
  margin: 8px 0 0;
  color: hsl(var(--muted-foreground));
  font-size: 14px;
}
</style>
