import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

export namespace InterfaceApi {
  export type RequestMethod = 'GET' | 'GET_POST' | 'POST';
  export type InvokeMethod = 'GET' | 'POST';
  export type BillingOperator = 'CONTAINS' | 'EQ' | 'GT' | 'LT' | 'NE';
  export type ChargeType = 'ADMIN' | 'BALANCE' | 'FREE' | 'MEMBER' | 'POINT';
  export type PollingMode = 'PRIMARY' | 'RANDOM' | 'ROUND_ROBIN' | 'SINGLE';

  export interface InterfaceItem {
    apiCode: string;
    avatarUrl?: string;
    callCount?: number | string;
    createTime?: string;
    docNotice?: string;
    docPreferredMethod?: '' | InvokeMethod;
    docRequestParams?: string;
    docResponseExample?: string;
    docResponseFields?: string;
    docResponseType?: 'FILE' | 'HTML' | 'JSON' | 'TEXT' | 'XML';
    docStatusCodes?: string;
    docSummary?: string;
    id: string;
    isFeatured: 0 | 1;
    isTop: 0 | 1;
    keyScope?: 'GLOBAL' | 'INTERFACE';
    keyStatus?: 0 | 1;
    name: string;
    paramKeys?: string[];
    currentNode?: number;
    currentNodeUrl?: string;
    pollingEnabled?: 0 | 1;
    pollingMode?: PollingMode;
    pointPrice: number | string;
    price: number | string;
    remark?: string;
    requestMethod: RequestMethod;
    requestUrl: string;
    secretKey?: string;
    status: 0 | 1;
    updateTime?: string;
    upstreamCount?: number;
    upstreamUrls?: string[];
  }

  export interface InterfaceListParams extends Recordable<any> {
    keyword?: string;
    isFeatured?: 0 | 1;
    page?: number;
    pageSize?: number;
    requestMethod?: RequestMethod;
    status?: 0 | 1;
  }

  export interface SaveInterface {
    apiCode?: string;
    avatarUrl?: string;
    isFeatured?: 0 | 1;
    name: string;
    isTop?: 0 | 1;
    price: number | string;
    pointPrice?: number | string;
    remark: string;
    requestMethod: RequestMethod;
    requestUrl: string;
    status?: 0 | 1;
  }

  export interface PollingConfig {
    currentNode?: number;
    currentNodeUrl?: string;
    id: string;
    name: string;
    pollingCheckEnabled?: 0 | 1;
    pollingCheckExpected?: string;
    pollingCheckField?: string;
    pollingEnabled: 0 | 1;
    pollingMode: PollingMode;
    requestUrl: string;
    upstreamCount?: number;
    upstreamConfigs?: UpstreamConfig[];
    upstreamUrls: string[];
  }

  export interface UpstreamConfig {
    pollingCheckEnabled?: 0 | 1;
    pollingCheckExpected?: string;
    pollingCheckField?: string;
    url: string;
  }

  export interface SavePollingConfig {
    pollingCheckEnabled?: 0 | 1;
    pollingCheckExpected?: string;
    pollingCheckField?: string;
    pollingEnabled?: 0 | 1;
    pollingMode?: PollingMode;
    upstreamConfigs?: UpstreamConfig[];
    upstreamUrls?: string[];
  }

  export interface InterfaceDocConfig {
    apiCode?: string;
    docNotice?: string;
    docPreferredMethod?: '' | InvokeMethod;
    docRequestParams?: string;
    docResponseExample?: string;
    docResponseFields?: string;
    docResponseType?: 'FILE' | 'HTML' | 'JSON' | 'TEXT' | 'XML';
    docStatusCodes?: string;
    docSummary?: string;
    id?: string;
    name?: string;
    requestMethod?: RequestMethod;
    requestUrl?: string;
    templateParameters?: string[];
  }

  export interface InvokePayload {
    body?: Recordable<any> | string;
    method: InvokeMethod;
    queryParams?: Recordable<any>;
  }

  export interface InvokeResult {
    apiName: string;
    billable?: boolean;
    body: string;
    chargeAmount?: number | string;
    elapsedMs: number;
    price: number | string;
    pointPrice?: number | string;
    requestMethod: InvokeMethod;
    statusCode: number;
    success: boolean;
    pollingMode?: PollingMode;
    upstreamSwitched?: boolean;
    upstreamUrl?: string;
  }

  export interface BillingRule {
    expectedValue: string;
    fieldName: string;
    id?: string;
    operator: BillingOperator;
    sortNo?: number;
  }

  export interface CallLogItem {
    apiCode: string;
    billable: boolean | number;
    chargeAmount: number | string;
    chargeType: ChargeType;
    clientIp?: string;
    clientRegion?: string;
    createTime?: string;
    elapsedMs: number;
    errorMessage?: string;
    id: string;
    interfaceId: string;
    interfaceName: string;
    realName?: string;
    requestMethod: InvokeMethod;
    requestParams?: string;
    requestValue?: string;
    responseStatus: number;
    success: boolean | number;
    pollingMode?: PollingMode;
    upstreamSwitched?: boolean | number;
    upstreamUrl?: string;
    userId: string;
    username: string;
  }

  export interface CallLogListParams extends Recordable<any> {
    chargeType?: ChargeType;
    interfaceId?: string;
    keyword?: string;
    page?: number;
    pageSize?: number;
    success?: 0 | 1;
  }
}

interface UploadFileParams {
  file: File;
  onError?: (error: Error) => void;
  onProgress?: (progress: { percent: number }) => void;
  onSuccess?: (data: any, file: File) => void;
}

async function getInterfaceList(params: InterfaceApi.InterfaceListParams) {
  return requestClient.get<{
    items: InterfaceApi.InterfaceItem[];
    total: number;
  }>('/interface/list', { params });
}

async function createInterface(data: InterfaceApi.SaveInterface) {
  return requestClient.post<InterfaceApi.InterfaceItem>('/interface', data);
}

async function updateInterface(id: string, data: InterfaceApi.SaveInterface) {
  return requestClient.put(`/interface/${id}`, data);
}

async function getInterfacePolling(id: string) {
  return requestClient.get<InterfaceApi.PollingConfig>(
    `/interface/${id}/polling`,
  );
}

async function updateInterfacePolling(
  id: string,
  data: InterfaceApi.SavePollingConfig,
) {
  return requestClient.put(`/interface/${id}/polling`, data);
}

async function getInterfaceDoc(id: string) {
  return requestClient.get<InterfaceApi.InterfaceDocConfig>(
    `/interface/${id}/doc`,
  );
}

async function updateInterfaceDoc(
  id: string,
  data: InterfaceApi.InterfaceDocConfig,
) {
  return requestClient.put(`/interface/${id}/doc`, data);
}

async function deleteInterface(id: string) {
  return requestClient.delete(`/interface/${id}`);
}

async function invokeInterface(
  id: string,
  data: InterfaceApi.InvokePayload,
) {
  return requestClient.post<InterfaceApi.InvokeResult>(
    `/interface/${id}/invoke`,
    data,
  );
}

async function getInterfaceBillingRules(id: string) {
  return requestClient.get<InterfaceApi.BillingRule[]>(
    `/interface/${id}/billing-rules`,
  );
}

async function getInterfaceCallLogList(
  params: InterfaceApi.CallLogListParams,
) {
  return requestClient.get<{
    items: InterfaceApi.CallLogItem[];
    total: number;
  }>('/interface/call-log/list', { params });
}

async function saveInterfaceBillingRules(
  id: string,
  rules: InterfaceApi.BillingRule[],
) {
  return requestClient.put(`/interface/${id}/billing-rules`, { rules });
}

async function uploadInterfaceAvatar({
  file,
  onError,
  onProgress,
  onSuccess,
}: UploadFileParams) {
  try {
    onProgress?.({ percent: 0 });
    const data = await requestClient.upload('/upload/interface-avatar', {
      file,
    });
    onProgress?.({ percent: 100 });
    onSuccess?.(data, file);
  } catch (error) {
    onError?.(error instanceof Error ? error : new Error(String(error)));
  }
}

export {
  createInterface,
  deleteInterface,
  getInterfaceBillingRules,
  getInterfaceCallLogList,
  getInterfaceDoc,
  getInterfaceList,
  getInterfacePolling,
  invokeInterface,
  saveInterfaceBillingRules,
  uploadInterfaceAvatar,
  updateInterfaceDoc,
  updateInterface,
  updateInterfacePolling,
};
