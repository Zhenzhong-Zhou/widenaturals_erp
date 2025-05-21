import { type FC, startTransition, Suspense, useCallback, useEffect, useState } from 'react';
import Skeleton from '@mui/material/Skeleton';
import CustomButton from '@components/common/CustomButton';
import CustomTypography from '@components/common/CustomTypography';
import ErrorDisplay from '@components/shared/ErrorDisplay';
import ErrorMessage from '@components/common/ErrorMessage';
import LocationInventoryFilterPanel from '@features/locationInventory/components/LocationInventoryFilterPanel';
import LocationInventorySummaryTable from '@features/locationInventory/components/LocationInventorySummaryTable';
import useLocationInventorySummary from '@hooks/useLocationInventorySummary';
import useLocationInventorySummaryByItemId from '@hooks/useLocationInventorySummaryByItemId';
import type { ItemType } from '@features/inventoryShared/types/InventorySharedType';
import type { LocationInventorySummaryItemDetail } from '@features/locationInventory/state';
import { debounce } from '@mui/material';

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
  const [detailPage, setDetailPage] = useState(1);
  const [detailLimit, setDetailLimit] = useState(5);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [detailCache, setDetailCache] = useState<Record<string, LocationInventorySummaryItemDetail[]>>({});
  
  const {
    data: summaryData,
    pagination:  summaryPagination,
    loading: summaryLoading,
    error: summaryError,
    fetchLocationInventorySummary,
  } = useLocationInventorySummary();
  
  const {
    data: detailData,
    pagination: detailsPagination,
    loading: detailLoading,
    error: detailError,
    fetchLocationInventorySummaryDetail,
  } = useLocationInventorySummaryByItemId();
  
  useEffect(() => {
    fetchLocationInventorySummary({ page, limit, ...(itemType ? { batchType: itemType } : {}) });
  }, [page, limit, itemType]);
  
  useEffect(() => {
    if (!expandedRowId) return;
    
    fetchLocationInventorySummaryDetail({
      itemId: expandedRowId,
      page: detailPage,
      limit: detailLimit,
    });
  }, [expandedRowId, detailPage, detailLimit]);
  
  const detailLoadingMap = expandedRowId
    ? { [expandedRowId]: detailLoading }
    : {};
  
  const detailErrorMap = expandedRowId && detailError
    ? { [expandedRowId]: detailError }
    : {};
  
  useEffect(() => {
    if (expandedRowId && detailData?.length) {
      setDetailCache((prev) => ({
        ...prev,
        [expandedRowId]: detailData,
      }));
    }
  }, [detailData, expandedRowId]);
  
  const handleRefresh = () => {
    fetchLocationInventorySummary({ page, limit, ...(itemType ? { batchType: itemType } : {}) });
  };
  
  const handleDetailsRefresh = () => {
    if (!expandedRowId) return;
    fetchLocationInventorySummaryDetail({
      itemId: expandedRowId,
      page: detailPage,
      limit: detailLimit,
    });
  };
  
  const handleDrillDownToggle = useCallback(
    debounce((rowId: string) => {
      startTransition(() => {
        setExpandedRowId((prev) => (prev === rowId ? null : rowId));
      });
    }, 150),
    []
  );
  
  const handleRowHover = (rowId: string) => {
    if (!detailCache[rowId]) {
      fetchLocationInventorySummaryDetail({
        itemId: rowId,
        page: detailPage,
        limit: detailLimit,
      });
    }
  };
  
  const handlePageChange = (newPage: number) => {
    setDetailPage(newPage + 1); // Component uses 0-based index
  };
  
  const handleRowsPerPageChange = (newLimit: number) => {
    setDetailLimit(newLimit);
    setDetailPage(1);
  };
  
  if (summaryLoading) {
    return (
      <>
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} variant="rectangular" height={60} sx={{ borderRadius: 1, mb: 2 }} />
        ))}
      </>
    );
  }
  
  if (summaryError) {
    return (
      <ErrorDisplay>
        <ErrorMessage message={summaryError} />
      </ErrorDisplay>
    );
  }
  
  if (summaryData.length === 0) {
    return <CustomTypography sx={{ mt: 2 }}>No location inventory data available.</CustomTypography>;
  }
  
  return (
    <>
      <Suspense fallback={<Skeleton height={400} variant="rectangular" sx={{ borderRadius: 1 }} />}>
        <LocationInventoryFilterPanel
          visibleFields={['productName', 'materialName', 'sku']}
          onApply={(filters) => {
            fetchLocationInventorySummary({
              page: 1,
              limit,
              ...filters,
              ...(itemType ? { batchType: itemType } : {}),
            });
          }}
          onReset={() => {
            fetchLocationInventorySummary({
              page: 1,
              limit,
              ...(itemType ? { batchType: itemType } : {}),
            });
          }}
        />
        <LocationInventorySummaryTable
          data={summaryData}
          page={page - 1}
          rowsPerPage={limit}
          totalRecords={summaryPagination?.totalRecords ?? 0}
          totalPages={summaryPagination?.totalPages ?? 1}
          onPageChange={onPageChange}
          onRowsPerPageChange={onRowsPerPageChange}
          expandedRowId={expandedRowId}
          onDrillDownToggle={handleDrillDownToggle}
          onRowHover={handleRowHover}
          detailDataMap={detailCache}
          detailErrorMap={detailErrorMap}
          detailLoadingMap={detailLoadingMap}
          detailPage={detailPage}
          detailLimit={detailLimit}
          detailTotalRecords={detailsPagination.totalRecords}
          detailTotalPages={detailsPagination.totalPages}
          onDetailPageChange={handlePageChange}
          onDetailRowsPerPageChange={handleRowsPerPageChange}
          onRefreshDetail={handleDetailsRefresh}
        />
      </Suspense>
      <CustomButton onClick={handleRefresh} sx={{ mt: 2 }}>
        Refresh Location Inventory Summary
      </CustomButton>
    </>
  );
};

export default LocationInventoryPanel;
