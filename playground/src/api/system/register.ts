import { requestClient } from '#/api/request';

export namespace RegisterConfigApi {
  export interface OpenConfig {
    defaultUserQps: number;
    registerIpHourLimit: number;
    registerEnabled: 0 | 1;
    registerGiftPoints: number;
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

async function updateRegisterMobileConfig(data: RegisterConfigApi.MobileConfig) {
  return requestClient.put('/system/register/mobile-config', data);
}

async function testRegisterMobileConfig(data: RegisterConfigApi.MobileConfig) {
  return requestClient.post('/system/register/mobile-config/test', data);
}

export {
  getRegisterEmailConfig,
  getRegisterMobileConfig,
  getRegisterOpenConfig,
  testRegisterEmailConfig,
  testRegisterMobileConfig,
  updateRegisterEmailConfig,
  updateRegisterMobileConfig,
  updateRegisterOpenConfig,
};
