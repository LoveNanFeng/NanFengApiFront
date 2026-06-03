import { baseRequestClient, requestClient } from '#/api/request';

export namespace AuthApi {
  /** 登录接口参数 */
  export interface LoginParams {
    captchaId?: string;
    password?: string;
    username?: string;
  }

  export interface CaptchaResult {
    captchaId: string;
    challenge: string;
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
    emailServiceEnabled?: boolean;
    mobileRegisterEnabled: boolean;
    registerEnabled: boolean;
  }

  /** 登录接口返回值 */
  export interface LoginResult {
    accessToken: string;
  }

  export interface PasswordResetAccountResult {
    maskedEmail: string;
  }

  export interface PasswordResetVerifyResult {
    resetToken: string;
  }

  export interface QqLoginPublicConfig {
    configured: boolean;
    enabled: boolean;
  }

  export interface QqLoginUrlResult {
    url: string;
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
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    return sha256HexFallback(data);
  }
  try {
    const digest = await subtle.digest('SHA-256', data);
    return [...new Uint8Array(digest)]
      .map((item) => item.toString(16).padStart(2, '0'))
      .join('');
  } catch {
    return sha256HexFallback(data);
  }
}

const SHA_256_INITIAL_HASH = [
  0x6A_09_E6_67, 0xBB_67_AE_85, 0x3C_6E_F3_72, 0xA5_4F_F5_3A, 0x51_0E_52_7F,
  0x9B_05_68_8C, 0x1F_83_D9_AB, 0x5B_E0_CD_19,
];

const SHA_256_K = [
  0x42_8A_2F_98, 0x71_37_44_91, 0xB5_C0_FB_CF, 0xE9_B5_DB_A5, 0x39_56_C2_5B,
  0x59_F1_11_F1, 0x92_3F_82_A4, 0xAB_1C_5E_D5, 0xD8_07_AA_98, 0x12_83_5B_01,
  0x24_31_85_BE, 0x55_0C_7D_C3, 0x72_BE_5D_74, 0x80_DE_B1_FE, 0x9B_DC_06_A7,
  0xC1_9B_F1_74, 0xE4_9B_69_C1, 0xEF_BE_47_86, 0x0F_C1_9D_C6, 0x24_0C_A1_CC,
  0x2D_E9_2C_6F, 0x4A_74_84_AA, 0x5C_B0_A9_DC, 0x76_F9_88_DA, 0x98_3E_51_52,
  0xA8_31_C6_6D, 0xB0_03_27_C8, 0xBF_59_7F_C7, 0xC6_E0_0B_F3, 0xD5_A7_91_47,
  0x06_CA_63_51, 0x14_29_29_67, 0x27_B7_0A_85, 0x2E_1B_21_38, 0x4D_2C_6D_FC,
  0x53_38_0D_13, 0x65_0A_73_54, 0x76_6A_0A_BB, 0x81_C2_C9_2E, 0x92_72_2C_85,
  0xA2_BF_E8_A1, 0xA8_1A_66_4B, 0xC2_4B_8B_70, 0xC7_6C_51_A3, 0xD1_92_E8_19,
  0xD6_99_06_24, 0xF4_0E_35_85, 0x10_6A_A0_70, 0x19_A4_C1_16, 0x1E_37_6C_08,
  0x27_48_77_4C, 0x34_B0_BC_B5, 0x39_1C_0C_B3, 0x4E_D8_AA_4A, 0x5B_9C_CA_4F,
  0x68_2E_6F_F3, 0x74_8F_82_EE, 0x78_A5_63_6F, 0x84_C8_78_14, 0x8C_C7_02_08,
  0x90_BE_FF_FA, 0xA4_50_6C_EB, 0xBE_F9_A3_F7, 0xC6_71_78_F2,
];

function sha256HexFallback(data: Uint8Array) {
  const h = [...SHA_256_INITIAL_HASH];
  const length = data.length;
  const paddedLength = Math.trunc((length + 9 + 63) / 64) * 64;
  const padded = new Uint8Array(paddedLength);
  padded.set(data);
  padded[length] = 0x80;
  const bitLengthHigh = Math.floor((length * 8) / 0x1_00_00_00_00);
  const bitLengthLow = (length * 8) >>> 0;
  padded[paddedLength - 8] = bitLengthHigh >>> 24;
  padded[paddedLength - 7] = bitLengthHigh >>> 16;
  padded[paddedLength - 6] = bitLengthHigh >>> 8;
  padded[paddedLength - 5] = bitLengthHigh;
  padded[paddedLength - 4] = bitLengthLow >>> 24;
  padded[paddedLength - 3] = bitLengthLow >>> 16;
  padded[paddedLength - 2] = bitLengthLow >>> 8;
  padded[paddedLength - 1] = bitLengthLow;

  const w = new Uint32Array(64);
  const paddedAt = (index: number) => padded[index] ?? 0;
  const wordAt = (index: number) => w[index] ?? 0;
  const hashAt = (index: number) => h[index] ?? 0;

  for (let offset = 0; offset < paddedLength; offset += 64) {
    for (let i = 0; i < 16; i++) {
      const index = offset + i * 4;
      w[i] =
        ((paddedAt(index) << 24) |
          (paddedAt(index + 1) << 16) |
          (paddedAt(index + 2) << 8) |
          paddedAt(index + 3)) >>>
        0;
    }
    for (let i = 16; i < 64; i++) {
      const word2 = wordAt(i - 2);
      const word7 = wordAt(i - 7);
      const word15 = wordAt(i - 15);
      const word16 = wordAt(i - 16);
      const s0 =
        rightRotate(word15, 7) ^ rightRotate(word15, 18) ^ (word15 >>> 3);
      const s1 =
        rightRotate(word2, 17) ^ rightRotate(word2, 19) ^ (word2 >>> 10);
      w[i] = (word16 + s0 + word7 + s1) >>> 0;
    }

    let a = hashAt(0);
    let b = hashAt(1);
    let c = hashAt(2);
    let d = hashAt(3);
    let e = hashAt(4);
    let f = hashAt(5);
    let g = hashAt(6);
    let hash = hashAt(7);
    for (let i = 0; i < 64; i++) {
      const s1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (hash + s1 + ch + (SHA_256_K[i] ?? 0) + wordAt(i)) >>> 0;
      const s0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (s0 + maj) >>> 0;

      hash = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    h[0] = (hashAt(0) + a) >>> 0;
    h[1] = (hashAt(1) + b) >>> 0;
    h[2] = (hashAt(2) + c) >>> 0;
    h[3] = (hashAt(3) + d) >>> 0;
    h[4] = (hashAt(4) + e) >>> 0;
    h[5] = (hashAt(5) + f) >>> 0;
    h[6] = (hashAt(6) + g) >>> 0;
    h[7] = (hashAt(7) + hash) >>> 0;
  }

  return h.map((item) => item.toString(16).padStart(8, '0')).join('');
}

function rightRotate(value: number, bits: number) {
  return (value >>> bits) | (value << (32 - bits));
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
 * 获取QQ快捷登录公开状态
 */
export async function getQqLoginPublicConfigApi() {
  return requestClient.get<AuthApi.QqLoginPublicConfig>('/auth/qq/config');
}

/**
 * 创建QQ快捷登录授权地址
 */
export async function getQqLoginUrlApi() {
  return requestClient.get<AuthApi.QqLoginUrlResult>('/auth/qq/login');
}

/**
 * QQ回调页用一次性票据换取系统登录态
 */
export async function exchangeQqLoginTicketApi(ticket: string) {
  return requestClient.post<AuthApi.LoginResult>(
    '/auth/qq/ticket',
    { ticket },
    {
      withCredentials: true,
    },
  );
}

/**
 * 发送注册邮箱验证码
 */
export async function sendRegisterEmailCodeApi(
  email: string,
  captchaId: string,
) {
  return requestClient.post<boolean>('/auth/register/email-code', {
    captchaId,
    email,
  });
}

/**
 * 发送注册短信验证码
 */
export async function sendRegisterMobileCodeApi(
  mobile: string,
  captchaId: string,
) {
  return requestClient.post<boolean>('/auth/register/mobile-code', {
    captchaId,
    mobile,
  });
}

/**
 * 校验找回密码账号并返回脱敏邮箱
 */
export async function checkPasswordResetAccountApi(account: string) {
  return requestClient.post<AuthApi.PasswordResetAccountResult>(
    '/auth/password-reset/account',
    { account },
  );
}

/**
 * 发送找回密码邮箱验证码
 */
export async function sendPasswordResetEmailCodeApi(
  account: string,
  captchaId: string,
) {
  return requestClient.post<boolean>('/auth/password-reset/email-code', {
    account,
    captchaId,
  });
}

/**
 * 校验找回密码邮箱验证码
 */
export async function verifyPasswordResetCodeApi(
  account: string,
  code: string,
) {
  return requestClient.post<AuthApi.PasswordResetVerifyResult>(
    '/auth/password-reset/verify',
    { account, code },
  );
}

/**
 * 重置普通用户密码
 */
export async function resetPasswordApi(
  resetToken: string,
  password: string,
  confirmPassword: string,
) {
  return requestClient.post<boolean>('/auth/password-reset', {
    confirmPassword,
    password,
    resetToken,
  });
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
