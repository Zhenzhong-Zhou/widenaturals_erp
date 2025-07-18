import { useMemo, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  fetchLotAdjustmentTypeLookupThunk,
  type LotAdjustmentLookupQueryParams,
  selectLotAdjustmentTypeError,
  selectLotAdjustmentTypeItems,
  selectLotAdjustmentTypeLoading,
} from '@features/lookup/state';
import { formatLabel } from '@utils/textUtils';
import { resetLotAdjustmentTypeLookup } from '@features/lookup/state/lotAdjustmentTypeLookupSlice';

/**
 * Custom hook to manage lot adjustment type lookup.
 * Allows flexible filtering via query params and exposes manual fetch/reset.
 *
 */
const useLotAdjustmentTypeLookup = () => {
  const dispatch = useAppDispatch();

  const items = useAppSelector(selectLotAdjustmentTypeItems);
  const loading = useAppSelector(selectLotAdjustmentTypeLoading);
  const error = useAppSelector(selectLotAdjustmentTypeError);

  // Dispatch fetch with object param
  const fetchLotAdjustmentTypeLookup = useCallback(
    (params: LotAdjustmentLookupQueryParams = {}) => {
      dispatch(fetchLotAdjustmentTypeLookupThunk(params));
    },
    [dispatch]
  );

  const clearLotAdjustmentTypeLookup = useCallback(() => {
    dispatch(resetLotAdjustmentTypeLookup());
  }, [dispatch]);

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
    fetchLotAdjustmentTypeLookup,
    clearLotAdjustmentTypeLookup,
  };
};

export default useLotAdjustmentTypeLookup;
