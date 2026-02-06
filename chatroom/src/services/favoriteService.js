import { apiClient } from './apiClient'

export const collectFromMessage = (data) => {
  return apiClient.post('/favoriteItem/collectFromMessage', data)
}

export const fetchFavoriteList = () => {
  return apiClient.post('/favoriteItem/list')
}

export const fetchFavoriteDetail = (favoriteId) => {
  return apiClient.post('/favoriteItem/detail', { param: favoriteId })
}

export const deleteFavorite = (favoriteId) => {
  return apiClient.post('/favoriteItem/delete', { param: favoriteId })
}
