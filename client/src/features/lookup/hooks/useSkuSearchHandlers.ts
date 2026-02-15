import { useDebouncedSearch } from '@utils/hooks';
import { SkuLookupQueryParams } from '@features/lookup/state';

/**
 * A generic interface representing any module's SKU lookup bundle.
 *
 * The module must provide a `.fetch()` method compatible with
 * `SkuLookupQueryParams`.
 */
export type SkuLookupBundle = {
  fetch: (params?: SkuLookupQueryParams) => void;
};

/**
 * Generic debounced search handler for SKU-based lookups.
 *
 * This hook adapts a SKU lookup bundle into a standardized
 * `handleSearch` API so it can be consumed consistently by
 * shared lookup and filter utilities.
 *
 * Works for:
 *  - SKU dropdowns
 *  - Compliance SKU filters
 *  - BOM SKU selectors
 *  - Inventory allocation SKU selectors
 *
 * Mirrors the Product and Status search handler design.
 */
const useSkuSearchHandlers = (bundle: SkuLookupBundle) => {
  const handleSearch = useDebouncedSearch<SkuLookupQueryParams>(bundle.fetch);

  return {
    /**
     * Debounced handler for SKU keyword searches.
     *
     * Usage:
     *   const { handleSearch } = useSkuSearchHandlers(skuLookup);
     *   handleSearch(keyword);
     */
    handleSearch,
  };
};

export default useSkuSearchHandlers;
