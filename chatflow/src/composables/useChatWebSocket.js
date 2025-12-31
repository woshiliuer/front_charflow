import { ref, computed } from 'vue'
import websocketService from '@/services/websocketService'
import { ElMessage } from 'element-plus'
import 'element-plus/es/components/message/style/css'

/**
 * Chat WebSocket Composable
 * 封装聊天相关的 WebSocket 逻辑
 * 
 * 注意：WebSocket仅用于接收消息推送，发送消息请使用REST API
 */
export function useChatWebSocket(options = {}) {
  const { 
    currentUserId, 
    conversations, 
    activeConversationId,
    messagesByConversation,
    onMessageReceived,
  } = options

  const isConnected = ref(false)
  const connecting = ref(false)

  /**
   * 初始化 WebSocket 连接
   */
  const connect = async () => {
    if (connecting.value || isConnected.value) {
      return
    }

    if (!currentUserId?.value) {
      return
    }

    connecting.value = true

    try {
      await websocketService.connect({
        onConnect: (frame) => {
          isConnected.value = true
          connecting.value = false
          ElMessage.success('已连接实时消息服务')

          // 订阅私信队列 - 用于接收一对一消息推送
          websocketService.subscribe('/user/queue/pm', handlePrivateMessage)

          // 订阅在线用户数量变化（可选）
          websocketService.subscribe('/topic/online-count', handleOnlineCountUpdate)
        },
        onDisconnect: (event) => {
          isConnected.value = false
          connecting.value = false
          ElMessage.warning('实时消息连接已断开')
        },
        onError: (error) => {
          isConnected.value = false
          connecting.value = false
          ElMessage.error('实时消息连接错误')
        },
      })
    } catch (error) {
      isConnected.value = false
      connecting.value = false
      ElMessage.error('无法连接实时消息服务')
    }
  }

  /**
   * 断开连接
   */
  const disconnect = () => {
    websocketService.disconnect()
    isConnected.value = false
    connecting.value = false
  }

  /**
   * 处理私信消息
   */
  const handlePrivateMessage = (message, rawMessage) => {
    console.log('[WebSocket] 收到私信消息:', message)
    
    if (onMessageReceived) {
      onMessageReceived(message)
      return
    }

    // 默认处理逻辑
    const conversationId = message.conversationId || message.sessionId || message.to || message.from || message.senderId

    if (!conversationId) {
      console.warn('[WebSocket] 无法确定会话ID，消息被忽略:', message)
      return
    }

    // 兼容后端字段：from 或 senderId
    const senderId = message.from || message.senderId
    const isFromMe = String(senderId) === String(currentUserId.value)
    
    console.log(`[WebSocket] 处理消息 - 会话ID: ${conversationId}, 发送者: ${senderId}, 是自己: ${isFromMe}`)

    // 如果是当前查看的会话，直接添加消息
    if (activeConversationId?.value && (
      activeConversationId.value === Number(conversationId) || 
      String(activeConversationId.value) === String(conversationId)
    )) {
      addMessageToThread(conversationId, message, isFromMe)
      
      // ⭐ 关键：如果是别人发来的消息且正在查看该会话，立即标记为已读
      if (!isFromMe) {
        import('@/services/messageService').then(({ markAsRead }) => {
          markAsRead(conversationId)
        })
      }
    } else {
      // 否则更新会话列表（只有别人发来的消息才增加未读）
      if (!isFromMe && updateConversationWithNewMessage) {
        updateConversationWithNewMessage(conversationId, message)
      }
    }
  }

  /**
   * 处理在线用户数量更新
   */
  const handleOnlineCountUpdate = (message, rawMessage) => {
    if (message.type === 'ONLINE_COUNT_UPDATE') {
      console.log('在线用户数:', message.count)
      // 可以在这里触发UI更新
    }
  }

  /**
   * 添加消息到线程（默认实现）
   */
  const addMessageToThread = (conversationId, message, isFromMe) => {
    if (!messagesByConversation?.value) {
      return
    }

    if (!messagesByConversation.value[conversationId]) {
      messagesByConversation.value[conversationId] = []
    }

    const conversation = conversations?.value?.find((conv) =>
      String(conv.id) === String(conversationId)
    )
    const contactName = conversation?.displayName || conversation?.nameEn || '对方'

    const role = isFromMe ? 'self' : 'contact'
    const author = isFromMe ? '我' : contactName

    // 检查是否已存在（去重）
    const existingMessage = messagesByConversation.value[conversationId].find((msg) => {
      if (message.sequence && msg.sequence) {
        return msg.sequence === message.sequence
      }
      if (message.id && msg.id) {
        return String(msg.id) === String(message.id)
      }
      return false
    })

    if (existingMessage) {
      if (message.status !== undefined) {
        existingMessage.status = message.status
      }
      if (message.avatarFullUrl) {
        existingMessage.avatarFullUrl = message.avatarFullUrl
      }
      return
    }

    const newMessage = {
      id: message.id || message.messageId || message.sequence || Date.now(),
      role,
      author,
      text: message.text || message.content || '',
      avatarFullUrl: message.avatarFullUrl || '',
      time: formatMessageTime(message.sendTime || Date.now()),
      sendTime: message.sendTime || Date.now(),
      sequence: message.sequence,
      status: message.status !== undefined ? message.status : 1,
    }

    messagesByConversation.value[conversationId].push(newMessage)

    // 排序
    messagesByConversation.value[conversationId].sort((a, b) => {
      if (a.sequence && b.sequence) {
        return a.sequence - b.sequence
      }
      if (a.sendTime && b.sendTime) {
        return a.sendTime - b.sendTime
      }
      return 0
    })
  }

  /**
   * 格式化会话时间
   */
  const formatConversationClock = (timestamp) => {
    if (!timestamp || !Number.isFinite(Number(timestamp))) return ''
    let ms = Number(timestamp)
    if (ms < 1e12) {
      ms *= 1000
    }
    const date = new Date(ms)
    if (Number.isNaN(date.getTime())) return ''
    const now = new Date()
    const sameDay = date.toDateString() === now.toDateString()
    const sameYear = date.getFullYear() === now.getFullYear()
    if (sameDay) {
      return date.toLocaleTimeString('zh-CN', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
      })
    }
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    if (sameYear) {
      return `${month}-${day}`
    }
    return `${date.getFullYear()}-${month}-${day}`
  }

  /**
   * 更新会话的新消息提示（默认实现）
   */
  const updateConversationWithNewMessage = (conversationId, message) => {
    if (!conversations?.value) {
      return
    }

    const conversation = conversations.value.find((conv) =>
      String(conv.id) === String(conversationId) || Number(conv.id) === Number(conversationId)
    )

    if (conversation) {
      // 兼容后端字段：from 或 senderId
      const senderId = message.from || message.senderId
      const isFromMe = String(senderId) === String(currentUserId.value)
      if (!isFromMe) {
        conversation.unread = (conversation.unread || 0) + 1
      }

      conversation.snippet = message.text || message.content || ''
      conversation.content = message.text || message.content || ''
      conversation.sendTime = message.sendTime || Date.now()
      conversation.clock = formatConversationClock(conversation.sendTime)
      
      // 缓存消息
      if (messagesByConversation?.value) {
        if (!messagesByConversation.value[conversationId]) {
          messagesByConversation.value[conversationId] = []
        }
        addMessageToThread(conversationId, message, isFromMe)
      }
    }
  }

  /**
   * 格式化消息时间
   */
  const formatMessageTime = (timestamp) => {
    if (!timestamp || !Number.isFinite(Number(timestamp))) return ''
    let ms = Number(timestamp)
    if (ms < 1e12) {
      ms *= 1000
    }
    const date = new Date(ms)
    if (Number.isNaN(date.getTime())) return ''
    const now = new Date()
    const sameDay = date.toDateString() === now.toDateString()
    
    if (sameDay) {
      return date.toLocaleTimeString('zh-CN', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
      })
    }
    
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    const isYesterday = date.toDateString() === yesterday.toDateString()
    
    if (isYesterday) {
      return `昨天 ${date.toLocaleTimeString('zh-CN', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
      })}`
    }
    
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${month}-${day} ${date.toLocaleTimeString('zh-CN', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    })}`
  }

  return {
    isConnected: computed(() => isConnected.value),
    connecting: computed(() => connecting.value),
    connect,
    disconnect,
  }
}

