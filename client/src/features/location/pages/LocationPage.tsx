import { useState } from 'react';
import { useLocations } from '../../../hooks';
import { LocationTable } from '../index.ts';
import Box from '@mui/material/Box';
import { CustomButton, ErrorDisplay, ErrorMessage, Loading, Typography } from '@components/index.ts';

const LocationPage = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  
  const { locations, pagination, loading, error, refresh } = useLocations(page, limit);
  
  if (loading) return <Loading message={'Loading All Locations...'}/>;
  if (error) return <ErrorDisplay><ErrorMessage message={error}/></ErrorDisplay>;
  if (!locations) return <Typography variant={'h4'}>No location found.</Typography>;
  
  return (
    <Box sx={{ padding: 3 }}>
      <CustomButton onClick={refresh} style={{ marginTop: '10px' }}>Refresh Data</CustomButton>
      {/* Ensure locations & pagination are passed as props */}
      <LocationTable
        data={locations}
        page={page - 1}
        rowsPerPage={limit}
        totalRecords={pagination.totalRecords}
        totalPages={pagination.totalPages}
        onPageChange={(newPage) => {
          setPage(newPage + 1);
        }}
        onRowsPerPageChange={(newLimit) => {
          setLimit(newLimit);
          setPage(1);
        }}
      />
    </Box>
  );
};

export default LocationPage;
