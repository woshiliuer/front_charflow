<template>
  <div class="chat-breeze">
    <aside class="sidebar-toolbar">
      <div class="toolbar-avatar">
        <img :src="currentUser.avatar" :alt="currentUser.name" />
      </div>
      <ul class="toolbar-actions">
        <li v-for="action in toolbarActions" :key="action.id">
          <button :title="action.label">
            <span aria-hidden="true">{{ action.icon }}</span>
            <span class="sr-only">{{ action.label }}</span>
          </button>
        </li>
      </ul>
    </aside>

    <aside class="sidebar" :style="{ width: sidebarWidth + 'px' }">
      <header class="sidebar-header">
        <h1>Messages 消息</h1>
        <div class="tools">
          <button title="设置">
            <span aria-hidden="true">⚙</span>
            <span class="sr-only">Settings</span>
          </button>
          <button title="新建会话">
            <span aria-hidden="true">＋</span>
            <span class="sr-only">New conversation</span>
          </button>
        </div>
      </header>

      <div class="search">
        <input
          type="text"
          placeholder="Search conversations... 搜索会话..."
          v-model="searchTerm"
        />
        <button title="搜索">
          <span aria-hidden="true">🔍</span>
          <span class="sr-only">Search</span>
        </button>
      </div>

      <ul class="conversation-list">
        <li
          v-for="item in filteredConversations"
          :key="item.id"
          :class="{ active: item.id === activeConversationId }"
          @click="selectConversation(item.id)"
        >
          <div class="avatar">
            <img :src="item.avatar" :alt="item.nameEn" />
            <span :class="['status', item.status]" />
          </div>

          <div class="info">
            <div class="row">
              <div class="name-block">
                <strong>{{ item.nameEn }}</strong>
              </div>
            </div>
            <p>{{ item.snippet }}</p>
          </div>

          <div class="meta">
            <span class="time"> {{ item.clock }}</span>
            <span v-if="item.unread" class="badge">{{ item.unread }}</span>
          </div>
        </li>
      </ul>

      <div
        class="resize-handle"
        :class="{ active: isResizing }"
        @mousedown="onResizeMouseDown"
      />
    </aside>

    <section class="welcome">
      <header class="highlight-bar">
        <div v-for="item in highlights" :key="item.id" class="highlight">
          <img :src="item.avatar" :alt="item.name" />
          <span>{{ item.name }}</span>
        </div>

          
      </header>

        <!-- 加入分割线 -->
      <div class="divider"></div>

      <main v-if="!selectedConversation" class="empty-state">
        <div class="icon">💬</div>
        <h2>Welcome to Messages 欢迎浏览留言</h2>
        <p>
          Select a conversation from the sidebar to start chatting with your contacts.<br />
          从侧边栏中选择一个对话，开始与联系人聊天。
        </p>

        <ul class="features">
          <li><span>🔒</span> End-to-end encrypted 端到端加密</li>
          <li><span>⏱</span> Real-time sync 实时同步</li>
          <li><span>📊</span> Insights 精确洞察</li>
        </ul>
      </main>

      <section v-else class="conversation-view">
        <header>
          <div class="title">
            <h2>{{ selectedConversation.displayName }}</h2>
          </div>
        </header>

        <ul class="message-list">
          <li
            v-for="message in selectedThread"
            :key="message.id"
            :class="['message', message.role]"
          >
            <div class="message-avatar">
              <img
                :src="message.role === 'self' ? currentUser.avatar : selectedConversation.avatar"
                :alt="message.role === 'self' ? currentUser.name : message.author"
              />
            </div>
            <div class="bubble">
              <p>{{ message.text }}</p>

            </div>
          </li>
        </ul>

        <footer class="composer">
          <input type="text" placeholder="输入消息..." v-model="draft" />
          <button type="button">发送</button>
        </footer>
      </section>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'

const conversations = [
  {
    id: 1,
    nameEn: 'Sarah Johnson',
    nameCn: '莎拉·约翰逊',
    period: '下午',
    clock: '2:30',
    snippet: 'Hey! How are you doing today? 嗨，你今天过得怎么样？',
    unread: 3,
    status: 'online',
    avatar: 'https://randomuser.me/api/portraits/women/9.jpg',
  },
  {
    id: 2,
    nameEn: 'Design Team',
    nameCn: '设计团队',
    period: '下午',
    clock: '1:45',
    snippet: '[Image] 新的 banner 请确认',
    unread: 12,
    status: 'online',
    avatar: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=120&q=80',
  },
  {
    id: 3,
    nameEn: 'Mike Chen',
    nameCn: '麦克·陈',
    period: '中午',
    clock: '12:20',
    snippet: '[Voice Message] 语音留言待听',
    unread: 0,
    status: 'away',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
  },
  {
    id: 4,
    nameEn: 'Project Alpha',
    nameCn: '项目甲',
    period: '上午',
    clock: '11:30',
    snippet: 'Meeting scheduled for 3 PM. 会议下午 3 点开始',
    unread: 5,
    status: 'online',
    avatar: 'https://images.unsplash.com/photo-1522196772883-393d879eb14d?auto=format&fit=crop&w=120&q=80',
  },
  {
    id: 5,
    nameEn: 'Emma Wilson',
    nameCn: '艾玛·威尔逊',
    period: '上午',
    clock: '10:15',
    snippet: '[File] PRD 初稿在附件',
    unread: 0,
    status: 'offline',
    avatar: 'https://randomuser.me/api/portraits/women/17.jpg',
  },
  {
    id: 6,
    nameEn: 'Development Team',
    nameCn: '研发团队',
    period: '昨天',
    clock: '20:05',
    snippet: 'Bug fixes have been deployed. 缺陷修复已部署',
    unread: 0,
    status: 'online',
    avatar: 'https://images.unsplash.com/photo-1454165205744-3b78555e5572?auto=format&fit=crop&w=120&q=80',
  },
]

const highlights = [
  {
    id: 1,
    name: 'Sarah 莎拉',
    avatar: 'https://randomuser.me/api/portraits/women/9.jpg',
  },
  {
    id: 3,
    name: 'Mike 麦克',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
  },
  {
    id: 5,
    name: 'Emma 艾玛',
    avatar: 'https://randomuser.me/api/portraits/women/17.jpg',
  },
]

const currentUser = {
  name: 'You 你',
  avatar: 'https://i.pravatar.cc/150?img=68',
}

const toolbarActions = [
  { id: 'conversations', icon: '💬', label: '会话' },
  { id: 'contacts', icon: '👥', label: '联系人' },
  { id: 'settings', icon: '⚙️', label: '设置' },
]

const threads = {
  1: [
    {
      id: 1,
      role: 'contact',
      author: 'Sarah Johnson',
      text: 'Hey! How are you doing today? 嗨，你今天过得怎么样？',
      time: '14:25',
    },
    {
      id: 2,
      role: 'self',
      author: '我',
      text: '状态不错，刚整理完信息卡片。稍后发给你。',
      time: '14:27',
    },
  ],
  2: [
    {
      id: 1,
      role: 'contact',
      author: 'Design Team',
      text: '新的配色方案已经发到群里邮件。',
      time: '13:40',
    },
    {
      id: 2,
      role: 'self',
      author: '我',
      text: '收到，我会在今晚前反馈，感谢。',
      time: '13:42',
    },
  ],
  3: [
    {
      id: 1,
      role: 'contact',
      author: 'Mike Chen',
      text: '开会资料已经上传到云盘。',
      time: '12:20',
    },
    {
      id: 2,
      role: 'self',
      author: '我',
      text: '好的，我午餐后立即查看。',
      time: '12:22',
    },
  ],
  4: [
    {
      id: 1,
      role: 'contact',
      author: 'Project Alpha',
      text: '别忘了下午的同步会议。',
      time: '11:30',
    },
    {
      id: 2,
      role: 'self',
      author: '我',
      text: '放心，我会提前十分钟准备。',
      time: '11:33',
    },
  ],
  5: [
    {
      id: 1,
      role: 'contact',
      author: 'Emma Wilson',
      text: '附件里是初版 PRD，请审阅。',
      time: '10:15',
    },
    {
      id: 2,
      role: 'self',
      author: '我',
      text: '谢谢，稍后给你反馈意见。',
      time: '10:18',
    },
  ],
  6: [
    {
      id: 1,
      role: 'contact',
      author: 'Development Team',
      text: 'Bug 修复已经上线，请关注监控。',
      time: '昨天 20:05',
    },
    {
      id: 2,
      role: 'self',
      author: '我',
      text: '收到，如有异常我会第一时间报告。',
      time: '昨天 20:10',
    },
  ],
}

const activeConversationId = ref(null)
const sidebarWidth = ref(320)
const isResizing = ref(false)
const startX = ref(0)
const startWidth = ref(sidebarWidth.value)
const searchTerm = ref('')
const draft = ref('')

const filteredConversations = computed(() => {
  if (!searchTerm.value.trim()) return conversations
  const keyword = searchTerm.value.trim().toLowerCase()
  return conversations.filter((item) => {
    return (
      item.nameEn.toLowerCase().includes(keyword) ||
      item.nameCn.includes(keyword) ||
      item.snippet.toLowerCase().includes(keyword)
    )
  })
})

const selectConversation = (id) => {
  activeConversationId.value = id
}

const selectedConversation = computed(() => {
  const convo = conversations.find((item) => item.id === activeConversationId.value)
  if (!convo) return null
  return {
    ...convo,
    displayName: `${convo.nameEn}`,
  }
})

const selectedThread = computed(() => {
  if (!activeConversationId.value) return []
  return threads[activeConversationId.value] || []
})

const onResizeMouseDown = (event) => {
  isResizing.value = true
  startX.value = event.clientX
  startWidth.value = sidebarWidth.value
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}

const onMouseMove = (event) => {
  if (!isResizing.value) return
  const delta = event.clientX - startX.value
  const newWidth = Math.min(480, Math.max(220, startWidth.value + delta))
  sidebarWidth.value = newWidth
}

const onMouseUp = () => {
  if (!isResizing.value) return
  isResizing.value = false
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
}

onBeforeUnmount(() => {
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
})
</script>

<style scoped>
.chat-breeze {
  display: flex;
  min-height: 100vh;
  background: linear-gradient(135deg, #f1f7f3 0%, #f8fbf7 100%);
  color: #1f3526;
  font-family: 'Inter', 'Noto Sans SC', 'Microsoft YaHei', sans-serif;
}

.sidebar-toolbar {
  width: 72px;
  padding: 32px 0 32px;
  background: rgba(255, 255, 255, 0.92);
  border-right: 1px solid #e6efe5;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.toolbar-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0 8px 18px rgba(32, 78, 55, 0.18);
}

.toolbar-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.toolbar-actions {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
}

.toolbar-actions li button {
  width: 44px;
  height: 44px;
  border-radius: 16px;
  border: none;
  background: linear-gradient(145deg, #ecf5ef, #ffffff);
  box-shadow: 0 10px 20px rgba(54, 102, 74, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.toolbar-actions li button:hover {
  transform: translateY(-3px);
  box-shadow: 0 16px 26px rgba(54, 102, 74, 0.18);
}

.toolbar-actions li button:focus-visible {
  outline: 3px solid rgba(52, 192, 115, 0.38);
  outline-offset: 3px;
}

.sidebar {
  position: relative;
  min-width: 260px;
  max-width: 480px;
  padding: 32px 28px;
  background: #ffffff;
  border-right: 1px solid #e6efe5;
  box-shadow: 14px 0 34px rgba(82, 128, 102, 0.08);
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.sidebar-header h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.tools {
  display: flex;
  gap: 12px;
}

.tools button {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: #eef7f0;
  color: #1c7c4f;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.tools button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(33, 132, 82, 0.15);
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

.conversation-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
}

.conversation-list li {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 18px;
  padding: 14px 16px;
  border-radius: 18px;
  background: transparent;
  cursor: pointer;
  transition: background 0.2s ease, box-shadow 0.2s ease;
  align-items: center;
}

.conversation-list li:hover {
  background: rgba(223, 240, 230, 0.6);
  box-shadow: 0 10px 18px rgba(67, 120, 92, 0.1);
}

.conversation-list li.active {
  background: linear-gradient(135deg, rgba(50, 195, 116, 0.18), rgba(29, 163, 104, 0.12));
  box-shadow: 0 14px 20px rgba(69, 145, 101, 0.18);
}

.avatar {
  position: relative;
  width: 48px;
  height: 48px;
}

.avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  box-shadow: 0 6px 12px rgba(40, 76, 58, 0.18);
}

.avatar .status {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid #ffffff;
}

.avatar .status.online {
  background: #31c173;
}

.avatar .status.away {
  background: #f4b43a;
}

.avatar .status.offline {
  background: #c0c9c3;
}

.info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.info .row {
  display: flex;
  align-items: center;
  align-items: flex-start; /* 顶部对齐 */
}



.name-block {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.name-block strong {
  font-size: 15px;
  line-height: 1.2;
}

.name-block {
  font-size: 12px;
  color: #728b78;
}

.info p {
  margin: 0;
  font-size: 13px;
  color: #56725f;
}

.meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  font-size: 12px;
  color: #728b78;
}

.meta .badge {
  background: linear-gradient(135deg, #f66d6d, #e74b4b);
  color: #fff;
  width: 18px;
  height: 18px;
  border-radius: 50%;            /* 完全圆形 */
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;               /* 字体更细 */
  font-weight: 600;
  line-height: 1;
  box-shadow: 0 2px 6px rgba(231, 75, 75, 0.25);
}


.resize-handle {
  position: absolute;
  top: 0;
  right: -6px;
  width: 12px;
  height: 100%;
  cursor: col-resize;
  background: transparent;
}

.resize-handle::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 2px;
  height: 64px;
  background: rgba(97, 126, 108, 0.16);
  border-radius: 999px;
}

.resize-handle.active::after {
  background: rgba(60, 196, 125, 0.5);
}

.welcome {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 40px 52px;
}

.highlight-bar {
  display: flex;
  gap: 18px;
  align-items: center;

}

.divider {
  width: 100%;
  height: 1px;
  margin: 0.75rem auto 0.5rem;
  background-color: #ccc;
  border-radius: 2px;
}



.highlight {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  transition: transform 0.2s ease;
}

.highlight:hover {
  transform: translateY(-4px);
}

.highlight:hover img {
  transform: scale(1.05);
  box-shadow: 0 14px 28px rgba(58, 96, 74, 0.22);
}

.highlight img {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid rgba(61, 191, 117, 0.85);
  box-shadow: 0 8px 18px rgba(58, 96, 74, 0.18);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.highlight span {
  font-size: 13px;
  color: #425b4a;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 18px;
  color: #31513d;
  text-align: center;
}

.empty-state .icon {
  width: 96px;
  height: 96px;
  border-radius: 28px;
  background: rgba(49, 193, 115, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 42px;
  color: #2b9c67;
}

.empty-state h2 {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
}

.empty-state p {
  margin: 0;
  font-size: 14px;
  line-height: 1.7;
  color: #4f6b58;
}

.features {
  list-style: none;
  margin: 18px auto 0;
  padding: 0;
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
  max-width: 420px;
}

.features li {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  border-radius: 16px;
  background: #ffffff;
  color: #325342;
  font-size: 13px;
  box-shadow: 0 10px 18px rgba(66, 103, 82, 0.12);
}

.conversation-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 18px 0;
  color: #2b4738;
}

.conversation-view header .title {
  display: flex;
  align-items: baseline;
  gap: 16px;
}

.conversation-view header h2 {
  margin: 0;
  font-size: 26px;
  font-weight: 700;
}

.conversation-view header span {
  font-size: 14px;
  color: #6b8574;
}

.conversation-view header p {
  margin: 12px 0 0;
  color: #58725f;
  font-size: 14px;
}

.message-list {
  flex: 1;
  list-style: none;
  margin: 24px 0 0;
  padding: 0 6px 0 0;
  display: flex;
  flex-direction: column;
  gap: 18px;
  overflow-y: auto;
}

.message {
  display: flex;
  align-items: flex-end;
  gap: 12px;
}

.message.contact {
  flex-direction: row;
}

.message.self {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  border: 2px solid rgba(255, 255, 255, 0.92);
  box-shadow: 0 6px 16px rgba(45, 75, 58, 0.14);
  align-self: flex-start;
}

.message-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.message.self .message-avatar {
  border-color: rgba(50, 195, 116, 0.6);
}

.bubble {
  max-width: 58%;
  background: #ffffff;
  border: 1px solid rgba(198, 221, 207, 0.8);
  border-radius: 14px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-shadow: 0 10px 20px rgba(58, 96, 74, 0.08);
}

.message.self .bubble {
  background: linear-gradient(135deg, #32c374, #1da368);
  color: #0f2e1f;
  border-color: transparent;
}


.message.self .bubble .author {
  color: rgba(12, 51, 32, 0.72);
}

.bubble p {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
}



.composer {
  margin-top: 32px;
  display: flex;
  gap: 12px;
}

.composer input {
  flex: 1;
  border: 1px solid #d3e4d9;
  border-radius: 14px;
  padding: 12px 16px;
  font-size: 14px;
  color: #1f3526;
  background: rgba(255, 255, 255, 0.92);
}

.composer input:focus {
  outline: none;
  border-color: #34c073;
  box-shadow: 0 0 0 3px rgba(52, 192, 115, 0.18);
}

.composer button {
  border: none;
  background: linear-gradient(135deg, #32c374, #1da368);
  color: #ffffff;
  border-radius: 14px;
  padding: 0 18px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 12px 20px rgba(45, 176, 103, 0.22);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.composer button:hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 24px rgba(45, 176, 103, 0.28);
}

@media (max-width: 1024px) {
  .sidebar {
    padding: 24px;
  }

  .sidebar-toolbar {
    width: 64px;
    padding: 24px 0;
  }

  .welcome {
    padding: 32px;
  }
}

@media (max-width: 768px) {
  .chat-breeze {
    flex-direction: column;
  }

  .sidebar-toolbar {
    display: none;
  }

  .sidebar {
    width: 100% !important;
    min-width: 0;
    max-width: none;
    border-right: none;
    border-bottom: 1px solid #edf0f2;
    box-shadow: none;
  }

  .resize-handle {
    display: none;
  }

  .welcome {
    padding: 24px;
  }

  .features {
    flex-direction: column;
    align-items: stretch;
  }

  .bubble {
    max-width: 72%;
  }
}
</style>
