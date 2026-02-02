<template>
  <div class="dynamic-list">
    <div class="dynamic-search">
      <div class="search-box">
        <input
          v-model="keyword"
          type="text"
          placeholder="搜索动态内容"
          :disabled="loading"
          @keydown.enter.prevent="handleSearchNow"
        />
        <button type="button" class="search-btn" :disabled="loading" @click="handleSearchNow">
          搜索
        </button>
      </div>
    </div>

    <ul class="dynamic-items">
      <li
        v-for="item in filteredItems"
        :key="item.id"
        :class="{ active: String(item.id) === String(activeId) }"
        @click="handleSelect(item.id)"
      >
        <div class="author-avatar">
          <img :src="item.avatarFullUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + item.id" alt="avatar" />
        </div>
        <div class="info">
          <div class="header-row">
            <span class="author-name">{{ item.nickname || '测试用户' }}</span>
            <span class="time">{{ item.timeHint || '' }}</span>
          </div>
          <p class="snippet">{{ item.content }}</p>
          <div class="stats-row">
            <span>❤️ {{ item.likeCount || 0 }}</span>
            <span>💬 {{ item.commentCount || 0 }}</span>
          </div>
        </div>
        <div class="badge-area">
          <span v-if="item.badge" class="badge">{{ item.badge }}</span>
        </div>
      </li>

      <li v-if="!filteredItems.length" class="empty">
        <span>{{ loading ? '加载中…' : '暂无动态' }}</span>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

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

const emit = defineEmits(['select', 'search'])

const keyword = ref('')

let searchTimer = null

watch(
  () => keyword.value,
  (value) => {
    if (searchTimer) {
      clearTimeout(searchTimer)
    }
    searchTimer = setTimeout(() => {
      emit('search', value)
    }, 300)
  },
)

const handleSearchNow = () => {
  if (searchTimer) {
    clearTimeout(searchTimer)
    searchTimer = null
  }
  emit('search', keyword.value)
}

const filteredItems = computed(() => {
  const list = Array.isArray(props.items) ? props.items : []
  const key = keyword.value.trim().toLowerCase()
  if (!key) return list
  return list.filter((it) => {
    const nickname = (it?.nickname ?? '').toString().toLowerCase()
    const content = (it?.content ?? '').toString().toLowerCase()
    return nickname.includes(key) || content.includes(key)
  })
})

const handleSelect = (id) => {
  emit('select', id)
}
</script>

<style scoped>
.dynamic-search {
  margin-bottom: 14px;
}

.search-box {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 18px;
  border: 1px solid #dbe7dc;
  background: #f7fbf8;
  box-shadow: 0 10px 20px rgba(54, 102, 74, 0.08);
}

.search-box:focus-within {
  border-color: rgba(52, 192, 115, 0.6);
  box-shadow: 0 0 0 4px rgba(52, 192, 115, 0.12), 0 14px 26px rgba(54, 102, 74, 0.12);
}

.search-box input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  padding: 6px 6px;
  font-size: 14px;
  color: #1f3526;
}

.search-btn {
  height: 32px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid rgba(52, 192, 115, 0.45);
  background: rgba(52, 192, 115, 0.12);
  color: #1a7a4c;
  font-weight: 800;
  font-size: 13px;
  cursor: pointer;
  transition: transform 0.12s ease, box-shadow 0.12s ease;
}

.search-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 18px rgba(32, 53, 39, 0.12);
}

.search-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.dynamic-items {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
}

.dynamic-items li {
  display: flex;
  gap: 14px;
  padding: 16px;
  border-radius: 20px;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  align-items: flex-start;
  margin-bottom: 4px;
}

.dynamic-items li:hover {
  background: #f0f4f2;
}

.dynamic-items li.active {
  background: #ffffff;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
}

.author-avatar {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  overflow: hidden;
  background: #edf2f0;
  flex-shrink: 0;
}

.author-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.author-name {
  font-size: 14px;
  font-weight: 700;
  color: #1a1a1a;
}

.time {
  font-size: 11px;
  color: #8e9c94;
}

.snippet {
  margin: 0;
  font-size: 13px;
  color: #5c6e64;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
}

.image-preview-strip {
  display: flex;
  gap: 4px;
  margin: 2px 0;
}

.mini-img {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  background: #f4f7f6;
  border: 1px solid #eef1f0;
}

.stats-row {
  display: flex;
  gap: 12px;
  font-size: 11px;
  color: #8e9c94;
  margin-top: 2px;
}

.badge-area {
  flex-shrink: 0;
}

.badge {
  background: #ff4d4f;
  color: #fff;
  min-width: 16px;
  height: 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
  font-size: 10px;
  font-weight: 700;
}

.empty {
  cursor: default;
  justify-content: center;
  grid-template-columns: 1fr;
  text-align: center;
  color: #51705f;
  background: rgba(255, 255, 255, 0.76);
  box-shadow: inset 0 0 0 1px rgba(198, 221, 207, 0.52);
}

.empty:hover {
  background: rgba(255, 255, 255, 0.76);
  box-shadow: inset 0 0 0 1px rgba(198, 221, 207, 0.52);
}
</style>
