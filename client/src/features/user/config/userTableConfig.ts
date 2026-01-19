/**
 * Supported rows-per-page options for the User list table.
 *
 * This constant defines the only valid pagination sizes that may be
 * used by the table UI and pagination controllers. All defaults and
 * state values must be derived from this list to avoid invalid
 * Select values and UI warnings.
 */
export const USER_TABLE_PAGE_SIZES = [10, 25, 50, 75] as const;

/**
 * Union type representing all valid User table page sizes.
 *
 * This type is derived directly from `USER_TABLE_PAGE_SIZES` to ensure
 * compile-time consistency between pagination configuration and usage.
 *
 * Example:
 *   const limit: UserTablePageSize = 25; // valid
 *   const limit: UserTablePageSize = 20; // compile-time error
 */
export type UserTablePageSize =
  (typeof USER_TABLE_PAGE_SIZES)[number];
