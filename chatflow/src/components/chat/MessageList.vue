<template>
  <ul class="conversation-list">
    <li
      v-for="item in conversations"
      :key="item.id"
      :class="{ active: item.id === activeConversationId }"
      @click="handleSelect(item.id)"
      @contextmenu.prevent="handleContextMenu(item, $event)"
    >
      <div class="avatar">
        <img :src="item.avatar" :alt="item.nameEn" />
        <span v-if="item.status" :class="['status', item.status]" />
      </div>
      <div class="info">
        <div class="name-block">
          <div class="name-row">
            <strong>{{ item.nameEn }}</strong>
            <span v-if="item.isGroupConversation" class="group-badge" title="群聊">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4zM20 12c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm1 2c-.15 0-.31.01-.46.02C21.91 14.88 23 16.29 23 18v2h4v-2c0-2.66-5.33-4-6-4zM4 12c1.66 0 3-1.34 3-3S5.66 6 4 6s-3 1.34-3 3 1.34 3 3 3zm-1 2c-.67 0-5.33 1.34-6 4v2h4v-2c0-1.71 1.09-3.12 2.46-3.98-.15-.01-.31-.02-.46-.02z"/>
              </svg>
            </span>
          </div>
          <span v-if="item.nameCn" class="name-cn">{{ item.nameCn }}</span>
        </div>
        <p v-if="item.snippet">{{ item.snippet }}</p>
      </div>
      <div class="meta">
        <span v-if="item.clock" class="time">{{ item.clock }}</span>
        <span v-if="item.unread" class="badge">{{ item.unread }}</span>
      </div>
    </li>
  </ul>
</template>
<script setup>
const props = defineProps({
  conversations: {
    type: Array,
    required: true,
  },
  activeConversationId: {
    type: [String, Number],
    default: null,
  },
})
const emit = defineEmits(['select', 'context'])
const handleSelect = (conversationId) => {
  emit('select', conversationId)
}
const handleContextMenu = (item, event) => {
  emit('context', { item, event })
}
</script>
<style scoped>
.conversation-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
}
.conversation-list li {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 18px;
  padding: 14px 16px;
  border-radius: 18px;
  background: transparent;
  cursor: pointer;
  transition: background 0.2s ease, box-shadow 0.2s ease;
  align-items: center;
}
.conversation-list li:hover {
  background: rgba(223, 240, 230, 0.6);
  box-shadow: 0 10px 18px rgba(67, 120, 92, 0.1);
}
.conversation-list li.active {
  background: linear-gradient(135deg, rgba(50, 195, 116, 0.18), rgba(29, 163, 104, 0.12));
  box-shadow: 0 14px 20px rgba(69, 145, 101, 0.18);
}
.avatar {
  position: relative;
  width: 48px;
  height: 48px;
}
.avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  box-shadow: 0 6px 12px rgba(40, 76, 58, 0.18);
}
.status {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid #ffffff;
}
.status.online {
  background: #31c173;
}
.status.away {
  background: #f4b43a;
}
.status.offline {
  background: #c0c9c3;
}
.info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.name-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.name-row {
  display: flex;
  align-items: center;
  gap: 6px;
}
.name-block strong {
  font-size: 15px;
  line-height: 1.2;
}
.group-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  line-height: 1;
  color: #ffffff;
  background: linear-gradient(135deg, #32c374, #1da368);
  padding: 2px 4px;
  border-radius: 4px;
  font-weight: 600;
  flex-shrink: 0;
  transform: translateY(-1px);
}
.name-cn {
  font-size: 12px;
  color: #728b78;
}
.info p {
  margin: 0;
  font-size: 13px;
  color: #56725f;
}
.meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  font-size: 12px;
  color: #728b78;
}
.badge {
  background: linear-gradient(135deg, #f66d6d, #e74b4b);
  color: #fff;
  min-width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  font-size: 11px;
  font-weight: 600;
  line-height: 1;
  box-shadow: 0 2px 6px rgba(231, 75, 75, 0.25);
}
</style>
