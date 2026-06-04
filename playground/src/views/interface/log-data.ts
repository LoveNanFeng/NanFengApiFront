import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridColumns } from '#/adapter/vxe-table';
import type { InterfaceApi } from '#/api/interface';

import { $t } from '#/locales';

import { pollingModeText } from './data';

export const callStatusOptions = [
  { label: $t('system.interface.callSuccess'), value: 1 },
  { label: $t('system.interface.callFailed'), value: 0 },
];

export const chargeTypeOptions = [
  { label: $t('system.interface.chargeMember'), value: 'MEMBER' },
  { label: $t('system.interface.chargePoint'), value: 'POINT' },
  { label: $t('system.interface.chargeBalance'), value: 'BALANCE' },
  { label: $t('system.interface.chargeFree'), value: 'FREE' },
  { label: $t('system.interface.chargeAdmin'), value: 'ADMIN' },
];

export function useCallLogGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      componentProps: {
        placeholder: $t('system.interface.callLogKeywordPlaceholder'),
      },
      fieldName: 'keyword',
      label: $t('system.interface.keyword'),
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: callStatusOptions,
      },
      fieldName: 'success',
      label: $t('system.interface.callResult'),
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: chargeTypeOptions,
      },
      fieldName: 'chargeType',
      label: $t('system.interface.chargeType'),
    },
  ];
}

export function useCallLogColumns(
  isAdmin: boolean,
): VxeTableGridColumns<InterfaceApi.CallLogItem> {
  const adminColumns = isAdmin
    ? [
        {
          field: 'userVisible',
          formatter: ({ cellValue }: any) =>
            cellValue === false || cellValue === 0 ? '已隐藏' : '用户可见',
          title: '用户侧状态',
          width: 110,
        },
        {
          field: 'upstreamUrl',
          formatter: ({ cellValue }: any) => cellValue || '-',
          minWidth: 260,
          title: '实际上游地址',
        },
        {
          field: 'upstreamSwitched',
          formatter: ({ cellValue }: any) =>
            cellValue === true || cellValue === 1 ? '是' : '否',
          title: '发生切换',
          width: 100,
        },
        {
          field: 'pollingMode',
          formatter: ({ cellValue }: any) =>
            pollingModeText(cellValue as InterfaceApi.PollingMode),
          title: '轮询模式',
          width: 120,
        },
      ]
    : [];
  return [
    {
      field: 'username',
      minWidth: 140,
      title: $t('system.interface.callUsername'),
    },
    {
      field: 'interfaceName',
      minWidth: 160,
      title: $t('system.interface.usedInterface'),
    },
    {
      field: 'requestValue',
      minWidth: 260,
      title: $t('system.interface.linkOrValue'),
    },
    {
      field: 'clientIp',
      formatter: ({ cellValue }) => cellValue || '-',
      minWidth: 150,
      title: $t('system.interface.clientIp'),
    },
    {
      field: 'clientRegion',
      formatter: ({ cellValue }) => cellValue || '-',
      minWidth: 180,
      title: $t('system.interface.clientRegion'),
    },
    ...adminColumns,
    {
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'processing', label: 'GET', value: 'GET' },
          { color: 'success', label: 'POST', value: 'POST' },
        ],
      },
      field: 'requestMethod',
      title: $t('system.interface.requestMethod'),
      width: 110,
    },
    {
      field: 'responseStatus',
      title: $t('system.interface.statusCode'),
      width: 110,
    },
    {
      field: 'elapsedMs',
      formatter: ({ cellValue }) => `${Number(cellValue ?? 0)} ms`,
      title: $t('system.interface.elapsedMs'),
      width: 110,
    },
    {
      field: 'success',
      slots: { default: 'success' },
      title: $t('system.interface.callResult'),
      width: 110,
    },
    {
      field: 'chargeType',
      slots: { default: 'chargeType' },
      title: $t('system.interface.chargeType'),
      width: 130,
    },
    {
      field: 'chargeAmount',
      formatter: ({ cellValue, row }) =>
        row.chargeType === 'POINT'
          ? `${Number(cellValue ?? 0).toLocaleString()} 点`
          : Number(cellValue ?? 0).toFixed(4),
      title: $t('system.interface.chargeAmount'),
      width: 120,
    },
    {
      field: 'errorMessage',
      minWidth: 180,
      title: $t('system.interface.errorMessage'),
    },
    {
      field: 'createTime',
      title: $t('system.interface.createTime'),
      width: 180,
    },
  ];
}
