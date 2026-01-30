import { apiClient } from '@/services/apiClient'

/**
 * 消息服务
 * 处理消息相关的API调用
 */

/**
 * 获取会话消息列表
 * @param {number} conversationId - 会话ID
 * @returns {Promise<Array>} 消息列表
 */
export const fetchMessageList = async (conversationId) => {
  const { data } = await apiClient.post('/message/messageList', {
    param: conversationId,
  })
  return Array.isArray(data) ? data : []
}

/**
 * 发送消息
 * @param {Object} messageData - 消息数据
 * @param {number} messageData.conversationId - 会话ID
 * @param {string} messageData.content - 消息内容
 * @param {number} [messageData.messageType=1] - 消息类型，默认为1(文本消息)
 * @returns {Promise<Object>} 发送结果，包含完整的消息对象
 */
export const sendMessage = async (messageData) => {
  const { data } = await apiClient.post('/message/send', {
    conversationId: messageData.conversationId,
    content: messageData.content,
    messageType: messageData.messageType || 1, // 默认文本消息
    messageFile: messageData.messageFile,
  })
  return data
}

export const uploadMessageFile = async (formData) => {
  return apiClient.postForm('/file/message/upload', formData)
}

/**
 * 标记会话消息为已读
 * 将指定会话的所有消息标记为已读
 * @param {number} conversationId - 会话ID
 * @returns {Promise<void>}
 */
export const markAsRead = async (conversationId) => {
  try {
    await apiClient.post('/message/markAsRead', {
      conversationId,
    })
  } catch (error) {
    console.error('标记已读失败:', error)
    // 静默失败，不影响用户体验
  }
}

