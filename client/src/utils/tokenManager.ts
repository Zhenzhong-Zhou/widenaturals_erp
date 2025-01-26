import Cookies from 'js-cookie';

export const getToken = (
  tokenName: 'accessToken' | 'refreshToken'
): string | null => {
  return Cookies.get(tokenName) || null;
};

export const clearTokens = (): void => {
  // Remove access token
  Cookies.remove('accessToken', { path: '/', secure: false });
  // Remove refresh token
  Cookies.remove('refreshToken', { path: '/', secure: true });
};
