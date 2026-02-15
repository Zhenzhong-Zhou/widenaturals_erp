import { useProductLookup, useSkuLookup, useStatusLookup } from '@hooks/index';

/**
 * useCommonProductLookups
 *
 * Shared lookup bundle for features that operate on
 * product + SKU + status domains.
 *
 * This hook intentionally excludes:
 * - packaging material
 * - supplier
 * - manufacturer
 *
 * Those are layered in feature-specific hooks.
 */
const useCommonProductLookups = () => {
  const product = useProductLookup();
  const sku = useSkuLookup();
  const status = useStatusLookup();

  return {
    product,
    sku,
    status,
  };
};

export default useCommonProductLookups;
