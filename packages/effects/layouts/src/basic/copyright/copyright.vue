<script lang="ts" setup>
interface Props {
  companyName?: string;
  companySiteLink?: string;
  content?: string;
  date?: string;
  icp?: string;
  icpLink?: string;
}

defineOptions({
  name: 'Copyright',
});

withDefaults(defineProps<Props>(), {
  companyName: 'Vben Admin',
  companySiteLink: '',
  content: '',
  date: '2024',
  icp: '',
  icpLink: '',
});
</script>

<template>
  <div class="text-md flex-center">
    <!-- ICP Link -->
    <a
      v-if="icp"
      :href="icpLink || 'javascript:void(0)'"
      class="mx-1 hover:text-primary-hover"
      target="_blank"
    >
      {{ icp }}
    </a>

    <template v-if="content">
      <span class="mx-1">{{ content }}</span>
    </template>

    <template v-else>
      <!-- Copyright Text -->
      Copyright &copy; {{ date }}

      <!-- Company Link -->
      <a
        v-if="companyName"
        :href="companySiteLink || 'javascript:void(0)'"
        class="mx-1 hover:text-primary-hover"
        target="_blank"
      >
        {{ companyName }}
      </a>
    </template>
  </div>
</template>
