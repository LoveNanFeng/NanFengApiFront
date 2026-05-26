<script setup lang="ts">
import type { TipTapPreviewProps } from '@vben/plugins/tiptap';

import { computed, ref } from 'vue';

import { VbenTiptapPreview } from '@vben/plugins/tiptap';

import { Image as AntImage } from 'ant-design-vue';

const props = withDefaults(defineProps<TipTapPreviewProps>(), {
  content: '',
  minHeight: 160,
});

const previewImage = ref('');
const previewVisible = ref(false);

const imagePreviewConfig = computed(() => ({
  rootClassName: 'app-rich-text-image-preview',
  src: previewImage.value,
  visible: previewVisible.value,
  onVisibleChange: handlePreviewVisibleChange,
}));

function handlePreviewVisibleChange(visible: boolean) {
  previewVisible.value = visible;
  if (!visible) {
    previewImage.value = '';
  }
}

function openImagePreview(src: string) {
  previewImage.value = src;
  previewVisible.value = true;
}
</script>

<template>
  <VbenTiptapPreview
    :class="props.class"
    :content="props.content"
    :min-height="props.minHeight"
    @image-preview="openImagePreview"
  />
  <AntImage
    v-if="previewImage"
    :preview="imagePreviewConfig"
    :src="previewImage"
    :style="{ display: 'none' }"
  />
</template>

<style scoped>
:global(.app-rich-text-image-preview .ant-image-preview-img) {
  width: auto !important;
  height: auto !important;
  max-width: min(920px, 82vw) !important;
  max-height: 78vh !important;
  object-fit: contain;
  border-radius: 8px;
  box-shadow:
    0 20px 45px rgb(15 23 42 / 18%),
    0 0 0 1px rgb(255 255 255 / 35%);
}

:global(.app-rich-text-image-preview .ant-image-preview-img-wrapper) {
  padding: 56px 80px;
}

@media (max-width: 768px) {
  :global(.app-rich-text-image-preview .ant-image-preview-img) {
    max-width: 88vw !important;
    max-height: 72vh !important;
  }

  :global(.app-rich-text-image-preview .ant-image-preview-img-wrapper) {
    padding: 48px 20px;
  }
}
</style>
