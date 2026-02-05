<template>
  <div class="dynamic-detail">
    <div class="dynamic-detail-card" v-if="dynamic">
      <div class="dynamic-detail-header">
        <div class="author-info">
          <div class="avatar">
            <img :src="dynamic.avatarFullUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'" alt="avatar" />
          </div>
          <div class="meta">
            <h2 class="name">{{ dynamic.nickname || '测试用户' }}</h2>
            <p class="time">{{ dynamic.timeHint || '' }}</p>
          </div>
        </div>
        <div class="header-actions" v-if="String(dynamic.userId) === String(currentUserId)">
          <button class="btn-delete-dynamic" @click="emit('delete', dynamic.id)" title="删除动态">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>

      <div class="content-scroll-area">
        <div class="dynamic-body">
          <div class="text-content">
            {{ dynamic.content }}
          </div>
          
          <div v-if="fileList.length" class="image-grid">
            <div v-for="file in fileList" :key="file.filePath" class="image-item">
              <img class="image-real" :src="file.fullFilePath" :alt="file.fileName || 'image'" />
            </div>
          </div>

          <!-- 互动状态 -->
          <div class="engagement-bar">
            <div class="stat">
              <button
                type="button"
                class="btn-like"
                :class="{ liked: Boolean(dynamic?.isLike) }"
                :disabled="actionLoading"
                @click="handleToggleLike"
              >
                <span class="icon">{{ dynamic?.isLike ? '❤️' : '🤍' }}</span>
              </button>
            </div>
            <div class="stat">
              <span class="icon">💬</span>
              <span class="count">{{ commentCount }}</span>
            </div>
          </div>
        </div>

        <!-- 评论区占位 -->
        <div class="comments-section">
          <h3 class="section-title">评论 ({{ commentCount }})</h3>
          <div class="comment-input">
            <input v-model="commentDraft" type="text" placeholder="说点什么吧..." :disabled="actionLoading" />
            <button :disabled="actionLoading || !commentDraft.trim()" @click="handleSubmitComment">发送</button>
          </div>
          <div class="comment-list">
            <div v-for="c in commentList" :key="c.id" class="comment-item">
              <div class="comment-avatar">
                <img :src="c.avatarFullUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + c.id" alt="avatar" />
              </div>
              <div class="comment-content">
                <div class="comment-user">{{ c.nickname || '用户' }}</div>
                <div class="comment-text">{{ c.content }}</div>
                <div class="comment-meta">
                  <span>{{ formatTimeHint(c.createTime) }}</span>
                  <button
                    v-if="String(c.userId) === String(currentUserId)"
                    class="btn-delete"
                    type="button"
                    :disabled="actionLoading"
                    @click="handleDeleteComment(c.id)"
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>

            <div v-if="!commentList.length" class="comment-empty">暂无评论</div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <div class="floating-planets">
        <span class="planet p1">🪐</span>
        <span class="planet p2">🌟</span>
        <span class="planet p3">☄️</span>
      </div>
      <div class="empty-text">
        <h3>探索星空动态</h3>
        <p>选择左侧的一条动态，开启探索之旅</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  dynamic: {
    type: Object,
    default: null,
  },
  currentUserId: {
    type: [String, Number],
    default: null,
  },
  actionLoading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['like', 'unlike', 'comment', 'delete-comment', 'delete'])

const commentDraft = ref('')

watch(
  () => props.dynamic?.id,
  () => {
    commentDraft.value = ''
  },
)

const fileList = computed(() => {
  const list = props.dynamic?.files
  return Array.isArray(list) ? list : []
})

const commentList = computed(() => {
  const list = props.dynamic?.comments
  return Array.isArray(list) ? list : []
})

const likeCount = computed(() => props.dynamic?.likeCount ?? 0)
const commentCount = computed(() => props.dynamic?.commentCount ?? commentList.value.length)

const handleToggleLike = () => {
  if (!props.dynamic?.id) return
  if (props.dynamic?.isLike) {
    emit('unlike', props.dynamic.id)
  } else {
    emit('like', props.dynamic.id)
  }
}

const handleSubmitComment = () => {
  if (!props.dynamic?.id) return
  const content = commentDraft.value.trim()
  if (!content) return
  emit('comment', { feedId: props.dynamic.id, content })
  commentDraft.value = ''
}

const handleDeleteComment = (commentId) => {
  emit('delete-comment', commentId)
}

const formatTimeHint = (timestamp) => {
  let t = Number(timestamp)
  if (!Number.isFinite(t) || t <= 0) return ''
  if (t < 1e12) {
    t *= 1000
  }
  const delta = Date.now() - t
  if (delta < 60 * 1000) return '刚刚'
  const minutes = Math.floor(delta / (60 * 1000))
  if (minutes < 60) return `${minutes}分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  return `${days}天前`
}
</script>

<style scoped>
.dynamic-detail {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px;
  background: #f8faf9;
  overflow: hidden;
}

.dynamic-detail-card {
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

/* Header */
.dynamic-detail-header {
  padding: 20px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #f0f2f1;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  overflow: hidden;
  background: #edf2f0;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.meta .name {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #1a1a1a;
}

.meta .time {
  margin: 2px 0 0;
  font-size: 12px;
  color: #8e9c94;
}

.btn-delete-dynamic {
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

.btn-delete-dynamic:hover {
  background: #fff1f0;
  color: #ff4d4f;
}

/* Content Area */
.content-scroll-area {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.text-content {
  font-size: 16px;
  line-height: 1.6;
  color: #333;
  margin-bottom: 20px;
}

/* Image Grid */
.image-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  width: min(360px, 100%);
  margin-bottom: 24px;
}

.image-item {
  aspect-ratio: 1;
  border-radius: 10px;
  background: #f4f7f6;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1px solid #eef1f0;
}

.image-real {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-placeholder {
  font-size: 12px;
  color: #bdc7c1;
}

/* Engagement */
.engagement-bar {
  display: flex;
  gap: 24px;
  padding: 16px 0;
  border-bottom: 1px solid #f0f2f1;
}

.stat {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #5c6e64;
  font-size: 14px;
}

.stat .icon {
  font-size: 18px;
}

.btn-like {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: none;
  background: transparent;
  color: #3a5b47;
  cursor: pointer;
  transition: transform 0.15s ease, background 0.15s ease;
}

.btn-like:hover {
  transform: translateY(-1px);
  background: rgba(240, 245, 242, 0.9);
}

.btn-like:active {
  transform: translateY(0);
}

.btn-like.liked {
  background: rgba(255, 241, 244, 0.55);
}

.btn-like:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-like .icon {
  font-size: 20px;
  line-height: 1;
}

/* Comments */
.comments-section {
  margin-top: 24px;
}

.section-title {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 16px;
}

.comment-input {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.comment-input input {
  flex: 1;
  background: #f4f7f6;
  border: none;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 14px;
  outline: none;
  transition: box-shadow 0.15s ease;
}

.comment-input input:focus {
  box-shadow: 0 0 0 3px rgba(52, 192, 115, 0.16);
}

.comment-input button {
  background: #edf2f0;
  color: #7d8f86;
  border: none;
  padding: 0 20px;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
}

.comment-input button:not(:disabled) {
  background: rgba(52, 192, 115, 0.12);
  color: #1a7a4c;
}

.comment-input button:not(:disabled):hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 18px rgba(32, 53, 39, 0.12);
}

.comment-input button:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.comment-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.comment-item {
  display: flex;
  gap: 12px;
  padding: 12px 12px;
  border-radius: 16px;
  background: rgba(244, 247, 246, 0.72);
  border: 1px solid rgba(238, 241, 240, 0.9);
}

.comment-avatar {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: #edf2f0;
  overflow: hidden;
  flex: 0 0 auto;
}

.comment-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.comment-content {
  flex: 1;
  min-width: 0;
}

.comment-user {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 4px;
}

.comment-text {
  font-size: 14px;
  color: #4a4a4a;
  line-height: 1.5;
}

.comment-meta {
  font-size: 12px;
  color: #8e9c94;
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn-delete {
  border: none;
  background: transparent;
  color: #c14141;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  padding: 0;
}

.btn-delete:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.comment-empty {
  padding: 16px 0;
  color: #8e9c94;
  font-size: 13px;
}

/* Empty State */
.empty-state {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.floating-planets {
  position: relative;
  width: 120px;
  height: 120px;
  margin-bottom: 24px;
}

.planet {
  position: absolute;
  font-size: 40px;
}

.p1 { top: 20px; left: 20px; animation: float 4s infinite ease-in-out; }
.p2 { top: 0; right: 0; font-size: 24px; animation: float 3s infinite ease-in-out; }
.p3 { bottom: 20px; right: 20px; font-size: 30px; animation: float 5s infinite ease-in-out; }

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.empty-text h3 {
  margin: 0;
  font-size: 20px;
  color: #1a1a1a;
}

.empty-text p {
  margin: 8px 0 0;
  color: #8e9c94;
}

@media (max-width: 600px) {
  .dynamic-detail { padding: 0; }
  .dynamic-detail-card { border-radius: 0; }
}
</style>
