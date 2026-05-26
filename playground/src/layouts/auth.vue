<script lang="ts" setup>
import { computed } from 'vue';

import { AuthPageLayout } from '@vben/layouts';
import { preferences } from '@vben/preferences';

import { $t } from '#/locales';
import { useSiteBrand } from '#/site-brand';

const siteBrand = useSiteBrand();
const appName = computed(() => preferences.app.name);
const logo = computed(() => siteBrand.logoUrl || preferences.logo.source);
const pageDescription = computed(() => siteBrand.description);
const pageTitle = computed(() => siteBrand.slogan);
const clickLogo = () => {};
</script>

<template>
  <AuthPageLayout
    :app-name="appName"
    :logo="logo"
    :page-description="pageDescription || $t('authentication.pageDesc')"
    :page-title="pageTitle || $t('authentication.pageTitle')"
    :click-logo="clickLogo"
  >
    <!-- 自定义工具栏 -->
    <!-- <template #toolbar></template> -->
  </AuthPageLayout>
</template>
