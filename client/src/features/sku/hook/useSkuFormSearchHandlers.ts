import useDebouncedSearch from '@utils/hooks/useDebouncedSearch';
import type {
  ProductLookupParams,
  SkuCodeBaseLookupParams,
} from '@features/lookup/state';

type SkuFormLookupBundles = {
  product: { fetch: (params?: ProductLookupParams) => void };
  skuCodeBase: { fetch: (params?: SkuCodeBaseLookupParams) => void };
};

/**
 * Provides debounced search handlers for Create SKU forms.
 *
 * Used by:
 *  - CreateSkuSingleForm
 *  - CreateSkuBulkForm
 *
 * Supports:
 *  - Product dropdown search
 *  - SKU Code Base dropdown search (Brand/Category combined)
 */
const useSkuFormSearchHandlers = (bundles: SkuFormLookupBundles) => {
  return {
    /** Debounced search for Product dropdown */
    handleProductSearch: useDebouncedSearch<ProductLookupParams>(
      bundles.product.fetch
    ),

    /** Debounced search for SKU Code Base dropdown */
    handleSkuCodeBaseSearch: useDebouncedSearch<SkuCodeBaseLookupParams>(
      bundles.skuCodeBase.fetch
    ),
  };
};

export default useSkuFormSearchHandlers;
