import {
  // useWarehouseTypeLookup,
  // useLocationLookup,
  useUserLookup,
  useStatusLookup,
} from '@hooks/index';

const useWarehouseLookups = () => {
  // const warehouseType = useWarehouseTypeLookup();
  // const location      = useLocationLookup();
  const user      = useUserLookup();
  const status        = useStatusLookup();
  
  return {
    // warehouseType,
    // location,
    user,
    status
  };
};

export default useWarehouseLookups;
