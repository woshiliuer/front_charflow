<template>
  <div v-if="visible" class="dynamic-publish-modal" @click.self="handleClose">
    <div class="dynamic-publish-card">
      <div class="dynamic-publish-header">
        <div class="dynamic-publish-title">发布动态</div>
        <button type="button" class="dynamic-publish-close" :disabled="submitting" @click="handleClose">×</button>
      </div>

      <div class="dynamic-publish-body">
        <div class="dynamic-publish-editor">
          <textarea
            ref="textareaRef"
            v-model="content"
            class="dynamic-publish-textarea"
            placeholder="分享点什么..."
            :disabled="submitting"
          />

          <div v-if="allPreviewItems.length" class="dynamic-publish-preview">
            <div v-for="item in allPreviewItems" :key="item.key" class="dynamic-publish-preview-item">
              <img :src="item.previewUrl" alt="preview" />
              <button
                type="button"
                class="dynamic-publish-remove"
                :disabled="submitting"
                @click="item.onRemove"
              >
                ×
              </button>
            </div>
          </div>
        </div>

        <div v-if="showEmojiPicker" class="emoji-picker" role="dialog" aria-label="选择表情" @click.stop>
          <div class="emoji-picker-header">
            <span class="emoji-picker-title">表情包</span>
            <div class="emoji-pack-bar">
              <button
                v-for="pack in emojiPacks"
                :key="pack.id"
                type="button"
                class="emoji-pack-item"
                :class="{ active: String(pack.id) === String(selectedEmojiPackId) }"
                :disabled="emojiPacksLoading || emojiItemsLoading"
                @click="handleSelectEmojiPack(pack.id)"
                :title="pack.name"
              >
                <img v-if="pack?.cover?.fullFilePath" :src="pack.cover.fullFilePath" :alt="pack.name" />
                <span v-else class="emoji-pack-fallback">{{ pack.name?.slice?.(0, 1) || '😀' }}</span>
              </button>
            </div>
          </div>

          <div class="emoji-grid">
            <button
              v-for="emoji in selectedEmojiItems"
              :key="emoji.id"
              type="button"
              class="emoji-item"
              :disabled="submitting"
              @click="handleSelectEmojiItem(emoji)"
              :title="emoji.name"
            >
              <template v-if="Number(emoji.type) === 1">{{ emoji.unicodeVal }}</template>
              <img
                v-else
                class="emoji-image"
                :src="emoji?.file?.fullFilePath || emoji?.emojiItemFile?.fullFilePath"
                :alt="emoji.name"
              />
            </button>
          </div>
        </div>
      </div>

      <div class="dynamic-publish-footer">
        <div class="dynamic-publish-tools">
          <button
            type="button"
            class="tool-btn"
            :disabled="submitting"
            @click.stop="triggerFilePick"
            title="添加图片"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 7h3l2-2h6l2 2h3" />
              <rect x="4" y="7" width="16" height="13" rx="2" />
              <circle cx="12" cy="13" r="3" />
            </svg>
          </button>
          <input
            ref="fileInputRef"
            type="file"
            accept="image/*"
            multiple
            class="dynamic-publish-file-input"
            :disabled="submitting"
            @change="handleFilesChange"
          />
          <button
            type="button"
            class="tool-btn"
            :class="{ active: showEmojiPicker }"
            :disabled="submitting"
            @click.stop="toggleEmojiPicker"
            title="表情"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M8 14s1.5 2 4 2 4-2 4-2" />
              <path d="M9 9h.01" />
              <path d="M15 9h.01" />
            </svg>
          </button>
        </div>

        <div class="dynamic-publish-actions">
          <button type="button" class="dynamic-publish-cancel" :disabled="submitting" @click="handleClose">
            取消
          </button>
          <button
            type="button"
            class="dynamic-publish-submit"
            :disabled="submitting || (!content.trim() && !rawFiles.length && !attachedFiles.length)"
            @click="handleSubmit"
          >
            {{ submitting ? '发布中...' : '发布' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, nextTick } from 'vue'
import { fetchMyEmojiPackList, fetchEmojiItems } from '@/services/emojiService'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  submitting: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['close', 'submit'])

const content = ref('')
const fileItems = ref([])
const attachedFiles = ref([])

const textareaRef = ref(null)
const fileInputRef = ref(null)

const showEmojiPicker = ref(false)
const emojiPacks = ref([])
const selectedEmojiPackId = ref(null)
const emojiItemsByPackId = ref({})
const emojiPacksLoading = ref(false)
const emojiItemsLoading = ref(false)

watch(
  () => props.visible,
  (next) => {
    if (next) return
    resetState()
  },
)

const rawFiles = computed(() => fileItems.value.map((it) => it?.file).filter(Boolean))

const allPreviewItems = computed(() => {
  const local = fileItems.value.map((it, idx) => ({
    key: `local_${idx}`,
    previewUrl: it.previewUrl,
    onRemove: () => removeFile(idx),
  }))

  const remote = attachedFiles.value
    .filter(Boolean)
    .map((f, idx) => ({
      key: `remote_${String(f?.filePath ?? idx)}`,
      previewUrl: f?.fullFilePath,
      onRemove: () => removeAttachedFile(idx),
    }))

  return [...remote, ...local]
})

const handleClose = () => {
  if (props.submitting) return
  emit('close')
}

const triggerFilePick = () => {
  fileInputRef.value?.click()
}

const handleFilesChange = (event) => {
  const files = Array.from(event?.target?.files || [])
  const next = files
    .filter(Boolean)
    .map((f) => ({
      file: f,
      previewUrl: URL.createObjectURL(f),
    }))
  fileItems.value = [...fileItems.value, ...next]
  if (event?.target) {
    event.target.value = ''
  }
}

const revokeItem = (item) => {
  if (item?.previewUrl) {
    URL.revokeObjectURL(item.previewUrl)
  }
}

const removeFile = (index) => {
  const list = fileItems.value.slice()
  const removed = list.splice(index, 1)[0]
  revokeItem(removed)
  fileItems.value = list
}

const clearFiles = () => {
  fileItems.value.forEach((it) => revokeItem(it))
  fileItems.value = []
}

const removeAttachedFile = (index) => {
  const list = attachedFiles.value.slice()
  list.splice(index, 1)
  attachedFiles.value = list
}

const clearAttachedFiles = () => {
  attachedFiles.value = []
}

const insertAtCaret = (value) => {
  const el = textareaRef.value
  if (!el) {
    content.value += value
    return
  }
  const start = el.selectionStart ?? content.value.length
  const end = el.selectionEnd ?? content.value.length
  const before = content.value.slice(0, start)
  const after = content.value.slice(end)
  content.value = `${before}${value}${after}`
  nextTick(() => {
    el.focus()
    const nextPos = start + value.length
    el.setSelectionRange(nextPos, nextPos)
  })
}

const loadEmojiPacks = async (force = false) => {
  if (emojiPacksLoading.value) return
  if (!force && emojiPacks.value.length) return
  emojiPacksLoading.value = true
  try {
    const list = await fetchMyEmojiPackList()
    emojiPacks.value = Array.isArray(list) ? list : []
    const existsSelected =
      selectedEmojiPackId.value != null &&
      emojiPacks.value.some((p) => String(p?.id) === String(selectedEmojiPackId.value))
    if (!existsSelected) {
      const defaultPack = emojiPacks.value.find((p) => Number(p?.type) === 1)
      selectedEmojiPackId.value = defaultPack?.id ?? (emojiPacks.value[0]?.id ?? null)
    }
  } finally {
    emojiPacksLoading.value = false
  }
}

const loadEmojiItems = async (packId, force = false) => {
  if (!packId) return
  if (emojiItemsLoading.value) return
  const key = String(packId)
  if (!force && emojiItemsByPackId.value[key]) return
  emojiItemsLoading.value = true
  try {
    const items = await fetchEmojiItems(packId)
    emojiItemsByPackId.value = {
      ...emojiItemsByPackId.value,
      [key]: Array.isArray(items) ? items : [],
    }
  } finally {
    emojiItemsLoading.value = false
  }
}

const selectedEmojiItems = computed(() => {
  const key = selectedEmojiPackId.value
  if (!key) return []
  return emojiItemsByPackId.value[String(key)] ?? []
})

const toggleEmojiPicker = async () => {
  showEmojiPicker.value = !showEmojiPicker.value
  if (showEmojiPicker.value) {
    await loadEmojiPacks(true)
    if (selectedEmojiPackId.value) {
      await loadEmojiItems(selectedEmojiPackId.value)
    }
  }
}

const handleSelectEmojiPack = async (packId) => {
  selectedEmojiPackId.value = packId
  await loadEmojiItems(packId)
}

const handleSelectEmojiItem = (emoji) => {
  if (!emoji) return
  if (Number(emoji.type) === 1 && emoji.unicodeVal) {
    insertAtCaret(emoji.unicodeVal)
    showEmojiPicker.value = false
    return
  }

  const fileInfo = emoji.file || emoji.emojiItemFile
  if (!fileInfo?.fullFilePath || !fileInfo?.filePath) return
  const exists = attachedFiles.value.some((f) => String(f?.filePath) === String(fileInfo.filePath))
  if (!exists) {
    attachedFiles.value = [...attachedFiles.value, fileInfo]
  }
  showEmojiPicker.value = false
}

const resetState = () => {
  content.value = ''
  clearFiles()
  clearAttachedFiles()
  showEmojiPicker.value = false
}

const handleSubmit = () => {
  if (props.submitting) return
  const text = content.value.trim()
  if (!text && rawFiles.value.length === 0 && attachedFiles.value.length === 0) return
  emit('submit', { content: text, files: rawFiles.value, attachedFiles: attachedFiles.value })
}
</script>

<style scoped>
.dynamic-publish-modal {
  position: fixed;
  inset: 0;
  z-index: 1600;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(16, 24, 20, 0.45);
  backdrop-filter: blur(10px);
}

.dynamic-publish-card {
  width: min(560px, 92vw);
  max-height: min(80vh, 820px);
  display: flex;
  flex-direction: column;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid rgba(219, 231, 220, 0.9);
  box-shadow: 0 28px 70px rgba(20, 34, 26, 0.35);
  overflow: hidden;
}

.dynamic-publish-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px;
  background: linear-gradient(180deg, rgba(234, 246, 238, 0.9), rgba(255, 255, 255, 0.9));
  border-bottom: 1px solid rgba(219, 231, 220, 0.9);
}

.dynamic-publish-title {
  font-size: 16px;
  font-weight: 800;
  letter-spacing: 0.02em;
  color: #163625;
}

.dynamic-publish-close {
  width: 36px;
  height: 36px;
  border-radius: 14px;
  border: 1px solid rgba(219, 231, 220, 0.9);
  background: rgba(255, 255, 255, 0.9);
  color: #557a63;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  transition: transform 0.15s ease, background 0.15s ease;
}

.dynamic-publish-close:hover {
  transform: translateY(-1px);
  background: rgba(240, 249, 244, 0.95);
}

.dynamic-publish-body {
  padding: 14px 16px 10px;
  overflow: auto;
}

.dynamic-publish-editor {
  border-radius: 18px;
  border: 1px solid rgba(198, 221, 207, 0.75);
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 12px 24px rgba(54, 102, 74, 0.08);
  padding: 10px;
}

.dynamic-publish-textarea {
  width: 100%;
  min-height: 120px;
  resize: vertical;
  border-radius: 14px;
  border: none;
  padding: 8px 8px;
  font-size: 14px;
  line-height: 1.6;
  color: #193a27;
  background: transparent;
  outline: none;
  transition: box-shadow 0.15s ease, border-color 0.15s ease;
}

.dynamic-publish-textarea:focus {
  box-shadow: none;
}
.dynamic-publish-file-input {
  display: none;
}

.dynamic-publish-preview {
  margin-top: 10px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

@media (max-width: 520px) {
  .dynamic-publish-preview {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.dynamic-publish-preview-item {
  position: relative;
  border-radius: 14px;
  overflow: hidden;
  background: rgba(236, 245, 239, 0.9);
  border: 1px solid rgba(219, 231, 220, 0.9);
  aspect-ratio: 1;
}

.dynamic-publish-preview-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.dynamic-publish-remove {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.85);
  background: rgba(18, 26, 21, 0.55);
  color: #ffffff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dynamic-publish-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  border-top: 1px solid rgba(219, 231, 220, 0.9);
  background: rgba(255, 255, 255, 0.92);
  position: relative;
}

.dynamic-publish-tools {
  display: flex;
  gap: 8px;
  align-items: center;
}

.tool-btn {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: 1px solid rgba(220, 228, 223, 0.95);
  background: #ffffff;
  cursor: pointer;
  transition: background 0.12s ease, border-color 0.12s ease;
  color: #355544;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tool-btn:hover {
  background: rgba(246, 252, 248, 0.95);
}

.tool-btn.active {
  border-color: rgba(52, 192, 115, 0.55);
  background: rgba(52, 192, 115, 0.12);
  color: #1a7a4c;
}

.dynamic-publish-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.dynamic-publish-cancel {
  height: 38px;
  padding: 0 14px;
  border-radius: 14px;
  border: 1px solid rgba(219, 231, 220, 0.95);
  background: rgba(255, 255, 255, 0.95);
  color: #355544;
  font-weight: 700;
  cursor: pointer;
}

.dynamic-publish-submit {
  height: 38px;
  padding: 0 18px;
  border-radius: 14px;
  border: 1px solid rgba(20, 153, 85, 0.55);
  background: linear-gradient(145deg, rgba(52, 192, 115, 0.92), rgba(20, 153, 85, 0.92));
  color: #ffffff;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 16px 26px rgba(20, 153, 85, 0.24);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.dynamic-publish-submit:hover {
  transform: translateY(-1px);
  box-shadow: 0 22px 34px rgba(20, 153, 85, 0.28);
}

.dynamic-publish-submit:disabled,
.dynamic-publish-cancel:disabled,
.dynamic-publish-remove:disabled,
.dynamic-publish-close:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}


.emoji-picker {
  margin-top: 10px;
  border-radius: 14px;
  border: 1px solid rgba(220, 228, 223, 0.9);
  background: #ffffff;
  box-shadow: 0 10px 22px rgba(32, 53, 39, 0.08);
  padding: 10px;
}

.emoji-picker-header {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(238, 241, 240, 0.95);
}

.emoji-picker-title {
  font-size: 13px;
  font-weight: 800;
  color: #274531;
  flex: 0 0 auto;
}

.emoji-pack-bar {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 2px;
}

.emoji-pack-item {
  width: 34px;
  height: 34px;
  border-radius: 16px;
  border: 1px solid rgba(219, 231, 220, 0.95);
  background: rgba(246, 252, 248, 0.9);
  cursor: pointer;
  flex: 0 0 auto;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.emoji-pack-item.active {
  border-color: rgba(52, 192, 115, 0.45);
  background: rgba(52, 192, 115, 0.12);
}

.emoji-pack-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.emoji-pack-fallback {
  font-size: 16px;
  font-weight: 800;
  color: #1a7a4c;
}

.emoji-grid {
  display: grid;
  grid-template-columns: repeat(8, minmax(0, 1fr));
  gap: 8px;
  padding-top: 0;
  max-height: 240px;
  overflow: auto;
}

@media (max-width: 520px) {
  .emoji-grid {
    grid-template-columns: repeat(6, minmax(0, 1fr));
  }
}

.emoji-item {
  border: none;
  background: rgba(246, 252, 248, 0.85);
  border-radius: 12px;
  height: 40px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  border: 1px solid rgba(238, 241, 240, 0.9);
}

.emoji-item:hover {
  background: rgba(52, 192, 115, 0.12);
  border-color: rgba(52, 192, 115, 0.25);
}

.emoji-image {
  width: 28px;
  height: 28px;
  object-fit: contain;
}
</style>
