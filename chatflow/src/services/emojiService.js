import { apiClient } from '@/services/apiClient'

/**
 * 表情包服务
 */

/**
 * 获取我的表情包列表
 */
export const fetchMyEmojiPackList = async () => {
  const { data } = await apiClient.get('/emoji/myEmojiPackList')
  return Array.isArray(data) ? data : []
}

/**
 * 获取表情包下的表情项
 * @param {number} packId - 表情包ID
 */
export const fetchEmojiItems = async (packId) => {
  const { data } = await apiClient.post('/emoji/emojiItemList', {
    param: packId
  })
  return Array.isArray(data) ? data : []
}

/**
 * 获取用户的自定义表情列表
 */
export const fetchCustomizeEmojis = async () => {
  const { data } = await apiClient.get('/emoji/customizeEmojis')
  return Array.isArray(data) ? data : []
}

/**
 * 上传自定义表情文件
 * @param {FormData} formData - 包含文件的FormData
 */
export const uploadCustomizeEmojiFile = async (formData) => {
  return apiClient.postForm('/file/customizeEmoji/upload', formData)
}

/**
 * 添加自定义表情
 * @param {Object} emojiData - 表情数据
 * @param {string} emojiData.name - 表情名称
 * @param {number} emojiData.type - 表情类型：2静态图 3动图
 * @param {Object} emojiData.file - 文件信息 (FileCommonDTO)
 */
export const addCustomizeEmoji = async (emojiData) => {
  return apiClient.post('/emoji/addCustomizeEmoji', emojiData)
}

/**
 * 从消息图片添加为自定义表情
 * @param {Object} payload
 * @param {string} [payload.name] - 表情名称，不传则后端使用文件名
 * @param {Object} payload.file - 文件信息 (FileCommonDTO)
 */
export const addEmojiFromMessageFile = async (payload) => {
  return apiClient.post('/emoji/addEmojiFromMessageFile', payload)
}

export const fetchEmojiPackList = async ({ page = 1, size = 20, name = '' } = {}) => {
  const { data } = await apiClient.post('/emoji/emojiPackList', {
    page,
    size,
    name,
  })
  return data
}

export const bindEmojiPack = async (packId) => {
  return apiClient.post('/emoji/bindEmojiPack', {
    param: packId,
  })
}

export const unbindEmojiPack = async (packId) => {
  return apiClient.post('/emoji/unbindEmojiPack', {
    param: packId,
  })
}

export const deleteCustomizeEmojiItem = async (emojiItemId) => {
  return apiClient.post('/emoji/deleteCustomizeEmojiItem', {
    param: emojiItemId,
  })
}

/**
 * 收藏表情项到自定义表情列表
 * @param {number} emojiItemId - 表情项ID
 */
export const collectEmojiItem = async (emojiItemId) => {
  return apiClient.post('/emoji/bindEmojiItem', {
    param: emojiItemId
  })
}
