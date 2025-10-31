<template>
  <div class="chat-breeze">
    <aside class="sidebar-toolbar">
      <div class="toolbar-avatar">
        <img :src="currentUser.avatarFullUrl" :alt="currentUser.nickname" />
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
      @update:draft="(v) => (draft = v)"
      @send="() => {}"
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
import { apiClient } from '@/services/apiClient'
import { fetchNormalizedFriends } from '@/services/friendService'
import { requestPasswordResetCode, recoverPassword } from '@/services/passwordRecovery'
import SettingsPanel from '@/components/settings/SettingsPanel.vue'
import ConversationArea from '@/components/chat/ConversationArea.vue'
import UserProfilePanel from '@/components/settings/UserProfilePanel.vue'
import ResetPasswordPanel from '@/components/settings/ResetPasswordPanel.vue'
import BrandShowcase from '@/components/common/BrandShowcase.vue'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'
import 'element-plus/es/components/message/style/css'

const router = useRouter()
const authStore = useAuthStore()

const conversations = [
  {
    id: 1,
    nameEn: 'Sarah Johnson',
    nameCn: '莎拉·约翰逊',
    period: '今天',
    clock: '2:30',
    snippet: '嗨，今天那件事你那边怎么处理？',
    unread: 3,
    status: 'online',
    avatar: 'https://randomuser.me/api/portraits/women/9.jpg',
  },
  {
    id: 2,
    nameEn: 'Design Team',
    nameCn: '设计团队',
    period: '今天',
    clock: '1:45',
    snippet: '[图片] 新的 banner 待确认',
    unread: 12,
    status: 'online',
    avatar: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=120&q=80',
  },
  {
    id: 3,
    nameEn: 'Mike Chen',
    nameCn: '麦克·陈',
    period: '今天',
    clock: '12:20',
    snippet: '[语音信息] 刚刚那段录了',
    unread: 0,
    status: 'away',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
  },
  {
    id: 4,
    nameEn: 'Project Alpha',
    nameCn: '项目A',
    period: '今天',
    clock: '11:30',
    snippet: '同步会下午 3 点开始',
    unread: 5,
    status: 'online',
    avatar: 'https://images.unsplash.com/photo-1522196772883-393d879eb14d?auto=format&fit=crop&w=120&q=80',
  },
  {
    id: 5,
    nameEn: 'Emma Wilson',
    nameCn: '艾玛·威尔逊',
    period: '今天',
    clock: '10:15',
    snippet: '[文件] PRD 已更新',
    unread: 0,
    status: 'offline',
    avatar: 'https://randomuser.me/api/portraits/women/17.jpg',
  },
  {
    id: 6,
    nameEn: 'Development Team',
    nameCn: '开发团队',
    period: '昨天',
    clock: '20:05',
    snippet: '缺陷修复已完成',
    unread: 0,
    status: 'online',
    avatar: 'https://images.unsplash.com/photo-1454165205744-3b78555e5572?auto=format&fit=crop&w=120&q=80',
  },
]

const highlights = [
  {
    id: 1,
    name: 'Sarah 莎拉',
    avatar: 'https://randomuser.me/api/portraits/women/9.jpg',
  },
  {
    id: 3,
    name: 'Mike 麦克',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
  },
  {
    id: 5,
    name: 'Emma 艾玛',
    avatar: 'https://randomuser.me/api/portraits/women/17.jpg',
  },
]

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
    const { data } = await apiClient.get('/friend/friendRequestList')
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
  console.log('选择了条目：', id)
}

const handleLogout = () => {
  activeItem.value = 'profile'
  showProfileModal.value = false
  showResetPasswordModal.value = false
  clearResetPasswordState()
  authStore.clearToken()
  ElMessage.success('已退出登录')
  router.push({ name: 'Login' })
}


const threads = {
  "1": [
    {
      id: 1,
      role: "contact",
      author: "Sarah Johnson",
      text: "嗨，今天的进度怎么样？",
      time: "14:25",
    },
    {
      id: 2,
      role: "self",
      author: "我",
      text: "状态我这边在更新，信息片段稍后发给你。",
      time: "14:27",
    },
  ],
  "2": [
    {
      id: 1,
      role: "contact",
      author: "设计团队",
      text: "新的配色方案已经发到群邮件。",
      time: "13:40",
    },
    {
      id: 2,
      role: "self",
      author: "我",
      text: "收到，我会在今天前审阅，谢谢。",
      time: "13:42",
    },
  ],
  "3": [
    {
      id: 1,
      role: "contact",
      author: "Mike Chen",
      text: "数据集已经上传到云端。",
      time: "12:20",
    },
    {
      id: 2,
      role: "self",
      author: "我",
      text: "好的，稍后我去查看。",
      time: "12:22",
    },
  ],
  "4": [
    {
      id: 1,
      role: "contact",
      author: "项目Alpha",
      text: "今天下午有一个同步会议。",
      time: "11:30",
    },
    {
      id: 2,
      role: "self",
      author: "我",
      text: "明白，我会提前十分钟准备。",
      time: "11:33",
    },
  ],
  "5": [
    {
      id: 1,
      role: "contact",
      author: "Emma Wilson",
      text: "麻烦看看 PRD 的最新版本。",
      time: "10:15",
    },
    {
      id: 2,
      role: "self",
      author: "我",
      text: "谢谢，我会尽快反馈意见。",
      time: "10:18",
    },
  ],
  "6": [
    {
      id: 1,
      role: "contact",
      author: "开发团队",
      text: "Bug 修复已经上线，请关注回归。",
      time: "昨天 20:05",
    },
    {
      id: 2,
      role: "self",
      author: "我",
      text: "收到，如有异常我会第一时间报告。",
      time: "昨天 20:10",
    },
  ],
};


const activeConversationId = ref(null)
const activeFriendId = ref(null)
const activeToolbar = ref('conversations')
const sidebarWidth = ref(320)
const isResizing = ref(false)
const startX = ref(0)
const startWidth = ref(sidebarWidth.value)
const searchTerm = ref('')
const draft = ref('')
const showFriendModal = ref(false)
const showCreateMenu = ref(false)
const toolsRef = ref(null)
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
  if (!searchTerm.value.trim()) return conversations
  const keyword = searchTerm.value.trim().toLowerCase()
  return conversations.filter((item) => {
    return (
      item.nameEn.toLowerCase().includes(keyword) ||
      item.nameCn.includes(searchTerm.value.trim()) ||
      item.snippet.toLowerCase().includes(keyword)
    )
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
  showCreateMenu.value = !showCreateMenu.value
}

const handleGlobalClick = (event) => {
  if (!showCreateMenu.value) return
  if (toolsRef.value && toolsRef.value.contains(event.target)) return
  showCreateMenu.value = false
}

const selectConversation = (id) => {
  activeConversationId.value = id
  activeToolbar.value = 'conversations'
  showCreateMenu.value = false
  showFriendModal.value = false
}

const selectedConversation = computed(() => {
  const convo = conversations.find((item) => item.id === activeConversationId.value)
  if (!convo) return null
  return {
    ...convo,
    displayName: `${convo.nameEn}`,
  }
})

const selectedThread = computed(() => {
  if (!activeConversationId.value) return []
  return threads[activeConversationId.value] || []
})
const selectToolbarAction = async (id) => {
  activeToolbar.value = id
  showCreateMenu.value = false
  showAddFriendModal.value = false
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
    const { data, message } = await apiClient.post(
      '/friend/agreeFriendRequest',
      {
        friendId,
        remark,
      },
    )
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
    const { data, message } = await apiClient.post(
      '/friend/disagreeFriendRequest',
      { param: friendId },
    )
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

const handleSendMessageToFriend = () => {
  if (!selectedFriend.value) return
  const mention = selectedFriend.value.nickname || selectedFriend.value.nameEn
  draft.value = `@${mention} `
  showFriendModal.value = false
  activeToolbar.value = 'conversations'
}

const handleStartGroup = async () => {
  showCreateMenu.value = false
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
    await apiClient.post('/group/addGroup', {
      groupName: name,
      memberIds: uniqueMemberIds,
    })
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

onMounted(() => {
  window.addEventListener('click', handleGlobalClick)
})

onBeforeUnmount(() => {
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
  window.removeEventListener('click', handleGlobalClick)
  clearResetPasswordState()
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
  const { data } = await apiClient.get('/user/getUserInfo')
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
    await apiClient.post('/user/updateUserInfo', body)
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
    const { data } = await apiClient.postForm('/user/uploadAvatar', formData)
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
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0 8px 18px rgba(32, 78, 55, 0.18);
}

.toolbar-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
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










