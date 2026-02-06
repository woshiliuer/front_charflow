import { apiClient } from '@/services/apiClient'

export const fetchMessageList = async (conversationId) => {
  const { data } = await apiClient.post('/message/messageList', {
    param: conversationId,
  })
  return Array.isArray(data) ? data : []
}

export const sendMessage = async (messageData) => {
  const { data } = await apiClient.post('/message/send', {
    conversationId: messageData.conversationId,
    content: messageData.content,
    messageType: messageData.messageType || 1,
    messageFile: messageData.messageFile,
  })
  return data
}

export const uploadMessageFile = async (formData) => {
  return apiClient.postForm('/file/message/upload', formData)
}

export const markAsRead = async (conversationId) => {
  try {
    await apiClient.post('/message/markAsRead', {
      conversationId,
    })
  } catch (error) {
    console.error('标记已读失败:', error)
  }
}
