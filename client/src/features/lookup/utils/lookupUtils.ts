import { useMemo } from 'react';
import type { LookupQuery } from '@features/lookup/state';
import type { MultiSelectOption } from '@components/common/MultiSelectDropdown';

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

type LookupLike<T> = {
  options: T[];
  loading: boolean;
  fetch: () => void;
};

/**
 * Creates an `onOpen` handler for lookup-style inputs (e.g. Autocomplete, Select)
 * that lazily loads options the first time the menu is opened.
 *
 * The returned handler triggers `fetch()` only when the options list is empty
 * and no fetch is already in progress, preventing duplicate network calls on
 * repeated open/close cycles.
 *
 * @template T - Shape of an individual lookup option.
 * @param lookup - Lookup state container exposing options, loading flag, and fetch trigger.
 * @returns Handler to bind to the input's `onOpen` event.
 *
 * @example
 * const customerLookup = useCustomerLookup();
 * <Autocomplete
 *   options={customerLookup.options}
 *   loading={customerLookup.loading}
 *   onOpen={createOnOpenHandler(customerLookup)}
 * />
 */
// todo: refactor all  old to new one
export const createOnOpenHandler = <T>(lookup: LookupLike<T>) => () => {
  if (lookup.options.length === 0 && !lookup.loading) {
    lookup.fetch();
  }
};

/**
 * Returns a memoized copy of lookup options with formatted labels.
 *
 * Useful when display labels require transformation (e.g. title case,
 * localization, normalization) without mutating the original option objects.
 *
 * The returned array preserves option identity except for the `label` field.
 *
 * @param options - Original lookup options
 * @param formatLabel - Function to transform each option label
 * @returns Memoized options array with formatted labels
 */
export const useFormattedOptions = (
  options: MultiSelectOption[],
  formatLabel: (label: string) => string
) =>
  useMemo(
    () => options.map((o) => ({ ...o, label: formatLabel(o.label) })),
    [options, formatLabel]
  );
