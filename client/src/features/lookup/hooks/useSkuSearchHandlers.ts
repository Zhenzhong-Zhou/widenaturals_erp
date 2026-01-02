import useDebouncedSearch from '@utils/hooks/useDebouncedSearch';
import { SkuLookupQueryParams } from '@features/lookup/state';

/**
 * A generic interface representing any module's SKU lookup bundle.
 *
 * The module must provide a `.fetch()` method compatible with SkuLookupParams.
 */
export type SkuLookupBundle = {
  fetch: (params?: SkuLookupQueryParams) => void;
};

/**
 * Generic debounced search handler for any SKU dropdown.
 *
 * Works for:
 *  - SkuDropdown
 *  - Compliance SKU Filter
 *  - BOM SKU Selector
 *  - Allocation SKU Selector
 *
 * Mirrors the Product and Status search handler design.
 */
const useSkuSearchHandlers = (bundle: SkuLookupBundle) => {
  return {
    /**
     * Debounced handler for SKU keyword searches.
     *
     * Usage:
     *   const { handleSkuSearch } = useSkuSearchHandlers(skuLookup);
     *   handleSkuSearch(keyword);
     */
    handleSkuSearch: useDebouncedSearch<SkuLookupQueryParams>(bundle.fetch),
  };
};

export default useSkuSearchHandlers;
