// =============================================================================
// Raw PostgreSQL error codes (infrastructure-level)
// Source: https://www.postgresql.org/docs/current/errcodes-appendix.html
// Do NOT expose these directly in API responses — map via pg-error-mapper.js.
// =============================================================================

const POSTGRES_ERROR_CODES = {
  
  // ---------------------------------------------------------------------------
  // Class 08 — Connection exceptions
  // ---------------------------------------------------------------------------
  CONNECTION_EXCEPTION:                                '08000',
  CONNECTION_DOES_NOT_EXIST:                           '08003',
  CONNECTION_FAILURE:                                  '08006',
  SQLCLIENT_UNABLE_TO_ESTABLISH_SQLCONNECTION:         '08001',
  SQLSERVER_REJECTED_ESTABLISHMENT_OF_SQLCONNECTION:   '08004',
  
  // ---------------------------------------------------------------------------
  // Class 22 — Data exceptions
  // ---------------------------------------------------------------------------
  NOT_NULL_VIOLATION:           '23502', // note: actual class is 23, kept here for grouping
  VALUE_TOO_LONG:               '22001',
  INVALID_TEXT_REPRESENTATION:  '22P02',
  NUMERIC_VALUE_OUT_OF_RANGE:   '22003',
  INVALID_DATETIME_FORMAT:      '22007',
  DIVISION_BY_ZERO:             '22012',
  
  // ---------------------------------------------------------------------------
  // Class 23 — Integrity constraint violations
  // ---------------------------------------------------------------------------
  UNIQUE_VIOLATION:             '23505',
  FOREIGN_KEY_VIOLATION:        '23503',
  NOT_NULL_VIOLATION_CLASS23:   '23502',
  CHECK_VIOLATION:              '23514',
  EXCLUSION_VIOLATION:          '23P01',
  
  // ---------------------------------------------------------------------------
  // Class 25 — Invalid transaction state
  // ---------------------------------------------------------------------------
  ACTIVE_SQL_TRANSACTION:       '25001',
  NO_ACTIVE_SQL_TRANSACTION:    '25P01',
  IN_FAILED_SQL_TRANSACTION:    '25P02',
  
  // ---------------------------------------------------------------------------
  // Class 28 — Invalid authorization specification
  // ---------------------------------------------------------------------------
  INVALID_AUTHORIZATION_SPECIFICATION: '28000',
  // GitGuardian-ignore-next-line
  INVALID_PASSWORD:                    '28P01',
  
  // ---------------------------------------------------------------------------
  // Class 40 — Transaction rollback
  // ---------------------------------------------------------------------------
  SERIALIZATION_FAILURE:        '40001',
  DEADLOCK_DETECTED:            '40P01',
  
  // ---------------------------------------------------------------------------
  // Class 42 — Syntax error or access rule violation
  // ---------------------------------------------------------------------------
  SYNTAX_ERROR:                 '42601',
  UNDEFINED_TABLE:              '42P01',
  UNDEFINED_COLUMN:             '42703',
  UNDEFINED_FUNCTION:           '42883',
  WRONG_OBJECT_TYPE:            '42809',
  
  // ---------------------------------------------------------------------------
  // Class 53 — Insufficient resources
  // ---------------------------------------------------------------------------
  INSUFFICIENT_RESOURCES:       '53000',
  DISK_FULL:                    '53100',
  OUT_OF_MEMORY:                '53200',
  TOO_MANY_CONNECTIONS:         '53300',
  
  // ---------------------------------------------------------------------------
  // Class 57 — Operator intervention
  // ---------------------------------------------------------------------------
  QUERY_CANCELED:               '57014',
  ADMIN_SHUTDOWN:               '57P01',
  CRASH_SHUTDOWN:               '57P02',
  
  // ---------------------------------------------------------------------------
  // Class 58 — System errors
  // ---------------------------------------------------------------------------
  IO_ERROR:                     '58030',
  UNDEFINED_FILE:               '58P01',
  DUPLICATE_FILE:               '58P02',
};

// =============================================================================
// Application-level DB error codes
// Used in AppError instances — safe to include in structured logs.
// Never expose raw POSTGRES_ERROR_CODES in API responses.
// =============================================================================

const DB_ERROR_CODES = {
  // Constraint violations
  UNIQUE_VIOLATION:           'UNIQUE_VIOLATION',
  FOREIGN_KEY_VIOLATION:      'FOREIGN_KEY_VIOLATION',
  NOT_NULL_VIOLATION:         'NOT_NULL_VIOLATION',
  CHECK_VIOLATION:            'CHECK_VIOLATION',
  EXCLUSION_VIOLATION:        'EXCLUSION_VIOLATION',
  
  // Data / format errors
  VALUE_TOO_LONG:             'VALUE_TOO_LONG',
  INVALID_INPUT_FORMAT:       'INVALID_INPUT_FORMAT',
  NUMERIC_OUT_OF_RANGE:       'NUMERIC_OUT_OF_RANGE',
  INVALID_DATETIME_FORMAT:    'INVALID_DATETIME_FORMAT',
  DIVISION_BY_ZERO:           'DIVISION_BY_ZERO',
  
  // Transaction errors
  SERIALIZATION_FAILURE:      'SERIALIZATION_FAILURE',
  DEADLOCK_DETECTED:          'DEADLOCK_DETECTED',
  INVALID_TRANSACTION_STATE:  'INVALID_TRANSACTION_STATE',
  
  // Connection / infrastructure
  CONNECTION_FAILURE:         'CONNECTION_FAILURE',
  AUTHORIZATION_FAILURE:      'AUTHORIZATION_FAILURE',
  INSUFFICIENT_RESOURCES:     'INSUFFICIENT_RESOURCES',
  QUERY_CANCELED:             'QUERY_CANCELED',
  SERVER_SHUTDOWN:            'SERVER_SHUTDOWN',
  IO_ERROR:                   'IO_ERROR',
  
  // Schema / programming errors
  SYNTAX_ERROR:               'SYNTAX_ERROR',
  UNDEFINED_TABLE:            'UNDEFINED_TABLE',
  UNDEFINED_COLUMN:           'UNDEFINED_COLUMN',
  UNDEFINED_FUNCTION:         'UNDEFINED_FUNCTION',
  WRONG_OBJECT_TYPE:          'WRONG_OBJECT_TYPE',
  
  // Fallback
  UNKNOWN_DB_ERROR:           'UNKNOWN_DB_ERROR',
};

module.exports = {
  POSTGRES_ERROR_CODES,
  DB_ERROR_CODES,
};
