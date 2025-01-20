enum ErrorType {
  NetworkError = 'NetworkError',
  AuthenticationError = 'AuthenticationError',
  ValidationError = 'ValidationError',
  TimeoutError = 'TimeoutError',
  UnknownError = 'UnknownError',
  GlobalError = 'GlobalError',
  SevereError = 'SevereError',
  ServerError = 'ServerError',
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
    console.error('Logging error to external service:', error);
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

  log() {
    const logLevel = this.status >= 500 ? 'error' : 'warn';
    console[logLevel](`AppError: ${this.message}`, {
      status: this.status,
      type: this.type,
      details: this.details,
      correlationId: this.correlationId,
    });
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
