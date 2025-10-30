<template>
  <transition name="friend-modal-fade">
    <div
      v-if="visible && friend"
      class="friend-modal-overlay"
      @click.self="emitClose"
    >
      <div class="friend-modal-card">
        <button
          type="button"
          class="friend-modal-close"
          aria-label="关闭好友详情"
          @click="emitClose"
        >
          &times;
        </button>
        <div class="friend-modal-header">
          <div class="friend-modal-avatar">
            <img :src="friend.avatar" :alt="friend.nickname || friend.nameEn" />
            <span
              v-if="friend.status"
              :class="['friend-status', friend.status]"
            />
          </div>
          <div class="friend-modal-title">
            <h3>{{ friend.nickname || friend.nameEn }}</h3>
            <p class="friend-modal-subtitle">
              {{ friend.nameEn }}
              <span v-if="friend.nameCn"> · {{ friend.nameCn }}</span>
            </p>
            <p class="friend-modal-remark">
              {{ friend.remark || '暂无备注' }}
            </p>
          </div>
        </div>
        <div class="friend-modal-body">
          <dl>
            <div class="friend-modal-row">
              <dt>备注</dt>
              <dd>{{ friend.remark || '暂无备注' }}</dd>
            </div>
            <div class="friend-modal-row">
              <dt>昵称</dt>
              <dd>{{ friend.nickname || friend.nameEn }}</dd>
            </div>
            <div class="friend-modal-row">
              <dt>邮箱</dt>
              <dd>{{ friend.email || '未提供邮箱' }}</dd>
            </div>
            <div class="friend-modal-row">
              <dt>个性签名</dt>
              <dd>{{ friend.signature || '这位朋友还没有写签名' }}</dd>
            </div>
          </dl>
        </div>
        <div class="friend-modal-actions">
          <button
            type="button"
            class="friend-modal-action"
            @click="emitSend"
          >
            发消息
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  friend: { type: Object, default: null },
})

const emit = defineEmits(['close', 'send'])

const friend = computed(() => props.friend)

const emitClose = () => {
  emit('close')
}

const emitSend = () => {
  emit('send')
}
</script>

<style scoped>
.friend-modal-fade-enter-active,
.friend-modal-fade-leave-active {
  transition: opacity 0.24s ease;
}

.friend-modal-fade-enter-from,
.friend-modal-fade-leave-to {
  opacity: 0;
}

.friend-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 40, 27, 0.48);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 24px;
  z-index: 1200;
}

.friend-modal-card {
  width: 420px;
  max-width: 100%;
  background: linear-gradient(150deg, rgba(255, 255, 255, 0.98), rgba(221, 239, 228, 0.94));
  border-radius: 24px;
  box-shadow: 0 28px 50px rgba(31, 53, 38, 0.26);
  padding: 32px 34px;
  color: #1f3526;
  position: relative;
}

.friend-modal-close {
  position: absolute;
  top: 18px;
  right: 20px;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.86);
  color: #2a4c38;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  box-shadow: 0 6px 16px rgba(31, 53, 38, 0.16);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.friend-modal-close:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 22px rgba(31, 53, 38, 0.22);
}

.friend-modal-header {
  display: flex;
  align-items: center;
  gap: 18px;
  margin-bottom: 24px;
}

.friend-modal-avatar {
  width: 82px;
  height: 82px;
  border-radius: 24px;
  overflow: hidden;
  position: relative;
  flex-shrink: 0;
  box-shadow: 0 16px 32px rgba(36, 75, 52, 0.22);
}

.friend-modal-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.friend-status {
  position: absolute;
  bottom: 10px;
  right: 10px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 3px solid rgba(255, 255, 255, 0.92);
}

.friend-status.online {
  background: #31c374;
}

.friend-status.away {
  background: #f7b84d;
}

.friend-status.offline {
  background: #bcc5c0;
}

.friend-modal-title h3 {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
}

.friend-modal-subtitle {
  margin: 6px 0 0;
  font-size: 14px;
  color: #58725f;
}

.friend-modal-remark {
  margin: 10px 0 0;
  font-size: 14px;
  color: #1f3526;
  font-weight: 500;
}

.friend-modal-body {
  padding-top: 18px;
  border-top: 1px solid rgba(198, 221, 207, 0.6);
}

.friend-modal-body dl {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.friend-modal-row {
  display: flex;
  gap: 12px;
}

.friend-modal-row dt {
  width: 72px;
  font-size: 13px;
  color: #6b8574;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  line-height: 1.5;
  flex-shrink: 0;
}

.friend-modal-row dd {
  margin: 0;
  font-size: 15px;
  color: #264736;
  line-height: 1.6;
}

.friend-modal-row:last-child dd {
  font-style: italic;
  color: #395848;
}

.friend-modal-actions {
  margin-top: 28px;
  display: flex;
  justify-content: center;
}

.friend-modal-action {
  border: none;
  border-radius: 16px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #32c374, #1da368);
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 16px 26px rgba(45, 176, 103, 0.28);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.friend-modal-action:hover {
  transform: translateY(-2px);
  box-shadow: 0 20px 32px rgba(45, 176, 103, 0.34);
}

@media (max-width: 768px) {
  .friend-modal-overlay {
    align-items: flex-end;
    padding: 24px 16px;
  }

  .friend-modal-card {
    width: 100%;
    padding: 24px 22px 28px;
    border-radius: 20px;
  }
}
</style>
