import { useStatusLookup } from '@hooks/index';

/**
 * Lookup bundle used by Location Type pages.
 *
 * Designed to be passed directly into:
 * - filter panels
 * - dropdown components
 * - advanced search controls
 *
 * Provides all reference data required for
 * location type-related filtering and forms.
 *
 * Currently, includes:
 * - status lookup
 *
 * Structure intentionally mirrors other feature
 * lookup bundles for architectural consistency.
 */
const useLocationTypeLookups = () => {
  const status = useStatusLookup();

  return {
    status,
  };
};

export default useLocationTypeLookups;
