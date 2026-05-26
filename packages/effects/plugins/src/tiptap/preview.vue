<script setup lang="ts">
import type { TipTapPreviewProps } from './types';

import { computed } from 'vue';

import { cn } from '@vben-core/shared/utils';

import './style.css';
const props = withDefaults(defineProps<TipTapPreviewProps>(), {
  content: '',
  minHeight: 160,
});
const emit = defineEmits<{
  'image-preview': [src: string];
}>();
const contentMinHeight = computed(() =>
  typeof props.minHeight === 'number'
    ? `${props.minHeight}px`
    : props.minHeight,
);
const previewClass = computed(() =>
  cn(
    'vben-tiptap-content',
    'vben-tiptap-preview',
    'text-foreground bg-transparent p-0 leading-7',
    props.class,
  ),
);

function handleContentClick(event: MouseEvent) {
  const target = event.target;

  if (!(target instanceof HTMLImageElement)) {
    return;
  }

  const imageSrc = target.currentSrc || target.src;
  if (imageSrc) {
    emit('image-preview', imageSrc);
  }
}
</script>

<template>
  <!-- eslint-disable vue/no-v-html -->
  <div
    :class="previewClass"
    :style="{ minHeight: contentMinHeight }"
    @click="handleContentClick"
    v-html="content"
  ></div>
</template>

<style scoped>
.vben-tiptap-preview :deep(img) {
  cursor: zoom-in;
}
</style>
