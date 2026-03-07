import { useLocationTypeLookup, useStatusLookup } from '@hooks/index';

/**
 * Lookup bundle used by Location pages.
 *
 * Designed to be passed directly into:
 * - filter panels
 * - dropdown components
 * - advanced search controls
 *
 * Provides all reference data required for
 * location-related filtering and forms.
 */
const useLocationLookups = () => {
  const status = useStatusLookup();
  const locationType = useLocationTypeLookup();

  return {
    status,
    locationType,
  };
};

export default useLocationLookups;
