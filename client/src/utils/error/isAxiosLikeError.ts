export type AxiosLikeError = {
  response?: {
    status?: number;
    data?: unknown;
  };
};

export const isAxiosLikeError = (error: unknown): error is AxiosLikeError =>
  typeof error === 'object' && error !== null && 'response' in error;
