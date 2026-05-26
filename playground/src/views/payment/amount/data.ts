import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeTableGridColumns } from '#/adapter/vxe-table';
import type { RechargeAmountApi } from '#/api/system/payment';

export const statusOptions = [
  { label: '启用', value: 1 },
  { label: '禁用', value: 0 },
];

export function formatAmount(value?: number | string) {
  return `¥${Number(value ?? 0).toFixed(2)}`;
}

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      componentProps: {
        placeholder: '搜索金额、赠送金额或备注',
      },
      fieldName: 'keyword',
      label: '关键词',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: statusOptions,
      },
      fieldName: 'status',
      label: '状态',
    },
  ];
}

export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'InputNumber',
      componentProps: {
        min: 0.01,
        precision: 2,
      },
      defaultValue: 10,
      fieldName: 'amount',
      label: '充值金额',
      rules: 'required',
    },
    {
      component: 'InputNumber',
      componentProps: {
        min: 0,
        precision: 2,
      },
      defaultValue: 0,
      fieldName: 'giftAmount',
      help: '填 0 表示不赠送，支付时实际到账为充值金额加赠送金额。',
      label: '赠送金额',
      rules: 'required',
    },
    {
      component: 'InputNumber',
      componentProps: {
        min: 0,
        precision: 0,
      },
      defaultValue: 0,
      fieldName: 'sortNo',
      label: '排序号',
    },
    {
      component: 'Switch',
      componentProps: {
        checkedChildren: '启用',
        class: 'w-auto',
        unCheckedChildren: '禁用',
      },
      defaultValue: true,
      fieldName: 'status',
      label: '状态',
    },
    {
      component: 'Textarea',
      componentProps: {
        rows: 4,
      },
      fieldName: 'remark',
      label: '备注',
    },
  ];
}

export function useColumns<T = RechargeAmountApi.RechargeAmount>(
  onActionClick: OnActionClickFn<T>,
): VxeTableGridColumns {
  return [
    {
      field: 'amount',
      formatter: ({ cellValue }) => formatAmount(cellValue),
      title: '充值金额',
      width: 140,
    },
    {
      field: 'giftAmount',
      formatter: ({ cellValue }) => {
        const value = Number(cellValue ?? 0);
        return value > 0 ? formatAmount(value) : '不赠送';
      },
      title: '赠送金额',
      width: 140,
    },
    {
      field: 'creditAmount',
      formatter: ({ row }) =>
        formatAmount(Number(row.amount ?? 0) + Number(row.giftAmount ?? 0)),
      title: '实际到账',
      width: 140,
    },
    {
      cellRender: { name: 'CellTag' },
      field: 'status',
      title: '状态',
      width: 100,
    },
    {
      field: 'sortNo',
      title: '排序号',
      width: 100,
    },
    {
      field: 'remark',
      minWidth: 180,
      title: '备注',
    },
    {
      field: 'updateTime',
      title: '更新时间',
      width: 180,
    },
    {
      align: 'center',
      cellRender: {
        attrs: {
          nameField: 'amount',
          nameTitle: '充值金额',
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          { code: 'edit', text: '编辑' },
          { code: 'delete', danger: true, text: '删除' },
        ],
      },
      field: 'operation',
      fixed: 'right',
      title: '操作',
      width: 160,
    },
  ];
}
