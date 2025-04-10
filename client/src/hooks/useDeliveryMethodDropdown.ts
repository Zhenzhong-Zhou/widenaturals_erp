import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  fetchDeliveryMethodDropdownThunk,
  selectDeliveryMethodDropdownError,
  selectDeliveryMethodDropdownLoading,
  selectFormattedDeliveryMethodDropdown,
} from '@features/deliveryMethod';

/**
 * Custom hook to fetch and manage delivery methods dropdown state.
 * @param {boolean} includePickup - Whether to include In-Store Pickup options. (Default: false)
 * @returns {UseDeliveryMethodDropdownReturnType} - Contains delivery methods, loading state, error state, and a refresh function.
 */
interface UseDeliveryMethodDropdownReturnType {
  methods: { value: string; label: string }[];
  loading: boolean;
  error: string | null;
  refreshMethods: () => void;
}

const useDeliveryMethodDropdown = (includePickup: boolean = false): UseDeliveryMethodDropdownReturnType => {
  const dispatch = useAppDispatch();
  
  // Memoized selectors
  const methods = useAppSelector(selectFormattedDeliveryMethodDropdown);
  const loading = useAppSelector(selectDeliveryMethodDropdownLoading);
  const error = useAppSelector(selectDeliveryMethodDropdownError);
  
  // Fetch data on mount or when includePickup changes
  useEffect(() => {
    dispatch(fetchDeliveryMethodDropdownThunk({ includePickup }));
  }, [dispatch, includePickup]);
  
  // Refresh function to manually trigger data fetch
  const refreshMethods = useCallback(() => {
    dispatch(fetchDeliveryMethodDropdownThunk({ includePickup }));
  }, [dispatch, includePickup]);
  
  return { methods, loading, error, refreshMethods };
};

export default useDeliveryMethodDropdown;
