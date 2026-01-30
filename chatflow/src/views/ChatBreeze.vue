<template>
  <div class="chat-breeze">
    <aside class="sidebar-toolbar">
      <div class="toolbar-avatar" ref="toolbarAvatarRef">
        <button
          type="button"
          class="toolbar-avatar-button"
          @click.stop="toggleProfileCard"
          aria-haspopup="dialog"
          :aria-expanded="showProfileCard"
        >
          <img
            v-if="hasAvatar"
            :src="currentUser.avatarFullUrl"
            :alt="currentUser.nickname || '用户头像'"
          />
          <span v-else class="toolbar-avatar-initial">
            {{ currentUserInitial }}
          </span>
        </button>
        <ProfilePopover
          ref="profileCardRef"
          :visible="showProfileCard"
          :user="currentUser"
          :has-avatar="hasAvatar"
          :initial="currentUserInitial"
        />
      </div>
      <ul class="toolbar-actions">
        <li v-for="action in toolbarActions" :key="action.id">
          <button
            :title="action.label"
            :class="{ active: action.id === activeToolbar }"
            type="button"
            @click="selectToolbarAction(action.id)"
          >
            <span aria-hidden="true">{{ action.icon }}</span>
            <span class="sr-only">{{ action.label }}</span>
          </button>
        </li>
      </ul>
    </aside>

    <aside class="sidebar" :style="{ width: sidebarWidth + 'px' }">
      <header class="sidebar-header">
        <h1 v-if="activeToolbar === 'conversations'">消息</h1>
        <h1 v-else-if="activeToolbar === 'contacts'">通讯录</h1>
        <h1 v-else>设置</h1>
        <div v-if="activeToolbar === 'conversations'" class="tools" ref="toolsRef">
          <div class="tool-create">
            <button
              class="tool-button"
              type="button"
              title="新建会话"
              @click.stop="toggleCreateMenu"
            >
              <span aria-hidden="true">+</span>
              <span class="sr-only">Create</span>
            </button>
            <transition name="tool-menu-fade">
              <ul v-if="showCreateMenu" class="tool-menu">
                <li>
                  <button type="button" @click="handleStartGroup">
                    <span class="tool-menu-icon">👥</span>
                    <span>创建群聊</span>
                  </button>
                </li>
                <li>
                  <button type="button" @click="handleAddFriend">
                    <span class="tool-menu-icon">➕</span>
                    <span>添加好友</span>
                  </button>
                </li>
              </ul>
            </transition>
          </div>
        </div>
      </header>

      <MessageList
        v-if="activeToolbar === 'conversations'"
        :conversations="filteredConversations"
        :active-conversation-id="activeConversationId"
        @select="selectConversation"
        @context="handleConversationContextMenu"
      />
      <ContactsDirectory
        v-else-if="activeToolbar === 'contacts'"
        :friend-requests="friendRequests"
        :friends="filteredContacts"
        :active-friend-id="activeFriendId"
        :pending-count="friendRequests.pendingCount"
        @select-friend="selectFriend"
        @approve-request="handleApproveFriendRequest"
        @reject-request="handleRejectFriendRequest"
        @select-group="handleSelectGroupFromContacts"
      />

      <SettingsPanel v-else 
        :items="settingsItems"
        :activeItem="activeItem"
        @select="handleSelect"
      />
      <!-- 拖拽以调整宽度 -->
      <div
        class="resize-handle"
        :class="{ active: isResizing }"
        @mousedown="onResizeMouseDown"
      />
    </aside>

    <ConversationArea
      v-if="activeToolbar === 'conversations'"
      :highlights="highlights"
      :selected-conversation="selectedConversation"
      :selected-thread="selectedThread"
      :current-user="currentUser"
      :draft="draft"
      :invite-enabled="canInviteGroupMembers"
      @update:draft="(v) => (draft = v)"
      @send="handleSendMessage"
      @send-file="handleSendFileMessage"
      @send-emoji-file="handleSendEmojiFile"
      @toggle-mute="handleToggleConversationMute"
      @toggle-favorite="handleToggleConversationFavorite"
      @delete-conversation="handleDeleteConversationFromDrawer"
      @leave-group="handleLeaveGroupFromDrawer"
      @invite-members="handleInviteMembers"
      @update-group-name="handleUpdateConversationGroupName"
      @update-group-intro="handleUpdateConversationGroupIntro"
      @remove-member="handleRemoveMemberFromGroup"
      @edit-announcement="handleEditAnnouncement"
      @send-group-message="handleSendGroupMessageFromDetail"
      @dissolve-group="handleDissolveGroupFromDetail"
    />
    <BrandShowcase v-else />
    <UserProfilePanel
      :visible="activeToolbar === 'settings' && showProfileModal"
      :current-user="currentUser"
      :loading="updatingProfile"
      @close="closeProfileModal"
      @update="handleProfileUpdate"
      @change-avatar="handleAvatarChange"
    />
    <ResetPasswordPanel
      :visible="activeToolbar === 'settings' && showResetPasswordModal"
      :current-user="currentUser"
      :submitting="resettingPassword"
      :sending-code="sendingResetCode"
      :code-countdown="resetCodeCountdown"
      @close="closeResetPasswordModal"
      @request-code="handleRequestResetCode"
      @reset="handleResetPassword"
    />


    <FriendDetailModal
      :visible="showFriendModal"
      :friend="selectedFriend"
      :sending-conversation="startingConversation"
      @close="closeFriendModal"
      @send="handleSendMessageToFriend"
      @delete="handleFriendDeleted"
    />
    <AddFriendModal
      :visible="showAddFriendModal"
      :current-user-id="currentUser.id"
      :current-user-email="currentUser.email"
      @close="closeAddFriendModal"
      @friend-added="handleFriendAdded"
    />
    <CreateGroupModal
      :visible="showCreateGroupModal"
      :friends="contacts"
      :submitting="isCreatingGroup"
      @close="closeCreateGroupModal"
      @confirm="handleCreateGroupConfirm"
    />
    <GroupInviteModal
      :visible="showGroupInviteModal"
      :friends="groupInviteCandidates"
      @close="closeGroupInviteModal"
      @confirm="handleInviteMembersConfirm"
    />
    <GroupAnnouncementModal
      :visible="showAnnouncementModal"
      :content="selectedConversationEntity?.announcement || ''"
      :updated-at="selectedConversationEntity?.announcementUpdatedAt"
      :saving="savingAnnouncement"
      @close="closeAnnouncementModal"
      @save="handleSaveAnnouncement"
    />
    <GroupDetailModal
      :visible="showGroupDetailModal"
      :group="selectedGroupFromContacts"
      :current-user-id="currentUser.id"
      @close="closeGroupDetailModal"
      @send="handleSendGroupMessageFromContacts"
      @dissolve="handleDissolveGroupFromContacts"
    />
    <FriendRemarkModal
      :visible="showApproveRemarkModal"
      :friend-name="pendingApproveName"
      :remark="remarkDraft"
      :loading="isProcessingFriendRequest"
      @update:remark="updateRemarkDraft"
      @cancel="closeApproveRemarkModal"
      @confirm="confirmApproveFriendRequest"
    />
    <RejectFriendModal
      :visible="showRejectConfirmModal"
      :friend-name="pendingRejectName"
      :loading="isProcessingFriendRequest"
      @cancel="closeRejectFriendModal"
      @confirm="confirmRejectFriendRequest"
    />

    <ul
      v-if="conversationMenu.visible"
      class="conversation-context-menu"
      :style="{ top: conversationMenu.y + 'px', left: conversationMenu.x + 'px' }"
      ref="conversationMenuRef"
    >
      <li>
        <button type="button" @click="handleMarkFavoriteConversation">
          {{ conversationMenuTarget?.isFavorite ? '取消常用会话' : '设置为常用会话' }}
        </button>
      </li>
      <li>
        <button type="button" class="danger" @click="handleDeleteConversation">
          删除会话
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, reactive, watch } from 'vue'
import { useRouter } from 'vue-router'
import ContactsDirectory from '@/components/chat/ContactsDirectory.vue'
import MessageList from '@/components/chat/MessageList.vue'
import AddFriendModal from '@/components/chat/AddFriendModal.vue'
import CreateGroupModal from '@/components/chat/CreateGroupModal.vue'
import FriendRemarkModal from '@/components/chat/FriendRemarkModal.vue'
import FriendDetailModal from '@/components/chat/FriendDetailModal.vue'
import RejectFriendModal from '@/components/chat/RejectFriendModal.vue'
import GroupInviteModal from '@/components/chat/GroupInviteModal.vue'
import GroupAnnouncementModal from '@/components/chat/GroupAnnouncementModal.vue'
import GroupDetailModal from '@/components/chat/GroupDetailModal.vue'
import ProfilePopover from '@/components/profile/ProfilePopover.vue'
import { fetchNormalizedFriends, fetchFriendRequests, agreeFriendRequest, rejectFriendRequest } from '@/services/friendService'
import {
  dissolveGroup,
  fetchGroupDetail,
  editGroup,
  inviteMembers,
  removeGroupMembers,
  createGroup,
} from '@/services/groupService'
import { requestPasswordResetCode, recoverPassword } from '@/services/passwordRecovery'
import { sendMessage as sendMessageAPI, fetchMessageList, markAsRead, uploadMessageFile } from '@/services/messageService'
import {
  restoreConversationByFriend,
  restoreConversationByGroup,
  fetchSessionList,
  toggleFavoriteSession,
  deleteSession as deleteConversationSession,
} from '@/services/conversationService'
import { logout as logoutApi, getUserInfo as fetchUserInfo, updateUserInfo as updateProfile, uploadAvatar as uploadUserAvatar } from '@/services/userService'
import SettingsPanel from '@/components/settings/SettingsPanel.vue'
import ConversationArea from '@/components/chat/ConversationArea.vue'
import UserProfilePanel from '@/components/settings/UserProfilePanel.vue'
import ResetPasswordPanel from '@/components/settings/ResetPasswordPanel.vue'
import BrandShowcase from '@/components/common/BrandShowcase.vue'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'
import 'element-plus/es/components/message/style/css'
import { useChatWebSocket } from '@/composables/useChatWebSocket'

const router = useRouter()
const authStore = useAuthStore()

const conversations = ref([])
const conversationsLoading = ref(false)
const conversationMuteState = reactive({})
const showGroupInviteModal = ref(false)
const showAnnouncementModal = ref(false)
const showGroupDetailModal = ref(false)
const selectedGroupFromContacts = ref(null)
const savingAnnouncement = ref(false)

const DEFAULT_AVATAR_URL =
  'https://chat-flow.oss-cn-guangzhou.aliyuncs.com/default-avatar/default-person.jpg'

const parseTimestamp = (value) => {
  if (value === undefined || value === null || value === '') return null
  let ms = Number(value)
  if (!Number.isFinite(ms)) return null
  if (ms < 1e12) {
    ms *= 1000
  }
  const date = new Date(ms)
  return Number.isNaN(date.getTime()) ? null : date.getTime()
}

const formatConversationClock = (timestamp) => {
  if (!Number.isFinite(timestamp)) return ''
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return ''
  const now = new Date()
  const sameDay = date.toDateString() === now.toDateString()
  const sameYear = date.getFullYear() === now.getFullYear()
  if (sameDay) {
    return date.toLocaleTimeString('zh-CN', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    })
  }
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  if (sameYear) {
    return `${month}-${day}`
  }
  return `${date.getFullYear()}-${month}-${day}`
}

const normalizeConversation = (item, index) => {
  if (!item) return null
  const rawId = item.id ?? item.sessionId ?? index
  const numericId = Number(rawId)
  const id = Number.isFinite(numericId) ? numericId : rawId
  const rawFriendId =
    item.friendId ??
    item.targetUserId ??
    item.userId ??
    item.contactId ??
    item.partnerId ??
    item.relationUserId ??
    null
  
  // relationId 是好友id/群聊id
  const rawRelationId = item.relationId
  const numericRelationId = Number(rawRelationId)
  const relationId = Number.isFinite(numericRelationId) ? numericRelationId : rawRelationId
  
  const displayName = item.displayName || item.name || `会话 ${id}`
  const sendTime = parseTimestamp(item.sendTime)
  const unreadCount = Number(item.unreadCount)
  const avatar = item.avatarFullUrl || DEFAULT_AVATAR_URL
  const statusValue = Number(item.status)
  const statusCode = Number.isFinite(statusValue) ? statusValue : 1
  const favoriteFlag = statusCode === 3
  const conversationTypeRaw = Number(item.conversationType)
  const conversationType = Number.isFinite(conversationTypeRaw) ? conversationTypeRaw : 1
  const isGroupConversation = conversationType === 2
  const friendId =
    rawFriendId !== null && rawFriendId !== undefined
      ? rawFriendId
      : !isGroupConversation
        ? relationId
        : null
  const muteSource =
    item.isMuted ??
    item.doNotDisturb ??
    item.disturbFlag ??
    item.muteFlag ??
    item.shieldingFlag ??
    item.shieldMsg ??
    false
  const muteFlag = Boolean(muteSource)
  const storedMute = Object.prototype.hasOwnProperty.call(conversationMuteState, id)
    ? conversationMuteState[id]
    : undefined
  const resolvedMute = typeof storedMute === 'boolean' ? storedMute : muteFlag
  if (typeof storedMute !== 'boolean') {
    conversationMuteState[id] = resolvedMute
  }
  const announcementUpdatedAt = parseTimestamp(
    item.announcementUpdatedAt ?? item.noticeUpdatedAt ?? item.announcementTime ?? null,
  )

  return {
    id,
    relationId,
    friendId,
    targetUserId: item.targetUserId ?? friendId,
    contactId: item.contactId ?? null,
    partnerId: item.partnerId ?? null,
    displayName,
    nameEn: displayName,
    nameCn: item.nameCn || '',
    snippet: item.content ?? '',
    content: item.content ?? '',
    unread: Number.isFinite(unreadCount) && unreadCount > 0 ? unreadCount : 0,
    status: '',
    statusCode,
    avatar,
    lastMessageId: item.lastMessageId ?? null,
    sendTime,
    conversationType,
    isGroupConversation,
    groupName: item.groupName || displayName,
    announcement: item.announcement || item.notice || '',
    announcementUpdatedAt,
    members: Array.isArray(item.members) ? item.members : [],
    isFavorite: favoriteFlag,
    isMuted: resolvedMute,
    clock: formatConversationClock(sendTime),
  }
}

const handleSendEmojiFile = async (payload) => {
  const messageFile = payload?.messageFile
  if (!messageFile) return

  if (!activeConversationId.value) return
  const conversationId = activeConversationId.value
  const conversation = conversations.value.find((conv) => conv.id === conversationId)
  if (!conversation) {
    ElMessage.warning('会话不存在')
    return
  }

  const tempId = `temp_emoji_${Date.now()}`
  const tempMessage = {
    id: tempId,
    role: 'self',
    author: '我',
    text: messageFile.fileName || '[表情]',
    messageType: 2,
    messageFile,
    time: formatMessageTime(Date.now()),
    sendTime: Date.now(),
    sequence: null,
    status: 0,
  }

  if (!messagesByConversation.value[conversationId]) {
    messagesByConversation.value[conversationId] = []
  }
  messagesByConversation.value[conversationId].push(tempMessage)

  try {
    const response = await sendMessageAPI({
      conversationId,
      content: messageFile.fileName || '[表情]',
      messageType: 2,
      messageFile,
    })

    const messageIndex = messagesByConversation.value[conversationId].findIndex((msg) => msg.id === tempId)
    if (messageIndex !== -1) {
      messagesByConversation.value[conversationId][messageIndex].status = 1
      messagesByConversation.value[conversationId][messageIndex].messageFile = response?.messageFile || messageFile
      if (response?.id) {
        messagesByConversation.value[conversationId][messageIndex].id = response.id
      }
      if (response?.sequence) {
        messagesByConversation.value[conversationId][messageIndex].sequence = response.sequence
      }
    }

    conversation.snippet = '[图片]'
    conversation.content = '[图片]'
    conversation.sendTime = Date.now()
    conversation.clock = formatConversationClock(conversation.sendTime)
    sortConversations()
  } catch (error) {
    console.error('[ChatBreeze] Failed to send emoji file:', error)
    ElMessage.error(error?.message || '发送表情失败，请重试')
    const messageIndex = messagesByConversation.value[conversationId].findIndex((msg) => msg.id === tempId)
    if (messageIndex !== -1) {
      messagesByConversation.value[conversationId][messageIndex].status = -1
    }
  }
}

const setConversations = (list) => {
  const normalized = list
    .map((item, index) => normalizeConversation(item, index))
    .filter(Boolean)
    .sort((a, b) => {
      const favoriteDelta = Number(b.isFavorite) - Number(a.isFavorite)
      if (favoriteDelta !== 0) {
        return favoriteDelta
      }
      return (b.sendTime ?? 0) - (a.sendTime ?? 0)
    })
  conversations.value = normalized
  if (!activeConversationId.value && normalized.length) {
    activeConversationId.value = normalized[0].id
  }
}

// 重新排序会话列表（保持置顶会话在前，其他按时间排序）
const sortConversations = () => {
  conversations.value.sort((a, b) => {
    const favoriteDelta = Number(b.isFavorite) - Number(a.isFavorite)
    if (favoriteDelta !== 0) {
      return favoriteDelta
    }
    return (b.sendTime ?? 0) - (a.sendTime ?? 0)
  })
}

const loadConversations = async ({ force = false } = {}) => {
  if (conversationsLoading.value) return
  if (!force && conversations.value.length) return
  conversationsLoading.value = true
  try {
    const list = await fetchSessionList()
    setConversations(Array.isArray(list) ? list : [])
  } catch (error) {
    console.error('加载会话列表失败', error)
    ElMessage.error(error?.message || '会话列表加载失败，请稍后重试')
  } finally {
    conversationsLoading.value = false
  }
}

const ensureConversationsLoaded = async () => {
  if (conversations.value.length || conversationsLoading.value) return
  await loadConversations()
}

const highlights = computed(() => {
  const list = Array.isArray(conversations.value) ? conversations.value : []
  return list
    .filter((conversation) => conversation.isFavorite)
    .slice(0, 6)
    .map((conversation) => ({
      id: conversation.id,
      name: conversation.displayName || conversation.nameEn || '',
      avatar: conversation.avatar,
    }))
})

const conversationMenu = reactive({
  visible: false,
  x: 0,
  y: 0,
  conversationId: null,
})

const conversationMenuRef = ref(null)

const conversationMenuTarget = computed(() => {
  const list = Array.isArray(conversations.value) ? conversations.value : []
  return list.find((item) => item.id === conversationMenu.conversationId) || null
})

const contacts = ref([])
const contactsLoading = ref(false)
const contactsError = ref('')

const friendRequests = reactive({
  incoming: [],
  outgoing: [],
  pendingCount: 0,
})

const getRequestDisplayName = (request) => {
  if (!request) return '未知用户'
  if (request.nickname) return request.nickname
  if (request.userId !== undefined && request.userId !== null) {
    return `用户 #${request.userId}`
  }
  return '未知用户'
}

const formatTimeHint = (timestamp) => {
  if (!timestamp) return '刚刚'
  let ms = Number(timestamp)
  if (!Number.isFinite(ms)) return '刚刚'
  if (ms < 1e12) {
    ms *= 1000
  }
  const date = new Date(ms)
  if (Number.isNaN(date.getTime())) return '刚刚'
  const diff = Date.now() - date.getTime()
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour
  if (diff < 0) {
    return date.toLocaleString('zh-CN', { hour12: false })
  }
  if (diff < minute) return '刚刚'
  if (diff < hour) return `${Math.max(1, Math.floor(diff / minute))} 分钟前`
  if (diff < day) return `${Math.max(1, Math.floor(diff / hour))} 小时前`
  return date.toLocaleString('zh-CN', { hour12: false })
}

const loadFriendRequests = async () => {
  try {
    const data = await fetchFriendRequests()
    const list = Array.isArray(data)
      ? data
      : Array.isArray(data?.friendRequestList)
      ? data.friendRequestList
      : []
    const pendingCount =
      typeof data?.pendingCount === 'number' && data.pendingCount >= 0
        ? data.pendingCount
        : list.filter(
            (item) => Number(item?.requestStatus) === 0 && Number(item?.applyDirection) !== 1,
          ).length
    if (!Array.isArray(list)) {
      friendRequests.incoming = []
      friendRequests.outgoing = []
      friendRequests.pendingCount = 0
      return
    }
    const nextIncoming = []
    const nextOutgoing = []
    list.forEach((item, index) => {
      if (!item) return
      const direction = Number(item.applyDirection)
      const baseId = item.id ?? item.requestId
      const fallbackId = `${direction || 0}-${item.userId ?? 'unknown'}-${item.createTime ?? index}`
      const statusValue = Number(item.requestStatus)
      const requestStatus = Number.isFinite(statusValue) ? statusValue : 0
      const record = {
        id: baseId ?? fallbackId,
        userId: item.userId ?? null,
        nickname: item.nickname ?? '',
        applyMessage: item.applyMessage ?? '',
        timeHint: formatTimeHint(item.createTime),
        avatar: item.avatarFullUrl ?? '',
        applyDirection: direction || 0,
        requestStatus,
      }
      if (direction === 1) {
        nextOutgoing.push(record)
      } else {
        nextIncoming.push(record)
      }
    })
    friendRequests.incoming = nextIncoming
    friendRequests.outgoing = nextOutgoing
    friendRequests.pendingCount = pendingCount
  } catch (error) {
    console.error('加载好友请求失败', error)
    friendRequests.incoming = []
    friendRequests.outgoing = []
    friendRequests.pendingCount = 0
  }
}

const toolbarActions = [
  { id: 'conversations', icon: '💬', label: '会话' },
  { id: 'contacts', icon: '👤', label: '通讯录' },
  { id: 'settings', icon: '⚙️', label: '设置' },
]

const settingsItems = [
  {
    id: 'profile',
    title: '个人资料'
  },
  {
    id: 'account',
    title: '找回密码'
  },
  {
    id: 'notifications',
    title: '通知'
  },
  {
    id: 'logout',
    title: '退出'
  },
]

const activeItem = ref('profile')

const handleSelect = (id) => {
  if (id === 'logout') {
    handleLogout()
    return
  }
  activeItem.value = id
  showProfileModal.value = id === 'profile'
  showResetPasswordModal.value = id === 'account'
  if (id !== 'account') {
    clearResetPasswordState()
  }
}

const handleLogout = async () => {
  activeItem.value = 'profile'
  showProfileModal.value = false
  showResetPasswordModal.value = false
  showProfileCard.value = false
  clearResetPasswordState()
  try {
    await logoutApi()
  } catch (error) {
    console.warn('调用退出接口失败', error)
  }
  authStore.clearToken()
  ElMessage.success('已退出登录')
  router.push({ name: 'Login' })
}


// 存储每个会话的消息列表，key为会话ID
const messagesByConversation = ref({})
const messagesLoading = ref(false)

// 先定义需要用到的 ref
const activeConversationId = ref(null)

// 处理接收到的消息
const handleReceivedMessage = (message) => {
  const conversationId =
    message.conversationId ||
    message.sessionId ||
    message.to ||
    message.from ||
    message.senderId
  
  if (!conversationId) {
    console.warn('无法确定会话ID，忽略消息:', message)
    return
  }

  const senderId = message.from || message.senderId
  const isFromMe = String(senderId) === String(currentUser.id)
  
  // 如果是当前查看的会话，直接添加消息
  if (activeConversationId.value && (
    activeConversationId.value === Number(conversationId) || 
    String(activeConversationId.value) === String(conversationId)
  )) {
    addMessageToThread(conversationId, message, isFromMe)
  } else {
    // 否则更新会话列表（只有别人发来的消息才增加未读）
    if (!isFromMe) {
      updateConversationWithNewMessage(conversationId, message)
    }
  }
}

// 添加消息到线程
const addMessageToThread = (conversationId, message, isFromMe) => {
  if (!messagesByConversation.value[conversationId]) {
    messagesByConversation.value[conversationId] = []
  }
  
  const conversation = conversations.value.find((conv) => 
    String(conv.id) === String(conversationId)
  )
  const contactName = conversation?.displayName || conversation?.nameEn || '对方'
  
  const role = isFromMe ? 'self' : 'contact'
  const author = isFromMe ? '我' : contactName
  
  // 检查是否已存在（去重）
  // 1. 优先通过 sequence 匹配
  // 2. 其次通过 id 匹配
  // 3. 如果是自己发送的消息，通过文本内容和时间匹配（去重乐观更新的消息）
  const messageText = message.text || message.content || ''
  const messageTime = message.sendTime || Date.now()
  
  const existingMessage = messagesByConversation.value[conversationId].find((msg) => {
    // 通过 sequence 匹配
    if (message.sequence && msg.sequence) {
      return msg.sequence === message.sequence
    }
    // 通过 id 匹配
    if (message.id && msg.id) {
      return String(msg.id) === String(message.id)
    }
    // 如果是自己发送的消息，通过文本和时间匹配（用于去重乐观更新的消息）
    if (isFromMe && msg.role === 'self' && msg.text === messageText) {
      // 检查时间差在 5 秒内，认为是同一条消息
      const timeDiff = Math.abs((msg.sendTime || 0) - messageTime)
      if (timeDiff < 5000) {
        return true
      }
    }
    return false
  })
  
  if (existingMessage) {
    // 如果找到已存在的消息，更新它而不是添加新的
    if (message.status !== undefined) {
      existingMessage.status = message.status
    }
    // 更新其他字段
    if (message.id && !existingMessage.id) {
      existingMessage.id = message.id
    }
    if (message.avatarFullUrl) {
      existingMessage.avatarFullUrl = message.avatarFullUrl
    }
    if (message.sequence && !existingMessage.sequence) {
      existingMessage.sequence = message.sequence
    }
    if (message.sendTime && message.sendTime > existingMessage.sendTime) {
      existingMessage.sendTime = message.sendTime
      existingMessage.time = formatMessageTime(message.sendTime)
    }
    return
  }
  
  const newMessage = {
    id: message.id || message.sequence || Date.now(),
    role,
    author,
    text: message.text || message.content || '',
    messageType: message.messageType ?? 1,
    messageFile: message.messageFile,
    avatarFullUrl: message.avatarFullUrl || '',
    time: formatMessageTime(message.sendTime || Date.now()),
    sendTime: message.sendTime || Date.now(),
    sequence: message.sequence,
    status: message.status !== undefined ? message.status : 1,
  }
  
  messagesByConversation.value[conversationId].push(newMessage)
  
  // 排序
  messagesByConversation.value[conversationId].sort((a, b) => {
    if (a.sequence && b.sequence) {
      return a.sequence - b.sequence
    }
    if (a.sendTime && b.sendTime) {
      return a.sendTime - b.sendTime
    }
    return 0
  })
}

// 更新会话的新消息提示
const updateConversationWithNewMessage = (conversationId, message) => {
  const conversation = conversations.value.find((conv) => 
    String(conv.id) === String(conversationId) || Number(conv.id) === Number(conversationId)
  )
  
  if (conversation) {
    const isFromMe = String(message.from) === String(currentUser.id)
    if (!isFromMe) {
      conversation.unread = (conversation.unread || 0) + 1
    }
    
    conversation.snippet = message.text || message.content || ''
    conversation.content = message.text || message.content || ''
    conversation.sendTime = message.sendTime || Date.now()
    conversation.clock = formatConversationClock(conversation.sendTime)
    
    // 缓存消息
    if (!messagesByConversation.value[conversationId]) {
      messagesByConversation.value[conversationId] = []
    }
    addMessageToThread(conversationId, message, isFromMe)
    
    // 重新排序会话列表（新消息的会话应该排在前面）
    sortConversations()
  }
}

// WebSocket 连接
const { isConnected, connect, disconnect, sendMessage } = useChatWebSocket({
  currentUserId: computed(() => currentUser.id),
  conversations,
  activeConversationId,
  messagesByConversation,
  onMessageReceived: handleReceivedMessage,
  onSystemMessage: (message) => {
    if (message.msg) {
      ElMessage.info(message.msg)
    }
  },
})

// 发送消息
const handleSendMessage = async () => {
  if (!draft.value.trim() || !activeConversationId.value) {
    return
  }
  
  const conversationId = activeConversationId.value
  const conversation = conversations.value.find((conv) => conv.id === conversationId)
  if (!conversation) {
    ElMessage.warning('会话不存在')
    return
  }
  
  const messageText = draft.value.trim()
  
  // 获取对方用户ID（优先使用会话中的targetUserId，否则使用会话ID）
  const targetUserId = conversation.targetUserId || conversation.friendId || conversation.userId || conversationId
  
  // 乐观更新：立即显示在UI中
  const tempId = `temp_${Date.now()}`
  const tempMessage = {
    id: tempId,
    role: 'self',
    author: '我',
    text: messageText,
    messageType: 1,
    messageFile: null,
    time: formatMessageTime(Date.now()),
    sendTime: Date.now(),
    sequence: null,
    status: 0, // 发送中
  }
  
  if (!messagesByConversation.value[conversationId]) {
    messagesByConversation.value[conversationId] = []
  }
  messagesByConversation.value[conversationId].push(tempMessage)
  
  // 清空输入框
  const originalDraft = draft.value
  draft.value = ''
  
  try {
    // 调用REST API发送消息（receiverId不再需要，后端会通过conversationId自动查询所有参与者）
    const response = await sendMessageAPI({
      conversationId: conversationId,
      content: messageText,
      messageType: 1, // 文本消息
    })
    
    console.log('[ChatBreeze] Message sent successfully:', response)
    
    // 更新临时消息的状态为已发送
    const messageIndex = messagesByConversation.value[conversationId].findIndex(
      (msg) => msg.id === tempId
    )
    if (messageIndex !== -1) {
      messagesByConversation.value[conversationId][messageIndex].status = 1
      // 更新服务器返回的真实ID和sequence
      if (response.id) {
        messagesByConversation.value[conversationId][messageIndex].id = response.id
      }
      if (response.sequence) {
        messagesByConversation.value[conversationId][messageIndex].sequence = response.sequence
      }
    }
    
    // 更新会话列表的最新消息
    conversation.snippet = messageText
    conversation.content = messageText
    conversation.sendTime = Date.now()
    conversation.clock = formatConversationClock(conversation.sendTime)
    
    // 重新排序会话列表（发送消息的会话应该排在前面）
    sortConversations()
    
  } catch (error) {
    console.error('[ChatBreeze] Failed to send message:', error)
    ElMessage.error(error?.message || '消息发送失败，请重试')
    
    // 发送失败，标记消息状态为失败（-1），并恢复输入框内容
    const messageIndex = messagesByConversation.value[conversationId].findIndex(
      (msg) => msg.id === tempId
    )
    if (messageIndex !== -1) {
      messagesByConversation.value[conversationId][messageIndex].status = -1
    }
    draft.value = originalDraft
  }
}

const handleSendFileMessage = async (file) => {
  if (!file || !activeConversationId.value) return
  const conversationId = activeConversationId.value
  const conversation = conversations.value.find((conv) => conv.id === conversationId)
  if (!conversation) {
    ElMessage.warning('会话不存在')
    return
  }

  const tempId = `temp_file_${Date.now()}`
  const tempMessage = {
    id: tempId,
    role: 'self',
    author: '我',
    text: file.name || '[文件]',
    messageType: 2,
    messageFile: null,
    time: formatMessageTime(Date.now()),
    sendTime: Date.now(),
    sequence: null,
    status: 0,
  }

  if (!messagesByConversation.value[conversationId]) {
    messagesByConversation.value[conversationId] = []
  }
  messagesByConversation.value[conversationId].push(tempMessage)

  try {
    const formData = new FormData()
    formData.append('file', file)
    const uploadRes = await uploadMessageFile(formData)
    const messageFile = uploadRes?.data ?? null

    const response = await sendMessageAPI({
      conversationId,
      content: file.name || '[文件]',
      messageType: 2,
      messageFile,
    })

    const messageIndex = messagesByConversation.value[conversationId].findIndex((msg) => msg.id === tempId)
    if (messageIndex !== -1) {
      messagesByConversation.value[conversationId][messageIndex].status = 1
      messagesByConversation.value[conversationId][messageIndex].messageFile = response?.messageFile || messageFile
      if (response?.id) {
        messagesByConversation.value[conversationId][messageIndex].id = response.id
      }
      if (response?.sequence) {
        messagesByConversation.value[conversationId][messageIndex].sequence = response.sequence
      }
    }

    conversation.snippet = '[图片]'
    conversation.content = '[图片]'
    conversation.sendTime = Date.now()
    conversation.clock = formatConversationClock(conversation.sendTime)
    sortConversations()
  } catch (error) {
    console.error('[ChatBreeze] Failed to send file message:', error)
    ElMessage.error(error?.message || '文件发送失败，请重试')
    const messageIndex = messagesByConversation.value[conversationId].findIndex((msg) => msg.id === tempId)
    if (messageIndex !== -1) {
      messagesByConversation.value[conversationId][messageIndex].status = -1
    }
  }
}

const activeFriendId = ref(null)
const activeToolbar = ref('conversations')
const sidebarWidth = ref(320)
const isResizing = ref(false)
const startX = ref(0)
const startWidth = ref(sidebarWidth.value)
const searchTerm = ref('')
const draft = ref('')
const showFriendModal = ref(false)
const startingConversation = ref(false)
const showCreateMenu = ref(false)
const showProfileCard = ref(false)
const toolsRef = ref(null)
const toolbarAvatarRef = ref(null)
const profileCardRef = ref(null)
const showAddFriendModal = ref(false)
const showCreateGroupModal = ref(false)
const isCreatingGroup = ref(false)
const showProfileModal = ref(false)
const showResetPasswordModal = ref(false)
const updatingProfile = ref(false)
const avatarUploading = ref(false)
const sendingResetCode = ref(false)
const resettingPassword = ref(false)
const resetCodeCountdown = ref(0)
let resetCodeTimer = null
const RESET_CODE_COUNTDOWN = 60

watch(
  () => contacts.value.length,
  (length) => {
    if (length > 0 && !activeFriendId.value) {
      activeFriendId.value = contacts.value[0].id
    }
  },
)

// 监听activeConversationId变化，自动加载消息
watch(
  () => activeConversationId.value,
  (newId) => {
    if (newId) {
      loadMessages(newId)
    }
  },
)

const clearResetPasswordState = () => {
  if (resetCodeTimer) {
    clearInterval(resetCodeTimer)
    resetCodeTimer = null
  }
  resetCodeCountdown.value = 0
}

const startResetCodeCountdown = (seconds = RESET_CODE_COUNTDOWN) => {
  if (resetCodeTimer) {
    clearInterval(resetCodeTimer)
    resetCodeTimer = null
  }
  resetCodeCountdown.value = seconds
  resetCodeTimer = setInterval(() => {
    if (resetCodeCountdown.value <= 1) {
      clearResetPasswordState()
    } else {
      resetCodeCountdown.value -= 1
    }
  }, 1000)
}

const searchPlaceholder = computed(() =>
  activeToolbar.value === 'contacts' ? '搜索通讯录...' : 'Search conversations...',
)

const filteredConversations = computed(() => {
  const list = Array.isArray(conversations.value) ? conversations.value : []
  if (!searchTerm.value.trim()) return list
  const keyword = searchTerm.value.trim().toLowerCase()
  const rawKeyword = searchTerm.value.trim()
  return list.filter((item) => {
    const display = (item.displayName || item.nameEn || '').toLowerCase()
    const snippet = item.snippet ? item.snippet.toLowerCase() : ''
    const matchesDisplay = display.includes(keyword)
    const matchesCn = item.nameCn ? item.nameCn.includes(rawKeyword) : false
    const matchesSnippet = snippet.includes(keyword)
    return matchesDisplay || matchesCn || matchesSnippet
  })
})
const filteredContacts = computed(() => {
  const list = Array.isArray(contacts.value) ? contacts.value : []
  if (!searchTerm.value.trim()) return list
  const keyword = searchTerm.value.trim().toLowerCase()
  const rawKeyword = searchTerm.value.trim()
  return list.filter((friend) => {
    const matchesEn = friend.nameEn.toLowerCase().includes(keyword)
    const matchesCn = friend.nameCn ? friend.nameCn.includes(rawKeyword) : false
    const matchesDescription = friend.description
      ? friend.description.toLowerCase().includes(keyword)
      : false
    return matchesEn || matchesCn || matchesDescription
  })
})

const loadFriends = async () => {
  if (contactsLoading.value) return
  contactsError.value = ''
  contactsLoading.value = true
  try {
    contacts.value = await fetchNormalizedFriends()
  } catch (error) {
    contactsError.value = error?.message || '好友列表加载失败，请稍后重试'
    console.error('加载好友列表失败', error)
    ElMessage.error(contactsError.value)
  } finally {
    contactsLoading.value = false
  }
}

const ensureFriendsLoaded = async () => {
  if (contacts.value.length || contactsLoading.value) return
  await loadFriends()
}

const selectedFriend = computed(() => {
  const list = Array.isArray(contacts.value) ? contacts.value : []
  return list.find((friend) => friend.id === activeFriendId.value) || null
})

const toggleCreateMenu = () => {
  showProfileCard.value = false
  showCreateMenu.value = !showCreateMenu.value
  closeConversationMenu()
}

const toggleProfileCard = () => {
  showCreateMenu.value = false
  showProfileCard.value = !showProfileCard.value
  closeConversationMenu()
}

const handleGlobalClick = (event) => {
  const target = event.target
  if (showCreateMenu.value) {
    const withinTools = toolsRef.value && toolsRef.value.contains(target)
    if (!withinTools) {
      showCreateMenu.value = false
    }
  }
  if (showProfileCard.value) {
    const withinAvatar =
      toolbarAvatarRef.value && toolbarAvatarRef.value.contains(target)
    const cardEl =
      profileCardRef.value?.$el ??
      profileCardRef.value?.root?.value ??
      null
    const withinCard = cardEl && cardEl.contains(target)
    if (!withinAvatar && !withinCard) {
      showProfileCard.value = false
    }
  }
  if (conversationMenu.visible) {
    const menuEl = conversationMenuRef.value
    const withinMenu = menuEl && menuEl.contains(target)
    if (!withinMenu) {
      closeConversationMenu()
    }
  }
}

function adjustMenuPosition(clientX, clientY) {
  const padding = 12
  const estimatedWidth = 180
  const estimatedHeight = 96
  let x = clientX
  let y = clientY
  if (x + estimatedWidth + padding > window.innerWidth) {
    x = window.innerWidth - estimatedWidth - padding
  }
  if (y + estimatedHeight + padding > window.innerHeight) {
    y = window.innerHeight - estimatedHeight - padding
  }
  return {
    x: Math.max(padding, x),
    y: Math.max(padding, y),
  }
}

function openConversationMenu(conversation, event) {
  if (!conversation) return
  const { clientX, clientY } = event
  const { x, y } = adjustMenuPosition(clientX, clientY)
  conversationMenu.visible = true
  conversationMenu.x = x
  conversationMenu.y = y
  conversationMenu.conversationId = conversation.id
  activeConversationId.value = conversation.id
}

function closeConversationMenu() {
  conversationMenu.visible = false
  conversationMenu.conversationId = null
}

function handleConversationContextMenu({ item, event }) {
  if (!event || !item) return
  openConversationMenu(item, event)
}

// 格式化时间戳为显示时间
const formatMessageTime = (timestamp) => {
  if (!timestamp || !Number.isFinite(Number(timestamp))) return ''
  let ms = Number(timestamp)
  if (ms < 1e12) {
    ms *= 1000
  }
  const date = new Date(ms)
  if (Number.isNaN(date.getTime())) return ''
  const now = new Date()
  const sameDay = date.toDateString() === now.toDateString()
  if (sameDay) {
    return date.toLocaleTimeString('zh-CN', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    })
  }
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const isYesterday = date.toDateString() === yesterday.toDateString()
  if (isYesterday) {
    return `昨天 ${date.toLocaleTimeString('zh-CN', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    })}`
  }
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${month}-${day} ${date.toLocaleTimeString('zh-CN', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  })}`
}

// 加载消息列表
const loadMessages = async (conversationId) => {
  if (!conversationId || messagesLoading.value) return
  // 如果已经有缓存，不再重复加载
  if (messagesByConversation.value[conversationId]) return
  
  messagesLoading.value = true
  try {
    const messageList = await fetchMessageList(conversationId)
    const list = Array.isArray(messageList) ? messageList : []
    
    // 获取会话信息用于显示对方名称
    const conversation = conversations.value.find((conv) => conv.id === conversationId)
    const contactName = conversation?.displayName || conversation?.nameEn || '对方'
    
    const convertedMessages = list.map((msg, index) => {
        const direction = Number(msg.direction)
        // direction: 1=USER_TO_FRIEND(我发出的), 2=FRIEND_TO_USER(收到的)
        const role = direction === 1 ? 'self' : 'contact'
        const author = role === 'self' ? '我' : contactName
        
        return {
          id: msg.sequence || index + 1,
          role,
          author,
          text: msg.content || '',
          messageType: msg.messageType ?? 1,
          messageFile: msg.messageFile,
          avatarFullUrl: msg.avatarFullUrl || '',
          time: formatMessageTime(msg.sendTime),
          sendTime: msg.sendTime,
          sequence: msg.sequence,
          status: msg.status,
        }
      })
    
    // 按时间排序（如果sequence不可用，使用sendTime）
    convertedMessages.sort((a, b) => {
      if (a.sequence && b.sequence) {
        return a.sequence - b.sequence
      }
      if (a.sendTime && b.sendTime) {
        return a.sendTime - b.sendTime
      }
      return 0
    })
    
    messagesByConversation.value[conversationId] = convertedMessages
  } catch (error) {
    console.error('加载消息列表失败', error)
    ElMessage.error(error?.message || '加载消息列表失败，请稍后重试')
    messagesByConversation.value[conversationId] = []
  } finally {
    messagesLoading.value = false
  }
}

const selectConversation = async (id) => {
  activeConversationId.value = id
  activeToolbar.value = 'conversations'
  showCreateMenu.value = false
  showProfileCard.value = false
  showFriendModal.value = false
  closeConversationMenu()
  // 加载该会话的消息列表
  await loadMessages(id)
  
  // 标记该会话的消息为已读
  try {
    await markAsRead(id)
    console.log('[ChatBreeze] Marked conversation as read:', id)
    
    // 更新本地会话的未读数为0
    const conversation = conversations.value.find((conv) => conv.id === id)
    if (conversation) {
      conversation.unread = 0
    }
  } catch (error) {
    console.error('[ChatBreeze] Failed to mark conversation as read:', error)
  }
}

const selectedConversation = computed(() => {
  const list = Array.isArray(conversations.value) ? conversations.value : []
  const convo = list.find((item) => item.id === activeConversationId.value)
  if (!convo) return null
  return {
    ...convo,
    displayName: convo.displayName || convo.nameEn || '',
  }
})

const selectedConversationEntity = computed(() => {
  const list = Array.isArray(conversations.value) ? conversations.value : []
  return list.find((item) => item.id === activeConversationId.value) || null
})

const selectedThread = computed(() => {
  if (!activeConversationId.value) return []
  return messagesByConversation.value[activeConversationId.value] || []
})
const selectToolbarAction = async (id) => {
  activeToolbar.value = id
  showCreateMenu.value = false
  showProfileCard.value = false
  showAddFriendModal.value = false
  closeConversationMenu()
  if (id === 'conversations') {
    await ensureConversationsLoaded()
  }
  if (id !== 'contacts') {
    showFriendModal.value = false
  }
  if (id !== 'settings') {
    showProfileModal.value = false
  } else {
    showProfileModal.value = false
  }
  if (id === 'contacts') {
    await ensureFriendsLoaded()
    if (!activeFriendId.value && filteredContacts.value.length) {
      activeFriendId.value = filteredContacts.value[0].id
    }
    loadFriendRequests()
  }
}

const toggleConversationFavorite = async (conversationId, nextFavorite) => {
  if (!conversationId) return false
  try {
    const { message } = await toggleFavoriteSession(conversationId, nextFavorite)
    const target = conversations.value.find((item) => item.id === conversationId)
    if (target) {
      target.isFavorite = nextFavorite
      target.statusCode = nextFavorite ? 3 : 1
    }
    sortConversations()
    ElMessage.success(message || (nextFavorite ? '已设置为常用会话' : '已取消常用会话'))
    await loadConversations({ force: true })
    return true
  } catch (error) {
    console.error('设置常用会话失败', error)
    ElMessage.error(error?.message || '操作失败，请稍后重试')
    return false
  }
}

const handleMarkFavoriteConversation = async () => {
  const target = conversationMenuTarget.value
  if (!target) {
    closeConversationMenu()
    return
  }
  const nextFavorite = !target.isFavorite
  await toggleConversationFavorite(target.id, nextFavorite)
  closeConversationMenu()
}

const handleToggleConversationFavorite = async (nextFavorite) => {
  const conversation = selectedConversation.value
  if (!conversation) return
  await toggleConversationFavorite(conversation.id, nextFavorite)
}

const handleToggleConversationMute = (nextMuted) => {
  const conversation = selectedConversation.value
  if (!conversation) return
  const target = conversations.value.find((item) => item.id === conversation.id)
  if (!target) return
  target.isMuted = nextMuted
  conversationMuteState[conversation.id] = nextMuted
  ElMessage.success(nextMuted ? '已开启消息免打扰' : '已关闭消息免打扰')
}

const deleteConversationById = async (conversationId, { successMessage } = {}) => {
  if (!conversationId) return false
  const target = conversations.value.find((item) => item.id === conversationId)
  if (!target) return false
  try {
    await deleteConversationSession(conversationId)
    conversations.value = conversations.value.filter((item) => item.id !== conversationId)
    if (activeConversationId.value === conversationId) {
      activeConversationId.value = conversations.value[0]?.id ?? null
    }
    delete conversationMuteState[conversationId]
    ElMessage.success(successMessage || '会话已删除')
    return true
  } catch (error) {
    console.error('删除会话失败', error)
    ElMessage.error(error?.message || '删除会话失败，请稍后重试')
    return false
  }
}

const handleDeleteConversation = async () => {
  const target = conversationMenuTarget.value
  if (!target) {
    closeConversationMenu()
    return
  }
  await deleteConversationById(target.id)
  closeConversationMenu()
}

const handleDeleteConversationFromDrawer = async () => {
  const conversation = selectedConversation.value
  if (!conversation) return
  await deleteConversationById(conversation.id)
}

const handleLeaveGroupFromDrawer = async () => {
  const conversation = selectedConversation.value
  if (!conversation) return
  const success = await deleteConversationById(conversation.id, { successMessage: '已退出群聊' })
  if (success) {
    showFriendModal.value = false
  }
}

const groupInviteCandidates = computed(() => {
    const conversation = selectedConversationEntity.value
    if (!conversation || !conversation.isGroupConversation) return []
    const members = Array.isArray(conversation.members) ? conversation.members : []
    const memberIds = new Set(
      members
        .map(
          (member) =>
            member?.id ??
            member?.userId ??
            member?.memberId ??
            member?.friendId ??
            member?.contactId ??
            member?.email ??
            null,
        )
        .filter((id) => id !== null && id !== undefined),
    )
    return (Array.isArray(contacts.value) ? contacts.value : [])
      .map((friend) => {
        const id = friend?.id ?? friend?.friendId ?? friend?.userId ?? friend?.contactId ?? null
        return {
          id,
          displayName:
            friend?.remark ||
            friend?.nickname ||
            friend?.displayName ||
            friend?.name ||
            friend?.email ||
            (id !== null && id !== undefined ? `好友 #${id}` : '好友'),
          avatar:
            friend?.avatarFullUrl ||
            friend?.avatarUrl ||
            friend?.avatar ||
            DEFAULT_AVATAR_URL,
          email: friend?.email || '',
        }
      })
      .filter((friend) => friend.id !== null && friend.id !== undefined && !memberIds.has(friend.id))
})

const canInviteGroupMembers = computed(() => {
  const conversation = selectedConversationEntity.value
  if (!conversation || !conversation.isGroupConversation) return false
  return groupInviteCandidates.value.length > 0
})

watch(
  () => selectedConversationEntity.value?.id,
  () => {
    showGroupInviteModal.value = false
    showAnnouncementModal.value = false
    savingAnnouncement.value = false
  },
)

const handleInviteMembers = async () => {
  const conversation = selectedConversationEntity.value
  if (!conversation || !conversation.isGroupConversation) return
  await ensureFriendsLoaded()
  if (!groupInviteCandidates.value.length) {
    ElMessage.info('暂无可邀请的好友')
    return
  }
  showGroupInviteModal.value = true
}

const closeGroupInviteModal = () => {
  showGroupInviteModal.value = false
}
const handleInviteMembersConfirm = (selectedIds) => {
  const conversation = selectedConversationEntity.value
  if (!conversation || !conversation.isGroupConversation) {
    closeGroupInviteModal()
    return
  }
  const ids = Array.isArray(selectedIds) ? selectedIds : []
  if (!ids.length) {
    closeGroupInviteModal()
    return
  }
  const groupId = conversation.relationId ?? conversation.id
  inviteMembers(groupId, ids)
    .then(() => {
      const friendMap = new Map(
        (Array.isArray(contacts.value) ? contacts.value : []).map((friend) => [
          friend?.id ?? friend?.friendId ?? friend?.userId ?? friend?.contactId ?? null,
          friend,
        ]),
      )
      const target = conversation
      const existingIds = new Set(
        (Array.isArray(target.members) ? target.members : [])
          .map(
            (member) =>
              member?.id ??
              member?.userId ??
              member?.memberId ??
              member?.friendId ??
              member?.contactId ??
              null,
          )
          .filter((id) => id !== null && id !== undefined),
      )

      const additions = []
      ids.forEach((id) => {
        if (id === null || id === undefined) return
        if (existingIds.has(id)) return
        const friend = friendMap.get(id)
        if (!friend) return
        existingIds.add(id)
        additions.push({
          id,
          name:
            friend?.remark ||
            friend?.nickname ||
            friend?.displayName ||
            friend?.name ||
            friend?.email ||
            `好友 #${id}`,
          avatar:
            friend?.avatarFullUrl ||
            friend?.avatarUrl ||
            friend?.avatar ||
            DEFAULT_AVATAR_URL,
        })
      })

      if (additions.length) {
        const currentMembers = Array.isArray(target.members) ? target.members : []
        target.members = [...currentMembers, ...additions]
        sortConversations()
      }
      ElMessage.success('已发送邀请')
      closeGroupInviteModal()
    })
    .catch((error) => {
      console.error('邀请成员失败', error)
      ElMessage.error(error?.message || '邀请失败，请稍后重试')
    })
}

const updateGroupInfo = async (payload = {}) => {
  const conversation = selectedConversationEntity.value
  if (!conversation || !conversation.isGroupConversation) return false
  const groupId = conversation.relationId ?? conversation.id
  const body = {
    groupId,
    groupName: conversation.groupName || conversation.displayName || '',
    introduction: conversation.introduction || '',
    announcement: conversation.announcement || '',
    ...payload,
  }
  try {
    await editGroup(body)
    return true
  } catch (error) {
    console.error('更新群信息失败', error)
    ElMessage.error(error?.message || '更新群信息失败，请稍后重试')
    return false
  }
}

const handleUpdateConversationGroupName = (value) => {
  const conversation = selectedConversationEntity.value
  if (!conversation || !conversation.isGroupConversation) return
  const nextName = (value ?? '').trim()
  const currentName = (conversation.groupName || conversation.displayName || '').trim()
  if (!nextName || nextName === currentName) {
    ElMessage.info('群聊名称未变化')
    return
  }
  conversation.groupName = nextName
  conversation.displayName = nextName
  conversation.nameCn = nextName
  conversation.nameEn = nextName
  sortConversations()
  updateGroupInfo({ groupName: nextName })
  ElMessage.success('群聊名称已更新')
}

const handleUpdateConversationGroupIntro = (value) => {
  const conversation = selectedConversationEntity.value
  if (!conversation || !conversation.isGroupConversation) return
  const nextIntro = (value ?? '').trim()
  const currentIntro = (conversation.introduction || '').trim()
  if (nextIntro === currentIntro) {
    ElMessage.info('群聊简介未变化')
    return
  }
  conversation.introduction = nextIntro
  updateGroupInfo({ introduction: nextIntro })
  ElMessage.success('群聊简介已更新')
}
const handleEditAnnouncement = () => {
  const conversation = selectedConversationEntity.value
  if (!conversation || !conversation.isGroupConversation) return
  showAnnouncementModal.value = true
}

const closeAnnouncementModal = () => {
  if (savingAnnouncement.value) return
  showAnnouncementModal.value = false
}

const handleSaveAnnouncement = async (content) => {
  const conversation = selectedConversationEntity.value
  if (!conversation || !conversation.isGroupConversation) {
    closeAnnouncementModal()
    return
  }
  const nextContent = (content ?? '').trim()
  if (conversation.announcement === nextContent) {
    ElMessage.info('群公告未变化')
    closeAnnouncementModal()
    return
  }
  savingAnnouncement.value = true
  try {
    conversation.announcement = nextContent
    conversation.announcementUpdatedAt = Date.now()
    await updateGroupInfo({ announcement: nextContent })
    ElMessage.success('群公告已更新')
    showAnnouncementModal.value = false
  } catch (error) {
    console.error('更新群公告失败', error)
    ElMessage.error('群公告更新失败')
  } finally {
    savingAnnouncement.value = false
  }
}

const handleRemoveMemberFromGroup = async (member) => {
  const conversation = selectedConversationEntity.value
  if (!conversation || !conversation.isGroupConversation) return

  const ids = (
    Array.isArray(member)
      ? member
      : [member?.userId ?? member?.memberId ?? member?.id ?? null]
  )
    .map((id) => (id === '' || id === undefined || id === null ? null : Number(id)))
    .filter((id) => Number.isFinite(id))

  if (!ids.length) {
    ElMessage.warning('成员信息无效')
    return
  }

  try {
    const groupId = conversation.relationId ?? conversation.id
    await removeGroupMembers(groupId, ids)

    // 刷新群详情，保持成员列表和人数最新
    try {
      const detail = await fetchGroupDetail(groupId)
      if (detail) {
        if (Array.isArray(detail.members)) {
          conversation.members = detail.members
        }
        if (typeof detail.onlineCount === 'number') {
          conversation.memberCount = detail.onlineCount
        } else if (typeof detail.memberCount === 'number') {
          conversation.memberCount = detail.memberCount
        }
        if (detail.groupName) {
          conversation.groupName = detail.groupName
          conversation.displayName = detail.groupName
        }
        if (detail.introduction !== undefined) {
          conversation.introduction = detail.introduction
        }
        if (detail.announcement !== undefined) {
          conversation.announcement = detail.announcement
        }
      }
    } catch (refreshError) {
      console.warn('刷新群详情失败', refreshError)
      // 兜底：手动从当前列表移除对应成员
      if (Array.isArray(conversation.members)) {
        conversation.members = conversation.members.filter(
          (m) => !ids.includes(m.userId ?? m.memberId ?? m.id),
        )
      }
    }

    ElMessage.success('已移除选中成员')
  } catch (error) {
    console.error('移除群成员失败', error)
    ElMessage.error(error?.message || '移除群成员失败，请稍后重试')
  }
}

const handleSendGroupMessageFromDetail = async () => {
  const conversation = selectedConversationEntity.value
  if (!conversation || !conversation.isGroupConversation) return
  const groupId = conversation.relationId ?? conversation.id
  if (!groupId) {
    ElMessage.warning('Ⱥ��IDȱ�ڣ���Դ�')
    return
  }
  try {
    const sessionId = await restoreConversationByGroup(groupId)
    await loadConversations({ force: true })
    const normalizedId = (() => {
      const numeric = Number(sessionId)
      return Number.isNaN(numeric) ? sessionId : numeric
    })()
    await selectConversation(normalizedId)
    activeToolbar.value = 'conversations'
  } catch (error) {
    console.error('[ChatBreeze] Failed to restore group session:', error)
    ElMessage.error(error?.message || '�޷�����Ⱥ��Ự�����Ժ�����')
  }
}

const handleDissolveGroupFromDetail = async () => {
  const conversation = selectedConversationEntity.value
  if (!conversation || !conversation.isGroupConversation) return
  const groupId = conversation.relationId ?? conversation.id
  if (!groupId) {
    ElMessage.warning('Ⱥ��IDȱ�ڣ��޷���ɢ')
    return
  }
  try {
    await dissolveGroup(groupId)
    ElMessage.success('Ⱥ���ѽ�ɢ')
    await loadConversations({ force: true })
    if (activeConversationId.value === conversation.id) {
      activeConversationId.value = conversations.value[0]?.id ?? null
    }
  } catch (error) {
    console.error('[ChatBreeze] Dissolve group failed:', error)
    ElMessage.error(error?.message || '��ɢȺ��ʧ�ܣ����Ժ�����')
  }
}

const handleSelectGroupFromContacts = (group) => {
  if (!group) return
  selectedGroupFromContacts.value = {
    ...group,
    loading: true,
  }
  showGroupDetailModal.value = true
  const groupId = group.id ?? group.groupId
  if (!groupId) {
    selectedGroupFromContacts.value.loading = false
    return
  }
  fetchGroupDetail(groupId)
    .then((detail) => {
      selectedGroupFromContacts.value = {
        ...group,
        ...detail,
        id: groupId,
        memberCount: detail?.onlineCount ?? detail?.memberCount ?? group.memberCount,
        introduction: detail?.introduction ?? group.introduction,
      }
    })
    .catch((error) => {
      console.error('[ChatBreeze] fetch group detail failed:', error)
    })
}

const closeGroupDetailModal = () => {
  showGroupDetailModal.value = false
  selectedGroupFromContacts.value = null
}

const handleSendGroupMessageFromContacts = async () => {
  if (!selectedGroupFromContacts.value) return
  const groupId = selectedGroupFromContacts.value.id ?? selectedGroupFromContacts.value.groupId
  if (!groupId) {
    ElMessage.warning('群聊ID缺失，无法发消息')
    return
  }
  try {
    const sessionId = await restoreConversationByGroup(groupId)
    await loadConversations({ force: true })
    const normalizedId = (() => {
      const numeric = Number(sessionId)
      return Number.isNaN(numeric) ? sessionId : numeric
    })()
    await selectConversation(normalizedId)
    activeToolbar.value = 'conversations'
    closeGroupDetailModal()
  } catch (error) {
    console.error('[ChatBreeze] restore group from contacts failed:', error)
    ElMessage.error(error?.message || '无法恢复群聊，请稍后重试')
  }
}

const handleDissolveGroupFromContacts = async () => {
  if (!selectedGroupFromContacts.value) return
  const groupId = selectedGroupFromContacts.value.id ?? selectedGroupFromContacts.value.groupId
  if (!groupId) {
    ElMessage.warning('群聊ID缺失，无法解散')
    return
  }
  try {
    await dissolveGroup(groupId)
    ElMessage.success('群聊已解散')
    await loadConversations({ force: true })
    closeGroupDetailModal()
  } catch (error) {
    console.error('[ChatBreeze] dissolve group from contacts failed:', error)
    ElMessage.error(error?.message || '解散群聊失败，请稍后重试')
  }
}

const selectFriend = (id) => {
  activeFriendId.value = id
  if (id) {
    showFriendModal.value = true
  }
}

const closeFriendModal = () => {
  showFriendModal.value = false
}


const closeAddFriendModal = () => {
  showAddFriendModal.value = false
}

const closeCreateGroupModal = () => {
  showCreateGroupModal.value = false
}

const isProcessingFriendRequest = ref(false)
const showApproveRemarkModal = ref(false)
const remarkDraft = ref('')
const pendingApproveRequest = ref(null)
const showRejectConfirmModal = ref(false)
const pendingRejectRequest = ref(null)

const pendingApproveName = computed(() =>
  getRequestDisplayName(pendingApproveRequest.value),
)
const pendingRejectName = computed(() =>
  getRequestDisplayName(pendingRejectRequest.value),
)

const handleApproveFriendRequest = (request) => {
  if (!request?.id || isProcessingFriendRequest.value) return
  pendingApproveRequest.value = request
  remarkDraft.value = request.nickname ?? ''
  showApproveRemarkModal.value = true
}

const closeApproveRemarkModal = () => {
  if (isProcessingFriendRequest.value) return
  showApproveRemarkModal.value = false
  pendingApproveRequest.value = null
  remarkDraft.value = ''
}

const updateRemarkDraft = (value) => {
  remarkDraft.value = value
}

const confirmApproveFriendRequest = async () => {
  const request = pendingApproveRequest.value
  if (!request?.id || isProcessingFriendRequest.value) return
  let friendId = request.userId ?? null
  if (friendId === null || friendId === undefined) {
    alert('未找到好友信息，无法同意请求')
    return
  }
  const numericFriendId = Number(friendId)
  if (!Number.isNaN(numericFriendId)) {
    friendId = numericFriendId
  }
  const remark = remarkDraft.value.trim()
  isProcessingFriendRequest.value = true
  try {
    const { data, message } = await agreeFriendRequest({
      friendId,
      remark,
    })
    const target = friendRequests.incoming.find(
      (item) => item.id === request.id,
    )
    if (target) {
      target.requestStatus = 1
    }
    friendRequests.pendingCount = Math.max(
      0,
      friendRequests.pendingCount - 1,
    )
    showApproveRemarkModal.value = false
    pendingApproveRequest.value = null
    remarkDraft.value = ''
    alert(
      (typeof data === 'string' && data) ||
        message ||
        `已同意 ${getRequestDisplayName(request)} 的好友请求。`,
    )
    loadFriendRequests()
  } catch (error) {
    alert(error?.message || '同意请求时出错，请稍后重试')
  } finally {
    isProcessingFriendRequest.value = false
  }
}

const handleRejectFriendRequest = (request) => {
  if (!request?.id || isProcessingFriendRequest.value) return
  pendingRejectRequest.value = request
  showRejectConfirmModal.value = true
}

const closeRejectFriendModal = () => {
  if (isProcessingFriendRequest.value) return
  showRejectConfirmModal.value = false
  pendingRejectRequest.value = null
}

const confirmRejectFriendRequest = async () => {
  const request = pendingRejectRequest.value
  if (!request?.id || isProcessingFriendRequest.value) return
  let friendId = request.userId ?? null
  if (friendId === null || friendId === undefined) {
    alert('未找到好友信息，无法拒绝请求')
    return
  }
  const numericFriendId = Number(friendId)
  if (!Number.isNaN(numericFriendId)) {
    friendId = numericFriendId
  }
  isProcessingFriendRequest.value = true
  try {
    const { data, message } = await rejectFriendRequest(friendId)
    const target = friendRequests.incoming.find(
      (item) => item.id === request.id,
    )
    if (target) {
      target.requestStatus = 2
    }
    friendRequests.pendingCount = Math.max(
      0,
      friendRequests.pendingCount - 1,
    )
    showRejectConfirmModal.value = false
    pendingRejectRequest.value = null
    alert(
      (typeof data === 'string' && data) ||
        message ||
        `已拒绝 ${getRequestDisplayName(request)} 的好友请求。`,
    )
    loadFriendRequests()
  } catch (error) {
    alert(error?.message || '拒绝请求时出错，请稍后重试')
  } finally {
    isProcessingFriendRequest.value = false
  }
}
const handleFriendAdded = () => {
  loadFriendRequests()
  loadFriends()
}

const handleFriendDeleted = async () => {
  showFriendModal.value = false
  activeFriendId.value = null
  await loadFriends()
  loadFriendRequests()
}

const resolveFriendId = (friend) => {
  if (!friend) return null
  return (
    friend.friendId ??
    friend.userId ??
    friend.id ??
    null
  )
}

const handleSendMessageToFriend = async () => {
  if (!selectedFriend.value || startingConversation.value) return
  const friend = selectedFriend.value
  const friendId = resolveFriendId(friend)
  if (!friendId) {
    ElMessage.warning('好友信息无效，无法发起会话')
    return
  }
  startingConversation.value = true
  try {
    const conversationId = await restoreConversationByFriend(friendId)
    await loadConversations({ force: true })
    const normalizedConversationId = (() => {
      const numeric = Number(conversationId)
      return Number.isNaN(numeric) ? conversationId : numeric
    })()
    await selectConversation(normalizedConversationId)
    draft.value = ''
    showFriendModal.value = false
    activeToolbar.value = 'conversations'
  } catch (error) {
    console.error('[ChatBreeze] Failed to start conversation:', error)
    ElMessage.error(error?.message || '发起会话失败，请稍后重试')
  } finally {
    startingConversation.value = false
  }
}

const handleStartGroup = async () => {
  showCreateMenu.value = false
  showProfileCard.value = false
  await selectToolbarAction('conversations')
  await ensureFriendsLoaded()
  if (!contacts.value.length) {
    const message = contactsError.value || '暂无好友可选，请先添加好友'
    ElMessage.warning(message)
    return
  }
  showCreateGroupModal.value = true
}

const handleCreateGroupConfirm = async ({ name, memberIds, members }) => {
  if (isCreatingGroup.value) return
  const normalizeIdValue = (value) => {
    if (value === null || value === undefined) return null
    const numeric = Number(value)
    return Number.isNaN(numeric) ? value : numeric
  }
  const memberIdSources = Array.isArray(members)
    ? members.map((item) => item?.userId ?? item?.id)
    : Array.isArray(memberIds)
    ? memberIds
    : []
  const normalizedIds = memberIdSources
    .map((value) => normalizeIdValue(value))
    .filter((value) => value !== null)
  const uniqueMemberIds = []
  const seen = new Set()
  const addUnique = (id) => {
    if (id === null || id === undefined) return
    const key = String(id)
    if (seen.has(key)) return
    seen.add(key)
    uniqueMemberIds.push(id)
  }
  normalizedIds.forEach((id) => addUnique(id))
  if (uniqueMemberIds.length === 0) {
    ElMessage.warning('请选择至少一位好友创建群聊')
    return
  }
  isCreatingGroup.value = true
  try {
    await createGroup({ groupName: name, memberIds: uniqueMemberIds })
    showCreateGroupModal.value = false
    ElMessage.success(`已创建群聊 "${name}"`)
  } catch (error) {
    const message =
      error?.response?.data?.message || error?.message || '创建群聊失败，请稍后重试'
    ElMessage.error(message)
  } finally {
    isCreatingGroup.value = false
  }
}


const handleAddFriend = () => {
  showCreateMenu.value = false
  showProfileCard.value = false
  showFriendModal.value = false
  showAddFriendModal.value = true
}

const onResizeMouseDown = (event) => {
  isResizing.value = true
  startX.value = event.clientX
  startWidth.value = sidebarWidth.value
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}

const onMouseMove = (event) => {
  if (!isResizing.value) return
  const delta = event.clientX - startX.value
  const newWidth = Math.min(480, Math.max(220, startWidth.value + delta))
  sidebarWidth.value = newWidth
}

const onMouseUp = () => {
  if (!isResizing.value) return
  isResizing.value = false
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
}

onMounted(async () => {
  window.addEventListener('click', handleGlobalClick)
  // 先获取用户信息
  await getUserInfo()
  console.log('[ChatBreeze] User info loaded, user ID:', currentUser.id)
  // 加载会话列表
  await loadConversations()
  // 初始化 WebSocket 连接
  if (currentUser.id) {
    console.log('[ChatBreeze] Attempting to connect WebSocket...')
    try {
      await connect()
    } catch (error) {
      console.error('[ChatBreeze] Failed to connect WebSocket:', error)
    }
  } else {
    console.warn('[ChatBreeze] Cannot connect WebSocket: user ID is missing')
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
  window.removeEventListener('click', handleGlobalClick)
  clearResetPasswordState()
  // 断开 WebSocket 连接
  disconnect()
})

let currentUser = reactive({
  id: null,
  email: '',
  nickname: '',
  avatarUrl: '',
  avatarFullUrl: '',
  gender: '',
  genderDesc: '',
  signature: '',
})

const hasAvatar = computed(() => !!currentUser.avatarFullUrl)

const currentUserInitial = computed(() => {
  const source =
    currentUser.nickname ||
    currentUser.email ||
    ''
  const initial = String(source).trim().charAt(0)
  return initial ? initial.toUpperCase() : '?'
})

const normalizeGender = (value) => {
  if (value === undefined || value === null) return ''
  const text = String(value).trim()
  if (text === '1') return 'male'
  if (text === '2') return 'female'
  const lower = text.toLowerCase()
  if (lower === 'male' || lower === 'm') return 'male'
  if (lower === 'female' || lower === 'f') return 'female'
  if (text === '男') return 'male'
  if (text === '女') return 'female'
  return ''
}

const getUserInfo = async () => {
  const data = await fetchUserInfo()
  if (data){
    currentUser.id = data.id ?? null
    currentUser.email = data.email ?? ''
    currentUser.nickname = data.nickname ?? ''
    const avatarUrl = data.avatarUrl ?? data.avatarFullUrl ?? ''
    currentUser.avatarUrl = avatarUrl
    currentUser.avatarFullUrl = data.avatarFullUrl ?? avatarUrl
    currentUser.signature = data.signature ?? ''
    currentUser.genderDesc = data.genderDesc ?? ''
    currentUser.gender = normalizeGender(data.gender ?? data.genderDesc)
  }
  console.log(currentUser)
}

getUserInfo()
loadFriendRequests()
loadFriends()
const closeProfileModal = () => {
  showProfileModal.value = false
}

const closeResetPasswordModal = () => {
  showResetPasswordModal.value = false
  clearResetPasswordState()
}

const handleProfileUpdate = async (payload) => {
  if (updatingProfile.value) return
  const genderValue = (() => {
    if (payload.gender === 'male') return 1
    if (payload.gender === 'female') return 2
    return 0
  })()
  const body = {
    nickname: payload.displayName ?? '',
    signature: payload.signature ?? '',
    gender: genderValue,
  }
  try {
    updatingProfile.value = true
    await updateProfile(body)
    ElMessage.success('个人资料已保存')
    await getUserInfo()
    closeProfileModal()
  } catch (error) {
    console.error(error)
    ElMessage.error(error?.message || '保存个人资料失败，请稍后重试')
  } finally {
    updatingProfile.value = false
  }
}

const handleRequestResetCode = async (email) => {
  if (sendingResetCode.value) return
  const targetEmail = email?.trim() || currentUser.email || ''
  if (!targetEmail) {
    ElMessage.warning('当前账号缺少邮箱信息，无法发送验证码')
    return
  }
  try {
    sendingResetCode.value = true
    await requestPasswordResetCode(targetEmail)
    ElMessage.success('验证码已发送，请查收邮箱')
    startResetCodeCountdown()
  } catch (error) {
    console.error(error)
    ElMessage.error(error?.message || '验证码发送失败，请稍后重试')
  } finally {
    sendingResetCode.value = false
  }
}

const handleResetPassword = async ({ email, code, password, passwordConfirm }) => {
  if (resettingPassword.value) return
  const targetEmail = email?.trim() || currentUser.email || ''
  if (!targetEmail) {
    ElMessage.error('当前账号缺少邮箱信息，无法重置密码')
    return
  }
  try {
    resettingPassword.value = true
    const { data } = await recoverPassword({
      email: targetEmail,
      code,
      password,
      passwordConfirm,
    })
    ElMessage.success(typeof data === 'string' && data ? data : '密码已重置，请使用新密码登录')
    closeResetPasswordModal()
  } catch (error) {
    console.error(error)
    ElMessage.error(error?.message || '重置密码失败，请稍后重试')
  } finally {
    resettingPassword.value = false
  }
}

const handleAvatarChange = async (file) => {
  if (!file || avatarUploading.value) return
  const formData = new FormData()
  formData.append('file', file)
  try {
    avatarUploading.value = true
    const { data } = await uploadUserAvatar(formData)
    const nextUrl =
      typeof data === 'string'
        ? data
        : data?.url ?? data?.avatarUrl ?? data?.avatarFullUrl ?? ''
    if (nextUrl) {
      currentUser.avatarUrl = nextUrl
      currentUser.avatarFullUrl = nextUrl
    }
    ElMessage.success('头像上传成功')
     await getUserInfo()
  } catch (error) {
    console.error(error)
    ElMessage.error(error?.message || '上传头像失败，请稍后重试')
  } finally {
    avatarUploading.value = false
  }
}


</script>

<style scoped>
.chat-breeze {
  display: flex;
  min-height: 100vh;
  background: linear-gradient(135deg, #f1f7f3 0%, #f8fbf7 100%);
  color: #1f3526;
  font-family: 'Inter', 'Noto Sans SC', 'Microsoft YaHei', sans-serif;
}

.sidebar-toolbar {
  width: 72px;
  padding: 32px 0 32px;
  background: rgba(255, 255, 255, 0.92);
  border-right: 1px solid #e6efe5;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.toolbar-avatar {
  position: relative;
  display: flex;
  justify-content: center;
}

.toolbar-avatar-button {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: none;
  padding: 0;
  overflow: hidden;
  background: linear-gradient(140deg, rgba(227, 241, 232, 0.98), rgba(202, 226, 211, 0.94));
  box-shadow: 0 8px 18px rgba(32, 78, 55, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.toolbar-avatar-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(32, 78, 55, 0.22);
}

.toolbar-avatar-button:focus-visible {
  outline: 3px solid rgba(71, 182, 124, 0.45);
  outline-offset: 2px;
}

.toolbar-avatar-button img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.toolbar-avatar-initial {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 18px;
  color: #2f513b;
  background: rgba(50, 195, 116, 0.22);
}

.conversation-context-menu {
  position: fixed;
  z-index: 1200;
  list-style: none;
  margin: 0;
  padding: 6px 0;
  background: #ffffff;
  border: 1px solid #dbe7dc;
  border-radius: 10px;
  box-shadow: 0 18px 32px rgba(32, 53, 39, 0.18);
  min-width: 168px;
}

.conversation-context-menu li {
  margin: 0;
}

.conversation-context-menu button {
  width: 100%;
  padding: 10px 18px;
  background: transparent;
  border: none;
  text-align: left;
  font-size: 14px;
  color: #274531;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.conversation-context-menu button:hover {
  background: rgba(73, 160, 112, 0.12);
  color: #1f3526;
}

.conversation-context-menu button.danger {
  color: #c14141;
}

.conversation-context-menu button.danger:hover {
  background: rgba(231, 92, 92, 0.12);
  color: #a92f2f;
}


.toolbar-actions {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
}

.toolbar-actions li button {
  width: 44px;
  height: 44px;
  border-radius: 16px;
  border: none;
  background: linear-gradient(145deg, #ecf5ef, #ffffff);
  box-shadow: 0 10px 20px rgba(54, 102, 74, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.toolbar-actions li button.active {
  transform: translateY(-3px);
  box-shadow: 0 18px 28px rgba(54, 102, 74, 0.22);
  background: linear-gradient(145deg, #d5f1df, #ffffff);
}

.toolbar-actions li button:hover {
  transform: translateY(-3px);
  box-shadow: 0 16px 26px rgba(54, 102, 74, 0.18);
}

.toolbar-actions li button:focus-visible {
  outline: 3px solid rgba(52, 192, 115, 0.38);
  outline-offset: 3px;
}

.sidebar {
  position: relative;
  min-width: 260px;
  max-width: 480px;
  padding: 32px 28px;
  background: #ffffff;
  border-right: 1px solid #e6efe5;
  box-shadow: 14px 0 34px rgba(82, 128, 102, 0.08);
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  position: relative; 
  min-height: 40px; 
}


.sidebar-header h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 0.02em;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: auto;
  white-space: nowrap;
}


.tools {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-left: auto; 
  z-index: 1; 
}

.tool-button {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(145deg, #ecf5ef, #ffffff);
  color: #1c7c4f;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 8px 16px rgba(33, 132, 82, 0.16);
}

.tool-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(33, 132, 82, 0.15);
}

.tool-button:focus-visible {
  outline: 3px solid rgba(52, 192, 115, 0.32);
  outline-offset: 2px;
}

.tool-create {
  position: relative;
}

.tool-menu-fade-enter-active,
.tool-menu-fade-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.tool-menu-fade-enter-from,
.tool-menu-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.tool-menu {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  width: 168px;
  padding: 14px 0;
  margin: 0;
  list-style: none;
  border-radius: 18px;
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.98), rgba(219, 239, 227, 0.96));
  box-shadow: 0 20px 36px rgba(35, 79, 55, 0.18);
  border: 1px solid rgba(198, 221, 207, 0.6);
  display: flex;
  flex-direction: column;
  gap: 6px;
  z-index: 20;
  backdrop-filter: blur(6px);
}

.tool-menu li {
  width: 100%;
}

.tool-menu button {
  width: 100%;
  border: none;
  background: transparent;
  color: #1f3526;
  font-size: 14px;
  padding: 10px 18px;
  text-align: left;
  cursor: pointer;
  transition: background 0.18s ease, transform 0.18s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.tool-menu button:hover {
  background: rgba(50, 195, 116, 0.12);
  color: #135539;
  transform: translateX(2px);
}

.tool-menu button:hover .tool-menu-icon {
  background: linear-gradient(135deg, #32c374, #1da368);
  color: #ffffff;
  box-shadow: 0 8px 16px rgba(45, 176, 103, 0.24);
}

.tool-menu-icon {
  width: 28px;
  height: 28px;
  border-radius: 12px;
  background: rgba(50, 195, 116, 0.12);
  color: #1d7a4b;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  box-shadow: inset 0 0 0 1px rgba(50, 195, 116, 0.24);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.resize-handle {
  position: absolute;
  top: 0;
  right: -6px;
  width: 12px;
  height: 100%;
  cursor: col-resize;
  background: transparent;
}

.resize-handle::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 2px;
  height: 64px;
  background: rgba(97, 126, 108, 0.16);
  border-radius: 999px;
}

.resize-handle.active::after {
  background: rgba(60, 196, 125, 0.5);
}
  .sidebar-toolbar {
    width: 64px;
    padding: 24px 0;
  }



@media (max-width: 768px) {
  .chat-breeze {
    flex-direction: column;
  }

  .sidebar-toolbar {
    display: none;
  }

  .sidebar {
    width: 100% !important;
    min-width: 0;
    max-width: none;
    border-right: none;
    border-bottom: 1px solid #edf0f2;
    box-shadow: none;
  }

  .resize-handle {
    display: none;
  }}
</style>

