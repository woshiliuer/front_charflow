import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'ChatBreezeShowcase',
      component: () => import('../components/chat/ChatBreeze.vue'),
      meta: { showcase: '简约蓝白消息中心' },
    },
  ],
})

export default router
