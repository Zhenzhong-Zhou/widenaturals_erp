import { useDebouncedSearch } from '@utils/hooks';
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
 * Generic debounced search handler for PRODUCT-based lookups.
 *
 * This hook adapts a product lookup bundle into a standardized
 * `handleSearch` API, allowing it to integrate seamlessly with
 * shared lookup and filter utilities.
 *
 * Works for:
 *  - Product dropdowns
 *  - Compliance product filters
 *  - BOM product selectors
 *  - Inventory allocation product selectors (future)
 *
 * This mirrors the Status and SKU search handler patterns to ensure
 * consistency across lookup modules.
 */
const useProductSearchHandlers = (bundle: ProductLookupBundle) => {
  const handleSearch = useDebouncedSearch<ProductLookupParams>(bundle.fetch);

  return {
    /**
     * Debounced handler for product keyword searches.
     *
     * Usage:
     *   const { handleSearch } = useProductSearchHandlers(productLookup);
     *   handleSearch(keyword);
     */
    handleSearch,
  };
};

export default useProductSearchHandlers;
