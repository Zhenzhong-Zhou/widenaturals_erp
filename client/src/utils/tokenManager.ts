import Cookies from 'js-cookie';

const COOKIE_OPTIONS = { secure: true, sameSite: 'Strict' as 'Strict' };

export const setTokens = (accessToken: string, refreshToken: string): void => {
  Cookies.set('accessToken', accessToken, COOKIE_OPTIONS);
  Cookies.set('refreshToken', refreshToken, COOKIE_OPTIONS);
};

export const getToken = (tokenName: 'accessToken' | 'refreshToken'): string | null => {
  return Cookies.get(tokenName) || null;
};

export const clearTokens = (): void => {
  Cookies.remove('accessToken');
  Cookies.remove('refreshToken');
};
