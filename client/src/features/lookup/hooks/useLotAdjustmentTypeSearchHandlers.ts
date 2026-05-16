import { useDebouncedSearch } from '@utils/hooks';
import type { LotAdjustmentTypeLookupParams } from '@features/lookup/state';

/**
 * A generic interface representing any module's lot adjustment type lookup bundle.
 *
 * The module must provide a `.fetch()` method compatible with
 * `LotAdjustmentTypeLookupParams`.
 */
export type LotAdjustmentTypeLookupBundle = {
  fetch: (params?: LotAdjustmentTypeLookupParams) => void;
};

/**
 * Generic debounced search handler for lot-adjustment-type-based lookups.
 *
 * This hook adapts a lot adjustment type lookup bundle into a standardized
 * `handleSearch` API so it can be consumed consistently by shared lookup
 * and filter utilities.
 *
 * Works for:
 *  - Inventory activity log filters
 *  - Adjustment audit trail filters
 *  - Warehouse adjustment workflows (future)
 *  - Reconciliation tooling (future)
 *
 * Mirrors:
 * - useProductSearchHandlers
 * - useSkuSearchHandlers
 * - usePackagingMaterialSearchHandlers
 *
 * Keeps debounce and fetch strategy outside UI components.
 */
const useLotAdjustmentTypeSearchHandlers = (
  bundle: LotAdjustmentTypeLookupBundle
) => {
  const handleSearch = useDebouncedSearch<LotAdjustmentTypeLookupParams>(
    bundle.fetch
  );

  return {
    /**
     * Debounced handler for lot adjustment type keyword searches.
     *
     * Usage:
     *   const { handleSearch } =
     *     useLotAdjustmentTypeSearchHandlers(adjustmentTypeLookup);
     *
     *   handleSearch(keyword);
     */
    handleSearch,
  };
};

export default useLotAdjustmentTypeSearchHandlers;
