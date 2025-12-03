import { type FC, lazy, memo, Suspense } from 'react';
import Skeleton from '@mui/material/Skeleton';
import CustomButton from '@components/common/CustomButton';
import CustomTypography from '@components/common/CustomTypography';
import ErrorDisplay from '@components/shared/ErrorDisplay';
import ErrorMessage from '@components/common/ErrorMessage';
import useWarehouseInventoryItemSummary from '@hooks/useWarehouseInventoryItemSummary';
import useWarehouseInventorySummaryByItemId from '@hooks/useWarehouseInventorySummaryByItemId';
import { useExpandableDetailPanel } from '@features/inventoryOverview/hook/useExpandableDetailPanel';
import type { ItemType } from '@features/inventoryShared/types/InventorySharedType';
import type { WarehouseInventorySummaryItemDetails } from '@features/warehouseInventory/state';
import type {
  InventoryActivityLogQueryParams,
  InventoryLogSource,
} from '@features/report/state';

const WarehouseInventorySummaryTable = lazy(
  () =>
    import('@features/warehouseInventory/components/WarehouseInventorySummaryTable')
);

interface Props {
  page: number;
  limit: number;
  itemType?: ItemType;
  onPageChange: (newPage: number) => void;
  onRowsPerPageChange: (newLimit: number) => void;
  canViewInventoryLogs: boolean;
  onViewLogs: (
    row: InventoryLogSource,
    extraFilters?: Partial<InventoryActivityLogQueryParams>
  ) => void;
}

const WarehouseInventorySummaryPanel: FC<Props> = ({
  page,
  limit,
  itemType,
  onPageChange,
  onRowsPerPageChange,
  canViewInventoryLogs,
  onViewLogs,
}) => {
  const {
    data: summaryData,
    pagination: summaryPagination,
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

  const {
    expandedRowId,
    detailPage,
    detailLimit,
    detailCache,
    detailLoadingMap,
    detailErrorMap,
    handleDrillDownToggle,
    handleRowHover,
    handleDetailPageChange,
    handleDetailRowsPerPageChange,
  } = useExpandableDetailPanel<WarehouseInventorySummaryItemDetails>({
    fetchDetail: fetchWarehouseInventorySummaryDetails,
    detailData,
    detailError,
    detailLoading,
  });

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

  if (summaryLoading) {
    return (
      <>
        {[...Array(5)].map((_, i) => (
          <Skeleton
            key={i}
            variant="rectangular"
            height={60}
            sx={{ borderRadius: 1, mb: 2 }}
          />
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
    return (
      <CustomTypography sx={{ mt: 2 }}>
        No warehouse inventory data available.
      </CustomTypography>
    );
  }

  return (
    <>
      <Suspense
        fallback={
          <Skeleton
            height={400}
            variant="rectangular"
            sx={{ borderRadius: 1 }}
          />
        }
      >
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
          onRowHover={handleRowHover}
          detailDataMap={detailCache}
          detailErrorMap={detailErrorMap}
          detailLoadingMap={detailLoadingMap}
          detailPage={detailPage}
          detailLimit={detailLimit}
          detailTotalRecords={detailsPagination.totalRecords}
          detailTotalPages={detailsPagination.totalPages}
          onDetailPageChange={handleDetailPageChange}
          onDetailRowsPerPageChange={handleDetailRowsPerPageChange}
          onRefreshDetail={handleDetailsRefresh}
          canViewInventoryLogs={canViewInventoryLogs}
          onViewLogs={onViewLogs}
        />
      </Suspense>
      <CustomButton onClick={handleRefresh} sx={{ mt: 2 }}>
        Refresh Warehouse Inventory Summary
      </CustomButton>
    </>
  );
};

export default memo(WarehouseInventorySummaryPanel);
