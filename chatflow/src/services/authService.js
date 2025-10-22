import { apiClient } from './apiClient'

export const validateAuthToken = async () => {
  try {
    const { data } = await apiClient.get('/user/token/validate')
    return data === true
  } catch (error) {
    return false
  }
}
