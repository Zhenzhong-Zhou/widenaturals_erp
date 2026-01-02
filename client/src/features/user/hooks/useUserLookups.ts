import useStatusLookup from '@hooks/useStatusLookup';
// import useRoleLookup from '@hooks/useRoleLookup';

/**
 * Lookup bundle used by User pages.
 *
 * Designed to be passed directly into filter panels
 * and dropdown components.
 */
const useUserLookups = () => {
  // const role = useRoleLookup();
  const status = useStatusLookup();

  return {
    // role,
    status,
  };
};

export default useUserLookups;
