import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeTableGridColumns } from '#/adapter/vxe-table';
import type { SystemUserApi } from '#/api/system/user';

import { getRoleList } from '#/api/system/role';
import { $t } from '#/locales';

async function fetchRoleOptions() {
  const result = (await getRoleList({ page: 1, pageSize: 100 })) as any;
  return Array.isArray(result) ? result : result.items;
}

export { fetchRoleOptions };

function userStatusOptions() {
  return [
    { color: 'success', label: $t('system.user.statusNormal'), value: 1 },
    { color: 'error', label: $t('system.user.statusBanned'), value: 0 },
  ];
}

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'keyword',
      label: $t('system.user.keyword'),
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: userStatusOptions(),
      },
      fieldName: 'status',
      label: $t('system.user.status'),
    },
    {
      component: 'ApiSelect',
      componentProps: {
        allowClear: true,
        api: fetchRoleOptions,
        labelField: 'name',
        valueField: 'id',
      },
      fieldName: 'roleId',
      label: $t('system.user.roles'),
    },
  ];
}

export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'username',
      label: $t('system.user.username'),
      rules: 'required',
    },
    {
      component: 'Input',
      fieldName: 'realName',
      label: $t('system.user.realName'),
      rules: 'required',
    },
    {
      component: 'InputPassword',
      componentProps: {
        placeholder: $t('system.user.passwordPlaceholder'),
      },
      fieldName: 'password',
      label: $t('system.user.password'),
    },
    {
      component: 'ApiSelect',
      componentProps: {
        api: fetchRoleOptions,
        labelField: 'name',
        mode: 'multiple',
        valueField: 'id',
      },
      fieldName: 'roleIds',
      label: $t('system.user.roles'),
      rules: 'selectRequired',
    },
    {
      component: 'Input',
      fieldName: 'email',
      label: $t('system.user.email'),
    },
    {
      component: 'Input',
      fieldName: 'mobile',
      label: $t('system.user.mobile'),
    },
    {
      component: 'InputNumber',
      componentProps: {
        min: 0,
        precision: 4,
        style: 'width: 100%',
      },
      defaultValue: 0,
      fieldName: 'balance',
      label: $t('system.user.balance'),
      rules: 'required',
    },
    {
      component: 'InputNumber',
      componentProps: {
        min: 0,
        precision: 0,
        style: 'width: 100%',
      },
      defaultValue: 0,
      fieldName: 'points',
      label: $t('system.user.points'),
      rules: 'required',
    },
    {
      component: 'RadioGroup',
      componentProps: {
        buttonStyle: 'solid',
        options: userStatusOptions(),
        optionType: 'button',
      },
      defaultValue: 1,
      fieldName: 'status',
      label: $t('system.user.status'),
    },
  ];
}

export function useColumns<T = SystemUserApi.SystemUser>(
  onActionClick: OnActionClickFn<T>,
): VxeTableGridColumns {
  return [
    {
      field: 'username',
      title: $t('system.user.username'),
      width: 160,
    },
    {
      field: 'realName',
      title: $t('system.user.realName'),
      width: 160,
    },
    {
      field: 'mobile',
      title: $t('system.user.mobile'),
      width: 160,
    },
    {
      field: 'email',
      minWidth: 180,
      title: $t('system.user.email'),
    },
    {
      field: 'roles',
      formatter: ({ cellValue }) =>
        Array.isArray(cellValue) ? cellValue.join('、') : cellValue,
      title: $t('system.user.roles'),
      width: 180,
    },
    {
      field: 'balance',
      formatter: ({ cellValue }) => Number(cellValue ?? 0).toFixed(4),
      title: $t('system.user.balance'),
      width: 120,
    },
    {
      field: 'points',
      formatter: ({ cellValue }) => Number(cellValue ?? 0).toLocaleString(),
      title: $t('system.user.points'),
      width: 120,
    },
    {
      field: 'totalRequests',
      formatter: ({ cellValue }) => Number(cellValue ?? 0).toLocaleString(),
      title: $t('system.user.totalRequests'),
      width: 140,
    },
    {
      cellRender: { name: 'CellTag', options: userStatusOptions() },
      field: 'status',
      title: $t('system.user.status'),
      width: 100,
    },
    {
      field: 'lastLoginTime',
      title: $t('system.user.lastLoginTime'),
      width: 180,
    },
    {
      field: 'createTime',
      title: $t('system.user.createTime'),
      width: 180,
    },
    {
      align: 'center',
      cellRender: {
        attrs: {
          nameField: 'username',
          nameTitle: $t('system.user.username'),
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          { code: 'edit', text: $t('common.edit') },
          {
            code: 'specifiedResponse',
            text: $t('system.user.specifiedResponseManage'),
          },
          {
            code: 'delete',
            danger: true,
            text: $t('common.delete'),
          },
        ],
      },
      field: 'operation',
      fixed: 'right',
      title: $t('system.user.operation'),
      width: 240,
    },
  ];
}
