<template>
  <Transition name="add-friend-fade">
    <div
      v-if="visible"
      class="add-friend-overlay"
      @click.self="handleClose"
    >
      <div class="add-friend-card">
        <button
          type="button"
          class="add-friend-close"
          aria-label="关闭添加好友弹窗"
          @click="handleClose"
        >
          &times;
        </button>
        <header class="add-friend-header">
          <h3>添加好友</h3>
          <p>通过邮箱搜索并与新的伙伴建立联系</p>
        </header>
        <form class="add-friend-search" @submit.prevent="searchAddFriend">
          <div class="add-friend-search-field">
            <input
              type="email"
              v-model="email"
              :disabled="isLoading || isSubmitting"
              placeholder="输入好友邮箱地址"
            />
            <button
              type="submit"
              :disabled="isLoading || isSubmitting || !email.trim()"
            >
              {{ isLoading ? '搜索中…' : '搜索' }}
            </button>
          </div>
        </form>
        <p v-if="errorMessage" class="add-friend-feedback error">
          {{ errorMessage }}
        </p>
        <p v-if="successMessage" class="add-friend-feedback success">
          {{ successMessage }}
        </p>
        <div v-if="isLoading" class="add-friend-loading">
          <span class="spinner" aria-hidden="true" />
          <span>正在搜索，请稍候…</span>
        </div>
        <div
          v-else-if="results.length"
          class="add-friend-results"
        >
          <button
            v-for="user in results"
            :key="user.id || user.email"
            type="button"
            class="add-friend-result-card"
            :class="{
              active:
                selectedResult &&
                (selectedResult.id === user.id ||
                  selectedResult.email === user.email),
            }"
            @click="selectResult(user)"
          >
            <div class="result-avatar">
              <img
                v-if="user.avatarFullUrl || user.avatarUrl || user.avatar"
                :src="user.avatarFullUrl || user.avatarUrl || user.avatar"
                :alt="user.nickname || user.name || user.email"
              />
              <span v-else>{{ getUserInitial(user) }}</span>
            </div>
            <div class="result-info">
              <strong>{{ user.nickname || user.name || '未填写昵称' }}</strong>
              <span>{{ user.email || '暂无邮箱' }}</span>
            </div>
            <span class="result-arrow">→</span>
          </button>
        </div>
        <div
          v-else-if="email && !errorMessage"
          class="add-friend-empty"
        >
          暂无搜索结果，换个邮箱试试吧。
        </div>
        <div v-if="selectedResult" class="add-friend-detail">
          <div class="detail-profile">
            <div class="detail-avatar">
              <img
                v-if="
                  selectedResult.avatarFullUrl ||
                  selectedResult.avatarUrl ||
                  selectedResult.avatar
                "
                :src="
                  selectedResult.avatarFullUrl ||
                  selectedResult.avatarUrl ||
                  selectedResult.avatar
                "
                :alt="
                  selectedResult.nickname ||
                  selectedResult.name ||
                  selectedResult.email
                "
              />
              <span v-else>{{ getUserInitial(selectedResult) }}</span>
            </div>
            <div class="detail-info">
              <h4>
                {{ selectedResult.nickname || selectedResult.name || '未填写昵称' }}
              </h4>
              <p>{{ selectedResult.email || '暂无邮箱信息' }}</p>
            </div>
          </div>
          <button
            type="button"
            class="add-friend-action"
            :disabled="isSubmitting || !!successMessage"
            @click="submitAddFriendRequest"
          >
            {{
              isSubmitting
                ? '添加中…'
                : successMessage
                ? '已发送'
                : '添加好友'
            }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, watch } from 'vue'
import { apiClient } from '@/services/apiClient'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  currentUserId: {
    type: [Number, String],
    default: null,
  },
  currentUserEmail: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['close', 'friend-added'])

const email = ref('')
const isLoading = ref(false)
const isSubmitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const results = ref([])
const selectedResult = ref(null)

const resetState = () => {
  email.value = ''
  isLoading.value = false
  isSubmitting.value = false
  errorMessage.value = ''
  successMessage.value = ''
  results.value = []
  selectedResult.value = null
}

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      resetState()
    }
  },
)

const handleClose = () => {
  emit('close')
}

const getUserInitial = (user) => {
  const source =
    (typeof user?.nickname === 'string' && user.nickname) ||
    (typeof user?.name === 'string' && user.name) ||
    (typeof user?.email === 'string' && user.email) ||
    ''
  const initial = source.trim().charAt(0)
  return initial ? initial.toUpperCase() : '?'
}

const searchAddFriend = async () => {
  const trimmed = email.value.trim()
  if (!trimmed) {
    errorMessage.value = '请输入好友邮箱'
    return
  }
  isLoading.value = true
  errorMessage.value = ''
  successMessage.value = ''
  results.value = []
  selectedResult.value = null
  try {
    const { data } = await apiClient.post('/user/getUserInfoByEmail', {
      param: trimmed,
    })
    const rawResults = Array.isArray(data)
      ? data
      : data
      ? [data]
      : []
    if (!rawResults.length) {
      errorMessage.value = '未找到匹配的用户'
      return
    }
    results.value = rawResults
  } catch (error) {
    errorMessage.value = error?.message || '搜索失败，请稍后重试'
  } finally {
    isLoading.value = false
  }
}

const selectResult = (user) => {
  selectedResult.value = user
  successMessage.value = ''
  errorMessage.value = ''
}

const submitAddFriendRequest = async () => {
  if (!selectedResult.value || isSubmitting.value) return
  const receiverId = selectedResult.value.id
  if (!receiverId && receiverId !== 0) {
    errorMessage.value = '未获取到好友信息，无法发送请求'
    return
  }
  const isSameUserById =
    props.currentUserId !== null &&
    props.currentUserId !== undefined &&
    (receiverId === props.currentUserId ||
      String(receiverId) === String(props.currentUserId))
  const isSameUserByEmail =
    props.currentUserEmail &&
    typeof selectedResult.value.email === 'string' &&
    selectedResult.value.email.toLowerCase() ===
      props.currentUserEmail.toLowerCase()
  if (isSameUserById || isSameUserByEmail) {
    errorMessage.value = '不能添加自己为好友'
    return
  }
  isSubmitting.value = true
  errorMessage.value = ''
  successMessage.value = ''
  try {
    const payload = {
      receiverId,
      applyMessage:
        selectedResult.value.nickname || selectedResult.value.name
          ? `你好，我是${selectedResult.value.nickname || selectedResult.value.name}`
          : '你好，我想添加你为好友',
      remark:
        selectedResult.value.nickname ||
        selectedResult.value.name ||
        selectedResult.value.email ||
        '好友',
    }
    const { data, message } = await apiClient.post(
      '/friend/addFriendRequest',
      payload,
    )
    const responseMessage =
      (typeof data === 'string' && data) ||
      message ||
      '好友请求已发送，请等待对方确认'
    successMessage.value = responseMessage
    emit('friend-added', { ...selectedResult.value, receiverId })
  } catch (error) {
    errorMessage.value = error?.message || '好友请求发送失败，请稍后重试'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.add-friend-fade-enter-active,
.add-friend-fade-leave-active {
  transition: opacity 0.24s ease;
}

.add-friend-fade-enter-from,
.add-friend-fade-leave-to {
  opacity: 0;
}

.add-friend-overlay {
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

.add-friend-card {
  width: 520px;
  max-width: 100%;
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.98), rgba(223, 241, 231, 0.96));
  border-radius: 26px;
  box-shadow: 0 34px 60px rgba(25, 54, 39, 0.28);
  padding: 32px 36px 36px;
  position: relative;
  color: #163626;
}

.add-friend-close {
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

.add-friend-close:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 30px rgba(18, 44, 30, 0.28);
}

.add-friend-header h3 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
}

.add-friend-header p {
  margin: 8px 0 0;
  color: #4a6b5b;
  font-size: 14px;
}

.add-friend-search {
  margin-top: 24px;
}

.add-friend-search-field {
  display: flex;
  gap: 12px;
}

.add-friend-search-field input {
  flex: 1;
  border: 1px solid rgba(198, 221, 207, 0.8);
  border-radius: 16px;
  padding: 12px 16px;
  font-size: 14px;
  color: #1f3526;
  background: rgba(255, 255, 255, 0.96);
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}

.add-friend-search-field input:focus {
  outline: none;
  border-color: #34c073;
  box-shadow: 0 0 0 3px rgba(52, 192, 115, 0.18);
}

.add-friend-search-field input:disabled {
  background: rgba(255, 255, 255, 0.7);
  cursor: not-allowed;
}

.add-friend-search-field button {
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

.add-friend-search-field button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.add-friend-search-field button:not(:disabled):hover {
  transform: translateY(-2px);
  box-shadow: 0 20px 32px rgba(45, 176, 103, 0.34);
}

.add-friend-feedback {
  margin-top: 16px;
  font-size: 13px;
}

.add-friend-feedback.error {
  color: #d15353;
}

.add-friend-feedback.success {
  color: #1b7a4d;
}

.add-friend-loading {
  margin-top: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: #4a6b5b;
  font-size: 14px;
}

.add-friend-loading .spinner {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 3px solid rgba(50, 195, 116, 0.28);
  border-top-color: #32c374;
  animation: addFriendSpin 0.8s linear infinite;
}

.add-friend-results {
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.add-friend-result-card {
  width: 100%;
  border: none;
  border-radius: 18px;
  padding: 14px 18px;
  background: rgba(255, 255, 255, 0.86);
  display: flex;
  align-items: center;
  gap: 14px;
  cursor: pointer;
  text-align: left;
  transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
  box-shadow: 0 12px 24px rgba(25, 54, 39, 0.16);
}

.add-friend-result-card:hover,
.add-friend-result-card.active {
  transform: translateY(-2px);
  background: linear-gradient(135deg, rgba(50, 195, 116, 0.12), rgba(29, 163, 104, 0.18));
  box-shadow: 0 18px 32px rgba(25, 54, 39, 0.24);
}

.result-avatar {
  width: 46px;
  height: 46px;
  border-radius: 16px;
  overflow: hidden;
  background: rgba(50, 195, 116, 0.14);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: #1d7a4b;
  font-weight: 600;
  flex-shrink: 0;
  box-shadow: inset 0 0 0 1px rgba(50, 195, 116, 0.24);
}

.result-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.result-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: #264737;
}

.result-info strong {
  font-size: 15px;
  font-weight: 600;
}

.result-info span {
  font-size: 13px;
  color: #58725f;
}

.result-arrow {
  font-size: 16px;
  color: #2a5942;
  opacity: 0.6;
}

.add-friend-empty {
  margin-top: 24px;
  padding: 18px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.76);
  color: #51705f;
  font-size: 14px;
  text-align: center;
  box-shadow: inset 0 0 0 1px rgba(198, 221, 207, 0.52);
}

.add-friend-detail {
  margin-top: 28px;
  padding-top: 20px;
  border-top: 1px solid rgba(198, 221, 207, 0.6);
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.detail-profile {
  display: flex;
  align-items: center;
  gap: 16px;
}

.detail-avatar {
  width: 86px;
  height: 86px;
  border-radius: 24px;
  overflow: hidden;
  background: rgba(50, 195, 116, 0.16);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: #1d7a4b;
  font-weight: 700;
  box-shadow: inset 0 0 0 1px rgba(50, 195, 116, 0.26);
}

.detail-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.detail-info h4 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #1f3526;
}

.detail-info p {
  margin: 6px 0 0;
  color: #58725f;
  font-size: 14px;
}

.add-friend-action {
  align-self: flex-start;
  border: none;
  border-radius: 18px;
  padding: 12px 28px;
  background: linear-gradient(135deg, #32c374, #1da368);
  color: #ffffff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 18px 30px rgba(45, 176, 103, 0.3);
  transition: transform 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease;
}

.add-friend-action:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}

.add-friend-action:not(:disabled):hover {
  transform: translateY(-2px);
  box-shadow: 0 24px 34px rgba(45, 176, 103, 0.36);
}

@keyframes addFriendSpin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .add-friend-overlay {
    align-items: flex-end;
    padding: 24px 16px;
  }

  .add-friend-card {
    width: 100%;
    padding: 24px 22px 28px;
    border-radius: 22px;
  }

  .add-friend-search-field {
    flex-direction: column;
  }

  .add-friend-search-field button {
    width: 100%;
    height: 44px;
  }

  .detail-profile {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .detail-avatar {
    width: 72px;
    height: 72px;
    border-radius: 20px;
  }

  .add-friend-action {
    width: 100%;
    text-align: center;
  }
}
</style>
