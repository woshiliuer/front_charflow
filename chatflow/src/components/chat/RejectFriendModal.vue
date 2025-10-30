<template>
  <Transition name="reject-modal-fade">
    <div
      v-if="visible"
      class="reject-modal-overlay"
      @click.self="handleCancel"
    >
      <div class="reject-modal-card">
        <button
          type="button"
          class="reject-modal-close"
          aria-label="关闭拒绝好友弹窗"
          :disabled="loading"
          @click="handleCancel"
        >
          &times;
        </button>

        <header class="reject-modal-header">
          <h3>拒绝好友申请</h3>
          <p>
            确定要拒绝
            <strong>{{ friendName || '这位伙伴' }}</strong>
            的好友申请吗？操作完成后对方将收到通知。
          </p>
        </header>
        <footer class="reject-modal-actions">
          <button
            type="button"
            class="reject-modal-button secondary"
            :disabled="loading"
            @click="handleCancel"
          >
            取消
          </button>
          <button
            type="button"
            class="reject-modal-button danger"
            :disabled="loading"
            @click="handleConfirm"
          >
            {{ loading ? '处理中...' : '确认拒绝' }}
          </button>
        </footer>
      </div>
    </div>
  </Transition>
</template>

<script setup>
const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
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

const emit = defineEmits(['confirm', 'cancel'])

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
.reject-modal-fade-enter-active,
.reject-modal-fade-leave-active {
  transition: opacity 0.24s ease;
}

.reject-modal-fade-enter-from,
.reject-modal-fade-leave-to {
  opacity: 0;
}

.reject-modal-overlay {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 32px 20px;
  background: rgba(14, 25, 21, 0.55);
  backdrop-filter: blur(10px);
  z-index: 1200;
}

.reject-modal-card {
  position: relative;
  width: 420px;
  max-width: 100%;
  padding: 36px 34px 32px;
  border-radius: 24px;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.96), rgba(243, 225, 225, 0.9));
  box-shadow: 0 34px 60px rgba(30, 28, 33, 0.28);
  color: #261818;
}

.reject-modal-close {
  position: absolute;
  top: 18px;
  right: 18px;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.85);
  color: #311c1c;
  font-size: 22px;
  cursor: pointer;
  box-shadow: 0 10px 22px rgba(34, 20, 20, 0.16);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.reject-modal-close:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  box-shadow: none;
}

.reject-modal-close:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 14px 26px rgba(34, 20, 20, 0.2);
}



.reject-modal-header h3 {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #311c1c;
}

.reject-modal-header p {
  margin: 12px 0 0;
  font-size: 14px;
  line-height: 1.6;
  color: #5b3737;
}

.reject-modal-header strong {
  color: #c03636;
}

.reject-modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 14px;
  margin-top: 28px;
}

.reject-modal-button {
  min-width: 120px;
  padding: 11px 24px;
  border-radius: 999px;
  border: none;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease;
}

.reject-modal-button.secondary {
  background: rgba(255, 255, 255, 0.88);
  color: #3b2626;
  box-shadow: 0 10px 22px rgba(42, 20, 20, 0.14);
}

.reject-modal-button.secondary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 14px 26px rgba(42, 20, 20, 0.18);
}

.reject-modal-button.danger {
  background: linear-gradient(135deg, #ff6e6e, #ff4949);
  color: #ffffff;
  box-shadow: 0 14px 28px rgba(255, 89, 89, 0.24);
}

.reject-modal-button.danger:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 18px 32px rgba(255, 89, 89, 0.28);
}

.reject-modal-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

@media (max-width: 520px) {
  .reject-modal-card {
    width: 100%;
    padding: 28px 24px 26px;
    border-radius: 22px;
  }

  .reject-modal-icon {
    width: 56px;
    height: 56px;
    font-size: 24px;
  }

  .reject-modal-actions {
    flex-direction: column;
  }

  .reject-modal-button {
    width: 100%;
  }
}
</style>

