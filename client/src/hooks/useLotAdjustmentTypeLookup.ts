import { useMemo, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  fetchLotAdjustmentTypeLookupThunk,
  selectLotAdjustmentTypeError,
  selectLotAdjustmentTypeItems,
  selectLotAdjustmentTypeLoading,
} from '@features/lookup/state';
import { formatLabel } from '@utils/textUtils';

/**
 * Custom hook to manage lot adjustment type lookup.
 * Fetches data on mount and exposes a manual fetch method.
 *
 * @param excludeInternal - Whether to exclude internal-only types (default: true).
 */
const useLotAdjustmentTypeLookup = (excludeInternal: boolean = true) => {
  const dispatch = useAppDispatch();
  
  const items = useAppSelector(selectLotAdjustmentTypeItems);
  const loading = useAppSelector(selectLotAdjustmentTypeLoading);
  const error = useAppSelector(selectLotAdjustmentTypeError);
  
  // Expose a function instead of dispatching immediately
  const fetchLotAdjustmentTypeLookup = useCallback(() => {
    dispatch(fetchLotAdjustmentTypeLookupThunk(excludeInternal));
  }, [dispatch, excludeInternal]);
  
  // Memoize mapped options
  const lookupOptions = useMemo(
    () =>
      items.map((item) => ({
        value: `${item.value}::${item.actionTypeId}`,
        label: formatLabel(item.label),
      })),
    [items]
  );
  
  return {
    options: lookupOptions,
    loading,
    error,
    fetchLotAdjustmentTypeLookup, // Exposed for manual control
  };
};

export default useLotAdjustmentTypeLookup;
