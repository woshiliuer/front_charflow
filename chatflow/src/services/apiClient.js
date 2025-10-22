import { getStoredAuthToken } from '@/stores/auth'

const API_BASE_PATH = import.meta.env.VITE_API_PROXY_PATH ?? '/api'

const joinUrl = (base, path) => {
  if (!path) return base
  if (path.startsWith('http')) return path
  const baseEndsWithSlash = base.endsWith('/')
  const pathStartsWithSlash = path.startsWith('/')
  if (baseEndsWithSlash && pathStartsWithSlash) {
    return `${base}${path.slice(1)}`
  }
  if (!baseEndsWithSlash && !pathStartsWithSlash) {
    return `${base}/${path}`
  }
  return `${base}${path}`
}

const parseResponse = async (response) => {
  const contentType = response.headers.get('content-type')
  const isJson = contentType?.includes('application/json')
  const payload = isJson ? await response.json() : await response.text()

  if (!response.ok) {
    const message =
      typeof payload === 'object' && payload !== null
        ? payload.message ?? payload.error ?? '请求失败'
        : payload || '请求失败'
    throw new Error(message)
  }

  if (typeof payload === 'object' && payload !== null) {
    const { code, message, data } = payload
    if (code !== '200' && code !== 200) {
      throw new Error(message || '请求失败')
    }
    return { code, message, data }
  }

  return { code: response.status, message: 'OK', data: payload }
}

export const apiClient = {
  async get(path, options = {}) {
    const url = joinUrl(API_BASE_PATH, path)
    const headers = {
      ...(options.headers ?? {}),
    }
    const token = getStoredAuthToken()
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
    const response = await fetch(url, {
      method: 'GET',
      headers,
      ...options,
    })
    return parseResponse(response)
  },
  async post(path, body, options = {}) {
    const url = joinUrl(API_BASE_PATH, path)
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    }
    const token = getStoredAuthToken()
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      ...options,
    })
    return parseResponse(response)
  },
}
