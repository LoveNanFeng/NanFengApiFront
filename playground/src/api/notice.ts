import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

export namespace NoticeApi {
  export interface NoticeItem {
    contentHtml?: string;
    createTime?: string;
    creatorName?: string;
    id: string;
    isPopup?: 0 | 1;
    isTop: 0 | 1;
    publishTime?: string;
    status?: 0 | 1;
    summary?: string;
    title: string;
    updateTime?: string;
  }

  export interface NoticeListParams extends Recordable<any> {
    isTop?: 0 | 1;
    isPopup?: 0 | 1;
    keyword?: string;
    page?: number;
    pageSize?: number;
    status?: 0 | 1;
  }

  export interface SaveNoticePayload {
    contentHtml: string;
    isPopup: 0 | 1;
    isTop: 0 | 1;
    status: 0 | 1;
    title: string;
  }
}

async function getAdminNoticeList(params: NoticeApi.NoticeListParams) {
  return requestClient.get<{
    items: NoticeApi.NoticeItem[];
    total: number;
  }>('/notice/admin/list', { params });
}

async function getAdminNoticeDetail(id: string) {
  return requestClient.get<NoticeApi.NoticeItem>(`/notice/admin/${id}`);
}

async function createNotice(data: NoticeApi.SaveNoticePayload) {
  return requestClient.post('/notice/admin', data);
}

async function updateNotice(id: string, data: NoticeApi.SaveNoticePayload) {
  return requestClient.put(`/notice/admin/${id}`, data);
}

async function deleteNotice(id: string) {
  return requestClient.delete(`/notice/admin/${id}`);
}

async function updateNoticeStatus(id: string, status: 0 | 1) {
  return requestClient.put(`/notice/admin/${id}/status`, { status });
}

async function updateNoticeTop(id: string, isTop: 0 | 1) {
  return requestClient.put(`/notice/admin/${id}/top`, { isTop });
}

async function updateNoticePopup(id: string, isPopup: 0 | 1) {
  return requestClient.put(`/notice/admin/${id}/popup`, { isPopup });
}

async function getUserNoticeList(params: NoticeApi.NoticeListParams) {
  return requestClient.get<{
    items: NoticeApi.NoticeItem[];
    total: number;
  }>('/notice/user/list', { params });
}

async function getUserNoticeDetail(id: string) {
  return requestClient.get<NoticeApi.NoticeItem>(`/notice/user/${id}`);
}

async function getUserPopupNotices() {
  return requestClient.get<NoticeApi.NoticeItem[]>('/notice/user/popup');
}

async function uploadNoticeImage(file: File) {
  const data = await requestClient.upload<{ url: string }>(
    '/upload/notice-image',
    { file },
  );
  return data.url;
}

export {
  createNotice,
  deleteNotice,
  getAdminNoticeDetail,
  getAdminNoticeList,
  getUserPopupNotices,
  getUserNoticeDetail,
  getUserNoticeList,
  updateNotice,
  updateNoticeStatus,
  updateNoticePopup,
  updateNoticeTop,
  uploadNoticeImage,
};
