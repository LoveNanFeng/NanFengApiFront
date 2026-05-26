import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    component: () => import('#/views/key/list.vue'),
    meta: {
      icon: 'mdi:key-chain',
      order: 9994,
      title: $t('system.key.title'),
    },
    name: 'KeyManagement',
    path: '/key',
  },
];

export default routes;
