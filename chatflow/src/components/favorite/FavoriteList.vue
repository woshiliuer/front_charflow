<template>
  <div class="favorite-list">
    <div class="favorite-header">
      <div class="title">收藏夹</div>
    </div>

    <ul class="items">
      <li
        v-for="item in items"
        :key="item.id"
        class="item"
        :class="{ active: String(item.id) === String(activeId) }"
        @click="emit('select', item.id)"
      >
        <div class="meta">
          <div class="content-row">
            <span class="main-content">{{ item.content }}</span>
          </div>
          <div class="info-row">
            <span class="sender">{{ item.senderName }}</span>
            <span v-if="item.sourceType === 2" class="group-name">
              · {{ item.groupName }}
            </span>
            <span class="time">{{ formatTime(item.sendTime) }}</span>
          </div>
        </div>
      </li>

      <li v-if="!items.length" class="empty">
        <span>{{ loading ? '加载中…' : '暂无收藏' }}</span>
      </li>
    </ul>
  </div>
</template>

<script setup>
const props = defineProps({
  items: {
    type: Array,
    default: () => [],
  },
  activeId: {
    type: [String, Number],
    default: null,
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['select'])

const formatTime = (timestamp) => {
  if (!timestamp) return ''
  let ms = Number(timestamp)
  if (ms < 1e12) ms *= 1000
  const date = new Date(ms)
  const now = new Date()
  const diff = now - date
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
  return date.toLocaleDateString()
}
</script>

<style scoped>
.favorite-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.favorite-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 40px;
}

.title {
  font-size: 14px;
  font-weight: 800;
  color: #274531;
}

.items {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
}

.item {
  display: flex;
  gap: 12px;
  padding: 12px;
  border-radius: 18px;
  border: 1px solid rgba(230, 239, 229, 0.9);
  background: rgba(246, 252, 248, 0.92);
  cursor: pointer;
  transition: transform 0.12s ease, box-shadow 0.12s ease, background 0.12s ease;
}

.item:hover {
  transform: translateY(-1px);
  box-shadow: 0 14px 26px rgba(54, 102, 74, 0.12);
}

.item.active {
  background: rgba(52, 192, 115, 0.12);
  border-color: rgba(52, 192, 115, 0.25);
}

.icon {
  width: 38px;
  height: 38px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  border: 1px solid rgba(220, 228, 223, 0.95);
  font-size: 18px;
  flex: 0 0 auto;
}

.meta {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.content-row {
  display: flex;
  align-items: center;
}

.main-content {
  font-size: 14px;
  font-weight: 500;
  color: #1f3526;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #8e9c94;
}

.sender {
  font-weight: 500;
}

.group-name {
  max-width: 100px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.time {
  margin-left: auto;
}

.empty {
  padding: 18px 8px;
  color: #8e9c94;
  font-size: 13px;
  text-align: center;
}
</style>
