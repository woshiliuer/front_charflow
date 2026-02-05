import { apiClient } from './apiClient'

/**
 * 从消息收藏
 * @param {Object} data { conversationId, messageId }
 */
export const collectFromMessage = (data) => {
  return apiClient.post('/favoriteItem/collectFromMessage', data)
}

/**
 * 获取收藏列表
 */
export const fetchFavoriteList = () => {
  return apiClient.post('/favoriteItem/list')
}

/**
 * 获取收藏详情
 * @param {Number|String} favoriteId
 */
export const fetchFavoriteDetail = (favoriteId) => {
  return apiClient.post('/favoriteItem/detail', { param: favoriteId })
}

/**
 * 删除收藏
 * @param {Number|String} favoriteId
 */
export const deleteFavorite = (favoriteId) => {
  return apiClient.post('/favoriteItem/delete', { param: favoriteId })
}
