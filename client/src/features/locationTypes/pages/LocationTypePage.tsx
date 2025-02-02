import useLocationTypes from '../../../hooks/useLocationTypes.ts';
import { Loading, ErrorMessage } from '@components/index.ts';
import Box from '@mui/material/Box';
import { LocationTypeTable } from '../index.ts';

const LocationTypesPage = () => {
  const { locationTypes, pagination, loading, error, fetchLocations } = useLocationTypes();
  
  const handlePageChange = (newPage: number) => fetchLocations(newPage, pagination.limit);
  const handleRowsPerPageChange = (newLimit: number) => fetchLocations(1, newLimit);
  
  if (loading) return <Loading message="Loading Location Types..." />;
  if (error) return <ErrorMessage message={error} />;
  
  console.log("page:",locationTypes, pagination);
  return (
    <Box sx={{ padding: 3 }}>
   
      <LocationTypeTable
        data={locationTypes}
        page={pagination.page}
        totalRecords={pagination.totalRecords}
        totalPages={pagination.totalPages}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
      />
    </Box>
  );
};

export default LocationTypesPage;
