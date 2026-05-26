import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeTableGridColumns } from '#/adapter/vxe-table';
import type { KeyApi } from '#/api/key';

import { getKeyInterfaceOptions } from '#/api/key';
import { $t } from '#/locales';

export async function fetchInterfaceOptions() {
  return await getKeyInterfaceOptions();
}

function buildOpenUrl(row: KeyApi.KeyItem) {
  if (row.keyScope === 'GLOBAL') {
    return `/open/v1/{apiCode}?key=${row.secretKey}`;
  }
  const paramText = (row.paramKeys ?? [])
    .map((key) => `&${encodeURIComponent(key)}=`)
    .join('');
  return `/open/v1/${row.apiCode}?key=${row.secretKey}${paramText}`;
}

function buildWhitelistPreview(row: KeyApi.KeyItem) {
  const value = (row.ipWhitelist ?? '').trim();
  if (!value) {
    return '-';
  }
  const items = value
    .split(/[,;\n\r]+/)
    .map((item) => item.trim())
    .filter(Boolean);
  if (items.length === 0) {
    return '-';
  }
  if (items.length <= 2) {
    return items.join(', ');
  }
  return `${items.slice(0, 2).join(', ')} +${items.length - 2}`;
}

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'keyword',
      label: $t('system.key.keyword'),
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [
          { label: $t('common.enabled'), value: 1 },
          { label: $t('common.disabled'), value: 0 },
        ],
      },
      fieldName: 'status',
      label: $t('system.key.status'),
    },
  ];
}

export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'RadioGroup',
      componentProps: {
        buttonStyle: 'solid',
        optionType: 'button',
        options: [
          { label: $t('system.key.scopeInterface'), value: 'INTERFACE' },
          { label: $t('system.key.scopeGlobal'), value: 'GLOBAL' },
        ],
      },
      defaultValue: 'INTERFACE',
      fieldName: 'keyScope',
      label: $t('system.key.keyScope'),
      rules: 'selectRequired',
    },
    {
      component: 'ApiSelect',
      componentProps: {
        api: fetchInterfaceOptions,
        labelField: 'label',
        placeholder: $t('system.key.interfacePlaceholder'),
        valueField: 'id',
      },
      dependencies: {
        if(values) {
          return values.keyScope !== 'GLOBAL';
        },
        rules(values) {
          return values.keyScope === 'GLOBAL' ? null : 'selectRequired';
        },
        triggerFields: ['keyScope'],
      },
      fieldName: 'interfaceId',
      label: $t('system.key.interfaceName'),
    },
  ];
}

export function useColumns<T = KeyApi.KeyItem>(
  onActionClick: OnActionClickFn<T>,
  onStatusChange?: (newStatus: any, row: T) => PromiseLike<boolean | undefined>,
): VxeTableGridColumns {
  return [
    {
      cellRender: {
        name: 'CellTag',
        options: [
          {
            color: 'processing',
            label: $t('system.key.scopeInterface'),
            value: 'INTERFACE',
          },
          {
            color: 'success',
            label: $t('system.key.scopeGlobal'),
            value: 'GLOBAL',
          },
        ],
      },
      field: 'keyScope',
      title: $t('system.key.keyScope'),
      width: 120,
    },
    {
      field: 'interfaceName',
      minWidth: 180,
      title: $t('system.key.interfaceName'),
    },
    {
      field: 'apiCode',
      minWidth: 160,
      title: $t('system.key.apiCode'),
    },
    {
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'processing', label: 'GET', value: 'GET' },
          { color: 'success', label: 'POST', value: 'POST' },
          { color: 'warning', label: 'GET/POST', value: 'GET_POST' },
        ],
      },
      field: 'requestMethod',
      title: $t('system.key.requestMethod'),
      width: 120,
    },
    {
      field: 'price',
      formatter: ({ cellValue, row }) =>
        (row as KeyApi.KeyItem).keyScope === 'GLOBAL'
          ? '-'
          : Number(cellValue ?? 0).toFixed(4),
      title: $t('system.key.price'),
      width: 120,
    },
    {
      field: 'pointPrice',
      formatter: ({ cellValue, row }) =>
        (row as KeyApi.KeyItem).keyScope === 'GLOBAL'
          ? '-'
          : Number(cellValue ?? 0).toLocaleString(),
      title: $t('system.interface.pointPrice'),
      width: 120,
    },
    {
      field: 'secretKey',
      minWidth: 240,
      title: $t('system.key.secretKey'),
    },
    {
      field: 'openUrl',
      formatter: ({ row }) => buildOpenUrl(row as KeyApi.KeyItem),
      minWidth: 320,
      title: $t('system.key.openUrl'),
    },
    {
      field: 'ipWhitelist',
      formatter: ({ row }) => buildWhitelistPreview(row as KeyApi.KeyItem),
      minWidth: 240,
      title: $t('system.key.ipWhitelist'),
    },
    {
      cellRender: {
        attrs: { beforeChange: onStatusChange },
        name: onStatusChange ? 'CellSwitch' : 'CellTag',
      },
      field: 'status',
      title: $t('system.key.status'),
      width: 100,
    },
    {
      field: 'createTime',
      title: $t('system.key.createTime'),
      width: 180,
    },
    {
      align: 'center',
      cellRender: {
        attrs: {
          nameField: 'interfaceName',
          nameTitle: $t('system.key.interfaceName'),
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          { code: 'ipWhitelist', text: $t('system.key.ipWhitelistManage') },
          { code: 'regenerate', text: $t('system.key.regenerate') },
          {
            code: 'delete',
            danger: true,
            text: $t('common.delete'),
          },
        ],
      },
      field: 'operation',
      fixed: 'right',
      title: $t('system.key.operation'),
      width: 240,
    },
  ];
}
