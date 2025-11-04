<template>
  <div v-if="visible" class="drawer-root">
    <transition name="drawer-fade">
      <div class="drawer-backdrop" @click="$emit('close')" />
    </transition>
    <transition name="drawer-slide">
      <aside class="drawer-panel" role="dialog" aria-modal="true">
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
                      class="member-avatar-wrapper"
                    >
                      <div
                        class="member-avatar"
                        :title="member.name || member.nickname || member.displayName || ''"
                      >
                        <img :src="member.avatar || member.avatarUrl || member.avatarFullUrl || DEFAULT_AVATAR_URL" :alt="member.name || member.nickname || member.displayName || '群成员头像'" />
                      </div>
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
                  <button
                    v-if="canKickMembers"
                    type="button"
                    class="member-avatar remove-member"
                    @click.stop="handleShowRemoveDialog"
                  >
                    <span class="minus">−</span>
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
                class="info-block"
                :class="{ editable: canEditAnnouncement }"
                @click="canEditAnnouncement ? handleAnnouncementClick() : null"
                :role="canEditAnnouncement ? 'button' : null"
                :tabindex="canEditAnnouncement ? 0 : null"
                @keydown.enter.prevent="canEditAnnouncement ? handleAnnouncementClick() : null"
                @keydown.space.prevent="canEditAnnouncement ? handleAnnouncementClick() : null"
              >
                <p class="section-title">
                  群公告
                  <span v-if="!canEditAnnouncement" class="view-only-hint">(仅查看)</span>
                </p>
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

    <!-- 移除成员弹窗 -->
    <transition name="dialog-fade">
      <div v-if="showRemoveMemberDialog" class="dialog-overlay" @click="handleCancelRemove">
        <div class="dialog-content" @click.stop>
          <div class="dialog-header">
            <h3 class="dialog-title">移除群成员</h3>
            <button type="button" class="dialog-close" @click.stop="handleCancelRemove">×</button>
          </div>
          <div class="dialog-body">
            <input
              v-model="removeMemberSearch"
              type="text"
              class="member-search-input"
              placeholder="搜索成员..."
            />
            <div class="removable-members-list">
              <div
                v-for="member in removableMembers"
                :key="member.userId"
                class="removable-member-item"
              >
                <label class="member-checkbox-label" @click="toggleMemberSelection(member.userId)">
                  <input
                    type="checkbox"
                    :value="member.userId"
                    :checked="selectedMembersToRemove.includes(member.userId)"
                    @change="toggleMemberSelection(member.userId)"
                    @click.stop
                  />
                  <div class="member-info">
                    <img :src="member.avatar || DEFAULT_AVATAR_URL" :alt="member.name || member.nickname" class="member-avatar-small" />
                    <span class="member-name">{{ member.name || member.nickname || member.displayName || '未命名' }}</span>
                  </div>
                </label>
              </div>
              <p v-if="!removableMembers.length" class="empty-hint">暂无可移除的成员</p>
            </div>
            <div class="dialog-actions">
              <button
                type="button"
                class="dialog-button dialog-button-cancel"
                @click.stop="handleCancelRemove"
              >
                取消
              </button>
              <button
                type="button"
                class="dialog-button dialog-button-confirm"
                :disabled="!selectedMembersToRemove.length"
                @click.stop="confirmRemoveMembers"
              >
                移除 {{ selectedMembersToRemove.length > 0 ? `(${selectedMembersToRemove.length})` : '' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
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
  currentUser: { type: Object, default: null },
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
  'remove-member',
])

const memberSearch = ref('')
const groupDetail = ref(null)
const loadingGroupDetail = ref(false)
const showRemoveMemberDialog = ref(false)
const removeMemberSearch = ref('')
const selectedMembersToRemove = ref([])

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

// 当前用户在群聊中的角色
const currentUserRole = computed(() => {
  if (!isGroupConversation.value || !props.currentUser?.id || !groupDetail.value?.members) {
    return 0 // 默认无权限
  }
  const member = groupDetail.value.members.find(m => m.memberId === props.currentUser.id)
  return member?.role || 1 // 默认为普通成员
})

// 权限判断
const canKickMembers = computed(() => {
  // 管理员(2)和群主(3)可以踢人
  return currentUserRole.value >= 2
})

const canEditAnnouncement = computed(() => {
  // 只有群主(3)可以编辑群公告
  return currentUserRole.value === 3
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
      role: member.role, // 保存角色信息
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

// 可移除的成员列表（排除自己和群主）
const removableMembers = computed(() => {
  const keyword = removeMemberSearch.value.trim().toLowerCase()
  let members = groupMembers.value.filter(member => {
    // 不能移除自己和群主
    if (member.userId === props.currentUser?.id || member.role === 3) {
      return false
    }
    return true
  })
  
  if (!keyword) {
    return members
  }
  
  return members.filter((member) => {
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
  console.log('handleToggleMute called, current isMuted:', props.isMuted)
  console.log('About to emit toggle-mute with value:', !props.isMuted)
  emit('toggle-mute', !props.isMuted)
}

const handleToggleFavorite = () => {
  console.log('handleToggleFavorite called, current isFavorite:', props.isFavorite)
  console.log('About to emit toggle-favorite with value:', !props.isFavorite)
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

// 监听弹窗关闭，重置选中状态
watch(showRemoveMemberDialog, (newVal) => {
  if (!newVal) {
    selectedMembersToRemove.value = []
    removeMemberSearch.value = ''
  }
})

// 监听抽屉关闭，重置弹窗状态
watch(() => props.visible, (newVal) => {
  if (!newVal) {
    showRemoveMemberDialog.value = false
    selectedMembersToRemove.value = []
    removeMemberSearch.value = ''
  }
})

// 切换成员选择
const toggleMemberSelection = (userId) => {
  console.log('toggleMemberSelection called with userId:', userId)
  const index = selectedMembersToRemove.value.indexOf(userId)
  if (index > -1) {
    selectedMembersToRemove.value.splice(index, 1)
  } else {
    selectedMembersToRemove.value.push(userId)
  }
  console.log('selectedMembersToRemove after toggle:', selectedMembersToRemove.value)
}

// 显示移除成员弹窗
const handleShowRemoveDialog = () => {
  console.log('显示移除成员弹窗')
  showRemoveMemberDialog.value = true
}

// 取消移除操作
const handleCancelRemove = () => {
  console.log('取消移除操作')
  showRemoveMemberDialog.value = false
  removeMemberSearch.value = ''
  selectedMembersToRemove.value = []
}

// 确认移除选中的成员
const confirmRemoveMembers = () => {
  console.log('确认移除成员按钮被点击')
  if (!canKickMembers.value || selectedMembersToRemove.value.length === 0) {
    console.log('无法移除成员，权限不足或未选择成员')
    return
  }
  
  // TODO: 调用移除成员的接口
  console.log('移除成员:', selectedMembersToRemove.value)
  
  // 关闭弹窗并重置状态
  showRemoveMemberDialog.value = false
  removeMemberSearch.value = ''
  selectedMembersToRemove.value = []
  
  // 发出事件
  emit('remove-member', selectedMembersToRemove.value)
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

.view-only-hint {
  font-size: 12px;
  font-weight: 400;
  color: rgba(44, 71, 57, 0.5);
  margin-left: 8px;
}

.group-members-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.member-avatar-wrapper {
  position: relative;
  width: 68px;
  height: 68px;
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

.member-avatar.remove-member {
  border: 1.5px dashed rgba(231, 76, 60, 0.45);
  background: rgba(231, 76, 60, 0.1);
  color: #c0392b;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.member-avatar.remove-member .minus {
  font-size: 28px;
  line-height: 1;
  font-weight: 300;
}

.member-avatar.remove-member:hover {
  transform: translateY(-2px);
  background: rgba(231, 76, 60, 0.2);
  box-shadow: 0 10px 18px rgba(231, 76, 60, 0.18);
}

.member-avatar.remove-member:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(231, 76, 60, 0.25);
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
  pointer-events: auto;
  z-index: 1;
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

/* 移除成员弹窗样式 */
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(20, 39, 29, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
  padding: 20px;
}

.dialog-content {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(35, 77, 54, 0.25);
  width: 100%;
  max-width: 480px;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(35, 77, 54, 0.12);
}

.dialog-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1a5b3d;
}

.dialog-close {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: rgba(44, 71, 57, 0.6);
  font-size: 28px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.dialog-close:hover {
  background: rgba(35, 77, 54, 0.08);
  color: #1a5b3d;
}

.dialog-body {
  padding: 20px 24px;
  overflow-y: auto;
  flex: 1;
}

.member-search-input {
  width: 100%;
  padding: 10px 14px;
  border: 1.5px solid rgba(35, 77, 54, 0.2);
  border-radius: 10px;
  font-size: 14px;
  color: #2c4739;
  background: #f9fcfa;
  transition: all 0.2s ease;
  margin-bottom: 16px;
}

.member-search-input:focus {
  outline: none;
  border-color: rgba(50, 195, 116, 0.5);
  background: #fff;
  box-shadow: 0 0 0 3px rgba(50, 195, 116, 0.1);
}

.member-search-input::placeholder {
  color: rgba(44, 71, 57, 0.5);
}

.removable-members-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.removable-member-item {
  border-radius: 10px;
  background: #f9fcfa;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.removable-member-item:hover {
  background: rgba(231, 76, 60, 0.08);
  border-color: rgba(231, 76, 60, 0.2);
}

.member-checkbox-label {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  cursor: pointer;
  width: 100%;
}

.member-checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #32c374;
  flex-shrink: 0;
  pointer-events: auto;
  z-index: 10;
  position: relative;
}

.member-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.member-avatar-small {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(35, 77, 54, 0.1);
}

.member-name {
  font-size: 15px;
  color: #2c4739;
  font-weight: 500;
}

.dialog-actions {
  display: flex;
  gap: 12px;
  padding-top: 20px;
  border-top: 1px solid rgba(35, 77, 54, 0.12);
  margin-top: 20px;
}

.dialog-button {
  flex: 1;
  padding: 12px 24px;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  pointer-events: auto;
  position: relative;
  z-index: 10;
  user-select: none;
}

.dialog-button-cancel {
  background: rgba(35, 77, 54, 0.08);
  color: #2c4739;
}

.dialog-button-cancel:hover {
  background: rgba(35, 77, 54, 0.15);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(35, 77, 54, 0.2);
}

.dialog-button-confirm {
  background: #e74c3c;
  color: white;
}

.dialog-button-confirm:hover:not(:disabled) {
  background: #c0392b;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(231, 76, 60, 0.3);
}

.dialog-button-confirm:disabled {
  background: rgba(35, 77, 54, 0.2);
  color: rgba(44, 71, 57, 0.4);
  cursor: not-allowed;
}

.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: opacity 0.25s ease;
}

.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
}

.dialog-fade-enter-active .dialog-content,
.dialog-fade-leave-active .dialog-content {
  transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}

.dialog-fade-enter-from .dialog-content,
.dialog-fade-leave-to .dialog-content {
  transform: scale(0.9) translateY(20px);
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
  
  .dialog-content {
    max-width: 100%;
  }
}
</style>
