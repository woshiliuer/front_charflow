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
  background: #f6f8fb;
  padding: 24px;
  box-sizing: border-box;
}

.login-card {
  width: min(420px, 100%);
  border-radius: 24px;
  background: #fff;
  padding: 48px 56px;
  box-shadow: 0 20px 60px rgba(15, 23, 42, 0.12);
  border: 1px solid rgba(15, 23, 42, 0.06);
  text-align: center;
}

.card-header {
  margin-bottom: 32px;
}

.brand {
  font-size: 28px;
  margin: 0;
  color: #0f172a;
}

.subtitle {
  margin: 8px 0 24px;
  color: #64748b;
  font-size: 14px;
}

.tabs {
  display: inline-flex;
  background: #f1f5f9;
  border-radius: 999px;
  padding: 4px;
  gap: 4px;
}

.tab-button {
  flex: 1;
  padding: 8px 28px;
  border: none;
  border-radius: 999px;
  background: transparent;
  font-size: 14px;
  color: #475569;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
}

.tab-button.active {
  background: #fff;
  color: #0f172a;
  font-weight: 600;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.08);
}

.auth-form {
  display: grid;
  gap: 20px;
  text-align: left;
}

.form-field {
  display: grid;
  gap: 8px;
  font-size: 14px;
  color: #0f172a;
}

.form-field input[type='email'],
.form-field input[type='password'],
.password-input input {
  width: 100%;
  padding: 12px 16px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  font-size: 15px;
  color: #0f172a;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.form-field input:focus {
  outline: none;
  border-color: #1d4ed8;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.18);
  background: #fff;
}

.password-input {
  display: flex;
  align-items: center;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.password-input:focus-within {
  border-color: #1d4ed8;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.18);
  background: #fff;
}

.password-input input {
  border: none;
  padding: 12px 16px;
  background: transparent;
}

.toggle-visibility {
  border: none;
  background: transparent;
  padding: 0 14px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  line-height: 1;
  color: #94a3b8;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: #64748b;
}

.remember {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.remember input {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  border: 1px solid #cbd5f5;
  accent-color: #0f172a;
}

.link {
  text-decoration: none;
  color: #0f172a;
  font-weight: 500;
}

.submit-button {
  width: 100%;
  padding: 14px;
  border-radius: 12px;
  border: none;
  background: #0f172a;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.1s ease;
}

.submit-button:hover {
  background: #111c37;
}

.submit-button:active {
  transform: translateY(1px);
}

.signup-hint {
  margin-top: 28px;
  font-size: 13px;
  color: #475569;
}

.link-button {
  border: none;
  background: none;
  color: #0f172a;
  font-weight: 600;
  cursor: pointer;
  margin-left: 4px;
  padding: 0;
}

.link-button:hover {
  text-decoration: underline;
}

@media (max-width: 640px) {
  .login-card {
    padding: 36px 28px;
    border-radius: 20px;
  }
}
</style>
