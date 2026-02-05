<template>
  <Teleport to="body">
    <transition name="notification-modal-fade">
      <div v-if="visible" class="notification-modal__overlay" @click.self="emitClose">
        <section
          ref="panelRef"
          class="notification-modal__panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="notification-modal-title"
          tabindex="-1"
          @keydown.esc.prevent="emitClose"
        >
          <header class="panel-header">
            <div class="panel-header__titles">
              <h2 id="notification-modal-title">通知设置</h2>
              <p class="panel-header__subtitle">管理聊天消息相关提醒</p>
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

          <div class="notification-content">
            <div class="setting-card">
              <div class="setting-card__info">
                <div class="setting-card__title">消息通知</div>
                <div class="setting-card__desc">关闭后，收到新消息将不再弹出提醒窗口</div>
              </div>
              <div class="setting-card__actions">
                <button 
                  type="button" 
                  :class="['setting-switch', { 'is-active': enabled }]" 
                  role="switch" 
                  :aria-checked="enabled"
                  :disabled="saving"
                  @click="handleToggle(!enabled)"
                >
                  <span class="switch-handle"></span>
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'

const props = defineProps({
  currentUser: { type: Object, required: true },
  visible: { type: Boolean, default: false },
  saving: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'toggle'])

const panelRef = ref(null)

const enabled = ref(true)

watch(
  () => props.currentUser?.notificationEnabled,
  (val) => {
    enabled.value = Number(val ?? 2) === 2
  },
  { immediate: true },
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

function emitClose() {
  emit('close')
}

function handleToggle(isEnable) {
  emit('toggle', isEnable ? 2 : 1)
}
</script>

<style scoped>
.notification-modal__overlay {
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

.notification-modal__panel {
  width: min(520px, 100%);
  max-height: 100%;
  overflow-y: auto;
  background: radial-gradient(circle at top left, rgba(50, 195, 116, 0.18), transparent 60%),
    radial-gradient(circle at bottom right, rgba(29, 163, 104, 0.18), transparent 55%),
    rgba(255, 255, 255, 0.96);
  border-radius: 28px;
  padding: 32px 36px 30px;
  box-shadow: 0 28px 56px rgba(11, 34, 23, 0.28);
  outline: none;
  display: flex;
  flex-direction: column;
  gap: 22px;
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
}

.panel-header__subtitle {
  margin: 0;
  font-size: 13px;
  color: rgba(19, 55, 39, 0.7);
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

.notification-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.setting-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 24px 24px;
  border-radius: 24px;
  border: 1px solid rgba(97, 126, 108, 0.22);
  background: rgba(255, 255, 255, 0.85);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.65);
}

.setting-card__info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.setting-card__title {
  font-size: 16px;
  font-weight: 700;
  color: #123b29;
}

.setting-card__desc {
  font-size: 14px;
  color: rgba(19, 55, 39, 0.72);
  line-height: 1.5;
}

.setting-card__actions {
  flex-shrink: 0;
}

.setting-switch {
  position: relative;
  width: 52px;
  height: 28px;
  border-radius: 14px;
  background: #d5dfd9;
  border: none;
  cursor: pointer;
  transition: background-color 0.25s ease;
  padding: 0;
  display: flex;
  align-items: center;
  outline: none;
}

.setting-switch.is-active {
  background-color: #34cc7a;
}

.setting-switch:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.switch-handle {
  position: absolute;
  left: 3px;
  width: 22px;
  height: 22px;
  background-color: #ffffff;
  border-radius: 50%;
  transition: transform 0.25s cubic-bezier(0.23, 1, 0.32, 1);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.setting-switch.is-active .switch-handle {
  transform: translateX(24px);
}

.notification-modal-fade-enter-active,
.notification-modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.notification-modal-fade-enter-from,
.notification-modal-fade-leave-to {
  opacity: 0;
}

.notification-modal-fade-enter-active .notification-modal__panel,
.notification-modal-fade-leave-active .notification-modal__panel {
  transition: transform 0.22s ease, opacity 0.22s ease;
}

.notification-modal-fade-enter-from .notification-modal__panel {
  transform: translateY(16px) scale(0.98);
  opacity: 0;
}

.notification-modal-fade-leave-to .notification-modal__panel {
  transform: translateY(12px) scale(0.98);
  opacity: 0;
}

@media (max-width: 640px) {
  .notification-modal__overlay {
    padding: 24px 16px;
  }

  .notification-modal__panel {
    padding: 28px 24px;
    border-radius: 22px;
  }
}
</style>
