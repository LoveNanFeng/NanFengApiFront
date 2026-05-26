import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

export namespace MarketApi {
  export type RequestMethod = 'GET' | 'GET_POST' | 'POST';
  export type PriceType = 'FREE' | 'PAID' | 'POINT';

  export interface ApiItem {
    apiCode?: string;
    avatarUrl?: string;
    callCount: number | string;
    description: string;
    id: string;
    isFeatured: 0 | 1;
    isTop: 0 | 1;
    name: string;
    pointPrice: number | string;
    price: number | string;
    priceLabel: string;
    requestMethod: RequestMethod;
    updateTime?: string;
  }

  export interface ApiParameter {
    description: string;
    exampleValue?: string;
    location: 'Body' | 'Header' | 'Path' | 'Query';
    name: string;
    placeholder?: string;
    required: boolean;
    type: string;
  }

  export interface ApiStatusCode {
    code: number | string;
    description: string;
  }

  export interface ApiResponseField {
    description: string;
    name: string;
    type: string;
  }

  export interface ApiTrendItem {
    date: string;
    label: string;
    value: number | string;
  }

  export interface ApiPricing {
    description: string;
    label: string;
    pointPrice: number | string;
    price: number | string;
  }

  export interface ApiDetail extends ApiItem {
    auth: {
      description: string;
      location: string;
      name: string;
      type: string;
    };
    gatewayPath: string;
    gatewayUrlTemplate: string;
    notice?: string;
    parameters: ApiParameter[];
    preferredMethod: RequestMethod | 'GET' | 'POST';
    pricing: ApiPricing;
    responseExample?: string;
    responseFields: ApiResponseField[];
    responseType: 'FILE' | 'HTML' | 'JSON' | 'TEXT' | 'XML';
    statusCodes: ApiStatusCode[];
    templateParameters: string[];
    callTrend7d: ApiTrendItem[];
  }

  export interface ApiTestKey {
    hasKey: boolean;
    keyScope: '' | 'GLOBAL' | 'INTERFACE';
    message: string;
    secretKey: string;
  }

  export interface ApiListParams extends Recordable<any> {
    featuredOnly?: 0 | 1;
    keyword?: string;
    page?: number;
    pageSize?: number;
    priceType?: PriceType;
    requestMethod?: RequestMethod;
  }
}

async function getMarketApis(params: MarketApi.ApiListParams) {
  return requestClient.get<{
    items: MarketApi.ApiItem[];
    total: number;
  }>('/market/apis', { params });
}

async function getMarketApiDetail(id: number | string) {
  return requestClient.get<MarketApi.ApiDetail>(`/market/apis/${id}`);
}

async function getMarketApiTestKey(id: number | string) {
  return requestClient.get<MarketApi.ApiTestKey>(`/market/apis/${id}/test-key`);
}

export { getMarketApiDetail, getMarketApis, getMarketApiTestKey };
