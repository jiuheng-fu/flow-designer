import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/flows',
    },
    {
      path: '/flows',
      name: 'FlowList',
      component: () => import('@/views/FlowList.vue'),
    },
    {
      path: '/flow/designer/:id',
      name: 'FlowEditor',
      component: () => import('@/views/FlowEditor.vue'),
    },
    {
      path: '/test-html',
      name: 'TestHtml',
      component: () => import('@/views/TestHtml.vue'),
    },
  ],
})

export default router
