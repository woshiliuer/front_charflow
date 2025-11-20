<template>
  <div class="contacts-directory">
      <div class="search">
        <input
          type="text"
          :placeholder="searchPlaceholder"
          v-model="searchTerm"
        />
        <button title="搜索">
          <span aria-hidden="true">🔍</span>
          <span class="sr-only">Search</span>
        </button>
      </div>


    <section class="directory-section">
      <button
        type="button"
        class="folder-trigger"
        @click="toggleSection('requests')"
      >
        <span class="folder-icon" aria-hidden="true">📂</span>
        <span class="folder-title">好友申请</span>
        <span class="folder-meta">
          {{
            totalRequestCount
              ? `${totalRequestCount} 条待处理`
              : '暂无申请'
          }}
        </span>
        <span class="folder-arrow" aria-hidden="true">
          {{ expandedSections.requests ? '▾' : '▸' }}
        </span>
      </button>
      <transition name="directory-collapse">
        <div v-if="expandedSections.requests" class="folder-content">
          <div
            v-if="!incomingRequests.length && !outgoingRequests.length"
            class="empty-hint"
          >
            <span aria-hidden="true">🌿</span>
            <p>当前没有新的好友申请，去认识更多伙伴吧。</p>
          </div>
          <template v-else>
            <div v-if="incomingRequests.length" class="request-group">
              <h4>收到的申请</h4>
              <ul>
                <li v-for="item in incomingRequests" :key="item.id">
                  <div class="request-row">
                    <div class="request-avatar">
                      <img
                        v-if="item.avatar"
                        :src="item.avatar"
                        :alt="getDisplayName(item)"
                      />
                      <span v-else>
                        {{ getInitial(getDisplayName(item)) }}
                      </span>
                    </div>
                    <div class="request-info">
                      <div class="request-header">
                        <strong>{{ getDisplayName(item) }}</strong>
                        <span class="request-time">{{ item.timeHint || '刚刚' }}</span>
                      </div>
                      <p>
                        <span v-if="item.applyMessage">“{{ item.applyMessage }}”</span>
                        <span v-else class="request-placeholder">对方未填写附言</span>
                      </p>
                      <span
                        v-if="!isPending(item)"
                        class="request-status"
                        :class="getStatusClass(item)"
                      >
                        {{ getStatusLabel(item) }}
                      </span>
                    </div>
                    <div
                      v-if="isPending(item)"
                      class="request-actions"
                    >
                      <button
                        type="button"
                        class="request-action agree"
                        @click.stop="approveRequest(item)"
                      >
                        同意
                      </button>
                      <button
                        type="button"
                        class="request-action reject"
                        @click.stop="rejectRequest(item)"
                      >
                        拒绝
                      </button>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
            <div v-if="outgoingRequests.length" class="request-group">
              <h4>我发出的申请</h4>
              <ul>
                <li v-for="item in outgoingRequests" :key="item.id">
                  <div class="request-row">
                    <div class="request-avatar">
                      <img
                        v-if="item.avatar"
                        :src="item.avatar"
                        :alt="getDisplayName(item)"
                      />
                      <span v-else>
                        {{ getInitial(getDisplayName(item)) }}
                      </span>
                    </div>
                    <div class="request-info">
                      <div class="request-header">
                        <strong>{{ getDisplayName(item) }}</strong>
                        <span class="request-time">{{ item.timeHint || '稍早前' }}</span>
                      </div>
                      <p>
                        <span
                          v-if="isPending(item)"
                          class="request-badge"
                        >
                          等待对方通过
                        </span>
                        <span v-if="item.applyMessage">“{{ item.applyMessage }}”</span>
                      </p>
                      <span
                        v-if="!isPending(item)"
                        class="request-status"
                        :class="getStatusClass(item)"
                      >
                        {{ getStatusLabel(item) }}
                      </span>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </template>
        </div>
      </transition>
    </section>

    <section class="directory-section">
      <button
        type="button"
        class="folder-trigger"
        @click="toggleSection('friends')"
      >
        <span class="folder-icon" aria-hidden="true">🗂️</span>
        <span class="folder-title">我的好友</span>
        <span class="folder-meta">
          {{ friendCount ? `${friendCount} 位联系人` : '暂未添加好友' }}
        </span>
        <span class="folder-arrow" aria-hidden="true">
          {{ expandedSections.friends ? '▾' : '▸' }}
        </span>
      </button>
      <transition name="directory-collapse">
        <div v-if="expandedSections.friends" class="folder-content">
          <div v-if="isLoadingFriends" class="empty-hint">
            <span aria-hidden="true">⏳</span>
            <p>好友列表加载中，请稍候...</p>
          </div>
          <div v-else-if="friendsError" class="empty-hint">
            <span aria-hidden="true">⚠️</span>
            <p>{{ friendsError }}</p>
            <button
              type="button"
              class="hint-action"
              :disabled="isLoadingFriends"
              @click="retryLoadFriends"
            >
              重新加载
            </button>
          </div>
          <div v-else-if="!friends.length" class="empty-hint">
            <span aria-hidden="true">🤝</span>
            <p>还没有好友，快去添加吧！</p>
          </div>
          <ChatFriendsList
            v-else
            :friends="friends"
            :active-friend-id="activeFriendId"
            @select="emit('select-friend', $event)"
          />
        </div>
      </transition>
    </section>

    <section class="directory-section">
      <button
        type="button"
        class="folder-trigger"
        @click="toggleSection('groups')"
      >
        <span class="folder-icon" aria-hidden="true">📁</span>
        <span class="folder-title">群聊</span>
        <span class="folder-meta muted">
          {{ groupCount ? `${groupCount} 个群聊` : '暂未加入群聊' }}
        </span>
        <span class="folder-arrow" aria-hidden="true">
          {{ expandedSections.groups ? '▾' : '▸' }}
        </span>
      </button>
      <transition name="directory-collapse">
        <div v-if="expandedSections.groups" class="folder-content">
          <div v-if="isLoadingGroups" class="empty-hint">
            <span aria-hidden="true">⏳</span>
            <p>群聊列表加载中，请稍候...</p>
          </div>
          <div v-else-if="groupsError" class="empty-hint">
            <span aria-hidden="true">⚠️</span>
            <p>{{ groupsError }}</p>
            <button
              type="button"
              class="hint-action"
              :disabled="isLoadingGroups"
              @click="retryLoadGroups"
            >
              重新加载
            </button>
          </div>
          <div v-else-if="!groups.length" class="empty-hint">
            <span aria-hidden="true">🌱</span>
            <p>暂未加入任何群聊，快去创建或加入一个吧！</p>
          </div>
          <ul v-else class="group-list">
            <li
              v-for="group in groups"
              :key="group.id"
              class="group-item"
              role="button"
              tabindex="0"
              @click="emit('select-group', group)"
              @keydown.enter.prevent="emit('select-group', group)"
              @keydown.space.prevent="emit('select-group', group)"
            >
              <div class="group-avatar">
                <img
                  v-if="group.avatar"
                  :src="group.avatar"
                  :alt="group.name"
                />
                <span v-else>{{ getGroupInitial(group.name) }}</span>
              </div>
              <div class="group-info">
                <strong>{{ group.name }}</strong>
                <span v-if="getGroupRoleLabel(group.role)" class="group-role">
                  {{ getGroupRoleLabel(group.role) }}
                </span>
              </div>
            </li>
          </ul>
        </div>
      </transition>
    </section>
  </div>
</template>

<script setup>
import { computed, reactive, ref, onMounted } from 'vue'
import ChatFriendsList from './ChatFriendsList.vue'
import { fetchNormalizedFriends } from '@/services/friendService'
import { fetchNormalizedGroups } from '@/services/groupService'

const props = defineProps({
  friendRequests: {
    type: Object,
    default: () => ({
      incoming: [],
      outgoing: [],
    }),
  },
  friends: {
    type: Array,
    default: () => [],
  },
  activeFriendId: {
    type: [String, Number],
    default: null,
  },
  pendingCount: {
    type: Number,
    default: null,
  },
})

const emit = defineEmits(['select-friend', 'approve-request', 'reject-request', 'select-group'])

const expandedSections = reactive({
  requests: false,
  friends: false,
  groups: false,
})

const loadedFriends = ref(null)
const isLoadingFriends = ref(false)
const friendsError = ref('')
const groups = ref([])
const isLoadingGroups = ref(false)
const groupsError = ref('')

const friendsFromProps = computed(() =>
  Array.isArray(props.friends) ? props.friends : [],
)

const friends = computed(() => {
  if (loadedFriends.value !== null) {
    return loadedFriends.value
  }
  return friendsFromProps.value
})

const friendCount = computed(() => friends.value.length)
const groupCount = computed(() => groups.value.length)

const incomingRequests = computed(
  () => props.friendRequests?.incoming ?? [],
)
const outgoingRequests = computed(
  () => props.friendRequests?.outgoing ?? [],
)
const totalRequestCount = computed(
  () => {
    if (
      typeof props.pendingCount === 'number' &&
      props.pendingCount >= 0
    ) {
      return props.pendingCount
    }
    return incomingRequests.value.filter(isPending).length
  },
)

const loadFriends = async ({ force = false } = {}) => {
  if (isLoadingFriends.value) return
  if (!force && loadedFriends.value !== null) return
  friendsError.value = ''
  isLoadingFriends.value = true
  try {
    loadedFriends.value = await fetchNormalizedFriends()
  } catch (error) {
    friendsError.value = error?.message || '好友列表获取失败，请稍后重试'
    if (force && loadedFriends.value === null) {
      loadedFriends.value = null
    }
  } finally {
    isLoadingFriends.value = false
  }
}

const retryLoadFriends = () => {
  loadFriends({ force: true })
}

const loadGroups = async ({ force = false } = {}) => {
  if (isLoadingGroups.value) return
  if (!force && groups.value.length) return
  groupsError.value = ''
  isLoadingGroups.value = true
  try {
    groups.value = await fetchNormalizedGroups()
  } catch (error) {
    groupsError.value = error?.message || '群聊列表获取失败，请稍后重试'
    if (force && !groups.value.length) {
      groups.value = []
    }
  } finally {
    isLoadingGroups.value = false
  }
}

const retryLoadGroups = () => {
  loadGroups({ force: true })
}

onMounted(() => {
  loadFriends()
  loadGroups()
})

const toggleSection = (section) => {
  expandedSections[section] = !expandedSections[section]
  if (section === 'groups' && expandedSections.groups && !groups.value.length && !isLoadingGroups.value) {
    loadGroups()
  }
}

const approveRequest = (request) => {
  emit('approve-request', request)
}

const rejectRequest = (request) => {
  emit('reject-request', request)
}

const getInitial = (text = '') => {
  const trimmed = text.trim()
  if (!trimmed) return '友'
  return trimmed.charAt(0).toUpperCase()
}

const getDisplayName = (item) => {
  if (!item) return '好友'
  if (item.nickname) return item.nickname
  if (item.userId !== undefined && item.userId !== null) {
    return `用户 #${item.userId}`
  }
  return '好友'
}

const STATUS_LABELS = {
  0: '待处理',
  1: '已同意',
  2: '已拒绝',
}

const getRequestStatus = (item) => {
  const value = Number(item?.requestStatus)
  return Number.isFinite(value) ? value : 0
}

const getStatusLabel = (item) => {
  const status = getRequestStatus(item)
  return STATUS_LABELS[status] ?? '待处理'
}

const getStatusClass = (item) => {
  const status = getRequestStatus(item)
  if (status === 1) return 'accepted'
  if (status === 2) return 'rejected'
  return 'pending'
}

const isPending = (item) => getRequestStatus(item) === 0

const GROUP_ROLE_LABELS = {
  1: '成员',
  2: '管理员',
  3: '群主',
}

const getGroupRoleLabel = (role) => {
  const value = Number(role)
  if (Number.isNaN(value)) return ''
  return GROUP_ROLE_LABELS[value] ?? ''
}

const getGroupInitial = (text = '') => {
  const trimmed = text.trim()
  if (!trimmed) return '群'
  return trimmed.charAt(0).toUpperCase()
}

</script>

<style scoped>
.contacts-directory {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.directory-section {
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(237, 245, 240, 0.94));
  box-shadow: 0 10px 28px rgba(31, 53, 38, 0.08);
  overflow: hidden;
}

.folder-trigger {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 18px;
  border: none;
  background: linear-gradient(135deg, rgba(226, 242, 233, 0.85), rgba(207, 233, 220, 0.95));
  cursor: pointer;
  color: #18412e;
  font-weight: 600;
  transition: background 0.2s ease, transform 0.2s ease;
}

.folder-trigger:hover {
  background: linear-gradient(135deg, rgba(207, 233, 220, 0.95), rgba(190, 224, 208, 0.97));
  transform: translateY(-1px);
}

.folder-icon {
  font-size: 18px;
}

.folder-title {
  flex: 1;
  text-align: left;
}

.folder-meta {
  font-size: 13px;
  color: #2e5a43;
}

.folder-meta.muted {
  color: #6c8f7b;
}

.folder-arrow {
  font-size: 12px;
  opacity: 0.8;
}

.folder-content {
  padding: 14px 18px 18px;
  display: grid;
  gap: 16px;
  background: rgba(255, 255, 255, 0.92);
}

.request-group {
  display: grid;
  gap: 12px;
}

.request-group h4 {
  margin: 0;
  font-size: 14px;
  color: #1e4a35;
  font-weight: 600;
}

.request-group ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 10px;
}

.request-row {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  background: rgba(233, 245, 238, 0.7);
  border-radius: 14px;
  padding: 12px 14px;
}

.request-row:hover {
  background: rgba(226, 240, 233, 0.85);
}

.request-avatar {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  overflow: hidden;
  background: rgba(210, 236, 221, 0.8);
  display: grid;
  place-items: center;
  font-size: 16px;
  color: #1c5038;
  font-weight: 600;
}

.request-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.request-info {
  flex: 1;
  display: grid;
  gap: 8px;
  text-align: left;
  color: #244836;
  align-content: start;
  position: relative;
  min-height: 60px;
}

.request-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
}

.request-info strong {
  font-size: 14px;
  font-weight: 600;
}

.request-time {
  font-size: 12px;
  color: #6c8f7b;
}

.request-info p {
  margin: 0;
  font-size: 13px;
  color: #35654d;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.group-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 12px;
}

.group-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 14px;
  border-radius: 16px;
  background: rgba(233, 245, 238, 0.7);
  transition: transform 0.16s ease, background 0.16s ease;
}

.group-item:hover {
  transform: translateY(-2px);
  background: rgba(226, 240, 233, 0.85);
}

.group-avatar {
  width: 44px;
  height: 44px;
  border-radius: 16px;
  overflow: hidden;
  background: rgba(210, 236, 221, 0.8);
  display: grid;
  place-items: center;
  font-size: 18px;
  font-weight: 600;
  color: #1c5038;
}

.group-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.group-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: #244836;
}

.group-info strong {
  font-size: 15px;
  font-weight: 600;
}

.group-role {
  font-size: 12px;
  color: #3c7753;
  background: rgba(201, 231, 212, 0.8);
  border-radius: 999px;
  padding: 2px 8px;
  align-self: flex-start;
}

.request-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(49, 195, 116, 0.1);
  color: #22835a;
  font-size: 12px;
}

.request-badge.muted {
  background: rgba(103, 132, 118, 0.1);
  color: #5c7b6a;
}

.request-placeholder {
  color: #6c8f7b;
  font-style: italic;
}

.request-info small {
  font-size: 12px;
  color: #6c8f7b;
}

.request-status {
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(103, 132, 118, 0.14);
  color: #476a56;
  font-weight: 600;
  font-size: 12px;
  position: absolute;
  right: 0;
  bottom: 0;
}

.request-status.pending {
  background: rgba(103, 132, 118, 0.14);
  color: #476a56;
}

.request-status.accepted {
  background: rgba(49, 195, 116, 0.16);
  color: #1d7d53;
}

.request-status.rejected {
  background: rgba(225, 92, 92, 0.18);
  color: #b44545;
}

.request-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-left: auto;
}

.request-action {
  border: none;
  border-radius: 999px;
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
}

.request-action.agree {
  background: linear-gradient(135deg, #32c374, #1da368);
  color: #ffffff;
  box-shadow: 0 6px 18px rgba(32, 163, 91, 0.26);
}

.request-action.agree:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 22px rgba(32, 163, 91, 0.28);
}

.request-action.reject {
  background: linear-gradient(135deg, rgba(225, 92, 92, 0.2), rgba(225, 92, 92, 0.32));
  color: #b44545;
  box-shadow: 0 6px 16px rgba(216, 108, 108, 0.18);
}

.request-action.reject:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 20px rgba(216, 108, 108, 0.22);
}

.empty-hint {
  background: rgba(233, 245, 238, 0.6);
  border-radius: 16px;
  padding: 24px 20px;
  display: grid;
  justify-items: center;
  gap: 6px;
  color: #476a56;
  font-size: 14px;
}

.empty-hint span {
  font-size: 20px;
}

.hint-action {
  margin-top: 12px;
  border: none;
  border-radius: 999px;
  padding: 8px 18px;
  background: linear-gradient(135deg, #32c374, #1da368);
  color: #ffffff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(45, 176, 103, 0.2);
  transition: transform 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease;
}

.hint-action:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 12px 24px rgba(45, 176, 103, 0.26);
}

.hint-action:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.directory-collapse-enter-active,
.directory-collapse-leave-active {
  transition: all 0.22s ease;
}

.directory-collapse-enter-from,
.directory-collapse-leave-to {
  max-height: 0;
  opacity: 0;
  transform: translateY(-6px);
}

.directory-collapse-enter-to,
.directory-collapse-leave-from {
  max-height: 640px;
  opacity: 1;
  transform: translateY(0);
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

.search {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 0 2px;
}

.search input {
  flex: 1;
  border: 1px solid #dbeadf;
  border-radius: 16px;
  padding: 12px 16px;
  font-size: 14px;
  background: rgba(243, 250, 245, 0.9);
  transition: border 0.2s ease, box-shadow 0.2s ease;
}

.search input:focus {
  outline: none;
  border-color: #3cc47d;
  box-shadow: 0 0 0 3px rgba(60, 196, 125, 0.2);
}

.search button {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  border: none;
  background: linear-gradient(135deg, #3cc47d, #2ea365);
  color: #ffffff;
  cursor: pointer;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.search button:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(46, 163, 101, 0.25);
}
</style>
