<template>
  <div class="paper-card bg-base-100 rounded-lg shadow-md border border-base-300 p-8">
    <div class="flex justify-center mb-8 gap-2" role="tablist">
      <button
        class="tab-btn px-4 py-2 text-sm border-b-2"
        :class="activeTab === 'login' ? 'tab-active border-primary text-primary font-medium' : 'border-transparent hover:border-base-content/50'"
        @click="activeTab = 'login'"
      >登录</button>
      <button
        class="tab-btn px-4 py-2 text-sm border-b-2"
        :class="activeTab === 'register' ? 'tab-active border-primary text-primary font-medium' : 'border-transparent hover:border-base-content/50'"
        @click="activeTab = 'register'"
      >注册</button>
    </div>

    <form v-if="activeTab === 'login'" class="space-y-6" @submit.prevent="onLogin">
      <div class="form-control">
        <input v-model="login.username" name="username" type="text" placeholder="用户名" class="input input-bordered w-full placeholder:text-base-content/60" required />
      </div>
      <div class="form-control">
        <input v-model="login.password" name="password" type="password" placeholder="密码（至少 6 位）" class="input input-bordered w-full placeholder:text-base-content/60" required />
      </div>
      <button type="submit" class="btn btn-primary w-full" :disabled="loading">{{ loading ? '登录中...' : '登录' }}</button>
      <button type="button" class="btn btn-neutral btn-sm w-full mt-2" @click="fillDemo">一键体验（demo / demo123）</button>
    </form>

    <form v-else class="space-y-6" @submit.prevent="onRegister">
      <div class="form-control">
        <input v-model="register.username" name="username" type="text" minlength="3" placeholder="用户名（至少 3 个字符）" class="input input-bordered w-full placeholder:text-base-content/60" required />
      </div>
      <div class="form-control">
        <input v-model="register.password" name="password" type="password" minlength="6" placeholder="密码（至少 6 位）" class="input input-bordered w-full placeholder:text-base-content/60" required />
      </div>
      <button type="submit" class="btn btn-primary w-full" :disabled="loading">{{ loading ? '注册中...' : '注册' }}</button>
    </form>

    <div v-if="message" :class="messageClass" class="mt-6 text-center text-sm">{{ message }}</div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from 'vue';
import { actions } from 'astro:actions';

const activeTab = ref<'login' | 'register'>('login');
const loading = ref(false);
const message = ref('');
const isError = ref(false);

const messageClass = computed(() => (isError.value ? 'text-error' : 'text-success'));

const login = reactive({ username: '', password: '' });
const register = reactive({ username: '', password: '' });

const onLogin = async () => {
  message.value = '';
  isError.value = false;
  loading.value = true;
  try {
    const fd = new FormData();
    fd.set('username', login.username);
    fd.set('password', login.password);
    const { error } = await actions.login(fd);
    if (error) {
      isError.value = true;
      message.value = error.message || '登录失败';
    } else {
      window.location.href = '/';
    }
  } finally {
    loading.value = false;
  }
};

const onRegister = async () => {
  message.value = '';
  isError.value = false;
  loading.value = true;
  try {
    const fd = new FormData();
    fd.set('username', register.username);
    fd.set('password', register.password);
    const { error } = await actions.register(fd);
    if (error) {
      isError.value = true;
      message.value = error.message || '注册失败';
    } else {
      message.value = '注册成功，请使用账号登录';
      activeTab.value = 'login';
    }
  } finally {
    loading.value = false;
  }
};

const fillDemo = async () => {
  login.username = 'demo';
  login.password = 'demo123';
  await onLogin();
};
</script>
