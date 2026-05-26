import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

export namespace FriendLinkApi {
  export type LinkStatus = 0 | 1;
  export type ApplicationStatus = 'APPROVED' | 'PENDING' | 'REJECTED';

  export interface FriendLinkItem {
    applicantName?: string;
    createTime?: string;
    description?: string;
    id: string;
    logoUrl?: string;
    normalizedSiteUrl?: string;
    siteName: string;
    siteUrl: string;
    sortNo?: number;
    status: LinkStatus;
    updateTime?: string;
  }

  export interface FriendLinkApplication {
    backlinkUrl?: string;
    contactEmail: string;
    contactName: string;
    contactQq?: string;
    createTime?: string;
    description?: string;
    id: string;
    logoUrl?: string;
    normalizedSiteUrl?: string;
    rejectReason?: string;
    reviewTime?: string;
    reviewerName?: string;
    siteName: string;
    siteUrl: string;
    status: ApplicationStatus;
    updateTime?: string;
    userId?: string;
    username?: string;
  }

  export interface FriendLinkConfig {
    applyEnabled: 0 | 1;
    applyNotice?: string;
    id?: string;
    updateTime?: string;
  }

  export interface SiteInfo {
    contactEmail?: string;
    description?: string;
    logoUrl?: string;
    siteName: string;
    siteUrl?: string;
  }

  export interface PublicMeta {
    config: FriendLinkConfig;
    siteInfo: SiteInfo;
  }

  export interface ApplyStatus {
    createTime?: string;
    status?: ApplicationStatus;
    submitted: boolean;
  }

  export interface LinkListParams extends Recordable<any> {
    keyword?: string;
    page?: number;
    pageSize?: number;
    status?: LinkStatus;
  }

  export interface ApplicationListParams extends Recordable<any> {
    keyword?: string;
    page?: number;
    pageSize?: number;
    status?: ApplicationStatus;
  }

  export interface SaveLinkPayload {
    description?: string;
    logoUrl?: string;
    siteName: string;
    siteUrl: string;
    sortNo?: number;
    status: LinkStatus;
  }

  export interface ApplyPayload {
    backlinkUrl?: string;
    contactEmail?: string;
    contactName?: string;
    contactQq?: string;
    description?: string;
    logoUrl?: string;
    siteName: string;
    siteUrl: string;
  }
}

async function getPublicFriendLinks() {
  return requestClient.get<FriendLinkApi.FriendLinkItem[]>(
    '/friend-links/public/list',
  );
}

async function getPublicFriendLinkMeta() {
  return requestClient.get<FriendLinkApi.PublicMeta>(
    '/friend-links/public/meta',
  );
}

async function applyFriendLink(data: FriendLinkApi.ApplyPayload) {
  return requestClient.post('/friend-links/apply', data);
}

async function getFriendLinkApplyStatus() {
  return requestClient.get<FriendLinkApi.ApplyStatus>(
    '/friend-links/apply/status',
  );
}

async function getAdminFriendLinkList(
  params: FriendLinkApi.LinkListParams,
) {
  return requestClient.get<{
    items: FriendLinkApi.FriendLinkItem[];
    total: number;
  }>('/friend-links/admin/list', { params });
}

async function getAdminFriendLinkDetail(id: string) {
  return requestClient.get<FriendLinkApi.FriendLinkItem>(
    `/friend-links/admin/${id}`,
  );
}

async function createFriendLink(data: FriendLinkApi.SaveLinkPayload) {
  return requestClient.post('/friend-links/admin', data);
}

async function updateFriendLink(
  id: string,
  data: FriendLinkApi.SaveLinkPayload,
) {
  return requestClient.put(`/friend-links/admin/${id}`, data);
}

async function deleteFriendLink(id: string) {
  return requestClient.delete(`/friend-links/admin/${id}`);
}

async function updateFriendLinkStatus(
  id: string,
  status: FriendLinkApi.LinkStatus,
) {
  return requestClient.put(`/friend-links/admin/${id}/status`, { status });
}

async function getAdminFriendLinkApplications(
  params: FriendLinkApi.ApplicationListParams,
) {
  return requestClient.get<{
    items: FriendLinkApi.FriendLinkApplication[];
    total: number;
  }>('/friend-links/admin/applications', { params });
}

async function approveFriendLinkApplication(id: string) {
  return requestClient.put(`/friend-links/admin/applications/${id}/approve`, {});
}

async function rejectFriendLinkApplication(
  id: string,
  rejectReason?: string,
) {
  return requestClient.put(`/friend-links/admin/applications/${id}/reject`, {
    rejectReason,
  });
}

async function getAdminFriendLinkConfig() {
  return requestClient.get<FriendLinkApi.FriendLinkConfig>(
    '/friend-links/admin/config',
  );
}

async function updateAdminFriendLinkConfig(
  data: Pick<FriendLinkApi.FriendLinkConfig, 'applyEnabled' | 'applyNotice'>,
) {
  return requestClient.put('/friend-links/admin/config', data);
}

export {
  applyFriendLink,
  approveFriendLinkApplication,
  createFriendLink,
  deleteFriendLink,
  getAdminFriendLinkApplications,
  getAdminFriendLinkConfig,
  getAdminFriendLinkDetail,
  getAdminFriendLinkList,
  getFriendLinkApplyStatus,
  getPublicFriendLinkMeta,
  getPublicFriendLinks,
  rejectFriendLinkApplication,
  updateAdminFriendLinkConfig,
  updateFriendLink,
  updateFriendLinkStatus,
};
