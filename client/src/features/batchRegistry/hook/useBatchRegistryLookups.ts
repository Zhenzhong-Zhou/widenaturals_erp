import { usePackagingMaterialLookup } from '@hooks/index';
import { useCommonProductLookups } from '@features/lookup/hooks';

/**
 * Aggregated lookup bundle for Batch Registry pages.
 */
const useBatchRegistryLookups = () => {
  const common = useCommonProductLookups();
  const packagingMaterial = usePackagingMaterialLookup();
  
  return {
    ...common,
    packagingMaterial,
  };
};

export default useBatchRegistryLookups;
