/**
 * @file useFilterFormSync.ts
 * @description Shared hook for synchronising react-hook-form state with
 * external filter props in filter panel components.
 *
 * Handles two concerns:
 *  - Notifying the parent of live form value changes via onFilterChange.
 *  - Syncing externally controlled filter state back into the form when
 *    the parent resets or updates filters from outside the panel.
 *
 * JSON serialisation is used for dirty-checking instead of deep equality
 * to avoid a lodash dependency. Safe here because react-hook-form always
 * produces filter objects with a consistent key order for the same schema.
 */

import { useEffect, useRef } from 'react';

/**
 * Synchronises a react-hook-form instance with external filter state.
 *
 * @param watchedValues  - Current form values from watch().
 * @param filters        - External filter state owned by the parent.
 * @param reset          - react-hook-form reset function.
 * @param onFilterChange - Optional callback fired when form values change.
 */
export const useFilterFormSync = <T>(
  watchedValues: T,
  filters: T,
  reset: (values: T) => void,
  onFilterChange?: (values: T) => void
): void => {
  // Tracks the last serialised form state to avoid firing onFilterChange
  // on re-renders where values have not actually changed.
  const prevWatchedRef = useRef<string>('');
  
  useEffect(() => {
    const serialized = JSON.stringify(watchedValues);
    if (serialized === prevWatchedRef.current) return;
    prevWatchedRef.current = serialized;
    onFilterChange?.(watchedValues);
  }, [watchedValues, onFilterChange]);
  
  // Syncs external filter changes back into the form — covers the case where
  // the parent resets filters via setFilters({}) without going through onReset.
  useEffect(() => {
    reset(filters);
  }, [filters, reset]);
};
