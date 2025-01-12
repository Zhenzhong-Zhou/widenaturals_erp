type ErrorType = 'NetworkError' | 'ValidationError' | 'UnknownError';

class AppError extends Error {
  status: number;
  details?: string;
  type: ErrorType;
  
  constructor(message: string, status: number = 500, type: ErrorType = 'UnknownError', details?: string) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.type = type;
    this.details = details;
    
    Object.setPrototypeOf(this, AppError.prototype);
  }
  
  static fromNetworkError(details?: string) {
    return new AppError('Network request failed', 503, 'NetworkError', details);
  }
  
  static fromValidationError(details?: string) {
    return new AppError('Validation error occurred', 400, 'ValidationError', details);
  }
  
  static reportError(error: AppError) {
    console.error('Logging error to external service:', error);
  }
}

export default AppError;
