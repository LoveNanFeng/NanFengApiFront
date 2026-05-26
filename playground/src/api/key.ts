import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

export namespace KeyApi {
  export type KeyScope = 'GLOBAL' | 'INTERFACE';

  export interface KeyItem {
    apiCode: string;
    createTime?: string;
    id: string;
    ipWhitelist?: string;
    interfaceId?: string;
    interfaceName: string;
    keyScope: KeyScope;
    paramKeys?: string[];
    pointPrice: number | string;
    price: number | string;
    requestMethod: 'GET' | 'GET_POST' | 'POST';
    secretKey: string;
    status: 0 | 1;
    updateTime?: string;
  }

  export interface InterfaceOption {
    apiCode: string;
    id: string;
    label: string;
    name: string;
    pointPrice: number | string;
    price: number | string;
    requestMethod: 'GET' | 'GET_POST' | 'POST';
  }

  export interface KeyListParams extends Recordable<any> {
    keyword?: string;
    page?: number;
    pageSize?: number;
    status?: 0 | 1;
  }
}

async function getKeyList(params: KeyApi.KeyListParams) {
  return requestClient.get<{
    items: KeyApi.KeyItem[];
    total: number;
  }>('/key/list', { params });
}

async function getKeyInterfaceOptions() {
  return requestClient.get<KeyApi.InterfaceOption[]>('/key/interface-options');
}

async function createKey(data: { interfaceId?: string; keyScope: KeyApi.KeyScope }) {
  return requestClient.post('/key', data);
}

async function updateKeyStatus(id: string, status: 0 | 1) {
  return requestClient.put(`/key/${id}/status`, { status });
}

async function regenerateKey(id: string) {
  return requestClient.post(`/key/${id}/regenerate`);
}

async function updateKeyIpWhitelist(id: string, ipWhitelist: string) {
  return requestClient.put(`/key/${id}/ip-whitelist`, { ipWhitelist });
}

async function deleteKey(id: string) {
  return requestClient.delete(`/key/${id}`);
}

export {
  createKey,
  deleteKey,
  getKeyInterfaceOptions,
  getKeyList,
  regenerateKey,
  updateKeyIpWhitelist,
  updateKeyStatus,
};
