import { useCallback, useState } from 'react';
import type { LotAdjustmentTypeLookupParams } from '@features/lookup/state';

interface UseLotAdjustmentTypeLookupBindingOptions {
  /**
   * Fetch function provided by the lot adjustment type lookup hook.
   * Must support optional pagination and keyword search via
   * LotAdjustmentTypeLookupParams.
   */
  fetchLotAdjustmentTypeLookup: (
    params?: LotAdjustmentTypeLookupParams
  ) => void;
}

/**
 * useLotAdjustmentTypeLookupBinding
 *
 * Encapsulates dropdown query state and interaction logic
 * for lot-adjustment-type-based lookup components.
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
 * - A consistent API across all lot adjustment type lookup usages
 *
 * Designed for reuse in:
 * - Activity log and audit trail filter panels
 * - Adjustment workflow forms
 * - Reconciliation tooling
 *
 * Architectural Note:
 * The hook is intentionally lightweight and does not include
 * debouncing. Debounce behavior, if required, should be handled
 * at a higher abstraction layer to avoid hidden timing side effects
 * (see useLotAdjustmentTypeSearchHandlers).
 *
 * Mirrors useUserLookupBinding so call sites stay consistent across
 * different single-select lookup fields.
 */
const useLotAdjustmentTypeLookupBinding = ({
                                             fetchLotAdjustmentTypeLookup,
                                           }: UseLotAdjustmentTypeLookupBindingOptions) => {
  const [fetchParams, setFetchParams] =
    useState<LotAdjustmentTypeLookupParams>({
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
      fetchLotAdjustmentTypeLookup(nextParams);
    },
    [fetchParams, fetchLotAdjustmentTypeLookup]
  );
  
  /**
   * Refreshes lookup results using either:
   * - Provided params override
   * - Or current internal fetchParams state
   */
  const handleRefresh = useCallback(
    (params?: LotAdjustmentTypeLookupParams) => {
      fetchLotAdjustmentTypeLookup(params ?? fetchParams);
    },
    [fetchLotAdjustmentTypeLookup, fetchParams]
  );
  
  return {
    fetchParams,
    setFetchParams,
    handleInputChange,
    handleRefresh,
  };
};

export default useLotAdjustmentTypeLookupBinding;
