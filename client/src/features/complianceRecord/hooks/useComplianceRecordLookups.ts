import useStatusLookup from '@hooks/useStatusLookup';
import useProductLookup from '@hooks/useProductLookup';
import useSkuLookup from '@hooks/useSkuLookup';

/**
 * Lookup bundle used by Compliance Record pages.
 *
 * Designed to be passed directly into filter panels
 * and dropdown components.
 */
const useComplianceRecordLookups = () => {
  const product = useProductLookup();
  const sku = useSkuLookup();
  const status = useStatusLookup();

  return {
    product,
    sku,
    status,
  };
};

export default useComplianceRecordLookups;
