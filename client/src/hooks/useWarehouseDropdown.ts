import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks.ts';
import {
  fetchWarehouseDropdownThunk,
  type GetWarehouseDropdownFilters,
  selectWarehouseDropdownError,
  selectWarehouseDropdownItems,
  selectWarehouseDropdownLoading,
} from '@features/dropdown/state';

/**
 * Hook to access warehouse dropdown state with memoization and typed store access.
 *
 */
const useWarehouseDropdown = () => {
  const dispatch = useAppDispatch();

  const items = useAppSelector(selectWarehouseDropdownItems);
  const loading = useAppSelector(selectWarehouseDropdownLoading);
  const error = useAppSelector(selectWarehouseDropdownError);

  const fetchDropdown = useCallback(
    (filters?: GetWarehouseDropdownFilters) => {
      dispatch(fetchWarehouseDropdownThunk(filters));
    },
    [dispatch]
  );

  return useMemo(
    () => ({
      items,
      loading,
      error,
      fetchDropdown,
    }),
    [items, loading, error, fetchDropdown]
  );
};

export default useWarehouseDropdown;
