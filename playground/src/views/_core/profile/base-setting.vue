<script setup lang="ts">
import { onMounted, ref } from 'vue';

import { useUserStore } from '@vben/stores';

import {
  bindEmailApi,
  bindMobileApi,
  getRegisterConfigApi,
  getUserInfoApi,
  sendBindEmailCodeApi,
  sendBindMobileCodeApi,
  updateProfileApi,
} from '#/api';
import { message } from 'ant-design-vue';

const userStore = useUserStore();

const emailChannelEnabled = ref(false);
const mobileChannelEnabled = ref(false);

const realName = ref('');
const username = ref('');
const avatar = ref('');
const email = ref('');
const mobile = ref('');
const roles = ref<string[]>([]);

const saving = ref(false);

// email binding state
const emailEditing = ref(false);
const bindEmail = ref('');
const emailCode = ref('');
const emailSending = ref(false);
const emailCountdown = ref(0);
const emailVerifying = ref(false);

// mobile binding state
const mobileEditing = ref(false);
const bindMobile = ref('');
const mobileCode = ref('');
const mobileSending = ref(false);
const mobileCountdown = ref(0);
const mobileVerifying = ref(false);

let emailTimer: ReturnType<typeof setInterval> | null = null;
let mobileTimer: ReturnType<typeof setInterval> | null = null;

function mapRoleLabel(role: string): string {
  if (role === 'admin') return '管理员';
  if (role === 'user') return '普通用户';
  return role;
}

function loadData(data: any) {
  username.value = data.username || '';
  realName.value = data.realName || '';
  avatar.value = data.avatar || '';
  email.value = data.email || '';
  mobile.value = data.mobile || '';
  roles.value = data.roles || [];
}

async function handleSaveProfile() {
  if (!realName.value.trim()) {
    message.warning('请输入姓名');
    return;
  }
  saving.value = true;
  try {
    const updated = await updateProfileApi({
      avatar: avatar.value,
      realName: realName.value.trim(),
    });
    userStore.setUserInfo(updated);
    message.success('个人资料已保存');
  } finally {
    saving.value = false;
  }
}

// --- email binding ---
function startEmailEdit() {
  bindEmail.value = '';
  emailCode.value = '';
  emailEditing.value = true;
}

function cancelEmailEdit() {
  emailEditing.value = false;
}

async function handleSendEmailCode() {
  if (!bindEmail.value.trim()) {
    message.warning('请输入要绑定的邮箱');
    return;
  }
  emailSending.value = true;
  try {
    await sendBindEmailCodeApi(bindEmail.value.trim());
    message.success('验证码已发送');
    emailCountdown.value = 60;
    if (emailTimer) clearInterval(emailTimer);
    emailTimer = setInterval(() => {
      emailCountdown.value--;
      if (emailCountdown.value <= 0) {
        if (emailTimer) clearInterval(emailTimer);
        emailTimer = null;
      }
    }, 1000);
  } finally {
    emailSending.value = false;
  }
}

async function handleVerifyEmail() {
  if (!emailCode.value.trim()) {
    message.warning('请输入验证码');
    return;
  }
  emailVerifying.value = true;
  try {
    const updated = await bindEmailApi(bindEmail.value.trim(), emailCode.value.trim());
    userStore.setUserInfo(updated);
    email.value = bindEmail.value.trim();
    emailEditing.value = false;
    message.success('邮箱绑定成功');
  } finally {
    emailVerifying.value = false;
  }
}

// --- mobile binding ---
function startMobileEdit() {
  bindMobile.value = '';
  mobileCode.value = '';
  mobileEditing.value = true;
}

function cancelMobileEdit() {
  mobileEditing.value = false;
}

async function handleSendMobileCode() {
  if (!bindMobile.value.trim()) {
    message.warning('请输入要绑定的手机号');
    return;
  }
  mobileSending.value = true;
  try {
    await sendBindMobileCodeApi(bindMobile.value.trim());
    message.success('验证码已发送');
    mobileCountdown.value = 60;
    if (mobileTimer) clearInterval(mobileTimer);
    mobileTimer = setInterval(() => {
      mobileCountdown.value--;
      if (mobileCountdown.value <= 0) {
        if (mobileTimer) clearInterval(mobileTimer);
        mobileTimer = null;
      }
    }, 1000);
  } finally {
    mobileSending.value = false;
  }
}

async function handleVerifyMobile() {
  if (!mobileCode.value.trim()) {
    message.warning('请输入验证码');
    return;
  }
  mobileVerifying.value = true;
  try {
    const updated = await bindMobileApi(bindMobile.value.trim(), mobileCode.value.trim());
    userStore.setUserInfo(updated);
    mobile.value = bindMobile.value.trim();
    mobileEditing.value = false;
    message.success('手机号绑定成功');
  } finally {
    mobileVerifying.value = false;
  }
}

onMounted(async () => {
  const [data, config] = await Promise.all([
    getUserInfoApi(),
    getRegisterConfigApi().catch(() => ({
      emailRegisterEnabled: false,
      emailServiceEnabled: false,
      mobileRegisterEnabled: false,
    })),
  ]);
  emailChannelEnabled.value = !!(
    (config as any).emailServiceEnabled ?? (config as any).emailRegisterEnabled
  );
  mobileChannelEnabled.value = !!(config as any).mobileRegisterEnabled;
  loadData(data);
});
</script>

<template>
  <div class="w-full max-w-lg space-y-6">
    <!-- basic info -->
    <div class="space-y-4">
      <div>
        <label class="mb-1 block text-sm text-gray-500">用户名</label>
        <div class="text-base">{{ username }}</div>
      </div>
      <div>
        <label class="mb-1 block text-sm text-gray-500">角色</label>
        <div class="text-base">
          <template v-for="(role, idx) in roles" :key="role">
            {{ idx > 0 ? '、' : '' }}{{ mapRoleLabel(role) }}
          </template>
        </div>
      </div>
      <div>
        <label class="mb-1 block text-sm text-gray-500">姓名</label>
        <input
          v-model="realName"
          class="w-full rounded border px-3 py-1.5 text-sm"
          maxlength="64"
          placeholder="请输入姓名"
        />
      </div>
      <button
        class="rounded bg-blue-500 px-4 py-1.5 text-sm text-white hover:bg-blue-600 disabled:opacity-50"
        :disabled="saving"
        @click="handleSaveProfile"
      >
        {{ saving ? '保存中...' : '保存' }}
      </button>
    </div>

    <!-- email binding -->
    <div v-if="emailChannelEnabled" class="border-t pt-4">
      <div class="mb-1 text-sm text-gray-500">绑定邮箱</div>
      <div v-if="!emailEditing" class="flex items-center justify-between">
        <span class="text-base">{{ email || '未绑定' }}</span>
        <button
          class="text-sm text-blue-500 hover:text-blue-600"
          @click="startEmailEdit"
        >
          {{ email ? '修改' : '绑定' }}
        </button>
      </div>
      <div v-else class="space-y-2">
        <input
          v-model="bindEmail"
          class="w-full rounded border px-3 py-1.5 text-sm"
          maxlength="128"
          placeholder="请输入新邮箱"
        />
        <div class="flex flex-wrap gap-2">
          <input
            v-model="emailCode"
            class="w-32 rounded border px-3 py-1.5 text-sm"
            maxlength="6"
            placeholder="验证码"
          />
          <button
            class="rounded px-3 py-1.5 text-sm text-blue-500 hover:bg-blue-50 disabled:opacity-50"
            :disabled="emailSending || emailCountdown > 0"
            @click="handleSendEmailCode"
          >
            {{ emailCountdown > 0 ? `${emailCountdown}s` : emailSending ? '发送中...' : '发送验证码' }}
          </button>
          <button
            class="rounded bg-green-500 px-3 py-1.5 text-sm text-white hover:bg-green-600 disabled:opacity-50"
            :disabled="emailVerifying"
            @click="handleVerifyEmail"
          >
            {{ emailVerifying ? '验证中...' : '验证并绑定' }}
          </button>
          <button
            class="rounded px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100"
            @click="cancelEmailEdit"
          >
            取消
          </button>
        </div>
      </div>
    </div>

    <!-- mobile binding -->
    <div v-if="mobileChannelEnabled" class="border-t pt-4">
      <div class="mb-1 text-sm text-gray-500">绑定手机号</div>
      <div v-if="!mobileEditing" class="flex items-center justify-between">
        <span class="text-base">{{ mobile || '未绑定' }}</span>
        <button
          class="text-sm text-blue-500 hover:text-blue-600"
          @click="startMobileEdit"
        >
          {{ mobile ? '修改' : '绑定' }}
        </button>
      </div>
      <div v-else class="space-y-2">
        <input
          v-model="bindMobile"
          class="w-full rounded border px-3 py-1.5 text-sm"
          maxlength="32"
          placeholder="请输入新手机号"
        />
        <div class="flex flex-wrap gap-2">
          <input
            v-model="mobileCode"
            class="w-32 rounded border px-3 py-1.5 text-sm"
            maxlength="6"
            placeholder="验证码"
          />
          <button
            class="rounded px-3 py-1.5 text-sm text-blue-500 hover:bg-blue-50 disabled:opacity-50"
            :disabled="mobileSending || mobileCountdown > 0"
            @click="handleSendMobileCode"
          >
            {{ mobileCountdown > 0 ? `${mobileCountdown}s` : mobileSending ? '发送中...' : '发送验证码' }}
          </button>
          <button
            class="rounded bg-green-500 px-3 py-1.5 text-sm text-white hover:bg-green-600 disabled:opacity-50"
            :disabled="mobileVerifying"
            @click="handleVerifyMobile"
          >
            {{ mobileVerifying ? '验证中...' : '验证并绑定' }}
          </button>
          <button
            class="rounded px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100"
            @click="cancelMobileEdit"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
