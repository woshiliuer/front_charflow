<template>
  <div class="favorite-detail">
    <div v-if="item" class="card">
      <div class="header">
        <div class="left">
          <div class="avatar-stack">
            <img v-if="item.senderAvatar?.fullFilePath" :src="item.senderAvatar.fullFilePath" class="avatar sender-avatar" title="发送人头像" />
            <div v-else class="avatar-placeholder sender-avatar">{{ item.senderName?.charAt(0) }}</div>
            
            <img v-if="item.sourceType === 2 && item.groupAvatar?.fullFilePath" :src="item.groupAvatar.fullFilePath" class="avatar group-avatar" title="群聊头像" />
          </div>
          <div class="info">
            <div class="title">
              {{ item.senderName }}
              <span v-if="item.sourceType === 2" class="group-info">
                @ {{ item.groupName }}
              </span>
            </div>
            <div class="sub">{{ formatTime(item.sendTime) }}</div>
          </div>
        </div>
        <div class="actions">
          <button class="delete-btn" @click="emit('delete', item.id)" title="取消收藏">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>

      <div class="content">
        <div v-if="item.itemType === 1" class="text">{{ item.content }}</div>
        <div v-else class="image-wrapper">
          <img class="image" :src="item.fileDetail?.fullFilePath" :alt="item.fileDetail?.fileName" />
          <div class="file-meta" v-if="item.fileDetail">
            <span class="file-size">{{ formatFileSize(item.fileDetail.fileSize) }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="empty">
      <div class="empty-title">收藏夹</div>
      <div class="empty-desc">选择左侧一条收藏查看详情</div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  item: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['delete'])

const formatTime = (timestamp) => {
  if (!timestamp) return ''
  let ms = Number(timestamp)
  if (ms < 1e12) ms *= 1000
  return new Date(ms).toLocaleString()
}

const formatFileSize = (bytes) => {
  if (!bytes) return ''
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}
</script>

<style scoped>
.favorite-detail {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px;
  background: #f8faf9;
  overflow: hidden;
}

.card {
  width: 100%;
  max-width: 800px;
  height: 100%;
  background: #ffffff;
  border-radius: 24px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.header {
  padding: 20px 24px;
  border-bottom: 1px solid #f0f2f1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.avatar-stack {
  position: relative;
  width: 48px;
  height: 48px;
}

.avatar {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  object-fit: cover;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.group-avatar {
  position: absolute;
  right: -4px;
  bottom: -4px;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: 2px solid #fff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.avatar-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e8f5e9;
  color: #2e7d32;
  font-weight: 800;
  font-size: 20px;
}

.info {
  display: flex;
  flex-direction: column;
}

.title {
  font-size: 16px;
  font-weight: 800;
  color: #1f3526;
  display: flex;
  align-items: center;
  gap: 8px;
}

.group-info {
  font-size: 13px;
  font-weight: 400;
  color: #8e9c94;
}

.delete-btn {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: none;
  background: transparent;
  color: #8e9c94;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.delete-btn:hover {
  background: #fff1f0;
  color: #ff4d4f;
}

.image-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.file-meta {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.file-name {
  font-size: 13px;
  color: #4e6a58;
  font-weight: 500;
}

.file-size {
  font-size: 11px;
  color: #8e9c94;
}

.sub {
  margin-top: 2px;
  font-size: 12px;
  color: #8e9c94;
}

.content {
  padding: 24px;
  overflow: auto;
}

.text {
  font-size: 14px;
  line-height: 1.7;
  color: #274531;
}

.image {
  display: block;
  width: min(520px, 100%);
  max-height: 420px;
  margin: 0 auto;
  object-fit: contain;
  border-radius: 16px;
  border: 1px solid rgba(238, 241, 240, 0.9);
  background: rgba(246, 252, 248, 0.92);
}

.empty {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.empty-title {
  font-size: 20px;
  font-weight: 900;
  color: #1f3526;
}

.empty-desc {
  margin-top: 8px;
  color: #8e9c94;
}
</style>
