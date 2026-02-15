// import { useManufacturerLookup } from '@hooks/index';
import { useCommonProductLookups } from '@features/lookup/hooks';

/**
 * Aggregated lookup bundle for Product Batch pages.
 *
 * Differs from Batch Registry:
 * - Uses manufacturer instead of packaging material
 */
const useProductBatchLookups = () => {
  const common = useCommonProductLookups();
  // const manufacturer = useManufacturerLookup();

  return {
    ...common,
    // manufacturer,
  };
};

export default useProductBatchLookups;
