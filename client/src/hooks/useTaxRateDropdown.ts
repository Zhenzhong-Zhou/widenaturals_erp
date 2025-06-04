import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  type TaxRateDropdownItem,
  fetchTaxRateDropdownThunk,
  selectTaxRateDropdown,
  selectTaxRateDropdownError,
  selectTaxRateDropdownLoading,
} from '@features/taxRate';

/**
 * Custom hook to fetch and manage tax rates dropdown state.
 * @param {string} region - The region to filter by (default: 'Canada').
 * @param {string|null} province - The province to filter by (optional).
 * @returns {object} The tax rates, loading state, error state, and refresh function.
 */
interface UseTaxRateDropdownReturn {
  taxRates: TaxRateDropdownItem[];
  loading: boolean;
  error: string | null;
  refreshTaxRates: () => void;
}

const useTaxRateDropdown = (
  region: string = 'Canada',
  province: string | null = null
): UseTaxRateDropdownReturn => {
  const dispatch = useAppDispatch();

  // Memoized selectors
  const taxRates = useAppSelector(selectTaxRateDropdown);
  const loading = useAppSelector(selectTaxRateDropdownLoading);
  const error = useAppSelector(selectTaxRateDropdownError);

  // Fetch tax rates on component mount or when dependencies change
  useEffect(() => {
    dispatch(fetchTaxRateDropdownThunk({ region, province }));
  }, [dispatch, region, province]);

  // Refresh function to manually trigger data fetch
  const refreshTaxRates = useCallback(() => {
    dispatch(fetchTaxRateDropdownThunk({ region, province }));
  }, [dispatch, region, province]);

  return { taxRates, loading, error, refreshTaxRates };
};

export default useTaxRateDropdown;
