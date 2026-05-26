import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

export namespace PackageApi {
  export interface GlobalPackage {
    createTime?: string;
    dailyLimit: number;
    id: string;
    name: string;
    price: number | string;
    qpsLimit: number;
    remark?: string;
    status: 0 | 1;
    updateTime?: string;
    validDays: number;
  }

  export interface InterfacePackageSpec {
    dailyLimit: number;
    id?: string;
    price: number | string;
    qpsLimit: number;
    remark?: string;
    sortNo?: number;
    specName: string;
    status: 0 | 1;
    validDays: number;
  }

  export interface InterfacePackage {
    apiCode?: string;
    createTime?: string;
    id: string;
    interfaceId: string;
    interfaceName?: string;
    name: string;
    remark?: string;
    specs: InterfacePackageSpec[];
    status: 0 | 1;
    updateTime?: string;
  }

  export interface PointPackage {
    createTime?: string;
    id: string;
    name: string;
    pointAmount: number | string;
    price: number | string;
    remark?: string;
    status: 0 | 1;
    updateTime?: string;
  }

  export interface MallGlobalPackage {
    createTime?: string;
    dailyLimit: number;
    id: string;
    name: string;
    price: number | string;
    qpsLimit: number;
    remark?: string;
    validDays: number;
  }

  export interface MallPointPackage {
    createTime?: string;
    id: string;
    name: string;
    pointAmount: number | string;
    price: number | string;
    remark?: string;
  }

  export interface MallInterfacePackageSpec {
    dailyLimit: number;
    id: string;
    packageId: string;
    price: number | string;
    qpsLimit: number;
    remark?: string;
    sortNo?: number;
    specName: string;
    validDays: number;
  }

  export interface MallInterfacePackage {
    apiCode: string;
    avatarUrl?: string;
    callCount?: number | string;
    id: string;
    interfaceId: string;
    interfaceName: string;
    interfaceRemark?: string;
    minPrice?: number | string;
    name: string;
    remark?: string;
    requestMethod: string;
    specCount?: number | string;
    specs: MallInterfacePackageSpec[];
  }

  export interface InterfaceOption {
    apiCode: string;
    id: string;
    label: string;
    name: string;
    price: number | string;
    requestMethod: string;
  }

  export interface UserOption {
    id: string;
    label: string;
    realName: string;
    username: string;
  }

  export interface ListParams extends Recordable<any> {
    interfaceId?: string;
    keyword?: string;
    page?: number;
    pageSize?: number;
    status?: 0 | 1;
  }

  export interface SaveGlobalPackage {
    dailyLimit: number;
    name: string;
    price: number | string;
    qpsLimit: number;
    remark?: string;
    status?: 0 | 1;
    validDays: number;
  }

  export interface SaveInterfacePackage {
    interfaceId: string;
    name: string;
    remark?: string;
    specs: InterfacePackageSpec[];
    status?: 0 | 1;
  }

  export interface SavePointPackage {
    name: string;
    pointAmount: number | string;
    price: number | string;
    remark?: string;
    status?: 0 | 1;
  }

  export interface OpenPackagePayload {
    expireTime?: string;
    specId?: string;
    startTime?: string;
    status?: 0 | 1;
    userId: string;
  }

  export interface PurchaseInterfacePackagePayload {
    specId: string;
  }
}

async function getGlobalPackageList(params: PackageApi.ListParams) {
  return requestClient.get<{
    items: PackageApi.GlobalPackage[];
    total: number;
  }>('/package/global/list', { params });
}

async function getMallGlobalPackageList(params: PackageApi.ListParams) {
  return requestClient.get<{
    items: PackageApi.MallGlobalPackage[];
    total: number;
  }>('/package/mall/global/list', { params });
}

async function getMallPointPackageList(params: PackageApi.ListParams) {
  return requestClient.get<{
    items: PackageApi.MallPointPackage[];
    total: number;
  }>('/package/mall/point/list', { params });
}

async function createGlobalPackage(data: PackageApi.SaveGlobalPackage) {
  return requestClient.post('/package/global', data);
}

async function updateGlobalPackage(
  id: string,
  data: PackageApi.SaveGlobalPackage,
) {
  return requestClient.put(`/package/global/${id}`, data);
}

async function deleteGlobalPackage(id: string) {
  return requestClient.delete(`/package/global/${id}`);
}

async function getInterfacePackageList(params: PackageApi.ListParams) {
  return requestClient.get<{
    items: PackageApi.InterfacePackage[];
    total: number;
  }>('/package/interface/list', { params });
}

async function getPointPackageList(params: PackageApi.ListParams) {
  return requestClient.get<{
    items: PackageApi.PointPackage[];
    total: number;
  }>('/package/point/list', { params });
}

async function getMallInterfacePackageList(params: PackageApi.ListParams) {
  return requestClient.get<{
    items: PackageApi.MallInterfacePackage[];
    total: number;
  }>('/package/mall/interface/list', { params });
}

async function getMallInterfacePackageDetail(id: string) {
  return requestClient.get<PackageApi.MallInterfacePackage>(
    `/package/mall/interface/${id}`,
  );
}

async function purchaseMallGlobalPackage(id: string) {
  return requestClient.post(`/package/mall/global/${id}/purchase`, {});
}

async function purchaseMallInterfacePackage(
  id: string,
  data: PackageApi.PurchaseInterfacePackagePayload,
) {
  return requestClient.post(`/package/mall/interface/${id}/purchase`, data);
}

async function purchaseMallPointPackage(id: string) {
  return requestClient.post(`/package/mall/point/${id}/purchase`, {});
}

async function createInterfacePackage(data: PackageApi.SaveInterfacePackage) {
  return requestClient.post('/package/interface', data);
}

async function updateInterfacePackage(
  id: string,
  data: PackageApi.SaveInterfacePackage,
) {
  return requestClient.put(`/package/interface/${id}`, data);
}

async function deleteInterfacePackage(id: string) {
  return requestClient.delete(`/package/interface/${id}`);
}

async function createPointPackage(data: PackageApi.SavePointPackage) {
  return requestClient.post('/package/point', data);
}

async function updatePointPackage(
  id: string,
  data: PackageApi.SavePointPackage,
) {
  return requestClient.put(`/package/point/${id}`, data);
}

async function deletePointPackage(id: string) {
  return requestClient.delete(`/package/point/${id}`);
}

async function getPackageInterfaceOptions() {
  return requestClient.get<PackageApi.InterfaceOption[]>(
    '/package/interface-options',
  );
}

async function getPackageUserOptions() {
  return requestClient.get<PackageApi.UserOption[]>('/package/user-options');
}

async function openGlobalPackage(
  id: string,
  data: PackageApi.OpenPackagePayload,
) {
  return requestClient.post(`/package/global/${id}/open`, data);
}

async function openInterfacePackage(
  id: string,
  data: PackageApi.OpenPackagePayload,
) {
  return requestClient.post(`/package/interface/${id}/open`, data);
}

export {
  createGlobalPackage,
  createInterfacePackage,
  createPointPackage,
  deleteGlobalPackage,
  deleteInterfacePackage,
  deletePointPackage,
  getGlobalPackageList,
  getInterfacePackageList,
  getMallGlobalPackageList,
  getMallInterfacePackageDetail,
  getMallInterfacePackageList,
  getMallPointPackageList,
  getPackageInterfaceOptions,
  getPointPackageList,
  getPackageUserOptions,
  openGlobalPackage,
  openInterfacePackage,
  purchaseMallGlobalPackage,
  purchaseMallInterfacePackage,
  purchaseMallPointPackage,
  updateGlobalPackage,
  updateInterfacePackage,
  updatePointPackage,
};
