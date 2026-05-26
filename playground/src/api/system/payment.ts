import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

export namespace PaymentConfigApi {
  export interface AlipayConfig {
    alipayPublicKey: string;
    appId: string;
    charsetName: 'UTF-8';
    enabled: 0 | 1;
    facePayEnabled: 0 | 1;
    formatType: 'JSON';
    gatewayUrl: string;
    merchantPrivateKey: string;
    notifyUrl: string;
    remark?: string;
    returnUrl?: string;
    signType: 'RSA' | 'RSA2';
    updateTime?: null | string;
    wapPayEnabled: 0 | 1;
    websitePayEnabled: 0 | 1;
  }
}

export namespace PaymentOrderApi {
  export type OrderStatus = 'CLOSED' | 'FAILED' | 'PAID' | 'PENDING';
  export type OrderType =
    | 'GLOBAL_PACKAGE'
    | 'INTERFACE_PACKAGE'
    | 'POINT_PACKAGE'
    | 'RECHARGE';
  export type PayChannel = 'ALIPAY' | 'BALANCE';

  export interface OrderListParams extends Recordable<any> {
    keyword?: string;
    orderType?: 'ALL' | OrderType;
    page?: number;
    pageSize?: number;
    payChannel?: PayChannel;
    status?: OrderStatus;
  }

  export interface PaymentOrder {
    alipayMethod?: string;
    amount: number | string;
    bizId?: string;
    bizName?: string;
    body?: string;
    buyerId?: string;
    clientType?: string;
    createTime?: string;
    expireTime?: string;
    giftAmount?: number | string;
    id: string;
    orderNo: string;
    orderType: OrderType;
    paidTime?: string;
    payChannel: PayChannel;
    payProduct?: string;
    realName?: string;
    status: OrderStatus;
    subject: string;
    tradeNo?: string;
    userId: string;
    username: string;
  }
}

export namespace RechargeAmountApi {
  export interface RechargeAmount {
    amount: number | string;
    createTime?: string;
    giftAmount: number | string;
    id: string;
    remark?: string;
    sortNo: number;
    status: 0 | 1;
    updateTime?: string;
  }

  export interface ListParams extends Recordable<any> {
    keyword?: string;
    page?: number;
    pageSize?: number;
    status?: 0 | 1;
  }

  export interface SaveRechargeAmount {
    amount: number | string;
    giftAmount: number | string;
    remark?: string;
    sortNo?: number;
    status?: 0 | 1;
  }
}

async function getAlipayConfig() {
  return requestClient.get<PaymentConfigApi.AlipayConfig>(
    '/system/payment/alipay-config',
  );
}

async function updateAlipayConfig(data: PaymentConfigApi.AlipayConfig) {
  return requestClient.put('/system/payment/alipay-config', data);
}

async function validateAlipayConfig(data: PaymentConfigApi.AlipayConfig) {
  return requestClient.post('/system/payment/alipay-config/validate', data);
}

async function getPaymentOrderList(params: PaymentOrderApi.OrderListParams) {
  return requestClient.get<{
    items: PaymentOrderApi.PaymentOrder[];
    total: number;
  }>('/system/payment/orders/list', { params });
}

async function getRechargeAmountList(
  params: RechargeAmountApi.ListParams,
) {
  return requestClient.get<{
    items: RechargeAmountApi.RechargeAmount[];
    total: number;
  }>('/system/payment/amount-config/list', { params });
}

async function createRechargeAmount(
  data: RechargeAmountApi.SaveRechargeAmount,
) {
  return requestClient.post('/system/payment/amount-config', data);
}

async function updateRechargeAmount(
  id: string,
  data: RechargeAmountApi.SaveRechargeAmount,
) {
  return requestClient.put(`/system/payment/amount-config/${id}`, data);
}

async function updateRechargeAmountStatus(id: string, status: 0 | 1) {
  return requestClient.put(`/system/payment/amount-config/${id}/status`, {
    status,
  });
}

async function deleteRechargeAmount(id: string) {
  return requestClient.delete(`/system/payment/amount-config/${id}`);
}

export {
  createRechargeAmount,
  deleteRechargeAmount,
  getAlipayConfig,
  getPaymentOrderList,
  getRechargeAmountList,
  updateAlipayConfig,
  updateRechargeAmount,
  updateRechargeAmountStatus,
  validateAlipayConfig,
};
