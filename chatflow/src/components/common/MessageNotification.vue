<template>
  <transition name="notification-fade">
    <div v-if="visible" class="message-notification" @click="handleClick">
      <div class="notification-header">
        <div class="sender-avatar">
          <img :src="avatar || defaultAvatar" alt="avatar" />
        </div>
        <div class="sender-info">
          <span class="sender-name">{{ senderName }}</span>
          <span class="notification-tag">新消息</span>
        </div>
        <button class="close-btn" @click.stop="handleClose">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M18 6L6 18M6 6l12 12"></path>
          </svg>
        </button>
      </div>
      <div class="notification-body">
        <p class="message-text">{{ messageText }}</p>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  visible: Boolean,
  senderName: String,
  messageText: String,
  avatar: String,
  conversationId: [String, Number]
})

const emit = defineEmits(['close', 'click'])

const defaultAvatar = 'https://chat-flow.oss-cn-guangzhou.aliyuncs.com/default-avatar/default-person.jpg'

const handleClose = () => {
  emit('close')
}

const handleClick = () => {
  emit('click', props.conversationId)
}

// 自动关闭逻辑可以在父组件控制，也可以在这里
</script>

<style scoped>
.message-notification {
  position: fixed;
  right: 24px;
  bottom: 24px;
  width: 300px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(52, 192, 115, 0.2);
  border-radius: 18px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1);
  padding: 16px;
  z-index: 9999;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  overflow: hidden;
}

.message-notification:hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 40px rgba(52, 192, 115, 0.15);
}

.notification-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.sender-avatar {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  overflow: hidden;
  border: 1.5px solid #fff;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
  flex-shrink: 0;
}

.sender-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.sender-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.sender-name {
  font-size: 14px;
  font-weight: 700;
  color: #1f3526;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.notification-tag {
  font-size: 10px;
  color: #2bb673;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  padding: 4px;
  color: #8e9c94;
  cursor: pointer;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #1f3526;
}

.notification-body {
  padding-left: 2px;
}

.message-text {
  font-size: 13px;
  color: #4e6a58;
  margin: 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 动画效果 */
.notification-fade-enter-active,
.notification-fade-leave-active {
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.notification-fade-enter-from {
  opacity: 0;
  transform: translateX(40px);
}

.notification-fade-leave-to {
  opacity: 0;
  transform: translateX(40px);
}
</style>
