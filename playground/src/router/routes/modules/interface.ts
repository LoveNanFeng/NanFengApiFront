import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    component: () => import('#/views/interface/list.vue'),
    meta: {
      icon: 'mdi:api',
      order: 9995,
      title: $t('system.interface.listTitle'),
    },
    name: 'InterfaceList',
    path: '/interface/list',
  },
  {
    component: () => import('#/views/interface/log.vue'),
    meta: {
      icon: 'mdi:clipboard-text-clock',
      order: 9994,
      title: $t('system.interface.callLogTitle'),
    },
    name: 'InterfaceCallLog',
    path: '/interface/log',
  },
];

export default routes;
