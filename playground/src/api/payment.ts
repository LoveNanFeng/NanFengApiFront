import type { PaymentOrderApi } from '#/api/system/payment';

import { requestClient } from '#/api/request';

export namespace RechargeApi {
  export type ClientType = 'AUTO' | 'DESKTOP' | 'MOBILE';
  export type PayProduct = 'AUTO' | 'FACE' | 'PAGE' | 'WAP';
  export type PayChannel = 'ALIPAY' | 'BALANCE';
  export type RechargeStatus = 'CLOSED' | 'FAILED' | 'PAID' | 'PENDING';

  export interface RechargeAmountOption {
    amount: number | string;
    creditAmount?: number | string;
    giftAmount: number | string;
    id: string;
    sortNo?: number;
  }

  export interface Capabilities {
    amountOptions?: RechargeAmountOption[];
    desktopDefault: Exclude<PayProduct, 'AUTO'>;
    enabled: boolean;
    facePayEnabled: boolean;
    mobileDefault: Exclude<PayProduct, 'AUTO'>;
    wapPayEnabled: boolean;
    websitePayEnabled: boolean;
  }

  export interface CreateOrderPayload {
    amount: number | string;
    clientType: ClientType;
    preferredProduct?: PayProduct;
  }

  export interface RechargeOrder {
    alipayMethod?: string;
    amount: string;
    creditAmount?: number | string;
    expireTime?: string;
    formActionUrl?: null | string;
    formHtml?: null | string;
    formParams?: null | Record<string, string>;
    gatewayUrl?: null | string;
    giftAmount?: number | string;
    orderNo: string;
    paidTime?: string;
    payProduct: Exclude<PayProduct, 'AUTO'>;
    payProductName?: string;
    paymentUrl?: null | string;
    qrCode?: null | string;
    status: RechargeStatus;
    tradeNo?: string;
  }

  export interface PackageOrderPayload {
    clientType?: ClientType;
    payChannel: PayChannel;
    preferredProduct?: PayProduct;
    specId?: string;
  }

  export interface PackagePaymentOrder {
    alipayMethod?: string;
    amount: string;
    expireTime?: string;
    formActionUrl?: null | string;
    formHtml?: null | string;
    formParams?: null | Record<string, string>;
    gatewayUrl?: null | string;
    opened?: boolean;
    orderNo: string;
    paidTime?: string;
    payChannel: PayChannel;
    payProduct: Exclude<PayProduct, 'AUTO'> | 'BALANCE';
    payProductName?: string;
    paymentUrl?: null | string;
    qrCode?: null | string;
    status: RechargeStatus;
    tradeNo?: string;
  }
}

async function getRechargeCapabilities() {
  return requestClient.get<RechargeApi.Capabilities>(
    '/payment/recharge/capabilities',
  );
}

async function createRechargeOrder(data: RechargeApi.CreateOrderPayload) {
  return requestClient.post<RechargeApi.RechargeOrder>(
    '/payment/recharge/orders',
    data,
  );
}

async function getRechargeOrder(orderNo: string) {
  return requestClient.get<RechargeApi.RechargeOrder>(
    `/payment/recharge/orders/${orderNo}`,
  );
}

async function syncRechargeOrder(orderNo: string) {
  return requestClient.post<RechargeApi.RechargeOrder>(
    `/payment/recharge/orders/${orderNo}/sync`,
    {},
  );
}

async function getMyPaymentOrderList(params: PaymentOrderApi.OrderListParams) {
  return requestClient.get<{
    items: PaymentOrderApi.PaymentOrder[];
    total: number;
  }>('/payment/orders/list', { params });
}

async function createGlobalPackagePaymentOrder(
  id: string,
  data: RechargeApi.PackageOrderPayload,
) {
  return requestClient.post<RechargeApi.PackagePaymentOrder>(
    `/payment/package/global/${id}/orders`,
    data,
  );
}

async function createInterfacePackagePaymentOrder(
  id: string,
  data: RechargeApi.PackageOrderPayload,
) {
  return requestClient.post<RechargeApi.PackagePaymentOrder>(
    `/payment/package/interface/${id}/orders`,
    data,
  );
}

async function createPointPackagePaymentOrder(
  id: string,
  data: RechargeApi.PackageOrderPayload,
) {
  return requestClient.post<RechargeApi.PackagePaymentOrder>(
    `/payment/package/point/${id}/orders`,
    data,
  );
}

export {
  createGlobalPackagePaymentOrder,
  createInterfacePackagePaymentOrder,
  createPointPackagePaymentOrder,
  createRechargeOrder,
  getMyPaymentOrderList,
  getRechargeCapabilities,
  getRechargeOrder,
  syncRechargeOrder,
};
