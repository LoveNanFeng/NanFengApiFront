<script setup lang="ts">
import type { Props } from './types';

import { preferences } from '@vben-core/preferences';
import {
  Card,
  Separator,
  Tabs,
  TabsList,
  TabsTrigger,
  VbenAvatar,
} from '@vben-core/shadcn-ui';

import { Page } from '../../components';

defineOptions({
  name: 'ProfileUI',
});

withDefaults(defineProps<Props>(), {
  title: '关于项目',
  tabs: () => [],
});

const tabsValue = defineModel<string>('modelValue');
</script>
<template>
  <Page auto-content-height>
    <div class="flex size-full flex-col md:flex-row">
      <Card class="w-full flex-none md:h-fit md:w-1/5 md:self-start lg:w-1/6">
        <div class="flex flex-row items-center gap-3 px-3 pt-3 md:flex-col md:items-center md:px-0 md:pt-4">
          <VbenAvatar
            :src="userInfo?.avatar ?? preferences.app.defaultAvatar"
            class="size-10 md:size-20"
          />
          <div class="min-w-0 md:text-center">
            <span class="text-sm font-semibold md:text-lg">
              {{ userInfo?.realName ?? '' }}
            </span>
            <span class="ml-2 text-xs text-foreground/60 md:ml-0 md:mt-1 md:block md:text-sm">
              {{ userInfo?.username ?? '' }}
            </span>
          </div>
        </div>
        <Separator class="my-2 md:my-4" />
        <Tabs v-model="tabsValue" orientation="vertical" class="px-2 pb-2 md:m-4 md:p-0">
          <TabsList
            class="flex h-auto w-full flex-nowrap overflow-x-auto overflow-y-hidden bg-card md:grid md:grid-cols-1 md:overflow-visible"
          >
            <TabsTrigger
              v-for="tab in tabs"
              :key="tab.value"
              :value="tab.value"
              class="h-10 shrink-0 justify-center whitespace-nowrap px-3 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground md:h-12 md:justify-start md:px-4"
            >
              {{ tab.label }}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </Card>
      <Card class="mt-4 w-full flex-auto p-4 md:ml-4 md:mt-0 md:w-4/5 md:p-6 lg:w-5/6 lg:p-8">
        <slot name="content"></slot>
      </Card>
    </div>
  </Page>
</template>
