<template>
  <transition name="friend-modal-fade">
    <div
      v-if="visible && friend"
      class="friend-modal-overlay"
      @click.self="emitClose"
    >
      <div class="friend-modal-card">
        <button
          type="button"
          class="friend-modal-close"
          aria-label="关闭好友详情"
          @click="emitClose"
        >
          &times;
        </button>
        <header class="friend-modal-header">
          <div class="friend-modal-avatar">
            <img
              v-if="resolvedFriend.avatar"
              :src="resolvedFriend.avatar"
              :alt="resolvedFriend.nickname"
            />
            <span v-else>{{ avatarInitial }}</span>
          </div>
          <div class="friend-modal-title">
            <h3>{{ resolvedFriend.remark || '暂无备注' }}</h3>
          </div>
        </header>
        <section class="friend-modal-body">
          <div v-if="isLoading" class="friend-modal-feedback">
            <span class="spinner" aria-hidden="true" />
            <span>好友信息加载中…</span>
          </div>
          <div v-else-if="detailError" class="friend-modal-feedback error">
            <span aria-hidden="true">⚠️</span>
            <p>{{ detailError }}</p>
          </div>
          <dl v-else>
            <div class="friend-modal-row">
              <dt>邮箱</dt>
              <dd>{{ resolvedFriend.email || '未提供邮箱' }}</dd>
            </div>
            <div class="friend-modal-row">
              <dt>昵称</dt>
              <dd>{{ resolvedFriend.nickname || '未填写昵称' }}</dd>
            </div>
            <div class="friend-modal-row">
              <dt>签名</dt>
              <dd>{{ resolvedFriend.signature || '这位朋友还没有写签名' }}</dd>
            </div>
          </dl>
        </section>
        <footer class="friend-modal-actions">
          <button
            type="button"
            class="friend-modal-action ghost"
            :disabled="isDeleting"
            @click="handleDelete"
          >
            {{ isDeleting ? '删除中…' : '删除好友' }}
          </button>
          <button
            type="button"
            class="friend-modal-action"
            @click="emitSend"
          >
            发消息
          </button>
        </footer>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { apiClient } from '@/services/apiClient'
import { ElMessageBox, ElMessage } from 'element-plus'
import 'element-plus/es/components/message-box/style/css'
import 'element-plus/es/components/message/style/css'

const props = defineProps({
  visible: { type: Boolean, default: false },
  friend: { type: Object, default: null },
})

const emit = defineEmits(['close', 'send', 'delete'])

const friend = computed(() => props.friend)
const detail = ref(null)
const isLoading = ref(false)
const detailError = ref('')
const isDeleting = ref(false)

const resolvedFriend = computed(() => {
  if (detail.value) {
    return {
      remark: detail.value.remark ?? '',
      nickname: detail.value.nickname ?? '',
      email: detail.value.email ?? '',
      avatar: detail.value.avatarFullUrl ?? '',
      signature: detail.value.signature ?? '',
    }
  }
  if (!friend.value) {
    return {
      remark: '',
      nickname: '',
      email: '',
      avatar: '',
      signature: '',
    }
  }
  return {
    remark: friend.value.remark ?? '',
    nickname: friend.value.nickname ?? friend.value.nameEn ?? '',
    email: friend.value.email ?? '',
    avatar:
      friend.value.avatarFullUrl ??
      friend.value.avatar ??
      friend.value.avatarUrl ??
      '',
    signature: friend.value.signature ?? '',
  }
})

const avatarInitial = computed(() => {
  const source =
    resolvedFriend.value.remark ||
    resolvedFriend.value.nickname ||
    resolvedFriend.value.email ||
    resolvedFriend.value.signature ||
    ''
  const char = source.trim().charAt(0)
  return char ? char.toUpperCase() : '友'
})

const emitClose = () => {
  emit('close')
}

const emitSend = () => {
  emit('send')
}

const resetDetailState = () => {
  detail.value = null
  detailError.value = ''
  isLoading.value = false
}

const fetchDetail = async () => {
  if (!props.visible || !friend.value) return
  const friendId = friend.value.userId ?? friend.value.id
  if (friendId === undefined || friendId === null) {
    detailError.value = '未找到好友标识，无法加载详情'
    return
  }
  detailError.value = ''
  isLoading.value = true
  try {
    const { data } = await apiClient.post('/friend/friendDetail', {
      param: friendId,
    })
    detail.value = data ?? null
  } catch (error) {
    detailError.value = error?.message || '好友详情加载失败，请稍后重试'
    detail.value = null
  } finally {
    isLoading.value = false
  }
}

watch(
  () => [props.visible, friend.value?.id, friend.value?.userId],
  () => {
    if (props.visible) {
      fetchDetail()
    } else {
      resetDetailState()
    }
  },
  { immediate: true },
)

const handleDelete = async () => {
  if (isDeleting.value || !friend.value) return
  const friendId = friend.value.userId ?? friend.value.id
  if (friendId === undefined || friendId === null) {
    ElMessage.error('未找到好友标识，无法删除')
    return
  }
  try {
    await ElMessageBox.confirm(
      '删除后将无法与该好友继续聊天，确定要删除吗？',
      '删除好友',
      {
        type: 'warning',
        confirmButtonText: '确认删除',
        cancelButtonText: '取消',
        customClass: 'friend-delete-confirm',
      },
    )
  } catch {
    return
  }
  isDeleting.value = true
  try {
    await apiClient.post('/friend/deleteFriend', {
      param: friendId,
    })
    ElMessage.success('好友已删除')
    emit('delete', friendId)
    emitClose()
  } finally {
    isDeleting.value = false
  }
}
</script>

<style scoped>
.friend-modal-fade-enter-active,
.friend-modal-fade-leave-active {
  transition: opacity 0.24s ease;
}

.friend-modal-fade-enter-from,
.friend-modal-fade-leave-to {
  opacity: 0;
}

.friend-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 40, 27, 0.48);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 24px;
  z-index: 1200;
}

.friend-modal-card {
  width: 420px;
  max-width: 100%;
  background: linear-gradient(150deg, rgba(255, 255, 255, 0.98), rgba(221, 239, 228, 0.94));
  border-radius: 24px;
  box-shadow: 0 28px 50px rgba(31, 53, 38, 0.26);
  padding: 32px 34px;
  color: #1f3526;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.friend-modal-close {
  position: absolute;
  top: 18px;
  right: 20px;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.86);
  color: #2a4c38;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  box-shadow: 0 6px 16px rgba(31, 53, 38, 0.16);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.friend-modal-close:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 22px rgba(31, 53, 38, 0.22);
}

.friend-modal-header {
  display: flex;
  align-items: center;
  gap: 18px;
  margin-bottom: 8px;
}

.friend-modal-avatar {
  width: 82px;
  height: 82px;
  border-radius: 24px;
  overflow: hidden;
  position: relative;
  flex-shrink: 0;
  background: rgba(210, 236, 221, 0.8);
  display: grid;
  place-items: center;
  font-size: 28px;
  font-weight: 700;
  color: #1f3526;
  box-shadow: 0 16px 32px rgba(36, 75, 52, 0.18);
}

.friend-modal-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.friend-modal-title h3 {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
}

.friend-modal-body {
  padding: 4px 0 12px;
  color: #244836;
}

.friend-modal-feedback {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
  justify-content: center;
  padding: 32px 0;
  color: #2d4f3d;
}

.friend-modal-feedback.error {
  color: #b85750;
}

.spinner {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 3px solid rgba(41, 97, 67, 0.2);
  border-top-color: rgba(41, 97, 67, 0.7);
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.friend-modal-body dl {
  margin: 0;
  display: grid;
  gap: 10px;
}

.friend-modal-row {
  display: grid;
  grid-template-columns: 82px 1fr;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 16px;
  background: rgba(233, 245, 238, 0.7);
}

.friend-modal-row + .friend-modal-row {
  margin-top: 2px;
}

.friend-modal-row dt {
  font-size: 13px;
  color: #476955;
  font-weight: 600;
}

.friend-modal-row dd {
  margin: 0;
  font-size: 14px;
  color: #20412f;
  display: flex;
  align-items: center;
}

.friend-modal-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
}

.friend-modal-action {
  min-width: 120px;
  height: 44px;
  border-radius: 16px;
  border: none;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease;
  background: linear-gradient(135deg, #47b67c, #2f9963);
  color: #ffffff;
  box-shadow: 0 14px 26px rgba(47, 153, 99, 0.32);
}

.friend-modal-action:hover {
  transform: translateY(-2px);
  box-shadow: 0 20px 32px rgba(47, 153, 99, 0.38);
}

.friend-modal-action:active {
  transform: translateY(0);
  box-shadow: 0 10px 18px rgba(47, 153, 99, 0.24);
}

.friend-modal-action.ghost {
  background: rgba(255, 255, 255, 0.86);
  color: #3a5d48;
  box-shadow: 0 8px 18px rgba(31, 53, 38, 0.12);
}

.friend-modal-action.ghost:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 26px rgba(31, 53, 38, 0.18);
}

.friend-modal-action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

:global(.friend-delete-confirm .el-message-box) {
  border-radius: 24px;
  padding: 26px 28px 20px;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.96), rgba(228, 244, 234, 0.94));
}

:global(.friend-delete-confirm .el-message-box__header) {
  padding-bottom: 12px;
}

:global(.friend-delete-confirm .el-message-box__title) {
  font-size: 18px;
  font-weight: 700;
  color: #2a4b38;
}

:global(.friend-delete-confirm .el-message-box__content) {
  color: #345744;
  font-size: 14px;
  line-height: 1.6;
}

:global(.friend-delete-confirm .el-message-box__btns) {
  margin-top: 18px;
}

:global(.friend-delete-confirm .el-button) {
  border-radius: 14px;
  min-width: 96px;
  height: 38px;
}

:global(.friend-delete-confirm .el-button--primary) {
  background: linear-gradient(135deg, #e06a64, #c74f48);
  border: none;
  color: #fff;
  box-shadow: 0 12px 24px rgba(199, 79, 72, 0.28);
}

:global(.friend-delete-confirm .el-button:not(.el-button--primary)) {
  background: rgba(255, 255, 255, 0.84);
  border: none;
  color: #3a5d48;
  box-shadow: 0 8px 18px rgba(31, 53, 38, 0.12);
}

:global(.friend-delete-confirm .el-button--primary:hover) {
  box-shadow: 0 18px 28px rgba(199, 79, 72, 0.32);
}

:global(.friend-delete-confirm .el-button:not(.el-button--primary):hover) {
  box-shadow: 0 12px 22px rgba(31, 53, 38, 0.18);
}
</style>
