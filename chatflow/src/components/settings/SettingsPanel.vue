<template>
  <div class="settings-panel">
    <header class="settings-panel__header">
      <h2>设置</h2>
    </header>
    <ul class="settings-panel__list">
      <li v-for="item in items" :key="item.id">
        <button
          type="button"
          :class="['settings-panel__item', { active: item.id === activeItem }]"
          @click="$emit('select', item.id)"
        >
          <div class="settings-panel__item-info">
            <span class="settings-panel__title">{{ item.title }}</span>
          </div>
          <span class="settings-panel__arrow" aria-hidden="true">›</span>
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup>
const props = defineProps({
  items: {
    type: Array,
    default: () => [],
  },
  activeItem: {
    type: String,
    default: '',
  },
})

defineEmits(['select'])
</script>

<style scoped>
.settings-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 4px 0 12px;
}

.settings-panel__header {
  padding: 12px 18px 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.settings-panel__header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #1f3526;
}


.settings-panel__list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.settings-panel__item {
  width: 100%;
  border: none;
  border-radius: 18px;
  padding: 16px 18px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(235, 245, 240, 0.94));
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  cursor: pointer;
  box-shadow: 0 12px 24px rgba(20, 56, 37, 0.12);
  transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
  color: #1f3526;
}

.settings-panel__item:hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 28px rgba(20, 56, 37, 0.14);
}

.settings-panel__item.active {
  background: linear-gradient(135deg, rgba(50, 195, 116, 0.16), rgba(29, 163, 104, 0.32));
  box-shadow: 0 18px 32px rgba(45, 176, 103, 0.18);
}

.settings-panel__item-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  text-align: left;
}

.settings-panel__title {
  font-size: 15px;
  font-weight: 600;
}



.settings-panel__arrow {
  font-size: 22px;
  color: #7a9486;
}
</style>

