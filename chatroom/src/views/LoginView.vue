<template>
  <div class="login-page">
    <div class="login-card">
      <header class="card-header">
        <div class="brand-logo">
          <img src="/logo.svg" alt="ChatRoom Logo" />
        </div>
        <h1 class="brand">ChatRoom</h1>
        <p class="subtitle">{{ isRegister ? '创建你的账户' : '欢迎回来' }}</p>
      </header>

      <nav class="tabs">
        <button type="button" class="tab-btn" :class="{ active: !isRegister }" @click="selectTab('login')">登录</button>
        <button type="button" class="tab-btn" :class="{ active: isRegister }" @click="selectTab('register')">注册</button>
      </nav>

      <div class="auth-container">
        <LoginForm v-if="!isRegister" @success="handleLoginSuccess" />
        <RegisterForm v-if="isRegister" @success="handleRegisterSuccess" />
      </div>

      <p class="toggle-hint">
        <span>{{ isRegister ? '已有账户？' : '没有账户？' }}</span>
        <button type="button" class="link-btn" @click="toggleTab">{{ isRegister ? '立即登录' : '立即注册' }}</button>
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import LoginForm from '@/components/auth/LoginForm.vue'
import RegisterForm from '@/components/auth/RegisterForm.vue'

const router = useRouter()
const activeTab = ref('login')
const selectTab = (tab) => { activeTab.value = tab }
const toggleTab = () => { selectTab(activeTab.value === 'login' ? 'register' : 'login') }
const isRegister = computed(() => activeTab.value === 'register')
const handleRegisterSuccess = () => { selectTab('login') }
const handleLoginSuccess = () => { router.push('/chat') }
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--c-bg-soft);
  padding: 24px;
}
.login-card {
  width: min(420px, 100%);
  padding: 40px 36px;
  border-radius: var(--c-radius-lg);
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  box-shadow: var(--c-shadow-lg);
  text-align: center;
}
.card-header { margin-bottom: 28px; }
.brand-logo { margin-bottom: 24px; display: flex; justify-content: center; }
.brand-logo img { width: 120px; height: 120px; filter: drop-shadow(0 8px 24px rgba(66, 99, 235, 0.25)); }
.auth-container { min-height: 200px; display: flex; flex-direction: column; }
.brand { font-size: 24px; font-weight: 700; margin: 0; color: var(--c-text); }
.subtitle { margin: 6px 0 0; color: var(--c-text-3); font-size: 14px; }
.tabs {
  display: inline-flex;
  background: var(--c-bg-mute);
  border-radius: 999px;
  padding: 3px;
  margin-bottom: 24px;
}
.tab-btn {
  padding: 7px 28px;
  border: none;
  border-radius: 999px;
  background: transparent;
  font-size: 13px;
  color: var(--c-text-3);
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}
.tab-btn.active { background: var(--c-surface); color: var(--c-text); box-shadow: var(--c-shadow-sm); font-weight: 600; }
.toggle-hint { margin-top: 20px; font-size: 13px; color: var(--c-text-3); }
.link-btn { border: none; background: none; color: var(--c-accent); font-weight: 600; cursor: pointer; margin-left: 4px; padding: 0; font-size: 13px; }
.link-btn:hover { text-decoration: underline; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.fade-enter-from { opacity: 0; transform: translateY(6px); }
.fade-leave-to { opacity: 0; transform: translateY(-6px); }
</style>
