import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

const STORAGE_KEY = 'chatflow_auth_token'

const readInitialToken = () => {
  if (typeof window === 'undefined') return ''
  try {
    return localStorage.getItem(STORAGE_KEY) ?? ''
  } catch (error) {
    console.warn('读取本地登录状态失败', error)
    return ''
  }
}

export const getStoredAuthToken = () => {
  if (typeof window === 'undefined') return ''
  try {
    return localStorage.getItem(STORAGE_KEY) ?? ''
  } catch (error) {
    console.warn('读取本地登录状态失败', error)
    return ''
  }
}

export const clearStoredAuthToken = () => {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.warn('清理本地登录状态失败', error)
  }
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref(readInitialToken())

  const isAuthenticated = computed(() => Boolean(token.value))

  const setToken = (value) => {
    const next = value ?? ''
    token.value = next
    if (typeof window === 'undefined') return
    try {
      if (next) {
        localStorage.setItem(STORAGE_KEY, next)
      } else {
        localStorage.removeItem(STORAGE_KEY)
      }
    } catch (error) {
      console.warn('保存登录状态失败', error)
    }
  }

  const clearToken = () => {
    setToken('')
  }

  return {
    token,
    isAuthenticated,
    setToken,
    clearToken,
  }
})
