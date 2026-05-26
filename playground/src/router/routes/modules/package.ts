import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    component: () => import('#/views/package/global/list.vue'),
    meta: {
      icon: 'mdi:web',
      order: 9993,
      title: $t('system.package.globalTitle'),
    },
    name: 'GlobalPackage',
    path: '/package/global',
  },
  {
    component: () => import('#/views/package/interface/list.vue'),
    meta: {
      icon: 'mdi:package-variant',
      order: 9992,
      title: $t('system.package.interfaceTitle'),
    },
    name: 'InterfacePackage',
    path: '/package/interface',
  },
  {
    component: () => import('#/views/purchase/global/list.vue'),
    meta: {
      icon: 'mdi:shopping-outline',
      order: 9991,
      title: $t('system.package.buyGlobalTitle'),
    },
    name: 'UserGlobalPackage',
    path: '/purchase/global',
  },
  {
    component: () => import('#/views/purchase/interface/list.vue'),
    meta: {
      icon: 'mdi:shopping-outline',
      order: 9990,
      title: $t('system.package.buyInterfaceTitle'),
    },
    name: 'UserInterfacePackage',
    path: '/purchase/interface',
  },
  {
    component: () => import('#/views/purchase/interface/detail.vue'),
    meta: {
      hideInMenu: true,
      title: $t('system.package.interfacePackageBuy'),
    },
    name: 'UserInterfacePackageDetail',
    path: '/purchase/interface/detail/:id',
  },
  {
    component: () => import('#/views/purchase/point/list.vue'),
    meta: {
      icon: 'mdi:database-plus',
      order: 9989,
      title: $t('system.package.buyPointTitle'),
    },
    name: 'UserPointPackage',
    path: '/purchase/point',
  },
  {
    component: () => import('#/views/payment/order/user.vue'),
    meta: {
      icon: 'mdi:receipt-clock-outline',
      order: 9988,
      title: '交易记录',
    },
    name: 'UserPaymentOrder',
    path: '/purchase/orders',
  },
];

export default routes;
