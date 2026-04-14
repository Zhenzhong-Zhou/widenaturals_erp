import {
  useProductLookup,
  useSkuLookup,
} from '@hooks/index';

/**
 * Aggregated lookup bundle for the pricing join list page.
 */
const usePricingLookups = () => {
  // const pricingType = usePricingTypeLookup();
  const product     = useProductLookup();
  const sku         = useSkuLookup();
  
  return {
    // pricingType,
    product,
    sku,
  };
};

export default usePricingLookups;
