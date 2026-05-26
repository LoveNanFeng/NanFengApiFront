import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'mdi:account-cog',
      order: 9996,
      title: $t('system.user.title'),
    },
    name: 'UserManagement',
    path: '/user',
    children: [
      {
        path: '/user/list',
        name: 'SystemUser',
        meta: {
          icon: 'mdi:account',
          title: $t('system.user.listTitle'),
        },
        component: () => import('#/views/system/user/list.vue'),
      },
      {
        path: '/user/role',
        name: 'SystemRole',
        meta: {
          icon: 'mdi:account-group',
          title: $t('system.role.title'),
        },
        component: () => import('#/views/system/role/list.vue'),
      },
    ],
  },
];

export default routes;
