import { useStatusLookup } from '@hooks/index';

/**
 * Aggregated lookup bundle for pricing type pages.
 */
const usePricingTypeLookups = () => {
  const status = useStatusLookup();
  
  return {
    status,
  };
};

export default usePricingTypeLookups;
