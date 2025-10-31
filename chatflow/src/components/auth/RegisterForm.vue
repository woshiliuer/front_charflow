<template>
  <form class="auth-form" @submit.prevent="handleSubmit">
    <label class="form-field">
      <span class="form-label">昵称</span>
      <input
        v-model="form.nickname"
        type="text"
        placeholder="请输入昵称"
        autocomplete="nickname"
        required
      />
    </label>

    <label class="form-field">
      <span class="form-label">邮箱地址</span>
      <input
        v-model="form.email"
        type="email"
        placeholder="请输入邮箱地址"
        autocomplete="email"
        required
      />
    </label>

    <label class="form-field">
      <span class="form-label">验证码</span>
      <div class="verification-input">
        <input
          v-model="form.verificationCode"
          type="text"
          placeholder="请输入验证码"
          required
        />
        <button
          type="button"
          class="verification-button"
          :disabled="isSendingCode || countdown > 0"
          @click="handleSendVerificationCode"
        >
          {{ countdownText }}
        </button>
      </div>
    </label>

    <label class="form-field">
      <span class="form-label">密码</span>
      <div class="password-input">
        <input
          :type="showPassword ? 'text' : 'password'"
          v-model="form.password"
          placeholder="请输入密码"
          autocomplete="new-password"
          required
        />
        <button
          type="button"
          class="toggle-visibility"
          @click="togglePassword"
          :aria-pressed="showPassword"
          aria-label="切换密码可见性"
        >
          <span class="icon" aria-hidden="true">
            <svg v-if="showPassword" viewBox="0 0 24 24" role="presentation">
              <path
                d="M3 6l18 12M9.88 9.94A3 3 0 0 1 12 9c3.75 0 6.75 3 9 6-1.05 1.51-2.35 2.85-3.87 3.86M13.83 13.9A3 3 0 0 1 12 15c-3.75 0-6.75-3-9-6 1.03-1.48 2.31-2.79 3.81-3.8"
              />
            </svg>
            <svg v-else viewBox="0 0 24 24" role="presentation">
              <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </span>
        </button>
      </div>
    </label>

    <label class="form-field">
      <span class="form-label">确认密码</span>
      <input
        class="confirm-password-input"
        :type="showPassword ? 'text' : 'password'"
        v-model="form.confirmPassword"
        placeholder="请再次输入密码"
        autocomplete="new-password"
        required
      />
    </label>

    <p class="form-tip">
      点击注册即表示你同意
      <a href="#" class="link">服务协议</a>
      和
      <a href="#" class="link">隐私政策</a>
    </p>

    <button type="submit" class="submit-button" :disabled="isSubmitting">
      {{ isSubmitting ? '注册中…' : '注册' }}
    </button>
  </form>
</template>

<script setup>
import { reactive, ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { apiClient } from '@/services/apiClient'

const emit = defineEmits(['submit', 'success'])

const form = reactive({
  nickname: '',
  email: '',
  verificationCode: '',
  password: '',
  confirmPassword: '',
})

const showPassword = ref(false)
const isSendingCode = ref(false)
const isSubmitting = ref(false)
const countdown = ref(0)

const COUNTDOWN_SECONDS = 60
const COUNTDOWN_STORAGE_KEY = 'registerVerificationCountdownExpiresAt'

let countdownTimer = null
let countdownExpiresAt = 0

const togglePassword = () => {
  showPassword.value = !showPassword.value
}

const clearCountdownTimer = () => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
}

const updateCountdown = () => {
  if (!countdownExpiresAt) {
    countdown.value = 0
    clearCountdownTimer()
    localStorage.removeItem(COUNTDOWN_STORAGE_KEY)
    return
  }

  const remainingMs = countdownExpiresAt - Date.now()
  const remainingSeconds = Math.max(0, Math.ceil(remainingMs / 1000))
  countdown.value = remainingSeconds

  if (remainingSeconds <= 0) {
    countdownExpiresAt = 0
    clearCountdownTimer()
    localStorage.removeItem(COUNTDOWN_STORAGE_KEY)
  }
}

const setCountdown = (expiresAt) => {
  countdownExpiresAt = expiresAt
  localStorage.setItem(COUNTDOWN_STORAGE_KEY, String(countdownExpiresAt))
  updateCountdown()
  clearCountdownTimer()
  countdownTimer = setInterval(updateCountdown, 1000)
}

const startCountdown = (seconds = COUNTDOWN_SECONDS) => {
  setCountdown(Date.now() + seconds * 1000)
}

const resumeCountdownIfNeeded = () => {
  const stored = Number(localStorage.getItem(COUNTDOWN_STORAGE_KEY))
  if (Number.isFinite(stored) && stored > Date.now()) {
    setCountdown(stored)
  } else {
    localStorage.removeItem(COUNTDOWN_STORAGE_KEY)
    countdownExpiresAt = 0
    countdown.value = 0
  }
}

onMounted(resumeCountdownIfNeeded)
onBeforeUnmount(clearCountdownTimer)

const countdownText = computed(() => {
  if (isSendingCode.value) return '发送中…'
  if (countdown.value > 0) return `${countdown.value}s后重试`
  return '获取验证码'
})

const handleSendVerificationCode = async () => {
  if (!form.email) {
    alert('请先输入邮箱地址')
    return
  }

  try {
    isSendingCode.value = true
    const { data } = await apiClient.post('/user/getVerfCode', {
      email: form.email,
      verfCodeType: 1,
    })
    startCountdown()
  } catch (error) {
    alert(error.message || '验证码发送失败')
  } finally {
    isSendingCode.value = false
  }
}

const handleSubmit = async () => {
  if (isSubmitting.value) return

  if (form.password !== form.confirmPassword) {
    alert('两次输入的密码不一致，请重新输入')
    return
  }

  if (!form.verificationCode) {
    alert('请输入验证码')
    return
  }

  try {
    isSubmitting.value = true
    const payload = {
      nickname: form.nickname,
      email: form.email,
      verificationCode: form.verificationCode,
      password: form.password,
    }
    const { data } = await apiClient.post('/user/register', payload)
    alert(typeof data === 'string' ? data : '注册成功')
    emit('submit', payload)
    emit('success', payload)
  } catch (error) {
    alert(error.message || '注册失败，请稍后重试')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.auth-form {
  display: grid;
  gap: 20px;
  text-align: left;
}

.form-field {
  display: grid;
  gap: 8px;
  font-size: 14px;
  color: var(--text-main, #0f172a);
}

.form-field input[type='email'],
.form-field input[type='text'],
.confirm-password-input,
.password-input input {
  width: 100%;
  padding: 12px 16px;
  border-radius: 12px;
  border: 1px solid var(--input-border, #e2e8f0);
  background: var(--input-bg, #f8fafc);
  font-size: 15px;
  color: var(--text-main, #0f172a);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.form-field input:focus {
  outline: none;
  border-color: var(--accent, #1d4ed8);
  box-shadow: 0 0 0 3px var(--focus-ring, rgba(59, 130, 246, 0.18));
  background: #ffffff;
}

.password-input {
  display: flex;
  align-items: center;
  background: var(--input-bg, #f8fafc);
  border-radius: 12px;
  border: 1px solid var(--input-border, #e2e8f0);
  overflow: hidden;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  width: 100%;
}

.password-input:focus-within {
  border-color: var(--accent, #1d4ed8);
  box-shadow: 0 0 0 3px var(--focus-ring, rgba(59, 130, 246, 0.18));
  background: #ffffff;
}

.password-input input {
  border: none;
  padding: 12px 16px;
  background: transparent;
  flex: 1;
}

.toggle-visibility {
  border: none;
  background: transparent;
  padding: 0 14px;
  cursor: pointer;
  line-height: 1;
  color: var(--text-muted, #94a3b8);
}

.toggle-visibility .icon {
  display: inline-flex;
  width: 20px;
  height: 20px;
  color: inherit;
}

.toggle-visibility svg {
  width: 100%;
  height: 100%;
  stroke: currentColor;
  stroke-width: 2;
  fill: none;
}

.toggle-visibility svg circle {
  fill: currentColor;
  stroke: none;
}

:deep(input[type='password']::-ms-reveal),
:deep(input[type='password']::-ms-clear),
:deep(input[type='password']::-webkit-credentials-auto-fill-button) {
  display: none;
}

.verification-input {
  display: flex;
  align-items: stretch;
  gap: 10px;
  background: var(--input-bg, #f8fafc);
  border: 1px solid var(--input-border, #e2e8f0);
  border-radius: 12px;
  padding: 6px;
}

.verification-input:focus-within {
  border-color: var(--accent, #1d4ed8);
  box-shadow: 0 0 0 3px var(--focus-ring, rgba(59, 130, 246, 0.18));
  background: #ffffff;
}

.verification-input input,
.verification-input input[type='text'] {
  flex: 1;
  border: none;
  padding: 6px 10px;
  background: transparent;
  min-width: 0;
  box-shadow: none;
  outline: none;
}

.verification-input input:focus,
.verification-input input[type='text']:focus {
  border: none;
  box-shadow: none;
  outline: none;
}

.verification-button {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  border: none;
  border-radius: 8px;
  background: var(--accent, #0f172a);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.1s ease, box-shadow 0.2s ease;
  min-height: 44px;
  box-shadow: 0 10px 18px var(--accent-soft, rgba(15, 23, 42, 0.12));
}

.verification-button:hover:enabled {
  background: var(--accent-dark, #111c37);
  box-shadow: 0 14px 22px var(--accent-soft, rgba(15, 23, 42, 0.16));
}

.verification-button:active:enabled {
  transform: translateY(1px);
}

.verification-button:disabled {
  cursor: not-allowed;
  opacity: 0.7;
  box-shadow: none;
}

.form-tip {
  font-size: 12px;
  color: var(--text-muted, #64748b);
  line-height: 1.6;
  margin: 0;
}

.link {
  text-decoration: none;
  color: var(--accent-dark, #0f172a);
  font-weight: 500;
}

.submit-button {
  width: 100%;
  padding: 14px;
  border-radius: 12px;
  border: none;
  background: var(--accent, #0f172a);
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.1s ease, box-shadow 0.2s ease;
  box-shadow: 0 18px 28px var(--accent-soft, rgba(15, 23, 42, 0.12));
}

.submit-button:hover {
  background: var(--accent-dark, #111c37);
  box-shadow: 0 20px 32px var(--accent-soft, rgba(15, 23, 42, 0.16));
}

.submit-button:active {
  transform: translateY(1px);
}

.submit-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}
</style>
