import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    component: () => import('#/views/notice/admin/list.vue'),
    meta: {
      icon: 'mdi:clipboard-text-outline',
      order: 9991,
      title: '公告列表',
    },
    name: 'NoticeAdminList',
    path: '/notice-admin/list',
  },
  {
    component: () => import('#/views/notice/admin/home-notice/index.vue'),
    meta: {
      icon: 'mdi:bullhorn-variant-outline',
      order: 9991,
      title: '首页公告配置',
    },
    name: 'NoticeHomeNotice',
    path: '/notice-admin/home-notice',
  },
  {
    component: () => import('#/views/notice/user/list.vue'),
    meta: {
      icon: 'mdi:bullhorn-outline',
      order: 9991,
      title: '公告列表',
    },
    name: 'UserNoticeCenter',
    path: '/notice',
  },
];

export default routes;
