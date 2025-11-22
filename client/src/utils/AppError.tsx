enum ErrorType {
  NetworkError = 'NetworkError',
  AuthenticationError = 'AuthenticationError',
  AuthorizationError = 'AuthorizationError',
  ValidationError = 'ValidationError',
  TimeoutError = 'TimeoutError',
  UnknownError = 'UnknownError',
  NotFoundError = 'NotFoundError',
  GlobalError = 'GlobalError',
  SevereError = 'SevereError',
  ServerError = 'ServerError',
  ServiceError = 'ServiceError',
  RateLimitError = 'RateLimitError',
  RuntimeError = 'RuntimeError',
  GeneralError = 'GeneralError',
}

type AppErrorDetails = string | Record<string, unknown>;

type AppErrorOptions = {
  type: ErrorType;
  details?: AppErrorDetails;
  correlationId?: string;
};

class AppError extends Error {
  status: number;
  details?: AppErrorDetails;
  type: ErrorType;
  correlationId: string;

  constructor(
    message: string,
    status: number = 500,
    options: AppErrorOptions = { type: ErrorType.UnknownError }
  ) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.type = options.type;
    this.details = options.details || 'No additional details provided';
    this.correlationId = options.correlationId || 'N/A';

    Object.setPrototypeOf(this, AppError.prototype);
  }

  static create(
    type: ErrorType,
    message: string,
    status: number,
    details?: AppErrorDetails
  ) {
    return new AppError(message, status, { type, details });
  }

  static fromNetworkError(details: AppErrorDetails = 'Network unreachable') {
    return new AppError('Network request failed', 503, {
      type: ErrorType.NetworkError,
      details,
    });
  }

  static fromValidationError(details?: AppErrorDetails) {
    return new AppError('Validation error occurred', 400, {
      type: ErrorType.ValidationError,
      details,
    });
  }

  static reportError(error: AppError) {
    const reportPayload = {
      message: error.message,
      type: error.type,
      details: error.details,
      recoverySuggestion: error.getRecoverySuggestion(),
      correlationId: error.correlationId,
    };
    console.error('Logging error to external service:', reportPayload);
    // Send reportPayload to your logging service
  }

  toJSON() {
    return {
      message: this.message,
      status: this.status,
      type: this.type,
      details:
        typeof this.details === 'object'
          ? this.details
          : { description: this.details },
      correlationId: this.correlationId,
    };
  }

  getRecoverySuggestion(): string {
    switch (this.type) {
      case ErrorType.NetworkError:
        return 'Check your internet connection and try again.';
      case ErrorType.ValidationError:
        return 'Verify the form inputs are correct.';
      case ErrorType.ServerError:
        return 'Our server encountered an issue. Please try again later.';
      default:
        return 'An unknown error occurred. Please contact support.';
    }
  }
}

export { AppError, ErrorType };
