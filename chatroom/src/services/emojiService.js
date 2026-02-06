import { apiClient } from '@/services/apiClient'

export const fetchMyEmojiPackList = async () => {
  const { data } = await apiClient.get('/emoji/myEmojiPackList')
  return Array.isArray(data) ? data : []
}

export const fetchEmojiItems = async (packId) => {
  const { data } = await apiClient.post('/emoji/emojiItemList', {
    param: packId
  })
  return Array.isArray(data) ? data : []
}

export const fetchCustomizeEmojis = async () => {
  const { data } = await apiClient.get('/emoji/customizeEmojis')
  return Array.isArray(data) ? data : []
}

export const uploadCustomizeEmojiFile = async (formData) => {
  return apiClient.postForm('/file/customizeEmoji/upload', formData)
}

export const addCustomizeEmoji = async (emojiData) => {
  return apiClient.post('/emoji/addCustomizeEmoji', emojiData)
}

export const addEmojiFromMessageFile = async (payload) => {
  return apiClient.post('/emoji/addEmojiFromMessageFile', payload)
}

export const fetchEmojiPackList = async ({ page = 1, size = 20, name = '' } = {}) => {
  const { data } = await apiClient.post('/emoji/emojiPackList', {
    page, size, name,
  })
  return data
}

export const bindEmojiPack = async (packId) => {
  return apiClient.post('/emoji/bindEmojiPack', { param: packId })
}

export const unbindEmojiPack = async (packId) => {
  return apiClient.post('/emoji/unbindEmojiPack', { param: packId })
}

export const deleteCustomizeEmojiItem = async (emojiItemId) => {
  return apiClient.post('/emoji/deleteCustomizeEmojiItem', { param: emojiItemId })
}

export const collectEmojiItem = async (emojiItemId) => {
  return apiClient.post('/emoji/bindEmojiItem', { param: emojiItemId })
}
