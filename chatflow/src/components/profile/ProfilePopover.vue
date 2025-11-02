<template>
  <Transition name="profile-popover-fade">
    <div
      v-if="visible"
      class="profile-popover"
      role="dialog"
      aria-label="个人信息"
    >
      <div class="profile-popover-header">
        <div class="profile-popover-avatar">
          <img
            v-if="hasAvatar"
            :src="user.avatarFullUrl || user.avatarUrl"
            :alt="displayName"
          />
          <span v-else>{{ initial }}</span>
        </div>
        <div class="profile-popover-meta">
          <strong>{{ displayName }}</strong>
          <span>{{ emailText }}</span>
        </div>
      </div>
      <div class="profile-popover-body">
        <p v-if="hasSignature">{{ signature }}</p>
        <p v-else class="muted">这个人很神秘，还没有留下签名。</p>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  user: {
    type: Object,
    default: () => ({}),
  },
  hasAvatar: {
    type: Boolean,
    default: false,
  },
  initial: {
    type: String,
    default: '?',
  },
})

const displayName = computed(() => {
  const user = props.user ?? {}
  return user.nickname || user.name || '未设置昵称'
})

const emailText = computed(() => {
  const user = props.user ?? {}
  return user.email || '未绑定邮箱'
})

const signature = computed(() => {
  const text = props.user?.signature
  return typeof text === 'string' ? text.trim() : ''
})

const hasSignature = computed(() => signature.value.length > 0)
</script>

<style scoped>
.profile-popover {
  position: absolute;
  top: 0;
  left: calc(100% + 16px);
  width: 260px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 20px 36px rgba(26, 62, 44, 0.22);
  padding: 20px 22px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  border: 1px solid rgba(207, 223, 214, 0.7);
  backdrop-filter: blur(6px);
  z-index: 80;
}

.profile-popover-header {
  display: flex;
  align-items: center;
  gap: 14px;
}

.profile-popover-avatar {
  width: 52px;
  height: 52px;
  border-radius: 18px;
  overflow: hidden;
  background: rgba(50, 195, 116, 0.16);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: #1f3526;
  font-size: 20px;
}

.profile-popover-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.profile-popover-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.profile-popover-meta strong {
  font-size: 16px;
  color: #173425;
}

.profile-popover-meta span {
  font-size: 13px;
  color: #597667;
}

.profile-popover-body {
  font-size: 13px;
  line-height: 1.6;
  color: #355041;
  word-break: break-word;
}

.profile-popover-body .muted {
  color: #8aa398;
}

.profile-popover-fade-enter-active,
.profile-popover-fade-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.profile-popover-fade-enter-from,
.profile-popover-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@media (max-width: 768px) {
  .profile-popover {
    left: 0;
    transform: translateY(60px);
    width: 240px;
  }
}
</style>
