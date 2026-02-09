<template>
  <form class="auth-form" @submit.prevent="handleSubmit">
    <div class="input-group">
      <label class="field">
        <span class="field-label">邮箱地址</span>
        <div class="input-wrapper">
          <span class="input-icon">✉️</span>
          <input v-model="form.email" type="email" placeholder="请输入邮箱地址" autocomplete="email" required />
        </div>
      </label>

      <label class="field">
        <span class="field-label">密码</span>
        <div class="input-wrapper">
          <span class="input-icon">🔒</span>
          <input :type="showPw ? 'text' : 'password'" v-model="form.password" placeholder="请输入密码" autocomplete="current-password" required />
          <button type="button" class="pw-toggle" @click="showPw = !showPw">{{ showPw ? '👁️' : '👁️‍🗨️' }}</button>
        </div>
      </label>
    </div>

    <div class="form-row">
      <label class="remember">
        <div class="checkbox-wrapper">
          <input v-model="form.remember" type="checkbox" id="remember-me" />
          <div class="checkbox-custom"></div>
        </div>
        <span>记住我</span>
      </label>
      <button type="button" class="forgot-btn" @click="handleForgotPassword">忘记密码?</button>
    </div>

    <button type="submit" class="submit-btn" :disabled="isSubmitting">
      <span v-if="!isSubmitting">立即登录</span>
      <span v-else class="loading-dots">登录中</span>
    </button>
  </form>
  <teleport to="body">
    <div v-if="showResetModal" class="modal-overlay" @click.self="closeResetModal">
      <div class="modal-card">
        <h3>找回密码</h3>
        <p class="modal-desc">验证码将发送至: <strong>{{ resetEmail }}</strong></p>
        <div class="modal-fields">
          <input v-model="resetCode" type="text" placeholder="输入验证码" />
          <button type="button" class="code-btn" :disabled="sendingCode || codeCountdown > 0" @click="handleSendResetCode">{{ codeCountdown > 0 ? `${codeCountdown}s` : (sendingCode ? '发送中…' : '获取验证码') }}</button>
        </div>
        <input v-model="resetPw" type="password" placeholder="新密码" />
        <input v-model="resetPwConfirm" type="password" placeholder="确认新密码" />
        <div class="modal-actions">
          <button type="button" class="btn-ghost" @click="closeResetModal">取消</button>
          <button type="button" class="btn-primary" :disabled="resetting" @click="handleResetPassword">{{ resetting ? '重置中…' : '重置密码' }}</button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { reactive, ref, onBeforeUnmount, onMounted, watch } from 'vue'
import { apiClient } from '@/services/apiClient'
import { useAuthStore } from '@/stores/auth'
import { requestPasswordResetCode, recoverPassword } from '@/services/passwordRecovery'

const emit = defineEmits(['submit', 'success'])
const authStore = useAuthStore()
const form = reactive({ email: '', password: '', remember: false })
const showPw = ref(false)
const isSubmitting = ref(false)
const showResetModal = ref(false)
const resetEmail = ref('')
const resetCode = ref('')
const resetPw = ref('')
const resetPwConfirm = ref('')
const sendingCode = ref(false)
const resetting = ref(false)
const codeCountdown = ref(0)
let codeTimer = null

const REMEMBER_KEY = 'chatroom_login_remember'

onMounted(() => {
  try {
    const raw = localStorage.getItem(REMEMBER_KEY)
    if (!raw) return
    const saved = JSON.parse(raw)
    if (saved && typeof saved === 'object') {
      form.email = typeof saved.email === 'string' ? saved.email : ''
      form.password = typeof saved.password === 'string' ? saved.password : ''
      form.remember = Boolean(saved.remember)
    }
  } catch (_) {
    localStorage.removeItem(REMEMBER_KEY)
  }
})

watch(
  () => form.remember,
  (val) => {
    if (val) return
    try { localStorage.removeItem(REMEMBER_KEY) } catch (_) {}
  }
)

const handleForgotPassword = () => {
  if (!form.email.trim()) { alert('请先输入邮箱地址'); return }
  resetEmail.value = form.email.trim(); showResetModal.value = true
}
const closeResetModal = () => {
  showResetModal.value = false; resetCode.value = ''; resetPw.value = ''; resetPwConfirm.value = ''
  if (codeTimer) { clearInterval(codeTimer); codeTimer = null }; codeCountdown.value = 0
}
const handleSendResetCode = async () => {
  if (sendingCode.value) return
  try { sendingCode.value = true; await requestPasswordResetCode(resetEmail.value); alert('验证码已发送'); codeCountdown.value = 60
    codeTimer = setInterval(() => { if (codeCountdown.value <= 1) { codeCountdown.value = 0; clearInterval(codeTimer); codeTimer = null } else codeCountdown.value-- }, 1000)
  } catch (e) { alert(e?.message || '验证码发送失败') } finally { sendingCode.value = false }
}
const handleResetPassword = async () => {
  if (resetting.value) return
  if (!resetCode.value) { alert('请输入验证码'); return }
  if (!resetPw.value) { alert('请输入新密码'); return }
  if (resetPw.value !== resetPwConfirm.value) { alert('两次密码不一致'); return }
  try { resetting.value = true; await recoverPassword({ email: resetEmail.value, code: resetCode.value, password: resetPw.value, passwordConfirm: resetPwConfirm.value }); alert('密码已重置'); closeResetModal()
  } catch (e) { alert(e?.message || '重置密码失败') } finally { resetting.value = false }
}
const handleSubmit = async () => {
  if (isSubmitting.value) return
  if (!form.email) { alert('请输入邮箱地址'); return }
  if (!form.password) { alert('请输入密码'); return }
  try { isSubmitting.value = true
    const { data } = await apiClient.post('/user/login', { email: form.email, password: form.password, remember: form.remember })
    if (data) { authStore.setToken(typeof data === 'string' ? data : data.token ?? '') }
    if (form.remember) {
      try {
        localStorage.setItem(
          REMEMBER_KEY,
          JSON.stringify({ email: form.email, password: form.password, remember: true })
        )
      } catch (_) {}
    }
    emit('success', { data })
  } catch (e) { alert(e.message || '登录失败') } finally { isSubmitting.value = false }
}
onBeforeUnmount(() => { if (codeTimer) clearInterval(codeTimer) })
</script>

<style scoped>
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

.pw-toggle {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  padding: 4px;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.form-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.remember {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #6b7280;
  cursor: pointer;
  font-size: 13px;
}

.checkbox-wrapper {
  position: relative;
  width: 16px;
  height: 16px;
}

.checkbox-wrapper input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}

.checkbox-custom {
  position: absolute;
  top: 0;
  left: 0;
  height: 16px;
  width: 16px;
  background-color: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  transition: all 0.2s;
}

.checkbox-wrapper:hover input ~ .checkbox-custom {
  border-color: #4f46e5;
}

.checkbox-wrapper input:checked ~ .checkbox-custom {
  background-color: #4f46e5;
  border-color: #4f46e5;
}

.checkbox-custom:after {
  content: "";
  position: absolute;
  display: none;
  left: 5px;
  top: 2px;
  width: 4px;
  height: 8px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.checkbox-wrapper input:checked ~ .checkbox-custom:after {
  display: block;
}

.forgot-btn {
  border: none;
  background: none;
  color: #4f46e5;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
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
  margin-top: 4px;
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

/* Modal styles - simple */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 24px;
}

.modal-card {
  width: min(400px, 100%);
  background: #ffffff;
  border-radius: 12px;
  padding: 24px;
  display: grid;
  gap: 16px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.modal-card h3 {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.modal-desc {
  font-size: 13px;
  color: #6b7280;
  margin: 0;
}

.modal-fields {
  display: flex;
  gap: 8px;
}

.modal-card input {
  width: 100%;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  background: #f9fafb;
  color: #111827;
  font-size: 14px;
  outline: none;
}

.code-btn {
  flex-shrink: 0;
  padding: 0 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #f3f4f6;
  color: #374151;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 4px;
}

.btn-ghost {
  padding: 8px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #ffffff;
  color: #374151;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.btn-primary {
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  background: #4f46e5;
  color: #ffffff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
</style>
