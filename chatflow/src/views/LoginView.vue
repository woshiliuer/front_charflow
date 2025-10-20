<template>
  <div class="login-page">
    <div class="login-card">
      <header class="card-header">
        <h1 class="brand">聊天室</h1>
        <p class="subtitle">{{ isRegister ? '创建新账户' : '欢迎回来' }}</p>
        <nav class="tabs" aria-label="登录或注册">
          <button
            type="button"
            class="tab-button"
            :class="{ active: !isRegister }"
            :aria-selected="!isRegister"
            @click="selectTab('login')"
          >
            登录
          </button>
          <button
            type="button"
            class="tab-button"
            :class="{ active: isRegister }"
            :aria-selected="isRegister"
            @click="selectTab('register')"
          >
            注册
          </button>
        </nav>
      </header>

      <LoginForm v-if="!isRegister" @submit="handleLoginSubmit" />
      <RegisterForm v-else @submit="handleRegisterSubmit" />

      <p class="signup-hint">
        <span>{{ isRegister ? '已经有账户？' : '还没有账户？' }}</span>
        <button type="button" class="link-button" @click="toggleTab">
          {{ isRegister ? '立即登录' : '立即注册' }}
        </button>
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import LoginForm from '../components/auth/LoginForm.vue'
import RegisterForm from '../components/auth/RegisterForm.vue'

const activeTab = ref('login')

const selectTab = (tab) => {
  activeTab.value = tab
}

const toggleTab = () => {
  selectTab(activeTab.value === 'login' ? 'register' : 'login')
}

const isRegister = computed(() => activeTab.value === 'register')

const handleLoginSubmit = (payload) => {
  console.log('登录信息', payload)
}

const handleRegisterSubmit = (payload) => {
  console.log('注册信息', payload)
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #f4f9f6 0%, #eef6f1 100%);
  padding: 24px;
  box-sizing: border-box;
}

.login-card {
  width: min(420px, 100%);
  border-radius: 24px;
  background: linear-gradient(180deg, #ffffff 0%, #f7fbf8 100%);
  padding: 48px 56px;
  box-shadow: 0 25px 60px rgba(35, 83, 52, 0.14);
  border: 1px solid rgba(102, 166, 130, 0.22);
  text-align: center;
  --accent: #2f855a;
  --accent-dark: #276749;
  --accent-soft: rgba(47, 133, 90, 0.12);
  --input-bg: #f4f9f6;
  --input-border: #cfe6d8;
  --focus-ring: rgba(47, 133, 90, 0.24);
  --text-main: #1f3d2c;
  --text-muted: #4d6f5a;
}

.card-header {
  margin-bottom: 32px;
}

.brand {
  font-size: 28px;
  margin: 0;
  color: var(--accent-dark);
  letter-spacing: 0.5px;
}

.subtitle {
  margin: 8px 0 24px;
  color: var(--text-muted);
  font-size: 14px;
}

.tabs {
  display: inline-flex;
  background: rgba(231, 245, 237, 0.9);
  border-radius: 999px;
  padding: 4px;
  gap: 4px;
  border: 1px solid rgba(102, 166, 130, 0.25);
}

.tab-button {
  flex: 1;
  padding: 8px 28px;
  border: none;
  border-radius: 999px;
  background: transparent;
  font-size: 14px;
  color: var(--text-muted);
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
}

.tab-button.active {
  background: #ffffff;
  color: var(--accent-dark);
  font-weight: 600;
  box-shadow: 0 6px 18px rgba(47, 133, 90, 0.18);
}

.tab-button:not(.active):hover {
  background: rgba(47, 133, 90, 0.08);
  color: var(--accent-dark);
}

.signup-hint {
  margin-top: 28px;
  font-size: 13px;
  color: var(--text-muted);
}

.link-button {
  border: none;
  background: none;
  color: var(--accent-dark);
  font-weight: 600;
  cursor: pointer;
  margin-left: 4px;
  padding: 0;
}

.link-button:hover {
  text-decoration: underline;
  color: var(--accent);
}

@media (max-width: 640px) {
  .login-card {
    padding: 36px 28px;
    border-radius: 20px;
  }
}
</style>
