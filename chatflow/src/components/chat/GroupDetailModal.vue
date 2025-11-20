<template>
  <teleport to="body">
    <transition name="dialog-fade">
      <div v-if="visible" class="group-modal-backdrop" @click.self="emit('close')">
        <div class="group-modal">
          <header class="modal-header">
            <div class="avatar">
              <img v-if="group?.avatar" :src="group.avatar" :alt="group?.name || '群聊'" />
              <span v-else>{{ initial }}</span>
            </div>
            <div class="meta">
              <h3>{{ group?.name || '群聊' }}</h3>
              <p v-if="roleLabel" class="role">{{ roleLabel }}</p>
            </div>
            <button type="button" class="close" @click="emit('close')" aria-label="关闭">
              ×
            </button>
          </header>
          <section class="modal-body">
            <div class="info-grid">
              <div class="info-item">
                <span class="label">人数</span>
                <span class="value">{{ memberCountText }}</span>
              </div>
              <div class="info-item">
                <span class="label">简介</span>
                <span class="value muted">{{ introText }}</span>
              </div>
            </div>
          </section>
          <footer class="modal-actions">
            <button
              v-if="canDissolve"
              type="button"
              class="danger"
              @click="emit('dissolve')"
            >
              解散群聊
            </button>
            <button type="button" class="primary" @click="emit('send')">发消息</button>
          </footer>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  group: { type: Object, default: null },
  currentUserId: { type: [Number, String], default: null },
})

const emit = defineEmits(['close', 'send', 'dissolve'])

const initial = computed(() => {
  const text = props.group?.name || ''
  return text.trim().charAt(0).toUpperCase() || 'G'
})

const roleLabel = computed(() => {
  const value = Number(props.group?.role)
  if (Number.isNaN(value)) return ''
  if (value === 3) return '群主'
  if (value === 2) return '管理员'
  if (value === 1) return '成员'
  return ''
})

const canDissolve = computed(() => Number(props.group?.role) === 3)

const memberCountText = computed(() => {
  const count =
    Number(props.group?.memberCount) ||
    (Array.isArray(props.group?.members) ? props.group.members.length : 0)
  return count > 0 ? `${count} 人` : '人数未知'
})

const introText = computed(() => {
  return (
    props.group?.introduction ||
    props.group?.description ||
    props.group?.intro ||
    props.group?.announcement ||
    '暂无简介'
  )
})
</script>

<style scoped>
.group-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2100;
}

.group-modal {
  width: min(420px, 92vw);
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.16);
  padding: 18px 18px 16px;
  display: grid;
  gap: 16px;
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
}

.avatar {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  overflow: hidden;
  background: #e6f3ec;
  display: grid;
  place-items: center;
  font-weight: 700;
  color: #225c3d;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.meta h3 {
  margin: 0;
  font-size: 18px;
  color: #1f3526;
}

.meta .role {
  margin: 4px 0 0;
  font-size: 13px;
  color: #3c6d52;
}

.close {
  position: absolute;
  top: 0;
  right: 0;
  border: none;
  background: transparent;
  font-size: 20px;
  cursor: pointer;
  color: #1f3526;
}

.modal-body {
  font-size: 14px;
  color: #2c4739;
}

.info-grid {
  display: grid;
  gap: 10px;
  margin-top: 10px;
}

.info-item {
  display: flex;
  gap: 8px;
  align-items: center;
}

.label {
  font-weight: 600;
  color: #1f3526;
}

.value {
  color: #2c4739;
}

.value.muted {
  color: #4f6b58;
}

.modal-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
}

.primary,
.danger {
  min-width: 100px;
  border: none;
  border-radius: 12px;
  padding: 10px 16px;
  font-weight: 600;
  cursor: pointer;
}

.primary {
  background: linear-gradient(135deg, #32c374, #1da368);
  color: #ffffff;
  box-shadow: 0 10px 20px rgba(45, 176, 103, 0.18);
}

.danger {
  background: linear-gradient(135deg, #f16767, #d14141);
  color: #ffffff;
}

.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: opacity 0.2s ease;
}

.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
}
</style>
