<template>
  <Transition name="emoji-manager-fade">
    <div v-if="visible" class="emoji-manager-overlay" @click.self="handleClose">
      <div class="emoji-manager-card">
        <button
          type="button"
          class="emoji-manager-close"
          aria-label="关闭表情管理"
          @click="handleClose"
        >
          &times;
        </button>

        <header class="emoji-manager-header">
          <h3>表情管理</h3>
          <p>搜索并添加官方表情包，点击查看表情包详情</p>
        </header>

        <form class="emoji-manager-search" @submit.prevent="handleSearch">
          <div class="emoji-manager-search-field">
            <input
              type="text"
              v-model="keyword"
              :disabled="loading"
              placeholder="搜索表情包名称"
            />
            <button type="submit" :disabled="loading">
              {{ loading ? '搜索中…' : '搜索' }}
            </button>
          </div>
        </form>

        <p v-if="errorMessage" class="emoji-manager-feedback error">{{ errorMessage }}</p>

        <div v-if="viewMode === 'list'">
          <div v-if="loading" class="emoji-manager-loading">
            <span class="spinner" aria-hidden="true" />
            <span>正在加载表情包…</span>
          </div>

          <div v-else class="emoji-pack-list">
            <button
              v-for="pack in packRecords"
              :key="pack.id"
              type="button"
              class="emoji-pack-card"
              @click="openPack(pack)"
            >
              <div class="emoji-pack-cover">
                <img
                  v-if="pack?.cover?.fullFilePath"
                  :src="pack.cover.fullFilePath"
                  :alt="pack.name || '表情包封面'"
                />
                <span v-else class="emoji-pack-cover-placeholder">🙂</span>
              </div>
              <div class="emoji-pack-info">
                <strong>{{ pack.name || '未命名表情包' }}</strong>
              </div>
              <button
                type="button"
                class="emoji-pack-action"
                :disabled="!!pack.bound || bindingId === pack.id"
                @click.stop="handleBindPack(pack)"
              >
                {{ pack.bound ? '已添加' : bindingId === pack.id ? '添加中…' : '添加' }}
              </button>
            </button>

            <div v-if="!packRecords.length" class="emoji-pack-empty">
              暂无表情包，换个关键词试试吧。
            </div>
          </div>

          <div v-if="total > 0" class="emoji-pack-pagination">
            <button type="button" :disabled="loading || page <= 1" @click="goPrevPage">
              上一页
            </button>
            <span class="emoji-pack-page">{{ page }} / {{ totalPages }}</span>
            <button
              type="button"
              :disabled="loading || page >= totalPages"
              @click="goNextPage"
            >
              下一页
            </button>
          </div>
        </div>

        <div v-else class="emoji-pack-detail">
          <div class="emoji-pack-detail-header">
            <button type="button" class="emoji-pack-back" @click="backToList">← 返回</button>
            <div class="emoji-pack-detail-title">
              <h4>{{ selectedPack?.name || '表情包' }}</h4>
            </div>
          </div>

          <div v-if="itemsLoading" class="emoji-manager-loading">
            <span class="spinner" aria-hidden="true" />
            <span>正在加载表情…</span>
          </div>

          <div v-else class="emoji-item-grid">
            <div v-for="item in items" :key="item.id" class="emoji-item-card">
              <div class="emoji-item-preview">
                <span v-if="Number(item.type) === 1" class="emoji-item-unicode">
                  {{ item.unicodeVal || '🙂' }}
                </span>
                <img
                  v-else-if="item?.emojiItemFile?.fullFilePath"
                  :src="item.emojiItemFile.fullFilePath"
                  :alt="item.name || '表情'"
                />
                <span v-else class="emoji-item-unicode">🙂</span>
              </div>
              <div class="emoji-item-name">{{ item.name || '表情' }}</div>
            </div>

            <div v-if="!items.length" class="emoji-pack-empty">
              该表情包暂无表情项。
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import 'element-plus/es/components/message/style/css'
import { fetchEmojiPackList, bindEmojiPack, fetchEmojiItems } from '@/services/emojiService'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['close'])

const keyword = ref('')
const loading = ref(false)
const errorMessage = ref('')

const page = ref(1)
const size = ref(12)
const total = ref(0)
const packRecords = ref([])

const viewMode = ref('list')
const selectedPack = ref(null)
const items = ref([])
const itemsLoading = ref(false)
const bindingId = ref(null)

const totalPages = computed(() => {
  const t = Number(total.value)
  const s = Number(size.value)
  if (!Number.isFinite(t) || !Number.isFinite(s) || s <= 0) return 1
  return Math.max(1, Math.ceil(t / s))
})

const resetListState = () => {
  keyword.value = ''
  page.value = 1
  total.value = 0
  packRecords.value = []
  errorMessage.value = ''
  viewMode.value = 'list'
  selectedPack.value = null
  items.value = []
  itemsLoading.value = false
  bindingId.value = null
}

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      resetListState()
      loadPacks()
    }
  },
)

const handleClose = () => {
  emit('close')
}

const loadPacks = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    const data = await fetchEmojiPackList({
      page: page.value,
      size: size.value,
      name: keyword.value.trim(),
    })
    total.value = Number(data?.total) || 0
    packRecords.value = Array.isArray(data?.records) ? data.records : []
  } catch (error) {
    console.error('[EmojiManagerModal] load packs error:', error)
    errorMessage.value = error?.message || '加载表情包失败'
    total.value = 0
    packRecords.value = []
  } finally {
    loading.value = false
  }
}

const handleSearch = async () => {
  page.value = 1
  await loadPacks()
}

const goPrevPage = async () => {
  if (page.value <= 1) return
  page.value -= 1
  await loadPacks()
}

const goNextPage = async () => {
  if (page.value >= totalPages.value) return
  page.value += 1
  await loadPacks()
}

const handleBindPack = async (pack) => {
  if (!pack || pack.bound || bindingId.value) return
  bindingId.value = pack.id
  try {
    await bindEmojiPack(pack.id)
    pack.bound = true
    ElMessage.success('添加成功')
  } catch (error) {
    console.error('[EmojiManagerModal] bind pack error:', error)
    ElMessage.error(error?.message || '添加失败，请重试')
  } finally {
    bindingId.value = null
  }
}

const openPack = async (pack) => {
  if (!pack) return
  selectedPack.value = pack
  viewMode.value = 'detail'
  itemsLoading.value = true
  items.value = []
  try {
    const list = await fetchEmojiItems(pack.id)
    items.value = Array.isArray(list) ? list : []
  } catch (error) {
    console.error('[EmojiManagerModal] load items error:', error)
    ElMessage.error(error?.message || '加载表情项失败')
    items.value = []
  } finally {
    itemsLoading.value = false
  }
}

const backToList = () => {
  viewMode.value = 'list'
  selectedPack.value = null
  items.value = []
  itemsLoading.value = false
}
</script>

<style scoped>
.emoji-manager-fade-enter-active,
.emoji-manager-fade-leave-active {
  transition: opacity 0.24s ease;
}

.emoji-manager-fade-enter-from,
.emoji-manager-fade-leave-to {
  opacity: 0;
}

.emoji-manager-overlay {
  position: fixed;
  inset: 0;
  background: rgba(13, 35, 24, 0.55);
  backdrop-filter: blur(10px);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 32px 20px;
  z-index: 1300;
}

.emoji-manager-card {
  width: 720px;
  max-width: 100%;
  background: linear-gradient(
    160deg,
    rgba(255, 255, 255, 0.98),
    rgba(223, 241, 231, 0.96)
  );
  border-radius: 26px;
  box-shadow: 0 34px 60px rgba(25, 54, 39, 0.28);
  padding: 32px 36px 26px;
  position: relative;
  color: #163626;
}

.emoji-manager-close {
  position: absolute;
  top: 20px;
  right: 22px;
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.88);
  color: #1f3526;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
  box-shadow: 0 10px 24px rgba(18, 44, 30, 0.22);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.emoji-manager-close:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 30px rgba(18, 44, 30, 0.28);
}

.emoji-manager-header h3 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
}

.emoji-manager-header p {
  margin: 8px 0 0;
  color: #4a6b5b;
  font-size: 14px;
}

.emoji-manager-search {
  margin-top: 24px;
}

.emoji-manager-search-field {
  display: flex;
  gap: 12px;
}

.emoji-manager-search-field input {
  flex: 1;
  border: 1px solid rgba(198, 221, 207, 0.8);
  border-radius: 16px;
  padding: 12px 16px;
  font-size: 14px;
  color: #1f3526;
  background: rgba(255, 255, 255, 0.96);
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}

.emoji-manager-search-field input:focus {
  outline: none;
  border-color: #34c073;
  box-shadow: 0 0 0 3px rgba(52, 192, 115, 0.18);
}

.emoji-manager-search-field button {
  min-width: 92px;
  border: none;
  border-radius: 16px;
  background: linear-gradient(135deg, #32c374, #1da368);
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  padding: 0 18px;
  box-shadow: 0 16px 24px rgba(45, 176, 103, 0.28);
  transition: transform 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease;
}

.emoji-manager-search-field button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.emoji-manager-search-field button:not(:disabled):hover {
  transform: translateY(-2px);
  box-shadow: 0 20px 32px rgba(45, 176, 103, 0.34);
}

.emoji-manager-feedback {
  margin-top: 16px;
  font-size: 13px;
}

.emoji-manager-feedback.error {
  color: #d15353;
}

.emoji-manager-loading {
  margin-top: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: #4a6b5b;
  font-size: 14px;
}

.emoji-manager-loading .spinner {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 3px solid rgba(50, 195, 116, 0.28);
  border-top-color: #32c374;
  animation: emojiManagerSpin 0.8s linear infinite;
}

.emoji-pack-list {
  margin-top: 20px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 14px;
}

.emoji-pack-card {
  border: none;
  border-radius: 18px;
  padding: 14px 14px 16px;
  background: rgba(255, 255, 255, 0.86);
  cursor: pointer;
  text-align: left;
  box-shadow: 0 12px 24px rgba(25, 54, 39, 0.16);
  display: grid;
  grid-template-columns: 52px 1fr auto;
  align-items: center;
  gap: 12px;
  transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
}

.emoji-pack-card:hover {
  transform: translateY(-2px);
  background: linear-gradient(
    135deg,
    rgba(50, 195, 116, 0.12),
    rgba(29, 163, 104, 0.18)
  );
  box-shadow: 0 18px 32px rgba(25, 54, 39, 0.24);
}

.emoji-pack-cover {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  overflow: hidden;
  background: rgba(50, 195, 116, 0.14);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 0 0 1px rgba(50, 195, 116, 0.24);
}

.emoji-pack-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.emoji-pack-cover-placeholder {
  font-size: 22px;
  color: #1d7a4b;
}

.emoji-pack-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.emoji-pack-info strong {
  font-size: 15px;
  font-weight: 700;
  color: #264737;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.emoji-pack-meta {
  font-size: 12px;
  color: #58725f;
}

.emoji-pack-action {
  border: none;
  border-radius: 14px;
  padding: 9px 12px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  background: linear-gradient(135deg, #32c374, #1da368);
  color: #ffffff;
  box-shadow: 0 14px 20px rgba(45, 176, 103, 0.24);
  transition: transform 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease;
}

.emoji-pack-action:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.emoji-pack-action:not(:disabled):hover {
  transform: translateY(-2px);
  box-shadow: 0 18px 28px rgba(45, 176, 103, 0.3);
}

.emoji-pack-empty {
  grid-column: 1 / -1;
  margin-top: 8px;
  padding: 18px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.76);
  color: #51705f;
  font-size: 14px;
  text-align: center;
  box-shadow: inset 0 0 0 1px rgba(198, 221, 207, 0.52);
}

.emoji-pack-pagination {
  margin-top: 18px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
}

.emoji-pack-pagination button {
  border: none;
  border-radius: 14px;
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.86);
  color: #1f3526;
  box-shadow: 0 12px 20px rgba(25, 54, 39, 0.14);
  transition: transform 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease;
}

.emoji-pack-pagination button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.emoji-pack-pagination button:not(:disabled):hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 24px rgba(25, 54, 39, 0.2);
}

.emoji-pack-page {
  font-size: 13px;
  color: #4a6b5b;
}

.emoji-pack-detail {
  margin-top: 20px;
}

.emoji-pack-detail-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 14px;
}

.emoji-pack-back {
  border: none;
  border-radius: 14px;
  padding: 10px 14px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.86);
  color: #1f3526;
  box-shadow: 0 12px 20px rgba(25, 54, 39, 0.14);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.emoji-pack-back:hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 24px rgba(25, 54, 39, 0.2);
}

.emoji-pack-detail-title h4 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #1f3526;
}

.emoji-pack-detail-title p {
  margin: 6px 0 0;
  font-size: 13px;
  color: #58725f;
}

.emoji-item-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 14px;
}

.emoji-item-card {
  border-radius: 18px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.86);
  box-shadow: 0 12px 24px rgba(25, 54, 39, 0.14);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.emoji-item-preview {
  width: 66px;
  height: 66px;
  border-radius: 20px;
  background: rgba(50, 195, 116, 0.14);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  box-shadow: inset 0 0 0 1px rgba(50, 195, 116, 0.2);
}

.emoji-item-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.emoji-item-unicode {
  font-size: 28px;
  color: #1d7a4b;
}

.emoji-item-name {
  font-size: 13px;
  color: #325445;
  text-align: center;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@keyframes emojiManagerSpin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .emoji-manager-overlay {
    align-items: flex-end;
    padding: 24px 16px;
  }

  .emoji-manager-card {
    width: 100%;
    padding: 24px 22px 22px;
    border-radius: 22px;
  }

  .emoji-manager-search-field {
    flex-direction: column;
  }

  .emoji-manager-search-field button {
    width: 100%;
    height: 44px;
  }
}
</style>
