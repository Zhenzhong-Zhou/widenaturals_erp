export interface ResetPasswordResponse {
  success: boolean;
  message: string;
  timestamp?: string;
}

export interface ResetPasswordError {
  success: false;
  message: string;
  code?: string;
  details?: Array<{ message: string; path?: string }>;
}