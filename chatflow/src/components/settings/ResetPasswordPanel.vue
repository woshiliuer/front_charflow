<template>
  <Teleport to="body">
    <transition name="reset-modal-fade">
      <div v-if="visible" class="reset-modal__overlay" @click.self="emitClose">
        <section
          ref="panelRef"
          class="reset-modal__panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-modal-title"
          tabindex="-1"
          @keydown.esc.prevent="emitClose"
        >
          <header class="panel-header">
            <div class="panel-header__titles">
              <h2 id="reset-modal-title">找回密码</h2>
              <p class="panel-header__subtitle">通过邮箱验证码重置登录密码</p>
            </div>
            <button
              type="button"
              class="panel-header__close"
              aria-label="关闭"
              @click="emitClose"
            >
              ×
            </button>
          </header>

          <form class="reset-form" @submit.prevent="onSubmit">
            <div class="field is-readonly">
              <label>邮箱</label>
              <div class="input-shell">
                <input :value="form.email" readonly />
              </div>
            </div>

            <div class="field">
              <label>验证码</label>
              <div class="input-shell verification-shell">
                <input
                  v-model.trim="form.code"
                  type="text"
                  placeholder="请输入验证码"
                  autocomplete="one-time-code"
                />
                <button
                  type="button"
                  class="btn secondary compact"
                  :disabled="sendingCode || codeCountdown > 0"
                  @click="onSendCode"
                >
                  {{ codeButtonText }}
                </button>
              </div>
            </div>

            <div class="field">
              <label>新密码</label>
              <div class="input-shell">
                <input
                  v-model="form.newPassword"
                  type="password"
                  placeholder="请输入新密码"
                  autocomplete="new-password"
                />
              </div>
            </div>

            <div class="field">
              <label>确认密码</label>
              <div class="input-shell">
                <input
                  v-model="form.confirmPassword"
                  type="password"
                  placeholder="请再次输入新密码"
                  autocomplete="new-password"
                />
              </div>
            </div>

            <footer class="panel-footer">
              <button type="button" class="btn secondary" @click="emitClose">
                取消
              </button>
              <button type="submit" class="btn primary" :disabled="submitting">
                {{ submitting ? '提交中…' : '确认重置' }}
              </button>
            </footer>
          </form>
        </section>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  currentUser: { type: Object, required: true },
  visible: { type: Boolean, default: false },
  submitting: { type: Boolean, default: false },
  sendingCode: { type: Boolean, default: false },
  codeCountdown: { type: Number, default: 0 },
})

const emit = defineEmits(['close', 'request-code', 'reset'])

const form = reactive({
  email: '',
  code: '',
  newPassword: '',
  confirmPassword: '',
})

const panelRef = ref(null)

watch(
  () => props.currentUser,
  (user) => {
    form.email = typeof user?.email === 'string' ? user.email.trim() : ''
  },
  { immediate: true, deep: true },
)

watch(
  () => props.visible,
  (isVisible) => {
    if (isVisible) {
      form.email = typeof props.currentUser?.email === 'string' ? props.currentUser.email.trim() : ''
      nextTick(() => {
        panelRef.value?.focus()
      })
    } else {
      form.code = ''
      form.newPassword = ''
      form.confirmPassword = ''
    }
  },
)

const codeButtonText = computed(() => {
  if (props.sendingCode) return '发送中…'
  if (props.codeCountdown > 0) return `${props.codeCountdown}s后重试`
  return '获取验证码'
})

const onSendCode = () => {
  if (props.sendingCode || props.codeCountdown > 0) return
  const email = typeof form.email === 'string' ? form.email.trim() : ''
  if (!email) {
    ElMessage.warning('当前账号缺少邮箱，无法发送验证码')
    return
  }
  emit('request-code', email)
}

const emitClose = () => {
  emit('close')
}

const onSubmit = () => {
  if (props.submitting) return

  if (!form.code.trim()) {
    ElMessage.error('请输入验证码')
    return
  }

  if (!form.newPassword) {
    ElMessage.error('请输入新密码')
    return
  }

  if (form.newPassword.length < 6) {
    ElMessage.error('密码长度需至少 6 位')
    return
  }

  if (form.newPassword !== form.confirmPassword) {
    ElMessage.error('两次输入的密码不一致')
    return
  }

  const email = typeof form.email === 'string' ? form.email.trim() : ''
  emit('reset', {
    email,
    code: form.code.trim(),
    password: form.newPassword,
    passwordConfirm: form.confirmPassword,
  })
}
</script>

<style scoped>
.reset-modal__overlay {
  position: fixed;
  inset: 0;
  background: linear-gradient(135deg, rgba(15, 42, 28, 0.52), rgba(18, 61, 41, 0.68));
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  z-index: 1200;
  backdrop-filter: blur(6px);
}

.reset-modal__panel {
  width: min(520px, 100%);
  max-height: 100%;
  overflow-y: auto;
  background: radial-gradient(circle at top left, rgba(50, 195, 116, 0.18), transparent 60%),
    radial-gradient(circle at bottom right, rgba(29, 163, 104, 0.18), transparent 55%),
    rgba(255, 255, 255, 0.96);
  border-radius: 28px;
  padding: 32px 36px 36px;
  box-shadow: 0 28px 56px rgba(11, 34, 23, 0.28);
  outline: none;
  display: flex;
  flex-direction: column;
  gap: 26px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.panel-header__titles {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-start;
  text-align: left;
}

.panel-header__titles h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #123b29;
}

.panel-header__subtitle {
  margin: 0;
  font-size: 14px;
  color: rgba(31, 53, 38, 0.68);
}

.panel-header__close {
  border: none;
  background: rgba(255, 255, 255, 0.3);
  width: 44px;
  height: 44px;
  border-radius: 14px;
  color: #0e2f20;
  font-size: 24px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.18s ease, transform 0.18s ease;
}

.panel-header__close:hover {
  background: rgba(255, 255, 255, 0.4);
  transform: translateY(-1px);
}

.reset-form {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.field label {
  font-size: 14px;
  font-weight: 600;
  color: rgba(19, 55, 39, 0.9);
  text-align: left;
}

.input-shell {
  border-radius: 16px;
  border: 1px solid rgba(97, 126, 108, 0.28);
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.65);
  display: flex;
  align-items: center;
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}

.input-shell:focus-within {
  border-color: rgba(52, 204, 122, 0.6);
  box-shadow: 0 8px 18px rgba(46, 170, 102, 0.22);
  background: rgba(255, 255, 255, 0.96);
}

.input-shell input {
  width: 100%;
  border: none;
  background: transparent;
  font-size: 15px;
  color: #143726;
  outline: none;
  padding: 8px 0;
}

.input-shell input::placeholder {
  color: rgba(97, 126, 108, 0.6);
}

.verification-shell {
  gap: 12px;
  padding: 6px 6px 6px 16px;
}

.verification-shell input {
  flex: 1;
}

.field.is-readonly .input-shell {
  background: rgba(243, 248, 245, 0.9);
  border-color: rgba(97, 126, 108, 0.26);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6);
}

.field.is-readonly input {
  color: #6d8377;
  cursor: default;
}

.btn {
  min-width: 128px;
  height: 44px;
  border-radius: 22px;
  border: none;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease;
}

.btn.compact {
  min-width: 108px;
  height: 40px;
  padding: 0 16px;
}

.btn.primary {
  background: linear-gradient(135deg, #34cc7a, #1da368);
  color: #ffffff;
  box-shadow: 0 18px 32px rgba(29, 163, 104, 0.3);
}

.btn.secondary {
  background: rgba(39, 121, 79, 0.1);
  color: #1f3526;
  box-shadow: 0 12px 24px rgba(11, 34, 23, 0.12);
}

.btn:hover:not(:disabled) {
  transform: translateY(-1px);
}

.btn:disabled {
  opacity: 0.62;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.panel-footer {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 12px;
}

.reset-modal-fade-enter-active,
.reset-modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.reset-modal-fade-enter-from,
.reset-modal-fade-leave-to {
  opacity: 0;
}

.reset-modal-fade-enter-active .reset-modal__panel,
.reset-modal-fade-leave-active .reset-modal__panel {
  transition: transform 0.22s ease, opacity 0.22s ease;
}

.reset-modal-fade-enter-from .reset-modal__panel {
  transform: translateY(16px) scale(0.98);
  opacity: 0;
}

.reset-modal-fade-leave-to .reset-modal__panel {
  transform: translateY(12px) scale(0.98);
  opacity: 0;
}

@media (max-width: 640px) {
  .reset-modal__overlay {
    padding: 24px 16px;
  }

  .reset-modal__panel {
    padding: 28px 24px;
    border-radius: 22px;
  }

  .panel-footer {
    flex-direction: column;
  }

  .panel-footer .btn {
    width: 100%;
  }
}
</style>
