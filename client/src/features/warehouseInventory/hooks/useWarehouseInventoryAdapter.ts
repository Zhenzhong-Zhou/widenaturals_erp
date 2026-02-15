import { useCallback } from 'react';
import { useWarehouseInventory } from '@hooks/index';
import { WarehouseInventoryFilters } from '@features/warehouseInventory';
import { SortConfig } from '@shared-types/api';

/**
 * Adapter to align useWarehouseInventory with BaseInventoryPage contract.
 *
 * Temporary bridge until the hook is refactored to be compliant.
 */
const useWarehouseInventoryAdapter = () => {
  const { records, loading, error, pagination, fetchRecords } =
    useWarehouseInventory();

  const normalizedPagination = pagination ?? {
    totalPages: 0,
    totalRecords: 0,
  };

  const fetchRecordsAdapter = useCallback(
    (
      paginationParams: { page: number; limit: number },
      filters: WarehouseInventoryFilters,
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

export default useWarehouseInventoryAdapter;
