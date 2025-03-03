import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/storeHooks.ts';
import {
  fetchAllDropdownLotAdjustmentTypesThunk,
  selectLotAdjustmentError,
  selectLotAdjustmentLoading,
  selectLotAdjustmentTypes,
} from '../features/warehouse-inventory';

/**
 * Custom hook to fetch and manage lot adjustment types.
 */
const useLotAdjustmentTypes = () => {
  const dispatch = useAppDispatch();

  // Select data from Redux store
  const types = useAppSelector(selectLotAdjustmentTypes);
  const loading = useAppSelector(selectLotAdjustmentLoading);
  const error = useAppSelector(selectLotAdjustmentError);

  // Fetch lot adjustment types on mount
  useEffect(() => {
    if (types.length === 0) {
      dispatch(fetchAllDropdownLotAdjustmentTypesThunk());
    }
  }, [dispatch, types.length]);

  return { types, loading, error };
};

export default useLotAdjustmentTypes;
