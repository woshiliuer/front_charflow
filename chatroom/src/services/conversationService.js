import { apiClient } from '@/services/apiClient'

const normalizeConversationId = (value) => {
  if (value === null || value === undefined) {
    return null
  }
  if (typeof value === 'object') {
    if ('conversationId' in value) {
      return normalizeConversationId(value.conversationId)
    }
    if ('id' in value) {
      return normalizeConversationId(value.id)
    }
  }
  const numeric = Number(value)
  if (Number.isNaN(numeric)) {
    return value
  }
  return numeric
}

export const restoreConversationByFriend = async (friendId) => {
  if (friendId === null || friendId === undefined || friendId === '') {
    throw new Error('好友ID不能为空')
  }
  const { data } = await apiClient.post('/session/restoreByFriend', { param: friendId })
  const conversationId = normalizeConversationId(data)
  if (conversationId === null || conversationId === undefined || conversationId === '') {
    throw new Error('无法获取会话ID')
  }
  return conversationId
}

export const restoreConversationByGroup = async (groupId) => {
  if (groupId === null || groupId === undefined || groupId === '') {
    throw new Error('群聊ID不能为空')
  }
  const { data } = await apiClient.post('/session/restoreByGroup', { param: groupId })
  const conversationId = normalizeConversationId(data)
  if (conversationId === null || conversationId === undefined || conversationId === '') {
    throw new Error('无法获取会话ID')
  }
  return conversationId
}

export const createConversationWithFriend = (...args) => restoreConversationByFriend(...args)

export const fetchSessionList = async () => {
  const { data } = await apiClient.get('/session/sessionList')
  return Array.isArray(data) ? data : []
}

export const toggleFavoriteSession = async (conversationId, favorite) => {
  const endpoint = favorite ? '/session/setFavorite' : '/session/cancelFavorite'
  return apiClient.post(endpoint, { param: conversationId })
}

export const deleteSession = async (conversationId) => {
  return apiClient.post('/session/deleteSession', { param: conversationId })
}
