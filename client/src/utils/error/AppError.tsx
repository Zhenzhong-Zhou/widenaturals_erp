/* =========================================================
 * Error Categories (WHAT failed)
 * ======================================================= */

export enum ErrorType {
  // ------------------------------
  // Client / Request errors (4xx)
  // ------------------------------
  Validation = 'Validation',
  Authentication = 'Authentication',
  Authorization = 'Authorization',
  NotFound = 'NotFound',
  RateLimit = 'RateLimit',
  
  // ------------------------------
  // Transport / Infrastructure
  // ------------------------------
  Network = 'Network',
  Timeout = 'Timeout',
  
  // ------------------------------
  // Server / Domain
  // ------------------------------
  Service = 'Service',
  Server = 'Server',
  
  // ------------------------------
  // Fallback
  // ------------------------------
  Unknown = 'Unknown',
}

/* =========================================================
 * Error Severity (HOW bad)
 * ======================================================= */

export enum ErrorSeverity {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
  Critical = 'Critical',
}

/* =========================================================
 * Supporting Types
 * ======================================================= */

export type AppErrorDetails =
  | string
  | Record<string, unknown>
  | Array<Record<string, unknown>>;

export interface AppErrorOptions {
  type: ErrorType;
  severity?: ErrorSeverity;
  details?: AppErrorDetails;
  correlationId?: string;
  cause?: unknown;
}

/* =========================================================
 * Default HTTP status mapping
 * ======================================================= */

const ERROR_STATUS_MAP: Record<ErrorType, number> = {
  [ErrorType.Validation]: 400,
  [ErrorType.Authentication]: 401,
  [ErrorType.Authorization]: 403,
  [ErrorType.NotFound]: 404,
  [ErrorType.RateLimit]: 429,
  
  [ErrorType.Network]: 503,
  [ErrorType.Timeout]: 504,
  
  [ErrorType.Service]: 502,
  [ErrorType.Server]: 500,
  
  [ErrorType.Unknown]: 500,
};

/* =========================================================
 * AppError Class
 * ======================================================= */

export class AppError extends Error {
  readonly type: ErrorType;
  readonly severity: ErrorSeverity;
  readonly status: number;
  readonly details?: AppErrorDetails;
  readonly correlationId?: string;
  readonly cause?: unknown;
  
  constructor(message: string, options: AppErrorOptions) {
    super(message);
    
    this.name = 'AppError';
    this.type = options.type;
    this.severity = options.severity ?? ErrorSeverity.Medium;
    this.status = ERROR_STATUS_MAP[options.type] ?? 500;
    this.details = options.details;
    this.correlationId = options.correlationId;
    this.cause = options.cause;
    
    Object.setPrototypeOf(this, AppError.prototype);
  }
  
  /* =====================================================
   * Factory helpers (recommended usage)
   * =================================================== */
  
  static validation(
    message = 'Validation failed',
    details?: AppErrorDetails
  ) {
    return new AppError(message, {
      type: ErrorType.Validation,
      severity: ErrorSeverity.Low,
      details,
    });
  }
  
  static authentication(message = 'Authentication required') {
    return new AppError(message, {
      type: ErrorType.Authentication,
      severity: ErrorSeverity.Medium,
    });
  }
  
  static authorization(message = 'Access denied') {
    return new AppError(message, {
      type: ErrorType.Authorization,
      severity: ErrorSeverity.Medium,
    });
  }
  
  static notFound(message = 'Resource not found') {
    return new AppError(message, {
      type: ErrorType.NotFound,
      severity: ErrorSeverity.Low,
    });
  }
  
  static rateLimit(
    message = 'Too many requests',
    details?: AppErrorDetails
  ) {
    return new AppError(message, {
      type: ErrorType.RateLimit,
      severity: ErrorSeverity.Medium,
      details,
    });
  }
  
  static network(details?: AppErrorDetails) {
    return new AppError('Network error occurred', {
      type: ErrorType.Network,
      severity: ErrorSeverity.High,
      details,
    });
  }
  
  static timeout(details?: AppErrorDetails) {
    return new AppError('Request timed out', {
      type: ErrorType.Timeout,
      severity: ErrorSeverity.High,
      details,
    });
  }
  
  static service(
    message = 'Upstream service error',
    details?: AppErrorDetails
  ) {
    return new AppError(message, {
      type: ErrorType.Service,
      severity: ErrorSeverity.High,
      details,
    });
  }
  
  static server(
    message = 'Internal server error',
    details?: AppErrorDetails
  ) {
    return new AppError(message, {
      type: ErrorType.Server,
      severity: ErrorSeverity.Critical,
      details,
    });
  }
  
  static unknown(
    message = 'Unexpected error occurred',
    cause?: unknown
  ) {
    return new AppError(message, {
      type: ErrorType.Unknown,
      severity: ErrorSeverity.Critical,
      cause,
    });
  }
  
  /* =====================================================
   * Serialization (API-safe)
   * =================================================== */
  
  toJSON() {
    return {
      message: this.message,
      type: this.type,
      status: this.status,
      severity: this.severity,
      details:
        typeof this.details === 'string'
          ? { description: this.details }
          : this.details,
      correlationId: this.correlationId,
    };
  }
  
  /* =====================================================
   * UI-safe recovery hints (optional)
   * =================================================== */
  
  getRecoveryHint(): string | undefined {
    switch (this.type) {
      case ErrorType.Network:
        return 'Please check your internet connection and try again.';
      case ErrorType.Timeout:
        return 'The request took too long. Please retry.';
      case ErrorType.Validation:
        return 'Please review the input and try again.';
      case ErrorType.Authentication:
        return 'Please sign in and try again.';
      default:
        return undefined;
    }
  }
}
