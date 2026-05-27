import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeTableGridColumns } from '#/adapter/vxe-table';
import type { PackageApi } from '#/api/package';

import { getPackageInterfaceOptions } from '#/api/package';
import { $t } from '#/locales';

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'keyword',
      label: $t('system.package.keyword'),
    },
    {
      component: 'ApiSelect',
      componentProps: {
        allowClear: true,
        api: getPackageInterfaceOptions,
        labelField: 'label',
        valueField: 'id',
      },
      fieldName: 'interfaceId',
      label: $t('system.package.interfaceName'),
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
      label: $t('system.package.status'),
    },
  ];
}

export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'ApiSelect',
      componentProps: {
        api: getPackageInterfaceOptions,
        labelField: 'label',
        valueField: 'id',
      },
      fieldName: 'interfaceId',
      label: $t('system.package.interfaceName'),
      rules: 'selectRequired',
    },
    {
      component: 'Input',
      fieldName: 'name',
      label: $t('system.package.name'),
      rules: 'required',
    },
    {
      component: 'Switch',
      componentProps: {
        checkedChildren: $t('system.register.enableAction'),
        class: 'w-auto',
        unCheckedChildren: $t('system.register.disableAction'),
      },
      defaultValue: true,
      fieldName: 'status',
      label: $t('system.package.status'),
    },
    {
      component: 'Textarea',
      componentProps: {
        rows: 3,
      },
      fieldName: 'remark',
      label: $t('system.package.remark'),
    },
  ];
}

export function useColumns<T = PackageApi.InterfacePackage>(
  onActionClick: OnActionClickFn<T>,
): VxeTableGridColumns {
  return [
    {
      field: 'id',
      title: 'ID',
      width: 90,
    },
    {
      field: 'interfaceName',
      minWidth: 180,
      title: $t('system.package.interfaceName'),
    },
    {
      field: 'apiCode',
      minWidth: 150,
      title: $t('system.interface.apiCode'),
    },
    {
      field: 'name',
      minWidth: 180,
      title: $t('system.package.name'),
    },
    {
      field: 'specs',
      formatter: ({ cellValue }) =>
        Array.isArray(cellValue)
          ? cellValue
              .map((item) =>
                item.id ? `#${item.id} ${item.specName}` : item.specName,
              )
              .join('、')
          : '',
      minWidth: 240,
      title: $t('system.package.specs'),
    },
    {
      cellRender: { name: 'CellTag' },
      field: 'status',
      title: $t('system.package.status'),
      width: 100,
    },
    {
      field: 'remark',
      minWidth: 180,
      title: $t('system.package.remark'),
    },
    {
      field: 'createTime',
      title: $t('system.package.createTime'),
      width: 180,
    },
    {
      align: 'center',
      cellRender: {
        attrs: {
          nameField: 'name',
          nameTitle: $t('system.package.name'),
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          { code: 'open', text: $t('system.package.openPackage') },
          { code: 'edit', text: $t('common.edit') },
          { code: 'delete', danger: true, text: $t('common.delete') },
        ],
      },
      field: 'operation',
      fixed: 'right',
      title: $t('system.package.operation'),
      width: 210,
    },
  ];
}
