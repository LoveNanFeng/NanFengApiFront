import type { UserInfo } from '@vben/types';

import { requestClient } from '#/api/request';

export interface InterfacePackageStats {
  apiCode: string;
  dailyLimit: number;
  expireTime?: string;
  interfaceId: string;
  interfaceName: string;
  packageId: string;
  packageName: string;
  qpsLimit: number;
  remainingCalls: number;
  remainingUnlimited: boolean;
  specId: string;
  specName: string;
  startTime?: string;
  todayCalls: number;
  userPackageId: string;
}

export interface MemberPackageStats {
  dailyLimit: number;
  expireTime?: string;
  packageId: string;
  packageName: string;
  qpsLimit: number;
  remainingCalls: number;
  remainingUnlimited: boolean;
  startTime?: string;
  todayCalls: number;
  userPackageId: string;
}

export type UserCallTrendKey = 'oneYear' | 'sevenDays' | 'thirtyDays';

export interface UserCallTrendStats {
  labels: string[];
  total: number;
  values: number[];
}

export interface UserWorkbenchStats {
  balance: number | string;
  callTrends: Record<UserCallTrendKey, UserCallTrendStats>;
  currentPackageName: string;
  currentPackageType: string;
  dailyLimit: number;
  dailyLimitUnlimited: boolean;
  failedCalls: number;
  failedRate: string;
  hasAnyPackage: boolean;
  hasMemberPackage: boolean;
  interfacePackageCount: number;
  interfacePackages: InterfacePackageStats[];
  memberPackage?: MemberPackageStats | null;
  points: number;
  qpsLimit: number;
  qpsLimitUnlimited: boolean;
  remainingCalls: number;
  remainingUnlimited: boolean;
  successCalls: number;
  successRate: string;
  todayCalls: number;
}

export interface QqBindingStatus {
  avatar?: string;
  bindTime?: string;
  bound: boolean;
  enabled: boolean;
  lastLoginTime?: string;
  nickname?: string;
}

export interface QqBindingAuthorizeResult {
  url: string;
}

export interface AdminWorkbenchOverview {
  apiEnabled: number;
  apiTotal: number;
  keyEnabled: number;
  keyTotal: number;
  pendingFriendLinks: number;
  pendingOrders: number;
  todayBillableCalls: number;
  todayCalls: number;
  todayChargeAmount: number | string;
  todayFailedCalls: number;
  todayNewUsers: number;
  todayRevenue: number | string;
  todaySuccessCalls: number;
  todaySuccessRate: string;
  totalRevenue: number | string;
  totalUsers: number;
}

export interface AdminCallTrend7d {
  billableCalls: number[];
  chargeAmounts: Array<number | string>;
  chargeTotal: number | string;
  failedCalls: number[];
  labels: string[];
  successCalls: number[];
  total: number;
  totalCalls: number[];
}

export interface AdminRevenueTrend7d {
  labels: string[];
  orderCounts: number[];
  paidAmounts: Array<number | string>;
  totalAmount: number | string;
  totalOrders: number;
}

export interface AdminHotApiStats {
  apiCode: string;
  apiStatus: number;
  avgElapsedMs: number;
  billableCalls: number;
  chargeAmount: number | string;
  failedCalls: number;
  id: number | string;
  name: string;
  successCalls: number;
  successRate: string;
  todayCalls: number;
}

export interface AdminActiveUserStats {
  chargeAmount: number | string;
  id: number | string;
  realName: string;
  successCalls: number;
  successRate: string;
  todayCalls: number;
  username: string;
}

export interface AdminWorkbenchAlert {
  content: string;
  level: 'danger' | 'info' | 'success' | 'warning';
  title: string;
  url?: string;
}

export interface AdminWorkbenchStats {
  activeUsers: AdminActiveUserStats[];
  alerts: AdminWorkbenchAlert[];
  callTrend7d: AdminCallTrend7d;
  hotApis: AdminHotApiStats[];
  overview: AdminWorkbenchOverview;
  revenueTrend7d: AdminRevenueTrend7d;
}

/**
 * 获取用户信息
 */
export async function getUserInfoApi() {
  return requestClient.get<UserInfo>('/user/info');
}

/**
 * 更新用户个人资料（姓名、头像）
 */
export async function updateProfileApi(data: {
  avatar?: string;
  realName: string;
}) {
  return requestClient.put<UserInfo>('/user/profile', data);
}

/**
 * 发送绑定邮箱验证码
 */
export async function sendBindEmailCodeApi(email: string) {
  return requestClient.post<boolean>('/user/send-bind-email-code', { email });
}

/**
 * 验证并绑定邮箱
 */
export async function bindEmailApi(email: string, code: string) {
  return requestClient.put<UserInfo>('/user/bind-email', { email, code });
}

/**
 * 发送绑定手机验证码
 */
export async function sendBindMobileCodeApi(mobile: string) {
  return requestClient.post<boolean>('/user/send-bind-mobile-code', { mobile });
}

/**
 * 验证并绑定手机号
 */
export async function bindMobileApi(mobile: string, code: string) {
  return requestClient.put<UserInfo>('/user/bind-mobile', { mobile, code });
}

/**
 * 获取QQ绑定状态
 */
export async function getQqBindingStatusApi() {
  return requestClient.get<QqBindingStatus>('/user/qq-binding');
}

/**
 * 创建QQ绑定授权地址
 */
export async function getQqBindingAuthorizeApi() {
  return requestClient.get<QqBindingAuthorizeResult>(
    '/user/qq-binding/authorize',
  );
}

/**
 * 解绑QQ
 */
export async function unbindQqApi() {
  return requestClient.delete<boolean>('/user/qq-binding');
}

/**
 * 修改密码
 */
export async function changePasswordApi(data: {
  captchaId: string;
  confirmPassword: string;
  newPassword: string;
  oldPassword: string;
}) {
  return requestClient.put<boolean>('/user/password', data);
}

/**
 * 获取用户端工作台统计
 */
export async function getUserWorkbenchStatsApi() {
  return requestClient.get<UserWorkbenchStats>('/user/workbench/stats');
}

/**
 * 获取管理员工作台统计
 */
export async function getAdminWorkbenchStatsApi() {
  return requestClient.get<AdminWorkbenchStats>('/user/workbench/admin-stats');
}
