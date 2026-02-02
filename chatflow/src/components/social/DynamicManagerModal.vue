<template>
  <Transition name="dynamic-manager-fade">
    <div v-if="visible" class="dynamic-manager-overlay" @click.self="handleClose">
      <div class="dynamic-manager-card">
        <button
          type="button"
          class="dynamic-manager-close"
          aria-label="关闭动态管理"
          @click="handleClose"
        >
          &times;
        </button>

        <header class="dynamic-manager-header">
          <h3>动态管理</h3>
          <p>后端接口开发中…</p>
        </header>

        <div class="dynamic-manager-body">
          <div class="dynamic-manager-placeholder">敬请期待</div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['close'])

const handleClose = () => {
  emit('close')
}
</script>

<style scoped>
.dynamic-manager-fade-enter-active,
.dynamic-manager-fade-leave-active {
  transition: opacity 0.24s ease;
}

.dynamic-manager-fade-enter-from,
.dynamic-manager-fade-leave-to {
  opacity: 0;
}

.dynamic-manager-overlay {
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

.dynamic-manager-card {
  width: 720px;
  max-width: 100%;
  background: linear-gradient(
    160deg,
    rgba(255, 255, 255, 0.98),
    rgba(223, 241, 231, 0.96)
  );
  border-radius: 26px;
  box-shadow: 0 34px 60px rgba(25, 54, 39, 0.28);
  padding: 32px 36px 26px;
  position: relative;
  color: #163626;
}

.dynamic-manager-close {
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

.dynamic-manager-close:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 30px rgba(18, 44, 30, 0.28);
}

.dynamic-manager-header h3 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
}

.dynamic-manager-header p {
  margin: 8px 0 0;
  color: #4a6b5b;
  font-size: 14px;
}

.dynamic-manager-body {
  margin-top: 24px;
}

.dynamic-manager-placeholder {
  padding: 18px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.76);
  color: #51705f;
  font-size: 14px;
  text-align: center;
  box-shadow: inset 0 0 0 1px rgba(198, 221, 207, 0.52);
}

@media (max-width: 768px) {
  .dynamic-manager-overlay {
    align-items: flex-end;
    padding: 24px 16px;
  }

  .dynamic-manager-card {
    width: 100%;
    padding: 24px 22px 22px;
    border-radius: 22px;
  }
}
</style>
