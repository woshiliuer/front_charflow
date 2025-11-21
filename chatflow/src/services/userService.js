import { apiClient } from '@/services/apiClient'

export const logout = async () => {
  return apiClient.post('/user/logout')
}

export const getUserInfo = async () => {
  const { data } = await apiClient.get('/user/getUserInfo')
  return data ?? null
}

export const updateUserInfo = async (payload) => {
  return apiClient.post('/user/updateUserInfo', payload)
}

export const uploadAvatar = async (formData) => {
  return apiClient.postForm('/user/uploadAvatar', formData)
}
