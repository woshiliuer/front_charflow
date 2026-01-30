<template>
  <section class="welcome">
    <header class="highlight-bar">
      <div v-for="item in highlights" :key="item.id" class="highlight">
        <img :src="item.avatar" :alt="item.name" />
        <span>{{ item.name }}</span>
      </div>
    </header>

    <div class="divider"></div>

    <main v-if="!selectedConversation" class="empty-state">
      <div class="icon">💬</div>
      <h2>Welcome to Messages 欢迎浏览留言</h2>
      <p>
        Select a conversation from the sidebar to start chatting with your contacts.<br />
        从侧边栏中选择一个对话，开始与联系人聊天。
      </p>

      <ul class="features">
        <li><span>🔒</span> End-to-end encrypted 端到端加密</li>
        <li><span>⚡</span> Real-time sync 实时同步</li>
        <li><span>📊</span> Insights 精准洞察</li>
      </ul>
    </main>

    <section v-else class="conversation-view">
      <header class="conversation-header">
        <div class="title">
          <h2>{{ selectedConversation.displayName }}</h2>
        </div>
        <button
          v-if="selectedConversation"
          type="button"
          class="settings-button"
          @click="openSettingsDrawer"
          aria-haspopup="dialog"
          aria-label="会话设置"
        >
          <span class="dot"></span>
          <span class="dot"></span>
          <span class="dot"></span>
        </button>
      </header>

      <ul class="message-list">
        <li
          v-for="message in selectedThread"
          :key="message.id"
          :class="['message', message.role]"
        >
          <div class="message-avatar">
            <img
              :src="
                message.role === 'self'
                  ? currentUser.avatarFullUrl
                  : message.avatarFullUrl || selectedConversation.avatar
              "
              :alt="message.role === 'self' ? currentUser.nickname : message.author"
            />
          </div>
          <div class="bubble" :class="{ 'bubble-image': Number(message.messageType) === 2 }">
            <template v-if="Number(message.messageType) === 2 && message.messageFile?.fullFilePath">
              <img
                class="message-file-image"
                :src="message.messageFile.fullFilePath"
                :alt="message.messageFile.fileName || 'image'"
              />
            </template>
            <p v-else class="message-text">
              <template
                v-for="(segment, index) in parseMessageSegments(message.text)"
                :key="index"
              >
                <span v-if="segment.type === 'text'">{{ segment.value }}</span>
                <span v-else-if="segment.type === 'unicode'">{{ segment.value }}</span>
                <img
                  v-else
                  class="message-emoji-image"
                  :src="segment.src"
                  :alt="segment.alt"
                />
              </template>
            </p>
          </div>
        </li>
      </ul>

      <footer class="composer">
        <div class="composer-input" ref="composerRootRef">
          <input
          type="text"
          placeholder="输入消息..."
          v-model="localDraft"
          @input="handleInput"
          ref="composerInputRef"
        />
          <button
            type="button"
            class="emoji-button"
            @click.stop="triggerFilePick"
            aria-label="发送图片"
          >
            📎
          </button>
          <input
            ref="fileInputRef"
            type="file"
            accept="image/*"
            class="hidden-file-input"
            @change="handleFilePicked"
          />
          <button
            type="button"
            class="emoji-button"
            @click.stop="toggleEmojiPicker"
            aria-label="选择表情"
            :aria-expanded="showEmojiPicker"
          >
            😀
          </button>
          <div
            v-if="showEmojiPicker"
            class="emoji-picker"
            role="dialog"
            aria-label="表情选择"
            @click.stop
          >
            <div class="emoji-section">
              <h4 class="emoji-section-title">表情包</h4>
              <div class="emoji-pack-bar">
                <button
                  v-for="pack in emojiPacks"
                  :key="pack.id"
                  type="button"
                  class="emoji-pack-item"
                  :class="{ active: String(pack.id) === String(selectedEmojiPackId) }"
                  @click="handleSelectEmojiPack(pack)"
                  :title="pack.name"
                >
                  <img
                    v-if="pack?.cover?.fullFilePath"
                    :src="pack.cover.fullFilePath"
                    :alt="pack.name"
                  />
                  <span v-else class="emoji-pack-fallback">{{ pack.name?.slice?.(0, 1) || '😀' }}</span>
                </button>
              </div>
              <h4 class="emoji-section-title">{{ selectedEmojiPackName }}</h4>
              <div class="emoji-grid">
                <button
                  v-for="emoji in selectedEmojiItems"
                  :key="emoji.id"
                  type="button"
                  class="emoji-item"
                  @click="handleSelectEmojiItem(emoji)"
                  :title="emoji.name"
                >
                  <template v-if="emoji.type === 1">{{ emoji.unicodeVal }}</template>
                  <img
                    v-else
                    class="emoji-image"
                    :src="emoji?.emojiItemFile?.fullFilePath"
                    :alt="emoji.name"
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
        <button type="button" class="send-button" @click="emitSend">发送</button>
      </footer>
      <ConversationSettingsDrawer
        :visible="showSettingsDrawer"
        :conversation="selectedConversation"
        :current-user="currentUser"
        :is-muted="isMuted"
        :is-favorite="isFavorite"
        :invite-enabled="propsInviteEnabled"
        :group-name-editable="selectedConversation?.isGroupConversation"
        :announcement-updated-at="selectedConversation?.announcementUpdatedAt"
        @close="handleDrawerClose"
        @toggle-mute="handleToggleMute"
        @toggle-favorite="handleToggleFavorite"
        @delete="handleDrawerDelete"
        @leave-group="handleDrawerLeaveGroup"
        @invite="handleInviteMembers"
        @update-group-name="handleUpdateGroupName"
        @update-group-intro="handleUpdateGroupIntro"
        @edit-announcement="handleEditAnnouncement"
        @remove-member="handleRemoveMember"
        @dissolve-group="handleDissolveGroup"
      />
    </section>
  </section>
</template>

<script setup>
import { ref, watch, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import ConversationSettingsDrawer from './ConversationSettingsDrawer.vue'
import { apiClient } from '@/services/apiClient'

const props = defineProps({
  highlights: { type: Array, required: true },
  selectedConversation: { type: Object, default: null },
  selectedThread: { type: Array, default: () => [] },
  currentUser: { type: Object, required: true },
  draft: { type: String, default: '' },
  inviteEnabled: { type: Boolean, default: false },
})

const emit = defineEmits([
  'update:draft',
  'send',
  'send-file',
  'send-emoji-file',
  'toggle-mute',
  'toggle-favorite',
  'delete-conversation',
  'leave-group',
  'invite-members',
  'update-group-name',
  'update-group-intro',
  'edit-announcement',
  'remove-member',
  'dissolve-group',
])

const localDraft = ref(props.draft)
const showSettingsDrawer = ref(false)
const showEmojiPicker = ref(false)
const composerInputRef = ref(null)
const composerRootRef = ref(null)
const fileInputRef = ref(null)

const emojiPacks = ref([])
const selectedEmojiPackId = ref(null)
const emojiItemsByPackId = ref({})
const emojiItemDict = ref({})
const emojiPacksLoading = ref(false)
const emojiItemsLoading = ref(false)

const selectedEmojiPackName = computed(() => {
  const pack = emojiPacks.value.find((item) => String(item.id) === String(selectedEmojiPackId.value))
  return pack?.name ?? ''
})

const selectedEmojiItems = computed(() => {
  const key = selectedEmojiPackId.value
  if (!key) return []
  return emojiItemsByPackId.value[key] ?? []
})


watch(
  () => props.draft,
  (val) => {
    if (val !== localDraft.value) {
      localDraft.value = val
    }
  },
)

const handleInput = () => {
  emit('update:draft', localDraft.value)
}

const loadEmojiPacks = async () => {
  if (emojiPacksLoading.value) return
  if (emojiPacks.value.length > 0) return
  emojiPacksLoading.value = true
  try {
    const res = await apiClient.get('/emoji/myEmojiPackList')
    emojiPacks.value = res?.data ?? []
    if (!selectedEmojiPackId.value && emojiPacks.value.length > 0) {
      selectedEmojiPackId.value = emojiPacks.value[0].id
    }
  } catch (e) {
    console.warn('Failed to load emoji packs', e)
  } finally {
    emojiPacksLoading.value = false
  }
}

const loadEmojiItems = async (packId) => {
  if (!packId) return
  if (emojiItemsLoading.value) return
  if (emojiItemsByPackId.value[packId]) return
  emojiItemsLoading.value = true
  try {
    const res = await apiClient.post('/emoji/emojiItemList', { param: packId })
    const items = res?.data ?? []
    emojiItemsByPackId.value = {
      ...emojiItemsByPackId.value,
      [packId]: items,
    }
    const nextDict = { ...emojiItemDict.value }
    items.forEach((item) => {
      if (item?.id != null) {
        nextDict[String(item.id)] = item
      }
    })
    emojiItemDict.value = nextDict
  } catch (e) {
    console.warn('Failed to load emoji items', e)
  } finally {
    emojiItemsLoading.value = false
  }
}

const toggleEmojiPicker = async () => {
  showEmojiPicker.value = !showEmojiPicker.value
  if (showEmojiPicker.value) {
    await loadEmojiPacks()
    if (selectedEmojiPackId.value) {
      await loadEmojiItems(selectedEmojiPackId.value)
    }
  }
}

const insertAtCaret = (value) => {
  const inputEl = composerInputRef.value
  if (!inputEl) {
    localDraft.value += value
    emit('update:draft', localDraft.value)
    return
  }

  const start = inputEl.selectionStart ?? localDraft.value.length
  const end = inputEl.selectionEnd ?? localDraft.value.length
  const before = localDraft.value.slice(0, start)
  const after = localDraft.value.slice(end)
  const nextValue = `${before}${value}${after}`

  localDraft.value = nextValue
  emit('update:draft', localDraft.value)

  nextTick(() => {
    inputEl.focus()
    const nextPos = start + value.length
    inputEl.setSelectionRange(nextPos, nextPos)
  })
}

const handleSelectEmoji = (emoji) => {
  insertAtCaret(emoji)
  showEmojiPicker.value = false
}

const handleSelectEmojiPack = async (pack) => {
  if (!pack?.id) return
  selectedEmojiPackId.value = pack.id
  await loadEmojiItems(pack.id)
}

const handleSelectEmojiItem = (emoji) => {
  if (!emoji) return
  if (emoji.type === 1 && emoji.unicodeVal) {
    handleSelectEmoji(emoji.unicodeVal)
    return
  }
  const src = emoji?.emojiItemFile?.fullFilePath
  if (src) {
    emit('send-emoji-file', {
      messageFile: emoji.emojiItemFile,
    })
    showEmojiPicker.value = false
    return
  }
  if (emoji.id != null) {
    handleSelectEmoji(`[emoji:${emoji.id}]`)
  }
}

const parseMessageSegments = (text) => {
  const content = text == null ? '' : String(text)
  const pattern = /\[emoji:(\d+)]/g
  const segments = []
  let lastIndex = 0
  let match
  while ((match = pattern.exec(content)) !== null) {
    const start = match.index
    const end = pattern.lastIndex
    if (start > lastIndex) {
      segments.push({ type: 'text', value: content.slice(lastIndex, start) })
    }
    const emojiId = match[1]
    const emoji = emojiItemDict.value[String(emojiId)]
    if (emoji?.type === 1 && emoji.unicodeVal) {
      segments.push({ type: 'unicode', value: emoji.unicodeVal })
    } else {
      const src = emoji?.emojiItemFile?.fullFilePath
      if (src) {
        segments.push({ type: 'image', src, alt: emoji?.name ?? `emoji:${emojiId}` })
      } else {
        segments.push({ type: 'text', value: match[0] })
      }
    }
    lastIndex = end
  }
  if (lastIndex < content.length) {
    segments.push({ type: 'text', value: content.slice(lastIndex) })
  }
  return segments
}

const emitSend = () => {
  emit('send')
}

const triggerFilePick = () => {
  fileInputRef.value?.click?.()
}

const handleFilePicked = (event) => {
  const input = event?.target
  const file = input?.files?.[0]
  if (!file) return
  emit('send-file', file)
  if (input) {
    input.value = ''
  }
}

const handleOutsideClick = (event) => {
  if (!showEmojiPicker.value) return
  const root = composerRootRef.value
  if (root && event?.target && root.contains(event.target)) return
  showEmojiPicker.value = false
}

onMounted(() => {
  document.addEventListener('click', handleOutsideClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleOutsideClick)
})

const isMuted = computed(() => Boolean(props.selectedConversation?.isMuted))
const isFavorite = computed(() => Boolean(props.selectedConversation?.isFavorite))

const openSettingsDrawer = () => {
  if (props.selectedConversation) {
    showSettingsDrawer.value = true
  }
}

const handleDrawerClose = () => {
  showSettingsDrawer.value = false
}

const handleToggleMute = (nextValue) => {
  emit('toggle-mute', nextValue)
}

const handleToggleFavorite = (nextValue) => {
  emit('toggle-favorite', nextValue)
}

const handleDrawerDelete = () => {
  emit('delete-conversation')
}

const handleDrawerLeaveGroup = () => {
  emit('leave-group')
}

const propsInviteEnabled = computed(() => Boolean(props.inviteEnabled))

const handleInviteMembers = () => {
  if (propsInviteEnabled.value) {
    emit('invite-members')
  }
}

const handleUpdateGroupName = (value) => {
  emit('update-group-name', value)
}

const handleUpdateGroupIntro = (value) => {
  emit('update-group-intro', value)
}

const handleEditAnnouncement = () => {
  emit('edit-announcement')
}

const handleRemoveMember = (member) => {
  emit('remove-member', member)
}

watch(
  () => props.selectedConversation?.id,
  () => {
    showSettingsDrawer.value = false
  },
)

const handleDissolveGroup = () => {
  emit('dissolve-group')
}
</script>

<style scoped>
.welcome {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 40px 52px;
  background: #f7faf9;
}

.highlight-bar {
  display: flex;
  gap: 18px;
  align-items: center;
}

.divider {
  width: 100%;
  height: 1px;
  margin: 12px 0 16px;
  background-color: #edf0f2;
  border-radius: 2px;
}

.highlight {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  transition: transform 0.2s ease;
}

.highlight:hover {
  transform: translateY(-4px);
}

.highlight:hover img {
  transform: scale(1.05);
  box-shadow: 0 14px 28px rgba(58, 96, 74, 0.22);
}

.highlight img {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid rgba(61, 191, 117, 0.85);
  box-shadow: 0 8px 18px rgba(58, 96, 74, 0.18);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.highlight span {
  font-size: 13px;
  color: #425b4a;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 18px;
  color: #31513d;
  text-align: center;
}

.empty-state .icon {
  width: 96px;
  height: 96px;
  border-radius: 28px;
  background: rgba(49, 193, 115, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 42px;
  color: #2b9c67;
}

.empty-state h2 {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
}

.empty-state p {
  margin: 0;
  font-size: 14px;
  line-height: 1.7;
  color: #4f6b58;
}

.features {
  list-style: none;
  margin: 18px auto 0;
  padding: 0;
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
  max-width: 420px;
}

.features li {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  border-radius: 16px;
  background: #ffffff;
  color: #325342;
  font-size: 13px;
  box-shadow: 0 10px 18px rgba(66, 103, 82, 0.12);
}

.conversation-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 18px 0;
  color: #2b4738;
}

.conversation-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
}

.conversation-view header .title {
  display: flex;
  align-items: baseline;
  gap: 16px;
}

.conversation-view header h2 {
  margin: 0;
  font-size: 26px;
  font-weight: 700;
}

.conversation-view header span {
  font-size: 14px;
  color: #6b8574;
}

.conversation-view header p {
  margin: 12px 0 0;
  color: #58725f;
  font-size: 14px;
}

.settings-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 32px;
  height: 32px;
  border: none;
  padding: 4px;
  background: transparent;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.settings-button:hover {
  transform: translateY(-1px);
}

.settings-button:active {
  transform: translateY(0);
}

.settings-button .dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #1c3325;
}

.message-list {
  flex: 1;
  list-style: none;
  margin: 24px 0 0;
  padding: 0 6px 0 0;
  display: flex;
  flex-direction: column;
  gap: 18px;
  overflow-y: auto;
}

.message {
  display: flex;
  align-items: flex-end;
  gap: 12px;
}

.message.contact {
  flex-direction: row;
}

.message.self {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  border: 2px solid rgba(255, 255, 255, 0.92);
  box-shadow: 0 6px 16px rgba(45, 75, 58, 0.14);
  align-self: flex-start;
}

.message-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.message.self .message-avatar {
  border-color: rgba(50, 195, 116, 0.6);
}

.bubble {
  max-width: 58%;
  background: #ffffff;
  border: 1px solid rgba(198, 221, 207, 0.8);
  border-radius: 14px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-shadow: 0 10px 20px rgba(58, 96, 74, 0.08);
}

.message.self .bubble {
  background: linear-gradient(135deg, #32c374, #1da368);
  color: #0f2e1f;
  border-color: transparent;
}

.message.self .bubble .author {
  color: rgba(12, 51, 32, 0.72);
}

.bubble p {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
}

.message-emoji-image {
  width: 22px;
  height: 22px;
  vertical-align: text-bottom;
  object-fit: contain;
}

.bubble.bubble-image {
  padding: 1px;
  border-radius: 11px;
  background: #ffffff;
}

.message.self .bubble.bubble-image {
  background: #32c374;
}

.message-file-image {
  width: 220px;
  max-width: 100%;
  height: auto;
  border-radius: 10px;
  display: block;
}

.composer {
  margin-top: 32px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.composer-input {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  height: 46px;
  background: #f7f7f7;
  border: 1px solid #ededed;
  border-radius: 18px;
  padding: 0 10px;
  box-shadow: 0 10px 18px rgba(0, 0, 0, 0.06);
}

.composer-input:focus-within {
  border-color: #d9d9d9;
  box-shadow: 0 0 0 4px rgba(0, 0, 0, 0.06);
}

.composer input {
  flex: 1;
  height: 100%;
  border: none;
  outline: none;
  padding: 0 44px 0 6px;
  font-size: 16px;
  color: #1f1f1f;
  background: transparent;
}

.composer input::placeholder {
  font-size: 16px;
}

.emoji-button {
  position: absolute;
  right: 8px;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 12px;
  background: transparent;
  cursor: pointer;
  font-size: 20px;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #4a4a4a;
  transition: background-color 0.15s ease;
}

.emoji-button:hover {
  background: #f2f2f2;
}

.emoji-picker {
  position: absolute;
  left: 0;
  bottom: calc(100% + 12px);
  width: 720px;
  max-width: calc(100vw - 120px);
  max-height: 360px;
  overflow-y: auto;
  background: #ffffff;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  padding: 24px 16px;
  box-shadow: 0 15px 45px rgba(0, 0, 0, 0.1);
  z-index: 2000;
  scrollbar-width: thin;
  scrollbar-color: #ddd transparent;
}

.emoji-picker::-webkit-scrollbar {
  width: 5px;
}

.emoji-picker::-webkit-scrollbar-thumb {
  background-color: #ccc;
  border-radius: 10px;
}

.emoji-section {
  margin-bottom: 24px;
}

.emoji-section:last-child {
  margin-bottom: 0;
}

.emoji-section-title {
  margin: 0 0 12px 8px;
  font-size: 13px;
  color: #8e8e8e;
  font-weight: 400;
}

.emoji-grid {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 2px;
}

.emoji-pack-bar {
  display: flex;
  gap: 8px;
  padding: 0 8px 12px;
  overflow-x: auto;
}

.emoji-pack-item {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  border: 1px solid #e5e5e5;
  background: #fff;
  padding: 0;
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.emoji-pack-item.active {
  border-color: rgba(49, 193, 115, 0.7);
  box-shadow: 0 0 0 3px rgba(49, 193, 115, 0.16);
}

.emoji-pack-item img {
  width: 100%;
  height: 100%;
  border-radius: 10px;
  object-fit: cover;
}

.emoji-pack-fallback {
  font-size: 18px;
  color: #4a4a4a;
}

.emoji-item {
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 34px;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: background-color 0.1s;
  padding: 0;
  line-height: 1;
}

.emoji-image {
  width: 34px;
  height: 34px;
  object-fit: contain;
}

.hidden-file-input {
  display: none;
}

.emoji-item:hover {
  background: #e1e1e1;
}

.emoji-item:active {
  background: #d4d4d4;
}

.send-button {
  border: none;
  height: 46px;
  background: #2bb673;
  color: #ffffff;
  border-radius: 14px;
  padding: 0 22px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 10px 18px rgba(0, 0, 0, 0.12);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.send-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 22px rgba(0, 0, 0, 0.16);
}

@media (max-width: 1024px) {
  .welcome {
    padding: 32px;
  }
}

@media (max-width: 768px) {
  .welcome {
    padding: 24px;
  }

  .features {
    flex-direction: column;
    align-items: stretch;
  }

  .bubble {
    max-width: 72%;
  }
}
</style>
