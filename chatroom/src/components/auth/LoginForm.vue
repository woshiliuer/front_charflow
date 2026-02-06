<template>
  <form class="auth-form" @submit.prevent="handleSubmit">
    <label class="field"><span class="field-label">邮箱地址</span>
      <input v-model="form.email" type="email" placeholder="请输入邮箱地址" autocomplete="email" required />
    </label>
    <label class="field"><span class="field-label">密码</span>
      <input :type="showPw ? 'text' : 'password'" v-model="form.password" placeholder="请输入密码" autocomplete="current-password" required />
    </label>
    <div class="form-row">
      <label class="remember"><input v-model="form.remember" type="checkbox" /><span>记住我</span></label>
      <button type="button" class="forgot-btn" @click="handleForgotPassword">忘记密码?</button>
    </div>
    <button type="submit" class="submit-btn" :disabled="isSubmitting">{{ isSubmitting ? '登录中…' : '登录' }}</button>
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
import { reactive, ref, onBeforeUnmount } from 'vue'
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
    emit('success', { data })
  } catch (e) { alert(e.message || '登录失败') } finally { isSubmitting.value = false }
}
onBeforeUnmount(() => { if (codeTimer) clearInterval(codeTimer) })
</script>

<style scoped>
.auth-form { display: grid; gap: 16px; text-align: left; }
.field { display: grid; gap: 5px; }
.field-label { font-size: 13px; font-weight: 500; color: var(--c-text-2); }
.field input { width: 100%; padding: 10px 14px; border-radius: var(--c-radius-sm); border: 1px solid var(--c-border); background: var(--c-bg); color: var(--c-text); font-size: 14px; outline: none; transition: border-color 0.2s; }
.field input:focus { border-color: var(--c-accent); box-shadow: 0 0 0 3px var(--c-accent-soft); }
.form-row { display: flex; justify-content: space-between; align-items: center; font-size: 13px; }
.remember { display: inline-flex; align-items: center; gap: 6px; color: var(--c-text-2); cursor: pointer; }
.remember input { width: 15px; height: 15px; accent-color: var(--c-accent); }
.forgot-btn { border: none; background: none; color: var(--c-accent); font-size: 13px; font-weight: 500; cursor: pointer; padding: 0; }
.forgot-btn:hover { text-decoration: underline; }
.submit-btn { width: 100%; padding: 11px; border-radius: var(--c-radius-sm); border: none; background: var(--c-accent); color: #fff; font-size: 14px; font-weight: 600; cursor: pointer; transition: background 0.2s; }
.submit-btn:hover:not(:disabled) { background: var(--c-accent-hover); }
.submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 24px; }
.modal-card { width: min(400px, 100%); background: var(--c-surface); border: 1px solid var(--c-border); border-radius: var(--c-radius-lg); padding: 28px; display: grid; gap: 14px; box-shadow: var(--c-shadow-lg); }
.modal-card h3 { font-size: 17px; color: var(--c-text); margin: 0; }
.modal-desc { font-size: 13px; color: var(--c-text-3); margin: 0; }
.modal-desc strong { color: var(--c-accent); }
.modal-fields { display: flex; gap: 8px; }
.modal-card input { width: 100%; padding: 9px 12px; border-radius: var(--c-radius-sm); border: 1px solid var(--c-border); background: var(--c-bg); color: var(--c-text); font-size: 14px; outline: none; }
.modal-card input:focus { border-color: var(--c-accent); box-shadow: 0 0 0 3px var(--c-accent-soft); }
.code-btn { flex-shrink: 0; padding: 9px 14px; border: none; border-radius: var(--c-radius-sm); background: var(--c-accent); color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; white-space: nowrap; }
.code-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 4px; }
.btn-ghost { padding: 8px 18px; border: 1px solid var(--c-border); border-radius: var(--c-radius-sm); background: var(--c-bg); color: var(--c-text-2); font-size: 13px; cursor: pointer; }
.btn-primary { padding: 8px 18px; border: none; border-radius: var(--c-radius-sm); background: var(--c-accent); color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
