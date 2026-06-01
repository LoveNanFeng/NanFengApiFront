import { requestClient } from '#/api/request';

export namespace RegisterConfigApi {
  export interface OpenConfig {
    defaultUserQps: number;
    registerEnabled: 0 | 1;
    registerGiftPoints: number;
    registerIpHourLimit: number;
    verificationCodeIpDayLimit: number;
    verificationCodeIpHourLimit: number;
    verificationCodeIpMinuteLimit: number;
  }

  export interface EmailConfig {
    authCode: string;
    enabled: 0 | 1;
    senderEmail: string;
    senderName: string;
    smtpPort: number;
    smtpServer: string;
    testEmail?: string;
  }

  export interface MobileConfig {
    accessKeyId: string;
    accessKeySecret: string;
    enabled: 0 | 1;
    endpoint: string;
    provider: 'aliyun';
    region: string;
    signName: string;
    templateId: string;
    testMobile?: string;
  }

  export interface QqLoginConfig {
    appId: string;
    appKey: string;
    enabled: 0 | 1;
    frontendBaseUrl: string;
    redirectUri: string;
    suggestedRedirectUri?: string;
  }
}

async function getRegisterOpenConfig() {
  return requestClient.get<RegisterConfigApi.OpenConfig>(
    '/system/register/open-config',
  );
}

async function updateRegisterOpenConfig(data: RegisterConfigApi.OpenConfig) {
  return requestClient.put('/system/register/open-config', data);
}

async function getRegisterEmailConfig() {
  return requestClient.get<RegisterConfigApi.EmailConfig>(
    '/system/register/email-config',
  );
}

async function updateRegisterEmailConfig(data: RegisterConfigApi.EmailConfig) {
  return requestClient.put('/system/register/email-config', data);
}

async function testRegisterEmailConfig(data: RegisterConfigApi.EmailConfig) {
  return requestClient.post('/system/register/email-config/test', data);
}

async function getRegisterMobileConfig() {
  return requestClient.get<RegisterConfigApi.MobileConfig>(
    '/system/register/mobile-config',
  );
}

async function updateRegisterMobileConfig(
  data: RegisterConfigApi.MobileConfig,
) {
  return requestClient.put('/system/register/mobile-config', data);
}

async function testRegisterMobileConfig(data: RegisterConfigApi.MobileConfig) {
  return requestClient.post('/system/register/mobile-config/test', data);
}

async function getQqLoginConfig() {
  return requestClient.get<RegisterConfigApi.QqLoginConfig>(
    '/system/login/qq-config',
  );
}

async function updateQqLoginConfig(data: RegisterConfigApi.QqLoginConfig) {
  return requestClient.put('/system/login/qq-config', data);
}

export {
  getQqLoginConfig,
  getRegisterEmailConfig,
  getRegisterMobileConfig,
  getRegisterOpenConfig,
  testRegisterEmailConfig,
  testRegisterMobileConfig,
  updateQqLoginConfig,
  updateRegisterEmailConfig,
  updateRegisterMobileConfig,
  updateRegisterOpenConfig,
};
