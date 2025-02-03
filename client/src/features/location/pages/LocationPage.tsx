import { useEffect, useState } from 'react';
import { useLocations } from '../../../hooks';
import { LocationTable } from '../index.ts';
import Box from '@mui/material/Box';
import { CustomButton, ErrorDisplay, ErrorMessage, Loading } from '@components/index.ts';

const LocationPage = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  
  const { locations, pagination, loading, error, refresh } = useLocations(1, 10);
  
  useEffect(() => {
    refresh();
  }, [refresh, page, limit]);
  
  if (loading) return <Loading message={'Loading All Locations...'}/>;
  if (error) return <ErrorDisplay><ErrorMessage message={error}/></ErrorDisplay>;
  
  return (
    <Box sx={{ padding: 3 }}>
      <CustomButton onClick={refresh} style={{ marginTop: '10px' }}>Refresh Data</CustomButton>
      {/* Ensure locations & pagination are passed as props */}
      <LocationTable
        data={locations}
        page={pagination.page}
        totalRecords={pagination.totalRecords}
        totalPages={pagination.totalPages}
        onPageChange={setPage}
        onRowsPerPageChange={setLimit}
      />
    </Box>
  );
};

export default LocationPage;
