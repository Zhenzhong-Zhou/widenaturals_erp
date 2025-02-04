import { FC, useState } from 'react';
import { useWarehouses } from '../../../hooks';
import WarehouseTable from '../components/WarehouseTable';
import Box from '@mui/material/Box';
import { CustomButton, ErrorMessage, Loading } from '@components/index.ts';

const WarehousesPage: FC = () => {
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  const { warehouses, pagination, loading, error, refetch } = useWarehouses({ page, limit: rowsPerPage });
  
  if (loading) return <Loading message="Loading Warehouses..." />;
  if (error) return <ErrorMessage message={error} />;
  
  return (
    <Box>
      {!loading && !error && warehouses.length > 0 && (
        <WarehouseTable
          warehouses={warehouses}
          totalPages={pagination?.totalPages}
          totalRecords={pagination?.totalRecords}
          page={page - 1} // MUI Pagination is zero-based
          onPageChange={(newPage) => setPage(newPage + 1)}
          onRowsPerPageChange={setRowsPerPage}
        />
      )}
      
      <CustomButton onClick={refetch}>
        Refresh Data
      </CustomButton>
    </Box>
  );
};

export default WarehousesPage;
