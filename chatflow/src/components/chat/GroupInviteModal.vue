<template>
  <transition name="modal-fade">
    <div v-if="visible" class="modal-root">
      <div class="modal-backdrop" @click="$emit('close')" />
      <div class="modal-panel" role="dialog" aria-modal="true">
        <header class="modal-header">
          <h3>邀请好友进群</h3>
          <button type="button" class="close-button" @click="$emit('close')" aria-label="关闭">
            X
          </button>
        </header>

        <div class="modal-body">
          <div class="search">
            <input
              v-model.trim="keyword"
              type="text"
              placeholder="搜索好友昵称或备注"
              aria-label="搜索好友"
            />
          </div>

          <div class="friend-list" v-if="filteredFriends.length">
            <label
              v-for="friend in filteredFriends"
              :key="friend.id"
              class="friend-item"
            >
              <input
                type="checkbox"
                :value="friend.id"
                v-model="selectedIds"
              />
              <span class="avatar">
                <img :src="friend.avatar" :alt="friend.displayName" />
              </span>
              <div class="info">
                <p class="name">{{ friend.displayName }}</p>
                <p v-if="friend.email" class="meta">{{ friend.email }}</p>
              </div>
            </label>
          </div>
          <div v-else class="empty">没有匹配的好友</div>
        </div>

        <footer class="modal-footer">
          <button type="button" class="ghost" @click="$emit('close')">取消</button>
          <button
            type="button"
            class="primary"
            :disabled="!selectedIds.length"
            @click="handleConfirm"
          >
            确认邀请<span v-if="selectedIds.length">({{ selectedIds.length }})</span>
          </button>
        </footer>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  friends: { type: Array, default: () => [] },
})

const emit = defineEmits(['close', 'confirm'])

const keyword = ref('')
const selectedIds = ref([])

const normalizedFriends = computed(() =>
  (Array.isArray(props.friends) ? props.friends : []).map((friend) => ({
    id: friend.id,
    displayName: friend.displayName || friend.nickname || friend.name || `好友 #${friend.id ?? ''}`,
    avatar:
      friend.avatar ||
      friend.avatarFullUrl ||
      friend.avatarUrl ||
      'https://chat-flow.oss-cn-guangzhou.aliyuncs.com/default-avatar/default-person.jpg',
    email: friend.email || '',
  })),
)

const filteredFriends = computed(() => {
  const list = normalizedFriends.value
  const term = keyword.value.trim().toLowerCase()
  if (!term) return list
  return list.filter((friend) => {
    const text = `${friend.displayName || ''} ${friend.email || ''}`.toLowerCase()
    return text.includes(term)
  })
})

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      keyword.value = ''
      selectedIds.value = []
    }
  },
)

const handleConfirm = () => {
  emit('confirm', [...selectedIds.value])
}
</script>

<style scoped>
.modal-root {
  position: fixed;
  inset: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2100;
}

.modal-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(16, 29, 22, 0.45);
  backdrop-filter: blur(4px);
}

.modal-panel {
  position: relative;
  width: min(480px, calc(100vw - 48px));
  max-height: 80vh;
  background: #f9fcfa;
  border-radius: 24px;
  box-shadow: 0 28px 60px rgba(22, 48, 34, 0.25);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  padding: 20px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(50, 195, 116, 0.16);
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  color: #153323;
}

.close-button {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 16px;
  background: rgba(47, 101, 69, 0.1);
  color: #153323;
  font-size: 18px;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.2s ease;
}

.close-button:hover {
  background: rgba(50, 195, 116, 0.22);
  transform: rotate(90deg);
}

.modal-body {
  padding: 18px 24px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow: hidden;
}

.search input {
  width: 100%;
  border: 1px solid rgba(47, 101, 69, 0.18);
  border-radius: 14px;
  padding: 10px 14px;
  font-size: 14px;
  background: rgba(255, 255, 255, 0.92);
  color: #1b3425;
}

.search input:focus {
  outline: none;
  border-color: #34c073;
  box-shadow: 0 0 0 3px rgba(52, 192, 115, 0.18);
}

.friend-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-right: 4px;
}

.friend-item {
  display: flex;
  align-items: center;
  gap: 14px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(55, 114, 77, 0.12);
  border-radius: 16px;
  padding: 10px 14px;
  cursor: pointer;
  transition: border 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.friend-item:hover {
  border-color: rgba(50, 195, 116, 0.4);
  transform: translateY(-1px);
  box-shadow: 0 12px 22px rgba(33, 66, 49, 0.12);
}

.friend-item input {
  width: 16px;
  height: 16px;
  accent-color: #32c374;
}

.avatar {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  overflow: hidden;
  flex-shrink: 0;
  background: rgba(50, 195, 116, 0.12);
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info .name {
  margin: 0;
  font-size: 15px;
  color: #163323;
  font-weight: 600;
}

.info .meta {
  margin: 0;
  font-size: 12px;
  color: rgba(22, 51, 35, 0.6);
}

.empty {
  text-align: center;
  color: rgba(22, 51, 35, 0.7);
  font-size: 13px;
  padding: 28px 0;
}

.modal-footer {
  padding: 16px 24px 20px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  border-top: 1px solid rgba(50, 195, 116, 0.16);
}

.modal-footer button {
  min-width: 110px;
  border-radius: 18px;
  padding: 10px 18px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.modal-footer button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
  box-shadow: none;
  transform: none;
}

.modal-footer .ghost {
  background: rgba(47, 101, 69, 0.12);
  color: #153323;
}

.modal-footer .ghost:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 8px 18px rgba(33, 66, 49, 0.14);
}

.modal-footer .primary {
  background: linear-gradient(135deg, #32c374, #1da368);
  color: #ffffff;
  box-shadow: 0 12px 22px rgba(45, 176, 103, 0.24);
}

.modal-footer .primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 14px 28px rgba(45, 176, 103, 0.28);
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.18s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

@media (max-width: 600px) {
  .modal-panel {
    width: calc(100vw - 32px);
    max-height: 84vh;
  }
}
</style>
