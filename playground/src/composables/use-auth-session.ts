import { preferences } from '@vben/preferences';
import { useAccessStore } from '@vben/stores';

import { refreshTokenApi } from '#/api/core/auth';

let restoringAccessToken: null | Promise<boolean> = null;

export async function restoreAccessTokenFromCookie() {
  const accessStore = useAccessStore();
  if (accessStore.accessToken) {
    return true;
  }
  if (!preferences.app.enableRefreshToken) {
    return false;
  }

  restoringAccessToken ??= refreshTokenApi()
    .then((resp) => {
      const token = resp.data;
      if (!token) {
        return false;
      }
      accessStore.setAccessToken(token);
      accessStore.setLoginExpired(false);
      return true;
    })
    .catch(() => false)
    .finally(() => {
      restoringAccessToken = null;
    });

  return restoringAccessToken;
}
