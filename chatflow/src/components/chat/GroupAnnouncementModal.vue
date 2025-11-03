<template>
  <transition name="modal-fade">
    <div v-if="visible" class="modal-root">
      <div class="modal-backdrop" @click="$emit('close')" />
      <div class="modal-panel" role="dialog" aria-modal="true">
        <header class="modal-header">
          <h3>编辑群公告</h3>
          <button type="button" class="close-button" @click="$emit('close')" aria-label="关闭">
            X
          </button>
        </header>
        <section class="modal-body">
          <textarea
            ref="textareaRef"
            v-model="draft"
            placeholder="请输入群公告内容"
            maxlength="500"
          />
          <div class="meta">
            <span class="hint">最多 500 字</span>
            <span class="timestamp" v-if="lastPublishedHint">
              最近发布：{{ lastPublishedHint }}
            </span>
          </div>
        </section>
        <footer class="modal-footer">
          <button type="button" class="ghost" @click="$emit('close')">取消</button>
          <button type="button" class="primary" :disabled="isSaving" @click="handleSave">
            <span v-if="isSaving">保存中...</span>
            <span v-else>保存</span>
          </button>
        </footer>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  content: { type: String, default: '' },
  updatedAt: { type: [Number, String, Date], default: null },
  saving: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'save'])

const draft = ref(props.content)
const textareaRef = ref(null)

const isSaving = computed(() => Boolean(props.saving))

const lastPublishedHint = computed(() => {
  const raw = props.updatedAt
  if (!raw) return ''
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  })
})

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      draft.value = props.content
      requestAnimationFrame(() => {
        textareaRef.value?.focus()
      })
    }
  },
)

watch(
  () => props.content,
  (val) => {
    if (!props.visible) {
      draft.value = val
    }
  },
)

const handleSave = () => {
  if (isSaving.value) return
  emit('save', draft.value.trim())
}
</script>

<style scoped>
.modal-root {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2100;
}

.modal-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(18, 36, 26, 0.5);
  backdrop-filter: blur(4px);
}

.modal-panel {
  position: relative;
  width: min(520px, calc(100vw - 48px));
  background: #f9fcfa;
  border-radius: 24px;
  box-shadow: 0 32px 64px rgba(20, 42, 31, 0.28);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  padding: 22px 26px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(50, 195, 116, 0.18);
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  color: #143223;
}

.close-button {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 16px;
  background: rgba(47, 101, 69, 0.12);
  color: #143223;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.2s ease;
}

.close-button:hover {
  background: rgba(50, 195, 116, 0.22);
  transform: rotate(90deg);
}

.modal-body {
  padding: 22px 26px 6px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.modal-body textarea {
  width: 100%;
  min-height: 180px;
  resize: vertical;
  border-radius: 18px;
  border: 1px solid rgba(47, 101, 69, 0.16);
  padding: 14px 16px;
  font-size: 14px;
  line-height: 1.6;
  color: #183727;
  background: rgba(255, 255, 255, 0.95);
}

.modal-body textarea:focus {
  outline: none;
  border-color: #32c374;
  box-shadow: 0 0 0 3px rgba(50, 195, 116, 0.2);
}

.meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: rgba(26, 52, 38, 0.64);
}

.modal-footer {
  padding: 16px 26px 24px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  border-top: 1px solid rgba(50, 195, 116, 0.18);
}

.modal-footer button {
  min-width: 110px;
  border-radius: 18px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.modal-footer button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
  transform: none;
  box-shadow: none;
}

.modal-footer .ghost {
  background: rgba(47, 101, 69, 0.14);
  color: #143223;
}

.modal-footer .ghost:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 10px 24px rgba(33, 66, 49, 0.18);
}

.modal-footer .primary {
  background: linear-gradient(135deg, #32c374, #1da368);
  color: #ffffff;
  box-shadow: 0 16px 28px rgba(45, 176, 103, 0.28);
}

.modal-footer .primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 20px 32px rgba(45, 176, 103, 0.34);
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

@media (max-width: 600px) {
  .modal-panel {
    width: calc(100vw - 24px);
  }
}
</style>
