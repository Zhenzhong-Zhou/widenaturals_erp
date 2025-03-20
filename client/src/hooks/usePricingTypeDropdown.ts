import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/storeHooks';
import {
  fetchPricingTypeDropdownThunk,
  selectPricingTypeDropdown,
  selectPricingTypeDropdownLoading,
  selectPricingTypeDropdownError,
} from '../features/pricingType';

/**
 * Custom hook to fetch and manage pricing types dropdown state.
 * @returns {object} - Contains pricing types, loading state, error state, and a refresh function.
 */
const usePricingTypeDropdown = (): {
  pricingTypes: { id: string; label: string }[];
  loading: boolean;
  error: string | null;
  refreshPricingTypes: () => void;
} => {
  const dispatch = useAppDispatch();
  
  // Memoized selectors
  const pricingTypes = useAppSelector(selectPricingTypeDropdown);
  const loading = useAppSelector(selectPricingTypeDropdownLoading);
  const error = useAppSelector(selectPricingTypeDropdownError);
  
  // Fetch data when the hook is first used
  useEffect(() => {
    dispatch(fetchPricingTypeDropdownThunk());
  }, [dispatch]);
  
  // Refresh function to manually trigger data fetch
  const refreshPricingTypes = useCallback(() => {
    dispatch(fetchPricingTypeDropdownThunk());
  }, [dispatch]);
  
  return { pricingTypes, loading, error, refreshPricingTypes };
};

export default usePricingTypeDropdown;
