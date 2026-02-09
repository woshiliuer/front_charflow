<template>
  <div class="register-form-container">
    <form class="auth-form" @submit.prevent="handleSubmit">
      <div class="input-group">
        <label class="field">
          <span class="field-label">昵称</span>
          <div class="input-wrapper">
            <span class="input-icon">👤</span>
            <input v-model="form.nickname" type="text" placeholder="请输入昵称" autocomplete="nickname" required />
          </div>
        </label>
        
        <label class="field">
          <span class="field-label">邮箱地址</span>
          <div class="input-wrapper">
            <span class="input-icon">✉️</span>
            <input v-model="form.email" type="email" placeholder="请输入邮箱地址" autocomplete="email" required />
          </div>
        </label>
        
        <label class="field">
          <span class="field-label">验证码</span>
          <div class="code-wrap">
            <div class="input-wrapper">
              <span class="input-icon">🔑</span>
              <input v-model="form.verificationCode" type="text" placeholder="请输入验证码" required />
            </div>
            <button type="button" class="code-btn" :disabled="isSendingCode || countdown > 0" @click="handleSendCode">
              {{ countdownText }}
            </button>
          </div>
        </label>
        
        <label class="field">
          <span class="field-label">设置密码</span>
          <div class="input-wrapper">
            <span class="input-icon">🔒</span>
            <input type="password" v-model="form.password" placeholder="请输入密码" autocomplete="new-password" required />
          </div>
        </label>
        
        <label class="field">
          <span class="field-label">确认密码</span>
          <div class="input-wrapper">
            <span class="input-icon">🛡️</span>
            <input type="password" v-model="form.confirmPassword" placeholder="请再次输入密码" autocomplete="new-password" required />
          </div>
        </label>
      </div>
      
      <button type="submit" class="submit-btn" :disabled="isSubmitting">
        <span v-if="!isSubmitting">注册</span>
        <span v-else class="loading-dots">提交中</span>
      </button>
    </form>
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { apiClient } from '@/services/apiClient'

const emit = defineEmits(['success'])

const form = reactive({
  nickname: '',
  email: '',
  verificationCode: '',
  password: '',
  confirmPassword: ''
})

const isSendingCode = ref(false)
const isSubmitting = ref(false)
const countdown = ref(0)
const COUNTDOWN_SECONDS = 60
const STORAGE_KEY = 'reg_cd_expires'

let timer = null

const updateCountdown = () => {
  const expiresAt = Number(localStorage.getItem(STORAGE_KEY))
  if (!expiresAt || expiresAt <= Date.now()) {
    countdown.value = 0
    if (timer) clearInterval(timer)
    localStorage.removeItem(STORAGE_KEY)
    return
  }
  countdown.value = Math.ceil((expiresAt - Date.now()) / 1000)
}

const startCountdown = () => {
  const expiresAt = Date.now() + COUNTDOWN_SECONDS * 1000
  localStorage.setItem(STORAGE_KEY, String(expiresAt))
  updateCountdown()
  if (timer) clearInterval(timer)
  timer = setInterval(updateCountdown, 1000)
}

onMounted(() => {
  updateCountdown()
  if (countdown.value > 0) {
    timer = setInterval(updateCountdown, 1000)
  }
})

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})

const countdownText = computed(() => {
  if (isSendingCode.value) return '发送中…'
  return countdown.value > 0 ? `${countdown.value}s` : '获取验证码'
})

const handleSendCode = async () => {
  if (!form.email) {
    alert('请先输入邮箱地址')
    return
  }
  isSendingCode.value = true
  try {
    await apiClient.post('/user/getVerfCode', { 
      email: form.email, 
      verfCodeType: 1 
    })
    alert('验证码已发送，请查收邮箱')
    startCountdown()
  } catch (e) {
    alert(e.message || '验证码发送失败')
  } finally {
    isSendingCode.value = false
  }
}

const handleSubmit = async () => {
  if (isSubmitting.value) return
  if (form.password !== form.confirmPassword) {
    alert('两次输入的密码不一致')
    return
  }
  if (!form.verificationCode) {
    alert('请输入验证码')
    return
  }
  
  isSubmitting.value = true
  try {
    const payload = {
      nickname: form.nickname,
      email: form.email,
      verificationCode: form.verificationCode,
      password: form.password
    }
    await apiClient.post('/user/register', payload)
    alert('注册成功，请登录')
    emit('success')
  } catch (e) {
    alert(e.message || '注册失败')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.register-form-container {
  width: 100%;
}

.auth-form {
  display: grid;
  gap: 16px;
  text-align: left;
}

.input-group {
  display: grid;
  gap: 12px;
}

.field {
  display: grid;
  gap: 4px;
}

.field-label {
  font-size: 13px;
  font-weight: 600;
  color: #4b5563;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

.input-icon {
  position: absolute;
  left: 12px;
  font-size: 14px;
  color: #9ca3af;
  pointer-events: none;
}

.input-wrapper input {
  width: 100%;
  padding: 10px 12px 10px 36px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  background: #ffffff;
  color: #111827;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.input-wrapper input:focus {
  border-color: #4f46e5;
  box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.1);
}

.code-wrap {
  display: flex;
  gap: 8px;
}

.code-wrap .input-wrapper {
  flex: 1;
}

.code-btn {
  flex-shrink: 0;
  min-width: 90px;
  padding: 0 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #f9fafb;
  color: #374151;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.code-btn:hover:not(:disabled) {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.code-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.submit-btn {
  width: 100%;
  padding: 12px;
  border-radius: 8px;
  border: none;
  background: #4f46e5;
  color: #ffffff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 8px;
  transition: background 0.2s;
}

.submit-btn:hover:not(:disabled) {
  background: #4338ca;
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-dots:after {
  content: '...';
  animation: dots 1.5s infinite;
}

@keyframes dots {
  0%, 20% { content: '.'; }
  40% { content: '..'; }
  60% { content: '...'; }
  80%, 100% { content: ''; }
}
</style>

