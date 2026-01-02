import useDebouncedSearch from '@utils/hooks/useDebouncedSearch';
import type { ProductLookupParams } from '@features/lookup/state';

/**
 * A generic interface representing any module's PRODUCT lookup bundle.
 *
 * The module must provide a `.fetch()` method compatible with ProductLookupParams.
 */
export type ProductLookupBundle = {
  fetch: (params?: ProductLookupParams) => void;
};

/**
 * Generic debounced search handler for any PRODUCT dropdown.
 *
 * Works for:
 *  - ProductDropdown
 *  - Compliance Product Filter
 *  - BOM Product Selector
 *  - Allocation Product Selector (future)
 *
 * Mirrors the existing Status search handler design.
 */
const useProductSearchHandlers = (bundle: ProductLookupBundle) => {
  return {
    /**
     * Debounced handler for product keyword searches.
     *
     * Usage:
     *   const { handleProductSearch } = useProductSearchHandlers(productLookup);
     *   handleProductSearch(keyword);
     */
    handleProductSearch: useDebouncedSearch<ProductLookupParams>(bundle.fetch),
  };
};

export default useProductSearchHandlers;
