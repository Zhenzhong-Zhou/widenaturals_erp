import { useCallback, useState } from 'react';
import type { InventoryActionTypeLookupParams } from '@features/lookup/state';

interface UseInventoryActionTypeLookupBindingOptions {
  /**
   * Fetch function provided by the inventory action type lookup hook.
   * Must support optional pagination and keyword search via
   * InventoryActionTypeLookupParams.
   */
  fetchInventoryActionTypeLookup: (
    params?: InventoryActionTypeLookupParams
  ) => void;
}

/**
 * useInventoryActionTypeLookupBinding
 *
 * Encapsulates dropdown query state and interaction logic
 * for inventory-action-type-based lookup components.
 *
 * Responsibilities:
 * - Owns pagination + keyword fetch parameters
 * - Handles keyword input changes
 * - Triggers lookup fetch on search or refresh
 * - Resets offset when keyword changes
 *
 * This hook intentionally keeps:
 * - Fetch execution logic separate from page-level state
 * - Dropdown-level query state isolated
 * - A consistent API across all inventory action type lookup usages
 *
 * Designed for reuse in:
 * - Inventory audit trail filter panels
 * - Activity log filters
 * - System action selection forms
 *
 * Architectural Note:
 * The hook is intentionally lightweight and does not include
 * debouncing. Debounce behavior, if required, should be handled
 * at a higher abstraction layer to avoid hidden timing side effects
 * (see useInventoryActionTypeSearchHandlers).
 *
 * Mirrors useUserLookupBinding and useLotAdjustmentTypeLookupBinding
 * so call sites stay consistent across different single-select lookup
 * fields.
 */
const useInventoryActionTypeLookupBinding = ({
  fetchInventoryActionTypeLookup,
}: UseInventoryActionTypeLookupBindingOptions) => {
  const [fetchParams, setFetchParams] =
    useState<InventoryActionTypeLookupParams>({
      offset: 0,
      limit: 10,
    });

  /**
   * Handles keyword search input changes.
   * Resets pagination offset and immediately triggers lookup fetch.
   */
  const handleInputChange = useCallback(
    (_: unknown, newValue: string, reason: string) => {
      if (reason !== 'input') return;

      const nextParams = {
        ...fetchParams,
        keyword: newValue,
        offset: 0,
      };

      setFetchParams(nextParams);
      fetchInventoryActionTypeLookup(nextParams);
    },
    [fetchParams, fetchInventoryActionTypeLookup]
  );

  /**
   * Refreshes lookup results using either:
   * - Provided params override
   * - Or current internal fetchParams state
   */
  const handleRefresh = useCallback(
    (params?: InventoryActionTypeLookupParams) => {
      fetchInventoryActionTypeLookup(params ?? fetchParams);
    },
    [fetchInventoryActionTypeLookup, fetchParams]
  );

  return {
    fetchParams,
    setFetchParams,
    handleInputChange,
    handleRefresh,
  };
};

export default useInventoryActionTypeLookupBinding;
