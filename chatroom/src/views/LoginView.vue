<template>
  <div class="login-page">
    <div class="login-card">
      <header class="card-header">
        <div class="brand-logo">
          <img src="/logo.svg" alt="ChatRoom Logo" />
        </div>
        <h1 class="brand">ChatFlow</h1>
        <p class="subtitle">{{ isRegister ? '创建您的账户' : '欢迎回来，请登录您的账户' }}</p>
      </header>

      <nav class="tabs">
        <button 
          type="button" 
          class="tab-btn" 
          :class="{ active: !isRegister }" 
          @click="selectTab('login')"
        >登录</button>
        <button 
          type="button" 
          class="tab-btn" 
          :class="{ active: isRegister }" 
          @click="selectTab('register')"
        >注册</button>
      </nav>

      <div class="auth-container">
        <LoginForm v-if="!isRegister" @success="handleLoginSuccess" />
        <RegisterForm v-if="isRegister" @success="handleRegisterSuccess" />
      </div>

      <footer class="card-footer">
        <p class="toggle-hint">
          <span>{{ isRegister ? '已有账户？' : '没有账户？' }}</span>
          <button type="button" class="link-btn" @click="toggleTab">
            {{ isRegister ? '立即登录' : '立即注册' }}
          </button>
        </p>
      </footer>
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
  background-color: #f8fafc;
  padding: 24px;
}

.login-card {
  width: 100%;
  max-width: 420px;
  background-color: #ffffff;
  padding: 48px 40px;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
  text-align: center;
}

.card-header {
  margin-bottom: 32px;
}

.brand-logo {
  margin-bottom: 16px;
  display: flex;
  justify-content: center;
}

.brand-logo img {
  width: 56px;
  height: 56px;
}

.brand {
  font-size: 26px;
  font-weight: 800;
  color: #1e293b;
  margin: 0;
  letter-spacing: -0.02em;
}

.subtitle {
  font-size: 14px;
  color: #64748b;
  margin-top: 8px;
}

.tabs {
  display: flex;
  background-color: #f1f5f9;
  padding: 4px;
  border-radius: 10px;
  margin-bottom: 32px;
}

.tab-btn {
  flex: 1;
  padding: 10px;
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
  background: transparent;
  border: none;
  border-radius: 7px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.tab-btn.active {
  background-color: #ffffff;
  color: #6366f1;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.auth-container {
  min-height: 280px;
  display: flex;
  flex-direction: column;
}

.card-footer {
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #f1f5f9;
}

.toggle-hint {
  font-size: 14px;
  color: #64748b;
}

.link-btn {
  background: transparent;
  border: none;
  color: #6366f1;
  font-weight: 700;
  cursor: pointer;
  margin-left: 6px;
  padding: 0;
  font-size: 14px;
}

.link-btn:hover {
  text-decoration: underline;
}
</style>
