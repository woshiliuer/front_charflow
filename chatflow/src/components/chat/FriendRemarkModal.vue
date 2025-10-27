<template>
  <Transition name="remark-modal-fade">
    <div
      v-if="visible"
      class="remark-modal-overlay"
      @click.self="handleCancel"
    >
      <div class="remark-modal-card">
        <button
          type="button"
          class="remark-modal-close"
          aria-label="关闭备注弹窗"
          :disabled="loading"
          @click="handleCancel"
        >
          &times;
        </button>
        <header class="remark-modal-header">
          <h3>确认好友申请</h3>
          <p>
            给
            <strong>{{ friendName || '这位伙伴' }}</strong>
            填写一个备注，方便后续在联系人中快速找到对方。
          </p>
        </header>
        <form class="remark-modal-form" @submit.prevent="handleConfirm">
          <label>
            备注（可留空）
            <input
              type="text"
              :value="localRemark"
              :disabled="loading"
              maxlength="36"
              placeholder="输入备注，如同事、项目角色等"
              @input="onInput"
            />
          </label>
          <footer class="remark-modal-actions">
            <button
              type="button"
              class="remark-modal-button secondary"
              :disabled="loading"
              @click="handleCancel"
            >
              取消
            </button>
            <button
              type="submit"
              class="remark-modal-button primary"
              :disabled="loading"
            >
              {{ loading ? '通过中…' : '确认通过' }}
            </button>
          </footer>
        </form>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  remark: {
    type: String,
    default: '',
  },
  friendName: {
    type: String,
    default: '',
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:remark', 'confirm', 'cancel'])

const localRemark = ref(props.remark ?? '')

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      localRemark.value = props.remark ?? ''
    }
  },
)

watch(
  () => props.remark,
  (next) => {
    const value = next ?? ''
    if (value !== localRemark.value) {
      localRemark.value = value
    }
  },
)

watch(
  localRemark,
  (value) => {
    emit('update:remark', value)
  },
)

const onInput = (event) => {
  localRemark.value = event.target.value
}

const handleCancel = () => {
  if (props.loading) return
  emit('cancel')
}

const handleConfirm = () => {
  if (props.loading) return
  emit('confirm')
}
</script>

<style scoped>
.remark-modal-fade-enter-active,
.remark-modal-fade-leave-active {
  transition: opacity 0.22s ease;
}

.remark-modal-fade-enter-from,
.remark-modal-fade-leave-to {
  opacity: 0;
}

.remark-modal-overlay {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 32px 20px;
  background: rgba(13, 35, 24, 0.55);
  backdrop-filter: blur(10px);
  z-index: 1500;
}

.remark-modal-card {
  position: relative;
  width: 420px;
  max-width: 100%;
  padding: 28px 32px;
  border-radius: 24px;
  background: linear-gradient(150deg, rgba(255, 255, 255, 0.98), rgba(226, 242, 233, 0.95));
  box-shadow: 0 32px 60px rgba(18, 44, 30, 0.26);
  color: #143526;
}

.remark-modal-close {
  position: absolute;
  top: 18px;
  right: 20px;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.85);
  color: #1f3526;
  font-size: 22px;
  cursor: pointer;
  box-shadow: 0 10px 22px rgba(18, 44, 30, 0.18);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.remark-modal-close:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 14px 28px rgba(18, 44, 30, 0.22);
}

.remark-modal-close:disabled {
  cursor: not-allowed;
  opacity: 0.5;
  box-shadow: none;
}

.remark-modal-header h3 {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
}

.remark-modal-header p {
  margin: 10px 0 0;
  font-size: 14px;
  color: #32543f;
  line-height: 1.6;
}

.remark-modal-header strong {
  color: #1b6643;
}

.remark-modal-form {
  margin-top: 22px;
  display: grid;
  gap: 18px;
}

.remark-modal-form label {
  display: grid;
  gap: 8px;
  font-size: 14px;
  color: #234534;
}

.remark-modal-form input {
  width: 100%;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid rgba(170, 208, 189, 0.9);
  background: rgba(255, 255, 255, 0.96);
  font-size: 15px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.remark-modal-form input:focus {
  outline: none;
  border-color: #32c374;
  box-shadow: 0 0 0 3px rgba(50, 195, 116, 0.18);
  background: rgba(255, 255, 255, 0.99);
}

.remark-modal-form input:disabled {
  background: rgba(240, 245, 242, 0.8);
  cursor: not-allowed;
}

.remark-modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.remark-modal-button {
  min-width: 108px;
  padding: 10px 18px;
  border-radius: 999px;
  border: none;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease;
}

.remark-modal-button.primary {
  background: linear-gradient(135deg, #32c374, #1da368);
  color: #ffffff;
  box-shadow: 0 12px 24px rgba(36, 166, 96, 0.24);
}

.remark-modal-button.primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 18px 30px rgba(36, 166, 96, 0.28);
}

.remark-modal-button.secondary {
  background: rgba(255, 255, 255, 0.85);
  color: #275941;
  box-shadow: 0 10px 20px rgba(19, 51, 35, 0.12);
}

.remark-modal-button.secondary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 14px 26px rgba(19, 51, 35, 0.16);
}

.remark-modal-button:disabled {
  opacity: 0.6;
  transform: none;
  cursor: not-allowed;
  box-shadow: none;
}
</style>
