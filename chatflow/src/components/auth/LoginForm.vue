<template>
  <form class="auth-form" @submit.prevent="handleSubmit">
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
      <span class="form-label">密码</span>
      <div class="password-input">
        <input
          :type="showPassword ? 'text' : 'password'"
          v-model="form.password"
          placeholder="请输入密码"
          autocomplete="current-password"
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

    <div class="form-options">
      <label class="remember">
        <input v-model="form.remember" type="checkbox" />
        记住我
      </label>
      <button type="button" class="link" @click="handleForgotPassword">
        忘记密码?
      </button>
    </div>

    <button type="submit" class="submit-button" :disabled="isSubmitting">
      {{ isSubmitting ? '登录中…' : '登录' }}
    </button>
  </form>

  <ResetPasswordPanel
    :visible="showResetPasswordModal"
    :current-user="resetUser"
    :submitting="resettingPassword"
    :sending-code="sendingResetCode"
    :code-countdown="resetCodeCountdown"
    @close="closeResetPasswordModal"
    @request-code="handleRequestResetCode"
    @reset="handleResetPassword"
  />
</template>

<script setup>
import { onBeforeUnmount, reactive, ref } from 'vue'
import { apiClient } from '@/services/apiClient'
import { useAuthStore } from '@/stores/auth'
import ResetPasswordPanel from '@/components/settings/ResetPasswordPanel.vue'
import { requestPasswordResetCode, recoverPassword } from '@/services/passwordRecovery'
import { ElMessage } from 'element-plus'
import 'element-plus/es/components/message/style/css'

const emit = defineEmits(['submit', 'success'])

const form = reactive({
  email: '',
  password: '',
  remember: false,
})

const resetUser = reactive({
  email: '',
})

const showPassword = ref(false)
const isSubmitting = ref(false)
const showResetPasswordModal = ref(false)
const sendingResetCode = ref(false)
const resettingPassword = ref(false)
const resetCodeCountdown = ref(0)

const authStore = useAuthStore()

const RESET_CODE_COUNTDOWN = 60
let resetCodeTimer = null

const togglePassword = () => {
  showPassword.value = !showPassword.value
}

const handleForgotPassword = () => {
  const email = form.email.trim()
  if (!email) {
    ElMessage.warning('请先输入邮箱地址')
    return
  }
  resetUser.email = email
  showResetPasswordModal.value = true
}

const clearResetPasswordState = () => {
  if (resetCodeTimer) {
    clearInterval(resetCodeTimer)
    resetCodeTimer = null
  }
  resetCodeCountdown.value = 0
}

const closeResetPasswordModal = () => {
  showResetPasswordModal.value = false
  clearResetPasswordState()
}

const startResetCodeCountdown = (seconds = RESET_CODE_COUNTDOWN) => {
  if (resetCodeTimer) {
    clearInterval(resetCodeTimer)
    resetCodeTimer = null
  }
  resetCodeCountdown.value = seconds
  resetCodeTimer = setInterval(() => {
    if (resetCodeCountdown.value <= 1) {
      clearResetPasswordState()
    } else {
      resetCodeCountdown.value -= 1
    }
  }, 1000)
}

const handleRequestResetCode = async (email) => {
  if (sendingResetCode.value) return
  const targetEmail = email?.trim() || resetUser.email || ''
  if (!targetEmail) {
    ElMessage.warning('请输入邮箱以获取验证码')
    return
  }
  try {
    sendingResetCode.value = true
    await requestPasswordResetCode(targetEmail)
    ElMessage.success('验证码已发送，请查收邮箱')
    startResetCodeCountdown()
  } catch (error) {
    console.error(error)
    ElMessage.error(error?.message || '验证码发送失败，请稍后重试')
  } finally {
    sendingResetCode.value = false
  }
}

const handleResetPassword = async ({ email, code, password, passwordConfirm }) => {
  if (resettingPassword.value) return
  const targetEmail = email?.trim() || resetUser.email || ''
  if (!targetEmail) {
    ElMessage.error('请提供邮箱地址以重置密码')
    return
  }
  try {
    resettingPassword.value = true
    const { data } = await recoverPassword({
      email: targetEmail,
      code,
      password,
      passwordConfirm,
    })
    ElMessage.success(typeof data === 'string' && data ? data : '密码已重置，请使用新密码登录')
    closeResetPasswordModal()
  } catch (error) {
    console.error(error)
    ElMessage.error(error?.message || '重置密码失败，请稍后重试')
  } finally {
    resettingPassword.value = false
  }
}

const handleSubmit = async () => {
  if (isSubmitting.value) return

  if (!form.email) {
    alert('请输入邮箱地址')
    return
  }

  if (!form.password) {
    alert('请输入密码')
    return
  }

  try {
    isSubmitting.value = true
    const payload = {
      email: form.email,
      password: form.password,
      remember: form.remember,
    }

    const { data } = await apiClient.post('/user/login', payload)
    if (data) {
      const token = typeof data === 'string' ? data : data.token ?? ''
      authStore.setToken(token)
    }
    emit('submit', payload)
    emit('success', { payload, data })
  } catch (error) {
    alert(error.message || '登录失败，请稍后重试')
  } finally {
    isSubmitting.value = false
  }
}

onBeforeUnmount(() => {
  clearResetPasswordState()
})
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

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: var(--text-muted, #64748b);
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
  border: 1px solid var(--input-border, #cbd5f5);
  accent-color: var(--accent, #0f172a);
}

.link {
  background: transparent;
  border: none;
  padding: 0;
  text-decoration: none;
  color: var(--accent-dark, #0f172a);
  font-weight: 500;
  cursor: pointer;
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
