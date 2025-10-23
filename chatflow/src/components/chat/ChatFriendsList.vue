<template>
  <ul class="friend-list">
    <li
      v-for="friend in friends"
      :key="friend.id"
      :class="['friend-item', { active: friend.id === activeFriendId }]"
    >
      <button type="button" @click="handleSelect(friend.id)">
        <div class="avatar">
          <img :src="friend.avatar" :alt="friend.nameEn" />
          <span v-if="friend.status" :class="['status', friend.status]" />
        </div>
        <div class="info">
          <div class="name-row">
            <strong>{{ friend.nameEn }}</strong>
            <span v-if="friend.nameCn" class="name-cn">{{ friend.nameCn }}</span>
          </div>
          <p v-if="friend.description">{{ friend.description }}</p>
        </div>
        <div class="meta">
          <span v-if="friend.lastActive" class="time">{{ friend.lastActive }}</span>
        </div>
      </button>
    </li>
  </ul>
</template>

<script setup>
const props = defineProps({
  friends: {
    type: Array,
    required: true,
  },
  activeFriendId: {
    type: [String, Number],
    default: null,
  },
})

const emit = defineEmits(['select'])

const handleSelect = (friendId) => {
  emit('select', friendId)
}
</script>

<style scoped>
.friend-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.friend-item button {
  width: 100%;
  border: none;
  background: linear-gradient(135deg, #f7fbf8, #ffffff);
  border-radius: 18px;
  padding: 16px 18px;
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
  box-shadow: 0 4px 14px rgba(60, 104, 78, 0.08);
}

.friend-item button:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 22px rgba(60, 104, 78, 0.16);
}

.friend-item.active button {
  background: linear-gradient(135deg, rgba(50, 195, 116, 0.16), rgba(29, 163, 104, 0.32));
  box-shadow: 0 14px 28px rgba(45, 176, 103, 0.18);
}

.avatar {
  position: relative;
  width: 48px;
  height: 48px;
  border-radius: 16px;
  overflow: hidden;
  flex-shrink: 0;
  box-shadow: 0 8px 18px rgba(58, 96, 74, 0.16);
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.status {
  position: absolute;
  bottom: 6px;
  right: 6px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid #ffffff;
}

.status.online {
  background: #31c374;
}

.status.away {
  background: #f7b84d;
}

.status.offline {
  background: #bcc5c0;
}

.info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  text-align: left;
  color: #2e4a3b;
}

.name-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.name-row strong {
  font-size: 16px;
  font-weight: 600;
}

.name-cn {
  font-size: 13px;
  color: #6b8574;
}

.info p {
  margin: 0;
  font-size: 13px;
  color: #58725f;
}

.meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  color: #6b8574;
  font-size: 12px;
}

.friend-item.active .meta {
  color: #1f3526;
  font-weight: 600;
}
</style>
