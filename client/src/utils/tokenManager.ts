import Cookies from 'js-cookie';

const COOKIE_OPTIONS = { secure: true, sameSite: 'Strict' as 'Strict' };

export const setTokens = (accessToken: string): void => {
  Cookies.set('accessToken', accessToken, COOKIE_OPTIONS);
};

export const getToken = (tokenName: '_csrf' | 'accessToken' | 'refreshToken'): string | null => {
  return Cookies.get(tokenName) || null;
};

export const clearTokens = (): void => {
  Cookies.remove('accessToken');
  Cookies.remove('refreshToken');
};
