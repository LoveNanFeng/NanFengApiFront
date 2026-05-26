import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeTableGridColumns } from '#/adapter/vxe-table';
import type { PackageApi } from '#/api/package';

import { $t } from '#/locales';

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'keyword',
      label: $t('system.package.keyword'),
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
      component: 'Input',
      fieldName: 'name',
      label: $t('system.package.name'),
      rules: 'required',
    },
    {
      component: 'InputNumber',
      componentProps: {
        min: 0,
        precision: 4,
      },
      defaultValue: 0,
      fieldName: 'price',
      label: $t('system.package.price'),
      rules: 'required',
    },
    {
      component: 'InputNumber',
      componentProps: {
        min: 1,
        precision: 0,
      },
      defaultValue: 100,
      fieldName: 'pointAmount',
      label: $t('system.package.pointAmount'),
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
        rows: 4,
      },
      fieldName: 'remark',
      label: $t('system.package.remark'),
    },
  ];
}

export function useColumns<T = PackageApi.PointPackage>(
  onActionClick: OnActionClickFn<T>,
): VxeTableGridColumns {
  return [
    {
      field: 'name',
      minWidth: 180,
      title: $t('system.package.name'),
    },
    {
      field: 'price',
      formatter: ({ cellValue }) => Number(cellValue ?? 0).toFixed(4),
      title: $t('system.package.price'),
      width: 120,
    },
    {
      field: 'pointAmount',
      formatter: ({ cellValue }) =>
        $t('system.package.pointAmountText', [
          Number(cellValue ?? 0).toLocaleString('zh-CN'),
        ]),
      title: $t('system.package.pointAmount'),
      width: 160,
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
          { code: 'edit', text: $t('common.edit') },
          { code: 'delete', danger: true, text: $t('common.delete') },
        ],
      },
      field: 'operation',
      fixed: 'right',
      title: $t('system.package.operation'),
      width: 160,
    },
  ];
}
