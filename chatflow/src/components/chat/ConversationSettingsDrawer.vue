<template>
  <transition name="drawer-fade">
    <div v-if="visible" class="drawer-root">
      <div class="drawer-backdrop" @click="$emit('close')" />
      <transition name="drawer-slide">
        <aside v-if="visible" class="drawer-panel" role="dialog" aria-modal="true">
          <button
            type="button"
            class="drawer-close"
            @click="$emit('close')"
            aria-label="关闭设置面板"
          >
            X
          </button>
          <div v-if="conversation" class="drawer-body">
            <template v-if="isGroupConversation">
              <div class="group-search">
                <input
                  v-model="memberSearch"
                  type="text"
                  placeholder="搜索群成员"
                  aria-label="搜索群成员"
                />
              </div>

              <div class="group-members">
                <p class="section-title">群成员</p>
                <div class="group-members-grid">
                  <template v-if="filteredMembers.length">
                    <div
                      v-for="member in filteredMembers"
                      :key="member.id || member.userId || member.email || member.name"
                      class="member-avatar"
                      :title="member.name || member.nickname || member.displayName || ''"
                    >
                      <img :src="member.avatar || member.avatarUrl || member.avatarFullUrl || DEFAULT_AVATAR_URL" :alt="member.name || member.nickname || member.displayName || '群成员头像'" />
                    </div>
                  </template>
                  <button
                    v-if="inviteEnabled"
                    type="button"
                    class="member-avatar add-member"
                    @click="handleInviteClick"
                  >
                    <span class="plus">+</span>
                  </button>
                </div>
                <p v-if="!filteredMembers.length" class="empty-hint">暂无群成员数据</p>
              </div>

              <div class="info-block editable">
                <p class="section-title">群聊名称</p>
                <div
                  class="editable-field"
                  :class="{ editing: editingGroupName }"
                  @click="startEditingGroupName"
                  @keydown.enter.prevent="finishEditingGroupName"
                  @keydown.esc.prevent="cancelEditingGroupName"
                >
                  <input
                    ref="groupNameInputRef"
                    type="text"
                    v-model="groupNameDraft"
                    :readonly="!editingGroupName"
                    :aria-readonly="!editingGroupName"
                  />
                  <button
                    v-if="editingGroupName"
                    type="button"
                    class="confirm-button"
                    @click="finishEditingGroupName"
                  >
                    保存
                  </button>
                </div>
              </div>

              <div
                class="info-block editable"
                @click="handleAnnouncementClick"
                role="button"
                tabindex="0"
                @keydown.enter.prevent="handleAnnouncementClick"
                @keydown.space.prevent="handleAnnouncementClick"
              >
                <p class="section-title">群公告</p>
                <p class="info-text muted" v-if="groupAnnouncement">{{ groupAnnouncement }}</p>
                <p class="info-text muted" v-else>暂无群公告</p>
                <p v-if="announcementUpdatedHint" class="meta-hint">最近发布：{{ announcementUpdatedHint }}</p>
              </div>

              <div class="setting-list">
                <div class="setting-item">
                  <div class="setting-copy">
                    <p class="setting-title">消息免打扰</p>
                    <p class="setting-desc">开启后将不会提醒该会话的新消息</p>
                  </div>
                  <button
                    type="button"
                    :class="['setting-switch', { on: isMuted }]"
                    role="switch"
                    :aria-checked="isMuted"
                    @click="handleToggleMute"
                  >
                    <span class="switch-handle" />
                  </button>
                </div>

                <div class="setting-item">
                  <div class="setting-copy">
                    <p class="setting-title">设为常用会话</p>
                    <p class="setting-desc">将该会话固定在常用列表中</p>
                  </div>
                  <button
                    type="button"
                    :class="['setting-switch', { on: isFavorite }]"
                    role="switch"
                    :aria-checked="isFavorite"
                    @click="handleToggleFavorite"
                  >
                    <span class="switch-handle" />
                  </button>
                </div>
              </div>
            </template>

            <template v-else>
              <div class="conversation-info">
                <div class="avatar">
                  <img :src="avatarUrl" :alt="displayName" />
                </div>
                <div class="meta">
                  <p class="meta-label">好友</p>
                  <div class="meta-row">
                    <p class="meta-name">{{ displayName }}</p>
                  </div>
                </div>
              </div>

              <div class="setting-list">
                <div class="setting-item">
                  <div class="setting-copy">
                    <p class="setting-title">消息免打扰</p>
                    <p class="setting-desc">开启后将不会提醒该会话的新消息</p>
                  </div>
                  <button
                    type="button"
                    :class="['setting-switch', { on: isMuted }]"
                    role="switch"
                    :aria-checked="isMuted"
                    @click="handleToggleMute"
                  >
                    <span class="switch-handle" />
                  </button>
                </div>

                <div class="setting-item">
                  <div class="setting-copy">
                    <p class="setting-title">设为常用会话</p>
                    <p class="setting-desc">将该会话固定在常用列表中</p>
                  </div>
                  <button
                    type="button"
                    :class="['setting-switch', { on: isFavorite }]"
                    role="switch"
                    :aria-checked="isFavorite"
                    @click="handleToggleFavorite"
                  >
                    <span class="switch-handle" />
                  </button>
                </div>
              </div>
            </template>
          </div>

          <div v-if="conversation" class="drawer-footer">
            <button type="button" class="danger-button" @click="handlePrimaryDangerAction">
              {{ isGroupConversation ? '退出群聊' : '删除' }}
            </button>
            <button
              v-if="isGroupConversation"
              type="button"
              class="danger-button secondary"
              @click="$emit('delete')"
            >
              删除会话
            </button>
          </div>
        </aside>
      </transition>
    </div>
  </transition>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { fetchGroupDetail } from '@/services/groupService'

const DEFAULT_AVATAR_URL =
  'https://chat-flow.oss-cn-guangzhou.aliyuncs.com/default-avatar/default-person.jpg'

const props = defineProps({
  visible: { type: Boolean, default: false },
  conversation: { type: Object, default: null },
  isMuted: { type: Boolean, default: false },
  isFavorite: { type: Boolean, default: false },
  inviteEnabled: { type: Boolean, default: false },
  groupNameEditable: { type: Boolean, default: true },
  announcementUpdatedAt: { type: [Number, String, Date], default: null },
})

const emit = defineEmits([
  'close',
  'toggle-mute',
  'toggle-favorite',
  'delete',
  'leave-group',
  'invite',
  'update-group-name',
  'edit-announcement',
])

const memberSearch = ref('')
const groupDetail = ref(null)
const loadingGroupDetail = ref(false)

const avatarUrl = computed(() => {
  return props.conversation?.avatar || DEFAULT_AVATAR_URL
})

const displayName = computed(() => {
  return (
    props.conversation?.displayName ||
    props.conversation?.nameCn ||
    props.conversation?.nameEn ||
    '未命名会话'
  )
})

const isGroupConversation = computed(
  () =>
    Boolean(props.conversation?.isGroupConversation) ||
    props.conversation?.conversationType === 2,
)

const groupNameInputRef = ref(null)
const editingGroupName = ref(false)
const groupNameDraft = ref('')

const groupName = computed(() => {
  if (!isGroupConversation.value) return ''
  // 优先使用从接口获取的群组名称
  if (groupDetail.value?.groupName) return groupDetail.value.groupName
  return props.conversation?.groupName || displayName.value
})

const groupAnnouncement = computed(() => {
  if (!isGroupConversation.value) return ''
  // 优先使用从接口获取的群公告
  if (groupDetail.value?.announcement) return groupDetail.value.announcement
  return props.conversation?.announcement || ''
})

const announcementUpdatedHint = computed(() => {
  if (!isGroupConversation.value) return ''
  const raw = props.announcementUpdatedAt ?? props.conversation?.announcementUpdatedAt ?? null
  if (!raw) return ''
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return ''
  const now = new Date()
  const sameDay = date.toDateString() === now.toDateString()
  if (sameDay) {
    return date.toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit' })
  }
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  })
})

const groupMembers = computed(() => {
  if (!isGroupConversation.value) return []
  // 优先使用从接口获取的成员列表
  if (groupDetail.value?.members && Array.isArray(groupDetail.value.members)) {
    return groupDetail.value.members.map((member) => ({
      id: member.memberId,
      userId: member.memberId,
      avatar: member.avatarFullUrl,
      avatarUrl: member.avatarFullUrl,
      avatarFullUrl: member.avatarFullUrl,
      name: member.nickname || member.username || `用户${member.memberId}`,
      nickname: member.nickname,
      username: member.username,
    })).slice(0, 20)
  }
  const members = Array.isArray(props.conversation?.members) ? props.conversation.members : []
  return members.slice(0, 20)
})

const filteredMembers = computed(() => {
  const keyword = memberSearch.value.trim().toLowerCase()
  if (!keyword) {
    return groupMembers.value
  }
  return groupMembers.value.filter((member) => {
    const text =
      member?.nickname ||
      member?.name ||
      member?.displayName ||
      member?.remark ||
      member?.email ||
      ''
    return text.toString().toLowerCase().includes(keyword)
  })
})

// 加载群组详情
const loadGroupDetail = async () => {
  if (!isGroupConversation.value || !props.conversation?.relationId) {
    return
  }

  try {
    loadingGroupDetail.value = true
    const detail = await fetchGroupDetail(props.conversation.relationId)
    groupDetail.value = detail
  } catch (error) {
    console.error('Failed to fetch group detail:', error)
    // 失败时使用 props 中的数据作为后备
    groupDetail.value = null
  } finally {
    loadingGroupDetail.value = false
  }
}

// 监听会话变化，重置状态并加载群组详情
watch(
  () => props.conversation?.id,
  () => {
    memberSearch.value = ''
    editingGroupName.value = false
    groupNameDraft.value = groupName.value
    groupDetail.value = null
  },
  { immediate: true },
)

// 监听抽屉显示状态，打开时加载群组详情
watch(
  () => props.visible,
  (newVisible) => {
    if (newVisible && isGroupConversation.value) {
      loadGroupDetail()
    }
  },
  { immediate: true },
)

const handleToggleMute = () => {
  emit('toggle-mute', !props.isMuted)
}

const handleToggleFavorite = () => {
  emit('toggle-favorite', !props.isFavorite)
}

const handlePrimaryDangerAction = () => {
  if (isGroupConversation.value) {
    emit('leave-group')
  } else {
    emit('delete')
  }
}

const handleInviteClick = () => {
  if (props.inviteEnabled) {
    emit('invite')
  }
}

const startEditingGroupName = () => {
  if (!isGroupConversation.value) return
  if (props.groupNameEditable === false) return
  if (!editingGroupName.value) {
    groupNameDraft.value = groupName.value
    editingGroupName.value = true
    requestAnimationFrame(() => {
      groupNameInputRef.value?.focus()
      groupNameInputRef.value?.select()
    })
  }
}

const finishEditingGroupName = () => {
  if (!editingGroupName.value) return
  const value = groupNameDraft.value.trim()
  emit('update-group-name', value || groupName.value)
  editingGroupName.value = false
}

const cancelEditingGroupName = () => {
  if (!editingGroupName.value) return
  groupNameDraft.value = groupName.value
  editingGroupName.value = false
}

const handleAnnouncementClick = () => {
  if (!isGroupConversation.value) return
  emit('edit-announcement')
}
</script>

<style scoped>
.drawer-root {
  position: fixed;
  inset: 0;
  display: flex;
  justify-content: flex-end;
  pointer-events: none;
  z-index: 2000;
}

.drawer-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(20, 39, 29, 0.35);
  backdrop-filter: blur(2px);
  pointer-events: auto;
}

.drawer-panel {
  position: relative;
  width: min(396px, 92vw);
  height: 100%;
  background: #f9fcfa;
  border-left: 1px solid rgba(35, 77, 54, 0.12);
  box-shadow: -12px 0 32px rgba(35, 77, 54, 0.18);
  padding: 28px 24px 32px;
  display: flex;
  flex-direction: column;
  pointer-events: auto;
  will-change: transform, opacity;
}

.drawer-close {
  position: absolute;
  top: 18px;
  right: 18px;
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(43, 71, 56, 0.08);
  color: #1c3325;
  border-radius: 50%;
  cursor: pointer;
  font-size: 18px;
  line-height: 32px;
  transition: background 0.2s ease, transform 0.2s ease;
}

.drawer-close:hover {
  background: rgba(50, 195, 116, 0.18);
  transform: rotate(90deg);
}

.drawer-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 28px;
  padding-top: 32px;
  overflow-y: auto;
  padding-right: 8px;
  padding-bottom: 56px;
}

.drawer-footer {
  position: sticky;
  bottom: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 12px 0 16px;
  background: linear-gradient(180deg, rgba(249, 252, 250, 0) 0%, #f9fcfa 32%, #f9fcfa 100%);
}

.group-search input {
  width: 100%;
  border: 1px solid rgba(47, 101, 69, 0.18);
  border-radius: 14px;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.9);
  color: #1b3425;
  font-size: 14px;
}

.group-search input:focus {
  outline: none;
  border-color: #34c073;
  box-shadow: 0 0 0 3px rgba(52, 192, 115, 0.18);
}

.group-members {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #1b3425;
}

.group-members-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.member-avatar {
  width: 68px;
  height: 68px;
  border-radius: 16px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(50, 195, 116, 0.18);
  box-shadow: 0 8px 16px rgba(33, 66, 49, 0.12);
}

.member-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.member-avatar.add-member {
  border: 1.5px dashed rgba(50, 195, 116, 0.45);
  background: rgba(50, 195, 116, 0.1);
  color: #1a5b3d;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.member-avatar.add-member .plus {
  font-size: 22px;
  line-height: 1;
}

.member-avatar.add-member .add-label {
  font-size: 12px;
  letter-spacing: 1px;
}

.member-avatar.add-member:hover {
  transform: translateY(-2px);
  background: rgba(50, 195, 116, 0.2);
  box-shadow: 0 10px 18px rgba(33, 66, 49, 0.18);
}

.member-avatar.add-member:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(50, 195, 116, 0.25);
}

.empty-hint {
  margin: 0;
  font-size: 13px;
  color: rgba(44, 71, 57, 0.6);
}

.info-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-block.editable {
  cursor: pointer;
  border-radius: 16px;
}

.info-block.editable:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(50, 195, 116, 0.18);
}

.info-text {
  margin: 0;
  font-size: 15px;
  color: #1c3325;
  line-height: 1.6;
}

.info-text.muted {
  color: rgba(44, 71, 57, 0.7);
}

.meta-hint {
  margin: 0;
  font-size: 12px;
  color: rgba(26, 52, 38, 0.58);
}

.info-block.editable .editable-field {
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid transparent;
  border-radius: 14px;
  padding: 4px 6px;
  transition: border 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
  cursor: text;
}

.info-block.editable .editable-field input {
  flex: 1;
  border: none;
  background: transparent;
  color: #1c3325;
  font-size: 15px;
  font-weight: 600;
  padding: 6px 8px;
  border-radius: 10px;
}

.info-block.editable .editable-field input:focus {
  outline: none;
}

.info-block.editable .editable-field:hover {
  border-color: rgba(50, 195, 116, 0.25);
  background: rgba(50, 195, 116, 0.08);
}

.info-block.editable .editable-field.editing {
  border-color: rgba(50, 195, 116, 0.45);
  background: rgba(50, 195, 116, 0.12);
  box-shadow: 0 0 0 3px rgba(50, 195, 116, 0.18);
}

.info-block.editable .confirm-button {
  border: none;
  background: linear-gradient(135deg, #32c374, #1da368);
  color: #ffffff;
  border-radius: 12px;
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 6px 14px rgba(45, 176, 103, 0.24);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.info-block.editable .confirm-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 18px rgba(45, 176, 103, 0.28);
}

.conversation-info {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 18px;
  border: 1px solid rgba(50, 195, 116, 0.16);
  box-shadow: 0 12px 24px rgba(33, 66, 49, 0.08);
}

.avatar {
  width: 72px;
  height: 72px;
  border-radius: 22px;
  overflow: hidden;
  flex-shrink: 0;
  border: 2px solid rgba(50, 195, 116, 0.3);
  box-shadow: 0 12px 20px rgba(40, 92, 61, 0.18);
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.meta-label {
  margin: 0;
  font-size: 13px;
  color: rgba(44, 71, 57, 0.6);
  letter-spacing: 0.3px;
}

.meta-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.meta-name {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1b3425;
}

.danger-button {
  min-width: 140px;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  border: none;
  background: linear-gradient(135deg, #f16767, #d14141);
  color: #ffffff;
  border-radius: 14px;
  padding: 10px 18px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 10px 20px rgba(209, 65, 65, 0.24);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.danger-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 14px 24px rgba(209, 65, 65, 0.32);
}

.danger-button.secondary {
  background: rgba(209, 65, 65, 0.12);
  color: #c94a4a;
  box-shadow: none;
}

.setting-list {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(47, 101, 69, 0.12);
  box-shadow: 0 12px 24px rgba(33, 66, 49, 0.08);
  gap: 16px;
}

.setting-copy {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.setting-title {
  margin: 0;
  font-size: 16px;
  color: #1b3425;
  font-weight: 600;
}

.setting-desc {
  margin: 0;
  font-size: 13px;
  color: rgba(44, 71, 57, 0.74);
}

.setting-switch {
  position: relative;
  width: 52px;
  height: 28px;
  border-radius: 999px;
  border: none;
  background: rgba(44, 71, 57, 0.2);
  cursor: pointer;
  transition: background 0.2s ease;
  padding: 0;
}

.setting-switch .switch-handle {
  position: absolute;
  top: 3px;
  left: 4px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 6px 12px rgba(26, 61, 42, 0.18);
  transition: transform 0.2s ease;
}

.setting-switch.on {
  background: linear-gradient(135deg, #32c374, #1da368);
}

.setting-switch.on .switch-handle {
  transform: translateX(24px);
}

.drawer-fade-enter-active,
.drawer-fade-leave-active {
  transition: opacity 0.2s ease;
}

.drawer-fade-enter-from,
.drawer-fade-leave-to {
  opacity: 0;
}

.drawer-slide-enter-active,
.drawer-slide-leave-active {
  transition:
    transform 0.36s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.28s ease;
}

.drawer-slide-enter-from,
.drawer-slide-leave-to {
  transform: translateX(120%);
  opacity: 0;
}

.drawer-slide-enter-to,
.drawer-slide-leave-from {
  transform: translateX(0);
  opacity: 1;
}

@media (max-width: 768px) {
  .drawer-panel {
    width: 100%;
    border-radius: 24px 24px 0 0;
    border-left: none;
    border-top: 1px solid rgba(35, 77, 54, 0.12);
    padding: 24px 20px 28px;
  }

  .drawer-root {
    align-items: flex-end;
  }

  .drawer-slide-enter-from,
  .drawer-slide-leave-to {
    transform: translateX(120%);
  }
}
</style>
