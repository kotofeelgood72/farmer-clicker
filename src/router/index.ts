import { createRouter, createMemoryHistory } from 'vue-router'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
    },
    {
      path: '/main',
      name: 'main',
      component: () => import('@/views/MainView.vue'),
    },
    {
      path: '/swipe',
      name: 'swipe',
      component: () => import('@/views/SwipeView.vue'),
    },
    {
      path: '/shop',
      name: 'shop',
      component: () => import('@/views/ShopView.vue'),
    },
    {
      path: '/chats',
      name: 'chats',
      component: () => import('@/views/ChatsView.vue'),
    },
    {
      path: '/chat/:id?',
      name: 'chat',
      component: () => import('@/views/ChatView.vue'),
    },
    {
      path: '/dates',
      name: 'dates',
      component: () => import('@/views/DatesView.vue'),
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('@/views/ProfileView.vue'),
    },
    {
      path: '/achievements',
      name: 'achievements',
      component: () => import('@/views/AchievementsView.vue'),
    },
    {
      path: '/date/:id?',
      name: 'date',
      component: () => import('@/views/DateSceneView.vue'),
    },
    {
      path: '/relationship/:id',
      name: 'relationship',
      component: () => import('@/views/GirlProfileView.vue'),
    },
  ],
})

export default router
