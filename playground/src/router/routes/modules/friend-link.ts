import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    component: () => import('#/views/friend-link/list.vue'),
    meta: {
      icon: 'mdi:link-box-variant-outline',
      order: 9990,
      title: '友链列表',
    },
    name: 'FriendLinkList',
    path: '/friend-link/list',
  },
  {
    component: () => import('#/views/friend-link/applications.vue'),
    meta: {
      icon: 'mdi:link-plus',
      order: 9990,
      title: '友链申请',
    },
    name: 'FriendLinkApplication',
    path: '/friend-link/applications',
  },
];

export default routes;
