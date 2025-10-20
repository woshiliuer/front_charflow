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
            <svg
              v-if="showPassword"
              viewBox="0 0 24 24"
              role="presentation"
            >
              <path
                d="M3 6l18 12M9.88 9.94A3 3 0 0 1 12 9c3.75 0 6.75 3 9 6-1.05 1.51-2.35 2.85-3.87 3.86M13.83 13.9A3 3 0 0 1 12 15c-3.75 0-6.75-3-9-6 1.03-1.48 2.31-2.79 3.81-3.8"
              />
            </svg>
            <svg v-else viewBox="0 0 24 24" role="presentation">
              <path
                d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"
              />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </span>
        </button>
      </div>
    </label>

    <label class="form-field">
      <span class="form-label">确认密码</span>
      <input class="confirm-password-input"
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

    <button type="submit" class="submit-button">注册</button>
  </form>
</template>

<script setup>
import { reactive, ref } from 'vue'

const emit = defineEmits(['submit'])

const form = reactive({
  nickname: '',
  email: '',
  password: '',
  confirmPassword: '',
})

const showPassword = ref(false)

const togglePassword = () => {
  showPassword.value = !showPassword.value
}

const handleSubmit = () => {
  if (form.password !== form.confirmPassword) {
    alert('两次输入的密码不一致，请重新输入')
    return
  }

  emit('submit', { ...form })
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
</style>
