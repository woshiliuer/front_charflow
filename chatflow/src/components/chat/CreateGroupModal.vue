<template>
  <Transition name="group-modal-fade">
    <div
      v-if="visible"
      class="group-modal-overlay"
      @click.self="emitClose"
    >
      <div class="group-modal-card">
        <button
          type="button"
          class="group-modal-close"
          aria-label="关闭创建群聊弹窗"
          @click="emitClose"
        >
          &times;
        </button>
        <header class="group-modal-header">
          <h3>创建群聊</h3>
          <p>挑选好友，开启高效协作</p>
        </header>
        <div class="group-modal-field">
          <label for="group-name">群聊名称</label>
          <input
            id="group-name"
            v-model="groupName"
            type="text"
            maxlength="32"
            placeholder="输入群聊名称"
          />
        </div>
        <div class="group-modal-members">
          <div class="group-modal-members-header">
            <h4>选择成员</h4>
            <span>{{ selectedCount }} / {{ friendList.length }}</span>
          </div>
          <div
            v-if="friendList.length"
            class="group-modal-member-list"
          >
            <label
              v-for="friend in friendList"
              :key="friend.id"
              class="group-member-item"
            >
              <input
                type="checkbox"
                :value="friend.id"
                v-model="selectedIds"
              />
              <div class="group-member-avatar">
                <img
                  v-if="friend.avatar"
                  :src="friend.avatar"
                  :alt="friend.nickname || friend.nameEn"
                />
                <span v-else>{{ getInitial(friend) }}</span>
              </div>
              <div class="group-member-info">
                <strong>{{ friend.nickname || friend.nameEn }}</strong>
                <p v-if="friend.remark">{{ friend.remark }}</p>
              </div>
              <span
                v-if="selectedIdSet.has(String(friend.id))"
                class="group-member-check"
                aria-hidden="true"
              >
                ✓
              </span>
            </label>
          </div>
          <div v-else class="group-modal-empty">
            暂无好友可以选择。
          </div>
        </div>
        <footer class="group-modal-actions">
          <button
            type="button"
            class="group-modal-button ghost"
            @click="emitClose"
          >
            取消
          </button>
          <button
            type="button"
            class="group-modal-button primary"
            :disabled="!canSubmit || submitting"
            @click="emitConfirm"
          >
            {{ submitting ? '创建中…' : '创建群聊' }}
          </button>
        </footer>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  friends: {
    type: Array,
    default: () => [],
  },
  submitting: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['close', 'confirm'])

const groupName = ref('')
const selectedIds = ref([])

const friendList = computed(() =>
  Array.isArray(props.friends) ? props.friends : [],
)

const selectedIdSet = computed(
  () => new Set(selectedIds.value.map((value) => String(value))),
)

const resetState = () => {
  groupName.value = ''
  selectedIds.value = []
}

watch(
  () => props.visible,
  (next) => {
    if (next) {
      resetState()
    }
  },
)

const selectedCount = computed(() => selectedIds.value.length)

const canSubmit = computed(() => {
  return groupName.value.trim().length > 0 && selectedIds.value.length >= 2
})

const getInitial = (friend) => {
  const source =
    friend?.nickname ||
    friend?.nameCn ||
    friend?.nameEn ||
    friend?.email ||
    ''
  const char = source.trim().charAt(0)
  return char ? char.toUpperCase() : '?'
}

const emitClose = () => {
  emit('close')
}

const emitConfirm = () => {
  if (!canSubmit.value || props.submitting) return
  const name = groupName.value.trim()
  const memberIds = [...selectedIds.value]
  const selectedSet = new Set(memberIds.map((value) => String(value)))
  const members = friendList.value.filter((friend) =>
    selectedSet.has(String(friend.id)),
  )
  emit('confirm', { name, memberIds, members })
}
</script>

<style scoped>
.group-modal-fade-enter-active,
.group-modal-fade-leave-active {
  transition: opacity 0.24s ease;
}

.group-modal-fade-enter-from,
.group-modal-fade-leave-to {
  opacity: 0;
}

.group-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 40, 27, 0.48);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 24px;
  z-index: 1400;
}

.group-modal-card {
  width: 520px;
  max-width: 100%;
  background: linear-gradient(150deg, rgba(255, 255, 255, 0.98), rgba(218, 240, 228, 0.94));
  border-radius: 28px;
  box-shadow: 0 32px 54px rgba(31, 53, 38, 0.24);
  padding: 36px 40px;
  color: #1f3526;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.group-modal-close {
  position: absolute;
  top: 22px;
  right: 26px;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.86);
  color: #2a4c38;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
  box-shadow: 0 6px 18px rgba(31, 53, 38, 0.18);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.group-modal-close:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 26px rgba(31, 53, 38, 0.26);
}

.group-modal-header h3 {
  margin: 0;
  font-size: 26px;
  font-weight: 700;
  letter-spacing: 0.01em;
}

.group-modal-header p {
  margin: 8px 0 0;
  color: #426753;
  font-size: 14px;
}

.group-modal-field {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.group-modal-field label {
  font-size: 14px;
  color: #3a5d48;
  font-weight: 600;
}

.group-modal-field input {
  height: 44px;
  border-radius: 16px;
  border: 1px solid rgba(63, 109, 80, 0.22);
  padding: 0 16px;
  background: rgba(255, 255, 255, 0.92);
  color: #1f3526;
  font-size: 15px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.group-modal-field input:focus {
  outline: none;
  border-color: rgba(63, 109, 80, 0.56);
  box-shadow: 0 0 0 4px rgba(58, 120, 87, 0.18);
}

.group-modal-members {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.group-modal-members-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #436850;
  font-size: 14px;
}

.group-modal-members-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #2e4c39;
}

.group-modal-member-list {
  max-height: 248px;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-right: 6px;
}

.group-modal-member-list::-webkit-scrollbar {
  width: 6px;
}

.group-modal-member-list::-webkit-scrollbar-thumb {
  background: rgba(63, 109, 80, 0.32);
  border-radius: 999px;
}

.group-member-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 14px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.86);
  box-shadow: 0 6px 20px rgba(31, 53, 38, 0.12);
  position: relative;
  cursor: pointer;
  transition: transform 0.16s ease, box-shadow 0.16s ease;
}

.group-member-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(31, 53, 38, 0.16);
}

.group-member-item input {
  width: 18px;
  height: 18px;
  accent-color: #3a7857;
}

.group-member-avatar {
  width: 48px;
  height: 48px;
  border-radius: 18px;
  overflow: hidden;
  flex-shrink: 0;
  background: linear-gradient(140deg, rgba(227, 241, 232, 0.98), rgba(202, 226, 211, 0.94));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: #2f513b;
  font-weight: 600;
}

.group-member-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.group-member-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: #2f513b;
}

.group-member-info strong {
  font-size: 15px;
}

.group-member-info p {
  margin: 0;
  font-size: 13px;
  color: #5b7a69;
}

.group-member-check {
  position: absolute;
  top: 12px;
  right: 18px;
  color: #2a7a53;
  font-weight: 700;
  font-size: 18px;
}

.group-modal-empty {
  text-align: center;
  padding: 60px 0;
  color: #5b7a69;
  background: rgba(255, 255, 255, 0.82);
  border-radius: 20px;
}

.group-modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.group-modal-button {
  min-width: 120px;
  height: 44px;
  border-radius: 16px;
  border: none;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease;
}

.group-modal-button.ghost {
  background: rgba(255, 255, 255, 0.86);
  color: #3a5d48;
  box-shadow: 0 8px 18px rgba(31, 53, 38, 0.12);
}

.group-modal-button.ghost:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 26px rgba(31, 53, 38, 0.18);
}

.group-modal-button.primary {
  background: linear-gradient(135deg, #47b67c, #2f9963);
  color: #ffffff;
  box-shadow: 0 14px 26px rgba(47, 153, 99, 0.32);
}

.group-modal-button.primary:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.group-modal-button.primary:not(:disabled):hover {
  transform: translateY(-2px);
  box-shadow: 0 20px 32px rgba(47, 153, 99, 0.38);
}
</style>
