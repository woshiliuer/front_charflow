<template>
  <div class="register-form-container">
    <form class="auth-form" @submit.prevent="handleSubmit">
      <label class="field">
        <span class="field-label">昵称</span>
        <input v-model="form.nickname" type="text" placeholder="请输入昵称" autocomplete="nickname" required />
      </label>
      
      <label class="field">
        <span class="field-label">邮箱地址</span>
        <input v-model="form.email" type="email" placeholder="请输入邮箱地址" autocomplete="email" required />
      </label>
      
      <label class="field">
        <span class="field-label">验证码</span>
        <div class="code-wrap">
          <input v-model="form.verificationCode" type="text" placeholder="请输入验证码" required />
          <button type="button" class="code-btn" :disabled="isSendingCode || countdown > 0" @click="handleSendCode">
            {{ countdownText }}
          </button>
        </div>
      </label>
      
      <label class="field">
        <span class="field-label">密码</span>
        <input type="password" v-model="form.password" placeholder="请输入密码" autocomplete="new-password" required />
      </label>
      
      <label class="field">
        <span class="field-label">确认密码</span>
        <input type="password" v-model="form.confirmPassword" placeholder="请再次输入密码" autocomplete="new-password" required />
      </label>
      
      <button type="submit" class="submit-btn" :disabled="isSubmitting">
        {{ isSubmitting ? '注册中…' : '注册' }}
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
  padding: 4px 0;
}
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  text-align: left;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.field-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--c-text-2);
}
.field input {
  width: 100%;
  padding: 10px 14px;
  border-radius: var(--c-radius-sm);
  border: 1px solid var(--c-border);
  background: var(--c-bg);
  color: var(--c-text);
  font-size: 14px;
  outline: none;
  transition: all 0.2s;
}
.field input:focus {
  border-color: var(--c-accent);
  box-shadow: 0 0 0 3px var(--c-accent-soft);
}
.code-wrap {
  display: flex;
  gap: 10px;
}
.code-wrap input {
  flex: 1;
}
.code-btn {
  flex-shrink: 0;
  min-width: 100px;
  padding: 0 14px;
  border: none;
  border-radius: var(--c-radius-sm);
  background: var(--c-accent);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
.code-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.submit-btn {
  width: 100%;
  padding: 12px;
  border-radius: var(--c-radius-sm);
  border: none;
  background: var(--c-accent);
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 8px;
  transition: background 0.2s;
}
.submit-btn:hover:not(:disabled) {
  background: var(--c-accent-hover);
}
.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>

