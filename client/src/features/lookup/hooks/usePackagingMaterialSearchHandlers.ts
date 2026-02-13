import { useDebouncedSearch } from '@utils/hooks';
import type { PackagingMaterialLookupQueryParams } from '@features/lookup/state';

/**
 * A generic interface representing any module's PACKAGING MATERIAL lookup bundle.
 *
 * The module must provide a `.fetch()` method compatible with
 * `PackagingMaterialLookupQueryParams`.
 */
export type PackagingMaterialLookupBundle = {
  fetch: (params?: PackagingMaterialLookupQueryParams) => void;
};

/**
 * Generic debounced search handler for packaging-material-based lookups.
 *
 * This hook adapts a packaging material lookup bundle into a standardized
 * `handleSearch` API so it can be consumed consistently by shared lookup
 * and filter utilities.
 *
 * Works for:
 *  - Packaging material dropdowns
 *  - Batch registry filters
 *  - BOM packaging selectors (future)
 *  - Procurement / supplier flows (future)
 *
 * Mirrors:
 * - useProductSearchHandlers
 * - useSkuSearchHandlers
 *
 * Keeps debounce and fetch strategy outside UI components.
 */
const usePackagingMaterialSearchHandlers = (
  bundle: PackagingMaterialLookupBundle
) => {
  const handleSearch =
    useDebouncedSearch<PackagingMaterialLookupQueryParams>(bundle.fetch);
  
  return {
    /**
     * Debounced handler for packaging material keyword searches.
     *
     * Usage:
     *   const { handleSearch } =
     *     usePackagingMaterialSearchHandlers(packagingLookup);
     *
     *   handleSearch(keyword);
     */
    handleSearch,
  };
};

export default usePackagingMaterialSearchHandlers;
