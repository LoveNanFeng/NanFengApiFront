import { requestClient } from '#/api/request';

export namespace SiteConfigApi {
  export interface Config {
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
}

interface UploadFileParams {
  file: File;
  onError?: (error: Error) => void;
  onProgress?: (progress: { percent: number }) => void;
  onSuccess?: (data: any, file: File) => void;
}

async function getSiteConfig() {
  return requestClient.get<SiteConfigApi.Config>('/site/admin/config');
}

async function getPublicSiteConfig() {
  return requestClient.get<SiteConfigApi.Config>('/site/config');
}

async function updateSiteConfig(data: SiteConfigApi.Config) {
  return requestClient.put('/site/admin/config', data);
}

async function uploadSiteLogo({
  file,
  onError,
  onProgress,
  onSuccess,
}: UploadFileParams) {
  try {
    onProgress?.({ percent: 0 });
    const data = await requestClient.upload('/upload/site-logo', { file });
    onProgress?.({ percent: 100 });
    onSuccess?.(data, file);
  } catch (error) {
    onError?.(error instanceof Error ? error : new Error(String(error)));
  }
}

export {
  getPublicSiteConfig,
  getSiteConfig,
  updateSiteConfig,
  uploadSiteLogo,
};
