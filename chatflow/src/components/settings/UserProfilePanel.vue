<template>
  <Teleport to="body">
    <transition name="profile-modal-fade">
      <div v-if="visible" class="profile-modal__overlay" @click.self="emitClose">
        <section
          ref="panelRef"
          class="profile-modal__panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="profile-modal-title"
          tabindex="-1"
          @keydown.esc.prevent="emitClose"
        >
          <header class="panel-header">
            <div class="panel-header__titles">
              <h2 id="profile-modal-title">个人资料</h2>
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

          <form class="profile-form" @submit.prevent="onSubmit">
            <div class="avatar-area">
              <img :src="form.avatarUrl || defaultAvatar" alt="avatar" class="avatar-preview" />
              <label class="avatar-upload">
                <input type="file" accept="image/*" @change="onAvatarChange" />
                <span>更换头像</span>
              </label>
            </div>

            <div class="field">
              <label>昵称</label>
              <div class="input-shell">
                <input v-model.trim="form.displayName" placeholder="请输入昵称" />
              </div>
            </div>

            <div class="field">
              <label>性别</label>
              <div class="gender-select" role="radiogroup" aria-label="性别">
                <button
                  type="button"
                  :class="['gender-select__option', { active: form.gender === 'male' }]"
                  @click="form.gender = 'male'"
                >
                  <span class="gender-select__icon">♂</span>
                  <span>男</span>
                </button>
                <button
                  type="button"
                  :class="['gender-select__option', { active: form.gender === 'female' }]"
                  @click="form.gender = 'female'"
                >
                  <span class="gender-select__icon">♀</span>
                  <span>女</span>
                </button>
              </div>
            </div>

            <div class="field is-readonly">
              <label>邮箱</label>
              <div class="input-shell">
                <input :value="form.email" readonly />
              </div>
            </div>

            <div class="field">
              <label>个性签名</label>
              <div class="input-shell textarea">
                <textarea
                  v-model.trim="form.signature"
                  rows="3"
                  placeholder="写点什么介绍自己吧"
                />
              </div>
            </div>

            <footer class="panel-footer">
              <button type="button" class="btn secondary" @click="onReset">重置</button>
              <button type="submit" class="btn primary" :disabled="submitting">
                {{ submitting ? '保存中…' : '保存修改' }}
              </button>
            </footer>
          </form>
        </section>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, reactive, ref, watch } from 'vue'

const props = defineProps({
  currentUser: { type: Object, required: true },
  loading: { type: Boolean, default: false },
  visible: { type: Boolean, default: false },
})

const emit = defineEmits(['update', 'change-avatar', 'close'])
const defaultAvatar = '/assets/default-avatar.png'

const form = reactive({
  avatarUrl: '',
  displayName: '',
  gender: '',
  email: '',
  signature: '',
})

const panelRef = ref(null)
watch(
  () => props.currentUser,
  (user) => {
    if (!user) return
    form.avatarUrl = user.avatarUrl || user.avatarFullUrl || ''
    form.displayName = user.displayName || user.nickname || ''
    form.gender = user.gender || ''
    form.email = user.email || ''
    form.signature = user.signature || ''
  },
  { immediate: true, deep: true },
)

watch(
  () => props.visible,
  (showing) => {
    if (showing) {
      nextTick(() => {
        panelRef.value?.focus()
      })
    }
  },
)

const submitting = computed(() => props.loading)

function emitClose() {
  emit('close')
}

function onAvatarChange(event) {
  if (props.loading) return
  const input = event?.target
  const file = input?.files?.[0]
  if (!file) return
  emit('change-avatar', file)
  if (input) {
    input.value = ''
  }
}

function onReset() {
  const user = props.currentUser || {}
  form.avatarUrl = user.avatarUrl || user.avatarFullUrl || ''
  form.displayName = user.displayName || user.nickname || ''
  form.gender = user.gender || ''
  form.email = user.email || ''
  form.signature = user.signature || ''
}

function onSubmit() {
  emit('update', {
    avatarUrl: form.avatarUrl,
    displayName: form.displayName,
    gender: form.gender,
    signature: form.signature,
  })
}


</script>

<style scoped>
.profile-modal__overlay {
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

.profile-modal__panel {
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

.panel-header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #123b29;
  text-shadow: none;
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

.profile-form {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.avatar-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}

.avatar-preview {
  width: 108px;
  height: 108px;
  border-radius: 32px;
  object-fit: cover;
  box-shadow: 0 16px 32px rgba(21, 74, 48, 0.2);
  border: 4px solid rgba(255, 255, 255, 0.65);
}

.avatar-upload {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: 18px;
  background: rgba(51, 158, 103, 0.1);
  color: #1f3526;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.18s ease, transform 0.18s ease, color 0.18s ease;
}

.avatar-upload input {
  display: none;
}

.avatar-upload:hover {
  background: rgba(46, 170, 102, 0.18);
  transform: translateY(-1px);
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

.input-shell.textarea {
  align-items: flex-start;
}

.input-shell textarea,
.input-shell input,
.input-shell select {
  width: 100%;
  border: none;
  background: transparent;
  font-size: 15px;
  color: #143726;
  outline: none;
  padding: 8px 0;
}

.input-shell textarea {
  resize: none;
  line-height: 1.5;
  min-height: 80px;
}

.gender-select {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  padding: 8px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(97, 126, 108, 0.22);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6);
}

.gender-select__option {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px 10px;
  border-radius: 14px;
  border: none;
  background: rgba(47, 156, 103, 0.08);
  color: #1f3526;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease, color 0.18s ease;
}

.gender-select__option .gender-select__icon {
  font-size: 18px;
  line-height: 1;
}

.gender-select__option:hover {
  background: rgba(47, 156, 103, 0.16);
  transform: translateY(-1px);
}

.gender-select__option.active {
  background: linear-gradient(135deg, rgba(52, 204, 122, 0.85), rgba(29, 163, 104, 0.85));
  color: #ffffff;
  box-shadow: 0 18px 32px rgba(29, 163, 104, 0.22);
  transform: translateY(-1px);
}

.gender-select__option.active .gender-select__icon {
  filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.2));
}

.gender-select__option:focus-visible {
  outline: 2px solid rgba(52, 204, 122, 0.8);
  outline-offset: 2px;
}

.input-shell input::placeholder,
.input-shell textarea::placeholder {
  color: rgba(97, 126, 108, 0.6);
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

.panel-footer {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding-top: 6px;
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

.profile-modal-fade-enter-active,
.profile-modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.profile-modal-fade-enter-from,
.profile-modal-fade-leave-to {
  opacity: 0;
}

.profile-modal-fade-enter-active .profile-modal__panel,
.profile-modal-fade-leave-active .profile-modal__panel {
  transition: transform 0.22s ease, opacity 0.22s ease;
}

.profile-modal-fade-enter-from .profile-modal__panel {
  transform: translateY(16px) scale(0.98);
  opacity: 0;
}

.profile-modal-fade-leave-to .profile-modal__panel {
  transform: translateY(12px) scale(0.98);
  opacity: 0;
}

@media (max-width: 640px) {
  .profile-modal__overlay {
    padding: 24px 16px;
  }

  .profile-modal__panel {
    padding: 28px 24px;
    border-radius: 22px;
  }
}
</style>
