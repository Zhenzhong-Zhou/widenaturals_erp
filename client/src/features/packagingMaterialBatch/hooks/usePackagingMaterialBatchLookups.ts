import { useSupplierLookup, usePackagingMaterialLookup } from '@hooks/index';
import { useCommonProductLookups } from '@features/lookup/hooks';

/**
 * Aggregated lookup bundle for Packaging Material Batch pages.
 *
 * Differs from Product Batch:
 * - Uses packaging material lookup
 * - Uses supplier lookup
 * - Does NOT use manufacturer lookup
 *
 * This hook centralizes all dropdown data dependencies required
 * by the Packaging Material Batch filter panel.
 */
const usePackagingMaterialBatchLookups = () => {
  const common = useCommonProductLookups(); // includes status, etc.
  const supplier = useSupplierLookup();
  const packagingMaterial = usePackagingMaterialLookup();

  return {
    ...common,
    supplier,
    packagingMaterial,
  };
};

export default usePackagingMaterialBatchLookups;
