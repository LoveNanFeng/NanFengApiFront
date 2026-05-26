import { requestClient } from './request';

export namespace HomeApi {
  export interface PlatformStats {
    activeRegions24h: number;
    activeRegions24hDelta: number;
    apiTotal: number;
    availabilityPercent: number | string;
    availabilitySource: 'API_STATUS' | 'CALL_SUCCESS';
    calls24h: number;
    calls24hDeltaPercent: number | string;
    enabledApiTotal: number;
    peakQps24h: number;
    peakQps24hDelta: number;
    requestTotal: number;
    userTotal: number;
  }

  export interface RegionRankItem {
    code: string;
    name: string;
    percent: number | string;
    rank: number;
    value: number;
  }

  export interface CallTrendItem {
    date: string;
    label: string;
    value: number;
  }

  export interface HotApiItem {
    avatarUrl?: null | string;
    callCount: number;
    description?: string;
    id: number | string;
    isFeatured?: number;
    isTop?: number;
    name: string;
    pointPrice?: number;
    price?: number | string;
    requestMethod?: string;
  }

  export interface HomeNotice {
    content: string;
    enabled: 0 | 1 | number;
    id: number | string;
    updateTime?: null | string;
  }

  export interface SiteConfig {
    contactAddress?: string;
    contactEmail?: string;
    contactPhone?: string;
    contactQq?: string;
    contactWechat?: string;
    copyright?: string;
    description?: string;
    icp?: string;
    id?: number | string;
    logoUrl?: string;
    siteName: string;
    slogan?: string;
    updateTime?: null | string;
  }

  export interface Overview {
    callTrend7d: CallTrendItem[];
    gatewayProvinceCode?: string;
    gatewayProvinceName?: string;
    gatewayLocationSource?: string;
    gatewayLookupValue?: string;
    homeNotice?: HomeNotice;
    hotApis: HotApiItem[];
    regionRanking: RegionRankItem[];
    siteConfig?: SiteConfig;
    stats: PlatformStats;
  }
}

export function getHomeOverview() {
  return requestClient.get<HomeApi.Overview>('/home/overview');
}
