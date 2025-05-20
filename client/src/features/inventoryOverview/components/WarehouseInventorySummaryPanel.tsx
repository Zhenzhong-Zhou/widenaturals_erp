import { type FC, Suspense, useEffect, useState } from 'react';
import Skeleton from '@mui/material/Skeleton';
import CustomButton from '@components/common/CustomButton';
import CustomTypography from '@components/common/CustomTypography';
import ErrorDisplay from '@components/shared/ErrorDisplay';
import ErrorMessage from '@components/common/ErrorMessage';
import WarehouseInventorySummaryTable from '@features/warehouseInventory/components/WarehouseInventorySummaryTable';
import useWarehouseInventoryItemSummary from '@hooks/useWarehouseInventoryItemSummary';
import type { ItemType } from '@features/inventoryShared/types/InventorySharedType';
import useWarehouseInventorySummaryByItemId from '@hooks/useWarehouseInventorySummaryByItemId.ts';
import type { WarehouseInventorySummaryItemDetails } from '@features/warehouseInventory/state';

interface Props {
  page: number;
  limit: number;
  itemType?: ItemType;
  onPageChange: (newPage: number) => void;
  onRowsPerPageChange: (newLimit: number) => void;
}

const WarehouseInventorySummaryPanel: FC<Props> = ({
                                              page,
                                              limit,
                                              itemType,
                                              onPageChange,
                                              onRowsPerPageChange,
                                            }) => {
  const [detailPage, setDetailPage] = useState(1);
  const [detailLimit, setDetailLimit] = useState(5);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [detailCache, setDetailCache] = useState<Record<string, WarehouseInventorySummaryItemDetails[]>>({});
  
  const {
    data: summaryData,
    pagination:  summaryPagination,
    loading: summaryLoading,
    error: summaryError,
    fetchWarehouseInventorySummary,
  } = useWarehouseInventoryItemSummary({ itemType });
  
  const {
    data: detailData,
    pagination: detailsPagination,
    loading: detailLoading,
    error: detailError,
    fetchWarehouseInventorySummaryDetails,
  } = useWarehouseInventorySummaryByItemId();
  
  useEffect(() => {
    fetchWarehouseInventorySummary({ page, limit, itemType });
  }, [page, limit, itemType]);
  
  useEffect(() => {
    if (expandedRowId && !detailCache[expandedRowId]) {
      fetchWarehouseInventorySummaryDetails({
        itemId: expandedRowId,
        page: detailPage,
        limit: detailLimit,
      });
    }
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
    fetchWarehouseInventorySummary({ page, limit, itemType });
  };
  
  const handleDetailsRefresh = () => {
    if (!expandedRowId) return;
    fetchWarehouseInventorySummaryDetails({
      itemId: expandedRowId,
      page: detailPage,
      limit: detailLimit,
    });
  };
  
  const handleDrillDownToggle = (rowId: string) => {
    setExpandedRowId((prev) => (prev === rowId ? null : rowId));
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
    return <CustomTypography sx={{ mt: 2 }}>No warehouse inventory data available.</CustomTypography>;
  }
  
  return (
    <>
      <Suspense fallback={<Skeleton height={400} variant="rectangular" sx={{ borderRadius: 1 }} />}>
        <WarehouseInventorySummaryTable
          data={summaryData}
          page={page - 1}
          rowsPerPage={limit}
          totalRecords={summaryPagination?.totalRecords ?? 0}
          totalPages={summaryPagination?.totalPages ?? 1}
          onPageChange={onPageChange}
          onRowsPerPageChange={onRowsPerPageChange}
          expandedRowId={expandedRowId}
          onDrillDownToggle={handleDrillDownToggle}
          detailDataMap={detailCache}
          detailErrorMap={detailErrorMap}
          detailLoadingMap={detailLoadingMap}
          detailPage={detailPage}
          detailLimit={detailLimit}
          detailTotalRecords={detailsPagination.totalRecords}
          detailTotalPages={detailsPagination.totalPages}
          onDetailPageChange={setDetailPage}
          onDetailRowsPerPageChange={setDetailLimit}
          onRefreshDetail={handleDetailsRefresh}
        />
      </Suspense>
      <CustomButton onClick={handleRefresh} sx={{ mt: 2 }}>
        Refresh Warehouse Inventory Summary
      </CustomButton>
    </>
  );
};

export default WarehouseInventorySummaryPanel;
