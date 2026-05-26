import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridColumns } from '#/adapter/vxe-table';
import type { PaymentOrderApi } from '#/api/system/payment';

export const orderTypeTabs: Array<{
  label: string;
  value: 'ALL' | PaymentOrderApi.OrderType;
}> = [
  { label: '全部订单', value: 'ALL' },
  { label: '充值记录', value: 'RECHARGE' },
  { label: '全站套餐', value: 'GLOBAL_PACKAGE' },
  { label: '接口套餐', value: 'INTERFACE_PACKAGE' },
  { label: '点数套餐', value: 'POINT_PACKAGE' },
];

export const orderTypeOptions = orderTypeTabs.filter(
  (item) => item.value !== 'ALL',
);

export const statusOptions = [
  { label: '待支付', value: 'PENDING' },
  { label: '已支付', value: 'PAID' },
  { label: '支付失败', value: 'FAILED' },
  { label: '已关闭', value: 'CLOSED' },
];

export const payChannelOptions = [
  { label: '支付宝', value: 'ALIPAY' },
  { label: '余额支付', value: 'BALANCE' },
];

export const orderTypeColor: Record<PaymentOrderApi.OrderType, string> = {
  GLOBAL_PACKAGE: 'blue',
  INTERFACE_PACKAGE: 'processing',
  POINT_PACKAGE: 'cyan',
  RECHARGE: 'green',
};

export const statusColor: Record<PaymentOrderApi.OrderStatus, string> = {
  CLOSED: 'default',
  FAILED: 'error',
  PAID: 'success',
  PENDING: 'warning',
};

export const payChannelColor: Record<PaymentOrderApi.PayChannel, string> = {
  ALIPAY: 'processing',
  BALANCE: 'gold',
};

export function orderTypeLabel(value?: string) {
  return orderTypeOptions.find((item) => item.value === value)?.label || '订单';
}

export function statusLabel(value?: string) {
  return statusOptions.find((item) => item.value === value)?.label || '未知';
}

export function payChannelLabel(value?: string) {
  return payChannelOptions.find((item) => item.value === value)?.label || value || '-';
}

function formatOrderMoney(value?: number | string) {
  return `¥${Number(value ?? 0).toFixed(2)}`;
}

export function useOrderGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      componentProps: {
        placeholder: '搜索订单号、用户、交易号或订单内容',
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
      label: '订单状态',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: payChannelOptions,
      },
      fieldName: 'payChannel',
      label: '支付方式',
    },
  ];
}

export function useOrderColumns(
  showUser: boolean,
): VxeTableGridColumns<PaymentOrderApi.PaymentOrder> {
  const columns: VxeTableGridColumns<PaymentOrderApi.PaymentOrder> = [
    {
      field: 'orderNo',
      minWidth: 210,
      title: '订单号',
    },
  ];

  if (showUser) {
    columns.push({
      field: 'username',
      minWidth: 140,
      title: '用户',
    });
  }

  columns.push(
    {
      field: 'orderType',
      slots: { default: 'orderType' },
      title: '订单类型',
      width: 120,
    },
    {
      field: 'subject',
      minWidth: 190,
      title: '订单内容',
    },
    {
      field: 'amount',
      formatter: ({ cellValue }) => formatOrderMoney(cellValue),
      title: '金额',
      width: 120,
    },
    {
      field: 'giftAmount',
      formatter: ({ cellValue, row }) => {
        const value = Number(cellValue ?? 0);
        return row.orderType === 'RECHARGE' && value > 0
          ? formatOrderMoney(value)
          : '-';
      },
      title: '赠送金额',
      width: 120,
    },
    {
      field: 'payChannel',
      slots: { default: 'payChannel' },
      title: '支付方式',
      width: 120,
    },
    {
      field: 'status',
      slots: { default: 'status' },
      title: '订单状态',
      width: 110,
    },
    {
      field: 'tradeNo',
      minWidth: 180,
      title: '第三方交易号',
    },
    {
      field: 'paidTime',
      title: '支付时间',
      width: 180,
    },
    {
      field: 'createTime',
      title: '创建时间',
      width: 180,
    },
  );

  return columns;
}
