import { baseRequestClient, requestClient } from '#/api/request';

export namespace AuthApi {
  /** 登录接口参数 */
  export interface LoginParams {
    captchaId?: string;
    password?: string;
    username?: string;
  }

  export interface CaptchaResult {
    challenge: string;
    captchaId: string;
    difficulty: number;
  }

  export interface CaptchaVerifyPayload {
    proof: string;
    time: string;
  }

  export interface RegisterParams {
    confirmPassword?: string;
    email?: string;
    emailCode?: string;
    mobile?: string;
    mobileCode?: string;
    password?: string;
    username?: string;
  }

  export interface RegisterConfig {
    emailRegisterEnabled: boolean;
    mobileRegisterEnabled: boolean;
    registerEnabled: boolean;
  }

  /** 登录接口返回值 */
  export interface LoginResult {
    accessToken: string;
  }

  export interface RefreshTokenResult {
    data: string;
    status: number;
  }
}

/**
 * 获取登录滑块验证码ID
 */
export async function getCaptchaApi() {
  return requestClient.get<AuthApi.CaptchaResult>('/auth/captcha');
}

/**
 * 滑块完成后通知服务端验证
 */
export async function verifyCaptchaApi(
  captcha: AuthApi.CaptchaResult,
  time: string,
) {
  const payload = await createCaptchaProof(captcha, time);
  return requestClient.post<boolean>(
    `/auth/captcha/${captcha.captchaId}/verify`,
    payload,
  );
}

async function createCaptchaProof(
  captcha: AuthApi.CaptchaResult,
  time: string,
): Promise<AuthApi.CaptchaVerifyPayload> {
  const prefix = '0'.repeat(captcha.difficulty);
  for (let nonce = 0; nonce < 500_000; nonce++) {
    const proof = nonce.toString(36);
    const hash = await sha256Hex(
      `${captcha.captchaId}:${captcha.challenge}:${time}:${proof}`,
    );
    if (hash.startsWith(prefix)) {
      return { proof, time };
    }
  }
  throw new Error('Captcha proof timeout');
}

async function sha256Hex(value: string) {
  const data = new TextEncoder().encode(value);
  const digest = await globalThis.crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)]
    .map((item) => item.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * 登录
 */
export async function loginApi(data: AuthApi.LoginParams) {
  return requestClient.post<AuthApi.LoginResult>('/auth/login', data, {
    withCredentials: true,
  });
}

/**
 * 注册
 */
export async function registerApi(data: AuthApi.RegisterParams) {
  return requestClient.post<AuthApi.LoginResult>('/auth/register', data, {
    withCredentials: true,
  });
}

/**
 * 获取注册配置
 */
export async function getRegisterConfigApi() {
  return requestClient.get<AuthApi.RegisterConfig>('/auth/register/config');
}

/**
 * 发送注册邮箱验证码
 */
export async function sendRegisterEmailCodeApi(email: string) {
  return requestClient.post<boolean>('/auth/register/email-code', { email });
}

/**
 * 发送注册短信验证码
 */
export async function sendRegisterMobileCodeApi(mobile: string) {
  return requestClient.post<boolean>('/auth/register/mobile-code', { mobile });
}

/**
 * 刷新accessToken
 */
export async function refreshTokenApi() {
  return baseRequestClient.post<AuthApi.RefreshTokenResult>(
    '/auth/refresh',
    null,
    {
      withCredentials: true,
    },
  );
}

/**
 * 退出登录
 */
export async function logoutApi() {
  return baseRequestClient.post('/auth/logout', null, {
    withCredentials: true,
  });
}

/**
 * 获取用户权限码
 */
export async function getAccessCodesApi() {
  return requestClient.get<string[]>('/auth/codes');
}
