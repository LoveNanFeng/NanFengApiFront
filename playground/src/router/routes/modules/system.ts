import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'ion:settings-outline',
      order: 9997,
      title: $t('system.title'),
    },
    name: 'System',
    path: '/system',
    children: [
      {
        path: '/system/menu',
        name: 'SystemMenu',
        meta: {
          icon: 'mdi:menu',
          title: $t('system.menu.title'),
        },
        component: () => import('#/views/system/menu/list.vue'),
      },
      {
        path: '/system/site',
        name: 'SystemSiteConfig',
        meta: {
          icon: 'mdi:web-sync',
          title: '站点配置',
        },
        component: () => import('#/views/system/site/index.vue'),
      },
    ],
  },
  {
    meta: {
      icon: 'mdi:account-cog-outline',
      order: 9996,
      title: '注册管理',
    },
    name: 'RegisterManage',
    path: '/register',
    children: [
      {
        path: '/register/basic',
        name: 'RegisterBasicConfig',
        meta: {
          icon: 'mdi:cog-outline',
          title: '基础配置',
        },
        component: () => import('#/views/system/register/index.vue'),
      },
      {
        path: '/register/email',
        name: 'RegisterEmailConfig',
        meta: {
          icon: 'mdi:email-outline',
          title: '邮箱配置',
        },
        component: () => import('#/views/system/register/email-config.vue'),
      },
      {
        path: '/register/mobile',
        name: 'RegisterMobileConfig',
        meta: {
          icon: 'mdi:cellphone-text',
          title: '手机号配置',
        },
        component: () => import('#/views/system/register/mobile-config.vue'),
      },
    ],
  },
];

export default routes;
