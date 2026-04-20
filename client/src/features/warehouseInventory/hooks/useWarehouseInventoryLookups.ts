import {
  // useInventoryStatusLookup,
  usePackagingMaterialLookup,
  useProductLookup,
  useSkuLookup,
} from '@hooks/index';

/**
 * Aggregated lookup bundle for the warehouse inventory list page.
 *
 * Bundles the four server-backed lookups used by the filter panel:
 *   - inventory status (dropdown)
 *   - product (paginated, keyword-searchable)
 *   - SKU (paginated, keyword-searchable)
 *   - packaging material (paginated, keyword-searchable)
 *
 * Batch type is a static enum and does not need a server lookup.
 */
const useWarehouseInventoryLookups = () => {
  // const inventoryStatus    = useInventoryStatusLookup();
  const product            = useProductLookup();
  const sku                = useSkuLookup();
  const packagingMaterial  = usePackagingMaterialLookup();
  
  return {
    // inventoryStatus,
    product,
    sku,
    packagingMaterial,
  };
};

export default useWarehouseInventoryLookups;
