import { requestClient } from '#/api/request';

export namespace HomeNoticeConfigApi {
  export interface Config {
    content: string;
    enabled: 0 | 1;
    id?: number;
    updateTime?: null | string;
  }
}

async function getHomeNoticeConfig() {
  return requestClient.get<HomeNoticeConfigApi.Config>(
    '/notice/admin/home-config',
  );
}

async function updateHomeNoticeConfig(data: HomeNoticeConfigApi.Config) {
  return requestClient.put('/notice/admin/home-config', data);
}

export { getHomeNoticeConfig, updateHomeNoticeConfig };
