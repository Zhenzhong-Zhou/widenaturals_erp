import { type FC, Suspense, useEffect } from 'react';
import Skeleton from '@mui/material/Skeleton';
import CustomButton from '@components/common/CustomButton';
import CustomTypography from '@components/common/CustomTypography';
import ErrorDisplay from '@components/shared/ErrorDisplay';
import ErrorMessage from '@components/common/ErrorMessage';
import LocationInventorySummaryTable from '@features/locationInventory/components/LocationInventorySummaryTable';
import useLocationInventorySummary from '@hooks/useLocationInventorySummary';
import type { ItemType } from '@features/inventoryShared/types/InventorySharedType';

interface Props {
  page: number;
  limit: number;
  itemType?: ItemType;
  onPageChange: (newPage: number) => void;
  onRowsPerPageChange: (newLimit: number) => void;
}

const LocationInventoryPanel: FC<Props> = ({
                                             page,
                                             limit,
                                             itemType,
                                             onPageChange,
                                             onRowsPerPageChange,
                                           }) => {
  const {
    data,
    pagination,
    loading,
    error,
    fetchData,
  } = useLocationInventorySummary();
  
  useEffect(() => {
    fetchData({ page, limit, ...(itemType ? { batchType: itemType } : {}) });
  }, [itemType]);
  
  const handleRefresh = () => {
    fetchData({ page, limit, ...(itemType ? { batchType: itemType } : {}) });
  };
  
  if (loading) {
    return (
      <>
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} variant="rectangular" height={60} sx={{ borderRadius: 1, mb: 2 }} />
        ))}
      </>
    );
  }
  
  if (error) {
    return (
      <ErrorDisplay>
        <ErrorMessage message={error} />
      </ErrorDisplay>
    );
  }
  
  if (data.length === 0) {
    return <CustomTypography sx={{ mt: 2 }}>No location inventory data available.</CustomTypography>;
  }
  
  return (
    <>
      <Suspense fallback={<Skeleton height={400} variant="rectangular" sx={{ borderRadius: 1 }} />}>
        <LocationInventorySummaryTable
          data={data}
          page={page - 1}
          rowsPerPage={limit}
          totalRecords={pagination?.totalRecords ?? 0}
          totalPages={pagination?.totalPages ?? 1}
          onPageChange={onPageChange}
          onRowsPerPageChange={onRowsPerPageChange}
        />
      </Suspense>
      <CustomButton onClick={handleRefresh} sx={{ mt: 2 }}>
        Refresh Location Inventory Summary
      </CustomButton>
    </>
  );
};

export default LocationInventoryPanel;
