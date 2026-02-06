import { ref, computed } from 'vue'
import websocketService from '@/services/websocketService'

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
          websocketService.subscribe('/user/queue/pm', handlePrivateMessage)
          websocketService.subscribe('/topic/online-count', handleOnlineCountUpdate)
        },
        onDisconnect: (event) => {
          isConnected.value = false
          connecting.value = false
        },
        onError: (error) => {
          isConnected.value = false
          connecting.value = false
        },
      })
    } catch (error) {
      isConnected.value = false
      connecting.value = false
    }
  }

  const disconnect = () => {
    websocketService.disconnect()
    isConnected.value = false
    connecting.value = false
  }

  const handlePrivateMessage = (message, rawMessage) => {
    console.log('[WebSocket] 收到私信消息:', message)
    if (onMessageReceived) {
      onMessageReceived(message)
      return
    }
    const conversationId = message.conversationId || message.sessionId || message.to || message.from || message.senderId
    if (!conversationId) {
      console.warn('[WebSocket] 无法确定会话ID，消息被忽略:', message)
      return
    }
    const senderId = message.from || message.senderId
    const isFromMe = String(senderId) === String(currentUserId.value)
    if (activeConversationId?.value && (
      activeConversationId.value === Number(conversationId) ||
      String(activeConversationId.value) === String(conversationId)
    )) {
      addMessageToThread(conversationId, message, isFromMe)
      if (!isFromMe) {
        import('@/services/messageService').then(({ markAsRead }) => {
          markAsRead(conversationId)
        })
      }
    } else {
      if (!isFromMe && updateConversationWithNewMessage) {
        updateConversationWithNewMessage(conversationId, message)
      }
    }
  }

  const handleOnlineCountUpdate = (message) => {
    if (message.type === 'ONLINE_COUNT_UPDATE') {
      console.log('在线用户数:', message.count)
    }
  }

  const addMessageToThread = (conversationId, message, isFromMe) => {
    if (!messagesByConversation?.value) return
    if (!messagesByConversation.value[conversationId]) {
      messagesByConversation.value[conversationId] = []
    }
    const conversation = conversations?.value?.find((conv) =>
      String(conv.id) === String(conversationId)
    )
    const contactName = conversation?.displayName || conversation?.nameEn || '对方'
    const role = isFromMe ? 'self' : 'contact'
    const author = isFromMe ? '我' : contactName
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
      if (message.status !== undefined) existingMessage.status = message.status
      if (message.avatarFullUrl) existingMessage.avatarFullUrl = message.avatarFullUrl
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
    messagesByConversation.value[conversationId].sort((a, b) => {
      if (a.sequence && b.sequence) return a.sequence - b.sequence
      if (a.sendTime && b.sendTime) return a.sendTime - b.sendTime
      return 0
    })
  }

  const formatConversationClock = (timestamp) => {
    if (!timestamp || !Number.isFinite(Number(timestamp))) return ''
    let ms = Number(timestamp)
    if (ms < 1e12) ms *= 1000
    const date = new Date(ms)
    if (Number.isNaN(date.getTime())) return ''
    const now = new Date()
    const sameDay = date.toDateString() === now.toDateString()
    const sameYear = date.getFullYear() === now.getFullYear()
    if (sameDay) {
      return date.toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit' })
    }
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    if (sameYear) return `${month}-${day}`
    return `${date.getFullYear()}-${month}-${day}`
  }

  const updateConversationWithNewMessage = (conversationId, message) => {
    if (!conversations?.value) return
    const conversation = conversations.value.find((conv) =>
      String(conv.id) === String(conversationId) || Number(conv.id) === Number(conversationId)
    )
    if (conversation) {
      const senderId = message.from || message.senderId
      const isFromMe = String(senderId) === String(currentUserId.value)
      if (!isFromMe) {
        conversation.unread = (conversation.unread || 0) + 1
      }
      conversation.snippet = message.text || message.content || ''
      conversation.content = message.text || message.content || ''
      conversation.sendTime = message.sendTime || Date.now()
      conversation.clock = formatConversationClock(conversation.sendTime)
      if (messagesByConversation?.value) {
        if (!messagesByConversation.value[conversationId]) {
          messagesByConversation.value[conversationId] = []
        }
        addMessageToThread(conversationId, message, isFromMe)
      }
    }
  }

  const formatMessageTime = (timestamp) => {
    if (!timestamp || !Number.isFinite(Number(timestamp))) return ''
    let ms = Number(timestamp)
    if (ms < 1e12) ms *= 1000
    const date = new Date(ms)
    if (Number.isNaN(date.getTime())) return ''
    const now = new Date()
    const sameDay = date.toDateString() === now.toDateString()
    if (sameDay) {
      return date.toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit' })
    }
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    const isYesterday = date.toDateString() === yesterday.toDateString()
    if (isYesterday) {
      return `昨天 ${date.toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit' })}`
    }
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${month}-${day} ${date.toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit' })}`
  }

  return {
    isConnected: computed(() => isConnected.value),
    connecting: computed(() => connecting.value),
    connect,
    disconnect,
  }
}
