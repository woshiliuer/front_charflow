import { apiClient } from '@/services/apiClient'

export const fetchSocialFeedList = async ({ page = 1, size = 10, content = '' } = {}) => {
  const { data } = await apiClient.post('/socialFeed/list', {
    page,
    size,
    content: content || '',
  })
  return data || { feedList: [], total: 0 }
}

export const fetchSocialFeedDetail = async (feedId) => {
  const { data } = await apiClient.post('/socialFeed/detail', { param: feedId })
  return data ?? null
}

export const publishSocialFeed = async ({ content = '', files = [] } = {}) => {
  const payload = {
    content: content || '',
    files: Array.isArray(files) ? files : [],
  }
  return apiClient.post('/socialFeed/publish', payload)
}

export const likeSocialFeed = async (feedId) => {
  return apiClient.post('/socialFeedLike/like', { param: feedId })
}

export const unlikeSocialFeed = async (feedId) => {
  return apiClient.post('/socialFeedLike/unlike', { param: feedId })
}

export const commentSocialFeed = async ({ feedId, content } = {}) => {
  return apiClient.post('/socialFeedComment/comment', {
    feedId,
    content,
  })
}

export const deleteSocialFeedComment = async (commentId) => {
  return apiClient.post('/socialFeedComment/delete', { param: commentId })
}

export const deleteSocialFeed = async (feedId) => {
  return apiClient.post('/socialFeed/delete', { param: feedId })
}

export const uploadSocialFeedFile = async (file) => {
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await apiClient.postForm('/file/socialFeed/upload', formData)
  return data ?? null
}

export const uploadSocialFeedFiles = async (files = []) => {
  const formData = new FormData()
  const list = Array.isArray(files) ? files : []
  list.forEach((f) => {
    if (f) formData.append('files', f)
  })
  const { data } = await apiClient.postForm('/file/socialFeed/uploadBatch', formData)
  return data ?? []
}
