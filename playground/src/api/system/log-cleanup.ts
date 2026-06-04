import { requestClient } from '#/api/request';

export namespace UserLogCleanupApi {
  export interface Config {
    cleanupTime: string;
    enabled: 0 | 1;
    lastHiddenCount: number | string;
    lastRunTime?: null | string;
    retentionDays: number;
  }
}

async function getUserLogCleanupConfig() {
  return requestClient.get<UserLogCleanupApi.Config>(
    '/system/user-log-cleanup/config',
  );
}

async function updateUserLogCleanupConfig(data: UserLogCleanupApi.Config) {
  return requestClient.put('/system/user-log-cleanup/config', data);
}

export { getUserLogCleanupConfig, updateUserLogCleanupConfig };
