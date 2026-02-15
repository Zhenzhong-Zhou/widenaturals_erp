import { useCallback } from 'react';
import { useLocationInventory } from '@hooks/index';
import { LocationInventoryFilters } from '@features/locationInventory';
import { SortConfig } from '@shared-types/api';

/**
 * Adapter hook to align `useLocationInventory` with
 * `BaseInventoryPage`'s strict contract.
 *
 * - Ensures pagination is never null
 * - Normalizes fetchRecords signature
 * - Keeps base component strict and predictable
 *
 * NOTE:
 * This adapter is intentionally thin and should be removed
 * once `useLocationInventory` is refactored to be compliant.
 */
const useLocationInventoryAdapter = () => {
  const { records, loading, error, pagination, fetchRecords } =
    useLocationInventory();

  /**
   * BaseInventoryPage requires pagination to always exist.
   * Provide a safe default when underlying hook has not
   * initialized pagination yet.
   */
  const normalizedPagination = pagination ?? {
    totalPages: 0,
    totalRecords: 0,
  };

  /**
   * Normalize fetchRecords signature:
   * BaseInventoryPage expects (pagination, filters, sort)
   * with no optional parameters.
   */
  const fetchRecordsAdapter = useCallback(
    (
      paginationParams: { page: number; limit: number },
      filters: LocationInventoryFilters,
      sort: SortConfig
    ) => {
      fetchRecords(paginationParams, filters, sort);
    },
    [fetchRecords]
  );

  return {
    records,
    loading,
    error,
    pagination: normalizedPagination,
    fetchRecords: fetchRecordsAdapter,
  };
};

export default useLocationInventoryAdapter;
