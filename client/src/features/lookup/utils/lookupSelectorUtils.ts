import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';

/**
 * Creates a selector to extract pagination metadata (`limit`, `offset`, `hasMore`)
 * from a paginated lookup slice.
 *
 * This utility assumes that the selected slice contains these keys and types:
 * - `hasMore`: boolean
 * - `limit`: number
 * - `offset`: number
 *
 * If the selected state shape is incorrect, a warning is logged in development.
 *
 * @param baseSelector - Selector function returning the lookup slice from the root state.
 * @returns A memoized selector that returns the pagination metadata object.
 *
 * @example
 * const selectDiscountLookupMeta = createLookupMetaSelector(selectDiscountLookupState);
 */
export const createLookupMetaSelector = (
  baseSelector: (state: RootState) => unknown
) => {
  return createSelector([baseSelector], (state): { hasMore: boolean; limit: number; offset: number } => {
    const hasValidShape =
      typeof state === 'object' &&
      state !== null &&
      'hasMore' in state &&
      'limit' in state &&
      'offset' in state &&
      typeof (state as any).hasMore === 'boolean' &&
      typeof (state as any).limit === 'number' &&
      typeof (state as any).offset === 'number';
    
    if (!hasValidShape && import.meta.env.DEV) {
      console.warn('[createLookupMetaSelector] Invalid lookup slice shape:', state);
    }
    
    return {
      hasMore: (state as any).hasMore ?? false,
      limit: (state as any).limit ?? 0,
      offset: (state as any).offset ?? 0,
    };
  });
};

/**
 * Transforms an array of objects with `id` and `label` fields
 * into a dropdown-compatible format with `label` and `value` keys.
 *
 * @template T - The type of each input item (must have `id` and `label`)
 * @param items - Array of lookup items
 * @returns Array of `{ label, value }` objects
 */
export const transformIdLabel = <T extends { id: string; label: string }>(
  items: T[]
): { label: string; value: string }[] =>
  items.map((item) => ({
    label: item.label,
    value: item.id,
  }));

/**
 * Maps lookup items to UI-friendly options with `label`, `value`, and optional extra fields.
 *
 * @template T - The type of the input items (must include `id` and `label`)
 * @template K - Keys from T to include in the mapped output
 * @param items - Array of lookup items
 * @param extraFields - Keys from T to copy to the output (e.g., 'isActive', 'isPickupLocation')
 * @returns Array of objects with `label`, `value`, and extra fields
 */
export const mapLookupItems = <
  T extends { id: string; label: string } & Record<string, any>,
  K extends keyof T = never
>(
  items: T[],
  extraFields: K[] = []
): Array<{ label: string; value: string } & Pick<T, K>> => {
  return items.map((item) => {
    const base = {
      label: item.label,
      value: item.id,
    };
    
    const extras = extraFields.reduce((acc, key) => {
      acc[key] = item[key];
      return acc;
    }, {} as Pick<T, K>);
    
    return { ...base, ...extras };
  });
};
