import { useDebouncedSearch } from '@utils/hooks';
import type { InventoryActionTypeLookupParams } from '@features/lookup/state';

/**
 * A generic interface representing any module's inventory action type lookup bundle.
 *
 * The module must provide a `.fetch()` method compatible with
 * `InventoryActionTypeLookupParams`.
 */
export type InventoryActionTypeLookupBundle = {
  fetch: (params?: InventoryActionTypeLookupParams) => void;
};

/**
 * Generic debounced search handler for inventory-action-type-based lookups.
 *
 * This hook adapts an inventory action type lookup bundle into a
 * standardized `handleSearch` API so it can be consumed consistently
 * by shared lookup and filter utilities.
 *
 * Works for:
 *  - Inventory audit trail filters
 *  - Activity log filters
 *  - System action selection forms
 *  - Adjustment workflow context resolution (future)
 *
 * Mirrors:
 * - useProductSearchHandlers
 * - useSkuSearchHandlers
 * - usePackagingMaterialSearchHandlers
 * - useLotAdjustmentTypeSearchHandlers
 *
 * Keeps debounce and fetch strategy outside UI components.
 */
const useInventoryActionTypeSearchHandlers = (
  bundle: InventoryActionTypeLookupBundle
) => {
  const handleSearch = useDebouncedSearch<InventoryActionTypeLookupParams>(
    bundle.fetch
  );
  
  return {
    /**
     * Debounced handler for inventory action type keyword searches.
     *
     * Usage:
     *   const { handleSearch } =
     *     useInventoryActionTypeSearchHandlers(inventoryActionTypeLookup);
     *
     *   handleSearch(keyword);
     */
    handleSearch,
  };
};

export default useInventoryActionTypeSearchHandlers;
