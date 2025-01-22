export interface ResetPasswordResponse {
  success: boolean;
  message: string;
  timestamp?: string;
}

export interface ResetPasswordError {
  message: string; // Human-readable error message
  status: number;  // HTTP status code (e.g., 400 for validation errors)
  type: string;    // Error type (e.g., "ValidationError")
  code: string;    // Error code for categorization (e.g., "VALIDATION_ERROR")
  isExpected: boolean; // Indicates if the error is expected
  details?: Array<{ message: string; path?: string }>; // Field-level validation details
}
