import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

export namespace SystemRoleApi {
  export interface SystemRole {
    [key: string]: any;
    id: number | string;
    name: string;
    permissions: Array<number | string>;
    remark?: string;
    roleKey: string;
    status: 0 | 1;
  }

  export interface SaveSystemRole {
    name?: string;
    permissions?: Array<number | string>;
    remark?: string;
    roleKey?: string;
    status?: 0 | 1;
  }
}

/**
 * 获取角色列表数据
 */
async function getRoleList(params: Recordable<any>) {
  return requestClient.get<Array<SystemRoleApi.SystemRole>>(
    '/system/role/list',
    { params },
  );
}

/**
 * 创建角色
 * @param data 角色数据
 */
async function createRole(data: SystemRoleApi.SaveSystemRole) {
  return requestClient.post('/system/role', data);
}

/**
 * 更新角色
 *
 * @param id 角色 ID
 * @param data 角色数据
 */
async function updateRole(
  id: number | string,
  data: SystemRoleApi.SaveSystemRole,
) {
  return requestClient.put(`/system/role/${id}`, data);
}

/**
 * 删除角色
 * @param id 角色 ID
 */
async function deleteRole(id: number | string) {
  return requestClient.delete(`/system/role/${id}`);
}

export { createRole, deleteRole, getRoleList, updateRole };
