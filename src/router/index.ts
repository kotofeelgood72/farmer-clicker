import { createRouter, createMemoryHistory } from 'vue-router'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      meta: { depth: 0 },
      component: () => import('@/views/HomeView.vue'),
    },
    {
      path: '/main',
      name: 'main',
      meta: { depth: 1, transitionGroup: 'tab' },
      component: () => import('@/views/MainView.vue'),
    },
    {
      path: '/swipe',
      name: 'swipe',
      meta: { depth: 1, transitionGroup: 'tab' },
      component: () => import('@/views/SwipeView.vue'),
    },
    {
      path: '/shop',
      name: 'shop',
      meta: { depth: 2 },
      component: () => import('@/views/ShopView.vue'),
    },
    {
      path: '/chats',
      name: 'chats',
      meta: { depth: 1, transitionGroup: 'tab' },
      component: () => import('@/views/ChatsView.vue'),
    },
    {
      path: '/chat/:id?',
      name: 'chat',
      meta: { depth: 2 },
      component: () => import('@/views/ChatView.vue'),
    },
    {
      path: '/dates',
      name: 'dates',
      meta: { depth: 1, transitionGroup: 'tab' },
      component: () => import('@/views/DatesView.vue'),
    },
    {
      path: '/profile',
      name: 'profile',
      meta: { depth: 1, transitionGroup: 'tab' },
      component: () => import('@/views/ProfileView.vue'),
    },
    {
      path: '/achievements',
      name: 'achievements',
      meta: { depth: 2 },
      component: () => import('@/views/AchievementsView.vue'),
    },
    {
      path: '/date/:id?',
      name: 'date',
      meta: { depth: 2 },
      component: () => import('@/views/DateSceneView.vue'),
    },
    {
      path: '/relationship/:id',
      name: 'relationship',
      meta: { depth: 3 },
      component: () => import('@/views/GirlProfileView.vue'),
    },
  ],
})

export default router
