import type { LookupQuery } from '@features/lookup/state';

/**
 * Utility: Create lookup parameters with defaults.
 *
 * Produces a strongly typed `LookupQuery`-compatible object (generic over T),
 * applying sensible defaults for pagination + keyword, and allowing both
 * override values and optional custom defaults.
 *
 * Priority order (lowest → highest):
 *   1. base defaults    → { keyword: '', offset: 0, limit: 20 }
 *   2. provided defaults (optional)
 *   3. overrides passed by caller
 *
 * This is used for initializing paginated dropdowns, search lookups, etc.,
 * ensuring the shape always matches `LookupQuery`.
 *
 * @example
 * const params = createLookupParams<StatusLookupParams>();
 *
 * @example
 * const params = createLookupParams<StatusLookupParams>(
 *   { keyword: 'Active' },
 *   { limit: 50 }
 * );
 */
export const createLookupParams = <T extends LookupQuery>(
  overrides: Partial<T> = {},
  defaults?: Partial<T>
): T => {
  const baseDefaults: LookupQuery = {
    keyword: '',
    offset: 0,
    limit: 20,
  };

  return {
    ...(baseDefaults as T),
    ...(defaults as T),
    ...(overrides as T),
  };
};

/**
 * Utility: Normalize lookup parameters.
 *
 * Ensures any missing fields from a partial `LookupQuery`-compatible object
 * are replaced with safe defaults. This prevents Joi schema validation errors
 * and guarantees that lookup fetch functions always receive a complete payload.
 *
 * All unset fields fall back to:
 *   keyword: ''
 *   offset: 0
 *   limit: 20
 *
 * @example
 * normalizeLookupParams({ keyword: 'test' })
 * // → { keyword: 'test', offset: 0, limit: 20 }
 *
 * @example
 * normalizeLookupParams({})
 * // → { keyword: '', offset: 0, limit: 20 }
 */
export const normalizeLookupParams = <T extends LookupQuery>(
  params: Partial<T> = {}
): T =>
  ({
    keyword: params.keyword ?? '',
    offset: params.offset ?? 0,
    limit: params.limit ?? 20,
  }) as T;
