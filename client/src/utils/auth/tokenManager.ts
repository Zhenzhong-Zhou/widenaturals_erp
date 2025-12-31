import Cookies from 'js-cookie';

/**
 * Read an auth token from storage.
 * Storage mechanism: cookies.
 */
export const getToken = (
  tokenName: 'accessToken' | 'refreshToken'
): string | null => {
  return Cookies.get(tokenName) || null;
};

/**
 * Clear all authentication tokens from storage.
 *
 * NOTE:
 * - This is a destructive operation.
 * - Should be used only during logout / session invalidation.
 */
export const clearTokens = (): void => {
  Cookies.remove('accessToken', { path: '/', secure: false });
  Cookies.remove('refreshToken', { path: '/', secure: true });
};
