import {
  useStatusLookup,
  useUserLookup,
} from '@hooks/index';

/**
 * Aggregated lookup bundle for pricing group pages.
 */
const usePricingGroupLookups = () => {
  const status      = useStatusLookup();
  const user        = useUserLookup();
  
  return {
    status,
    user,
  };
};

export default usePricingGroupLookups;
