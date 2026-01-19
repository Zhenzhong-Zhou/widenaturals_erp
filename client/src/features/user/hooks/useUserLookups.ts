import { useRoleLookup, useStatusLookup } from '@hooks/index';

/**
 * Lookup bundle used by User pages.
 *
 * Designed to be passed directly into filter panels
 * and dropdown components.
 */
const useUserLookups = () => {
  const role = useRoleLookup();
  const status = useStatusLookup();

  return {
    role,
    status,
  };
};

export default useUserLookups;
