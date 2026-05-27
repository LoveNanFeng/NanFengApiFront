import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

export namespace RedeemCardApi {
  export type CardType =
    | 'BALANCE'
    | 'GLOBAL_PACKAGE'
    | 'INTERFACE_PACKAGE'
    | 'POINT_PACKAGE';

  export type OpenKeyCardType = 'BALANCE' | 'GLOBAL' | 'INTERFACE' | 'POINT';

  export interface CardItem {
    amount?: number | string;
    batchNo: string;
    cardCode: string;
    cardType: CardType;
    createTime?: string;
    expireTime?: string;
    id: string;
    packageId?: string;
    packageName?: string;
    packageScope?: string;
    pointAmount?: number;
    remark?: string;
    specId?: string;
    status: 0 | 1;
    targetUserId?: string;
    targetUsername?: string;
    used: 0 | 1;
    usedRealName?: string;
    usedTime?: string;
    usedUserId?: string;
    usedUsername?: string;
  }

  export interface LogItem {
    cardCode: string;
    cardId: string;
    cardType: CardType;
    clientIp?: string;
    createTime?: string;
    id: string;
    realName?: string;
    rewardSummary: string;
    userId: string;
    username: string;
  }

  export interface GlobalPackageOption {
    id: string;
    name: string;
    price: number | string;
    validDays: number;
  }

  export interface InterfaceSpecOption {
    interfaceId: string;
    interfaceName: string;
    label: string;
    packageId: string;
    packageName: string;
    price: number | string;
    specId: string;
    specName: string;
    validDays: number;
  }

  export interface PointPackageOption {
    id: string;
    name: string;
    pointAmount: number;
    price: number | string;
  }

  export interface GenerateOptions {
    globalPackages: GlobalPackageOption[];
    interfaceSpecs: InterfaceSpecOption[];
    pointPackages: PointPackageOption[];
  }

  export interface GeneratePayload {
    amount?: number;
    cardType: CardType;
    count: number;
    expireTime?: string;
    packageId?: string;
    remark?: string;
    specId?: string;
  }

  export interface GeneratedCard {
    cardCode: string;
    cardType: CardType;
    reward: string;
  }

  export interface GenerateResult {
    batchNo: string;
    cards: GeneratedCard[];
    count: number;
    reward: string;
  }

  export interface OpenKeyItem {
    cardType: OpenKeyCardType;
    createTime?: string;
    id: string;
    keyName: string;
    kmKey: string;
    lastUsedTime?: string;
    status: 0 | 1;
    updateTime?: string;
  }

  export interface OpenKeyPayload {
    cardType: OpenKeyCardType;
    keyName?: string;
    status?: 0 | 1;
  }

  export interface OpenKeyListParams extends Recordable<any> {
    cardType?: OpenKeyCardType;
    keyword?: string;
    page?: number;
    pageSize?: number;
    status?: 0 | 1;
  }

  export interface ListParams extends Recordable<any> {
    cardType?: CardType;
    keyword?: string;
    page?: number;
    pageSize?: number;
    used?: 0 | 1;
  }

  export interface LogParams extends Recordable<any> {
    cardType?: CardType;
    keyword?: string;
    page?: number;
    pageSize?: number;
  }
}

export function getRedeemCardList(params: RedeemCardApi.ListParams) {
  return requestClient.get<{
    items: RedeemCardApi.CardItem[];
    total: number;
  }>('/redeem-card/cards', { params });
}

export function getRedeemCardLogs(params: RedeemCardApi.LogParams) {
  return requestClient.get<{
    items: RedeemCardApi.LogItem[];
    total: number;
  }>('/redeem-card/logs', { params });
}

export function getMyRedeemCardLogs(params: RedeemCardApi.LogParams) {
  return requestClient.get<{
    items: RedeemCardApi.LogItem[];
    total: number;
  }>('/redeem-card/my-logs', { params });
}

export function getRedeemCardOptions() {
  return requestClient.get<RedeemCardApi.GenerateOptions>(
    '/redeem-card/options',
  );
}

export function generateRedeemCards(data: RedeemCardApi.GeneratePayload) {
  return requestClient.post<RedeemCardApi.GenerateResult>(
    '/redeem-card/generate',
    data,
  );
}

export function getRedeemCardOpenKeys(
  params: RedeemCardApi.OpenKeyListParams,
) {
  return requestClient.get<{
    items: RedeemCardApi.OpenKeyItem[];
    total: number;
  }>('/redeem-card/open-keys', { params });
}

export function createRedeemCardOpenKey(
  data: RedeemCardApi.OpenKeyPayload,
) {
  return requestClient.post<boolean>('/redeem-card/open-keys', data);
}

export function updateRedeemCardOpenKey(
  id: string,
  data: RedeemCardApi.OpenKeyPayload,
) {
  return requestClient.put<boolean>(`/redeem-card/open-keys/${id}`, data);
}

export function regenerateRedeemCardOpenKey(id: string) {
  return requestClient.post<{ kmKey: string }>(
    `/redeem-card/open-keys/${id}/regenerate`,
    {},
  );
}

export function deleteRedeemCardOpenKey(id: string) {
  return requestClient.delete<boolean>(`/redeem-card/open-keys/${id}`);
}

export function redeemCard(cardCode: string) {
  return requestClient.post<{
    balance?: number | string;
    cardCode: string;
    cardType: RedeemCardApi.CardType;
    reward: string;
  }>('/redeem-card/redeem', { cardCode });
}
