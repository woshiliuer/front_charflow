import { createRouter, createWebHistory } from 'vue-router'
import { getStoredAuthToken, clearStoredAuthToken, useAuthStore } from '@/stores/auth'
import { validateAuthToken } from '@/services/authService'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/login',
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('../views/LoginView.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/chat',
      name: 'Chat',
      component: () => import('../views/ChatView.vue'),
      meta: { requiresAuth: true },
    },
  ],
})

const resetAuthState = () => {
  clearStoredAuthToken()
  try {
    const authStore = useAuthStore()
    authStore.clearToken()
  } catch (error) {
    console.warn('清理登录状态失败', error)
  }
}

router.beforeEach(async (to) => {
  if (import.meta.env.SSR) return true

  if (to.meta?.requiresAuth) {
    const token = getStoredAuthToken()
    if (!token) {
      resetAuthState()
      return { name: 'Login' }
    }
    const isValid = await validateAuthToken()
    if (!isValid) {
      resetAuthState()
      return { name: 'Login' }
    }
    return true
  }

  if (to.meta?.guestOnly) {
    const token = getStoredAuthToken()
    if (!token) return true
    const isValid = await validateAuthToken()
    if (isValid) {
      return { path: '/chat' }
    }
    resetAuthState()
  }

  return true
})

export default router
