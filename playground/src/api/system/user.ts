import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

export namespace SystemUserApi {
  export interface SystemUser {
    balance?: number | string;
    createTime?: string;
    email?: string;
    homePath?: string;
    id: string;
    lastLoginTime?: string;
    mobile?: string;
    realName: string;
    roleIds: number[];
    roles: string[];
    points?: number | string;
    specifiedResponseBillable?: 0 | 1;
    specifiedResponseEnabled?: 0 | 1;
    status: 0 | 1;
    totalRequests?: number | string;
    username: string;
  }

  export interface SaveUser {
    balance?: number | string;
    email?: string;
    homePath?: string;
    mobile?: string;
    password?: string;
    points?: number | string;
    realName?: string;
    roleIds?: number[];
    status?: 0 | 1;
    username: string;
  }

  export interface SpecifiedResponseConfig {
    specifiedResponseBillable: 0 | 1;
    specifiedResponseBody: string;
    specifiedResponseEnabled: 0 | 1;
  }

  export interface UserListParams extends Recordable<any> {
    keyword?: string;
    page?: number;
    pageSize?: number;
    roleId?: number;
    status?: 0 | 1;
  }
}

async function getUserList(params: SystemUserApi.UserListParams) {
  return requestClient.get<{
    items: SystemUserApi.SystemUser[];
    total: number;
  }>('/system/user/list', { params });
}

async function createUser(data: SystemUserApi.SaveUser) {
  return requestClient.post('/system/user', data);
}

async function updateUser(id: string, data: SystemUserApi.SaveUser) {
  return requestClient.put(`/system/user/${id}`, data);
}

async function deleteUser(id: string) {
  return requestClient.delete(`/system/user/${id}`);
}

async function getUserSpecifiedResponse(id: string) {
  return requestClient.get<SystemUserApi.SpecifiedResponseConfig>(
    `/system/user/${id}/specified-response`,
  );
}

async function updateUserSpecifiedResponse(
  id: string,
  data: SystemUserApi.SpecifiedResponseConfig,
) {
  return requestClient.put(`/system/user/${id}/specified-response`, data);
}

export {
  createUser,
  deleteUser,
  getUserList,
  getUserSpecifiedResponse,
  updateUser,
  updateUserSpecifiedResponse,
};
