import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/chat/breeze',
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('../views/LoginView.vue'),
      meta: { showcase: '登录页面' },
    },
    {
      path: '/chat/breeze',
      name: 'ChatBreezeShowcase',
      component: () => import('../views/ChatBreeze.vue'),
      meta: { showcase: '简约蓝白消息中心' },
    },
  ],
})

export default router
