import { useMemo, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  fetchLotAdjustmentTypeDropdownThunk,
  selectLotAdjustmentTypeError,
  selectLotAdjustmentTypeItems,
  selectLotAdjustmentTypeLoading,
} from '@features/dropdown/state';
import { formatLabel } from '@utils/textUtils';

/**
 * Custom hook to manage lot adjustment type dropdown.
 * Fetches data on mount and exposes a manual fetch method.
 *
 * @param excludeInternal - Whether to exclude internal-only types (default: true).
 */
const useLotAdjustmentTypeDropdown = (excludeInternal: boolean = true) => {
  const dispatch = useAppDispatch();
  
  const items = useAppSelector(selectLotAdjustmentTypeItems);
  const loading = useAppSelector(selectLotAdjustmentTypeLoading);
  const error = useAppSelector(selectLotAdjustmentTypeError);
  
  // Expose a function instead of dispatching immediately
  const fetchLotAdjustmentTypeDropdown = useCallback(() => {
    dispatch(fetchLotAdjustmentTypeDropdownThunk(excludeInternal));
  }, [dispatch, excludeInternal]);
  
  // Memoize mapped options
  const dropdownOptions = useMemo(
    () =>
      items.map((item) => ({
        value: `${item.value}::${item.actionTypeId}`,
        label: formatLabel(item.label),
      })),
    [items]
  );
  
  return {
    options: dropdownOptions,
    loading,
    error,
    fetchLotAdjustmentTypeDropdown, // Exposed for manual control
  };
};

export default useLotAdjustmentTypeDropdown;
