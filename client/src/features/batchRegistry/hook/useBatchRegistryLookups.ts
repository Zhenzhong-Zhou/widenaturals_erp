import {
  usePackagingMaterialLookup,
  useProductLookup,
  useSkuLookup,
  useStatusLookup,
} from '@hooks/index';

/**
 * Aggregated lookup bundle for Batch Registry pages.
 *
 * Provides a stable, centralized set of lookup hooks that can be
 * passed directly into filter panels, dropdown components, and
 * advanced search UIs without exposing individual lookup wiring.
 *
 * Designed for forward compatibility:
 * - Supplier and manufacturer lookups can be added in future
 *   iterations without changing consumers.
 *
 * NOTE:
 * Supplier and manufacturer lookups will be added
 * in a later iteration without changing consumers.
 */
const useBatchRegistryLookups = () => {
  const product = useProductLookup();
  const sku = useSkuLookup();
  const packagingMaterial = usePackagingMaterialLookup();
  const status = useStatusLookup();
  
  return {
    product,
    sku,
    packagingMaterial,
    status,
  };
};

export default useBatchRegistryLookups;
