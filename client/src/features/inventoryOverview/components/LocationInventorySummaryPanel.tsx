import { type FC, lazy, memo, Suspense, useEffect, useRef } from 'react';
import Skeleton from '@mui/material/Skeleton';
import CustomButton from '@components/common/CustomButton';
import CustomTypography from '@components/common/CustomTypography';
import ErrorDisplay from '@components/shared/ErrorDisplay';
import ErrorMessage from '@components/common/ErrorMessage';
import Loading from '@components/common/Loading';
import useLocationInventorySummary from '@hooks/useLocationInventorySummary';
import useLocationInventorySummaryByItemId from '@hooks/useLocationInventorySummaryByItemId';
import { useExpandableDetailPanel } from '@features/inventoryOverview/hook/useExpandableDetailPanel';
import type { ItemType } from '@features/inventoryShared/types/InventorySharedType';
import type { LocationInventorySummaryItemDetail } from '@features/locationInventory/state';
import type {
  InventoryActivityLogQueryParams,
  InventoryLogSource,
} from '@features/report/state';

const LocationInventoryFilterPanel = lazy(
  () =>
    import('@features/locationInventory/components/LocationInventoryFilterPanel')
);
const LocationInventorySummaryTable = lazy(
  () =>
    import('@features/locationInventory/components/LocationInventorySummaryTable')
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

const LocationInventorySummaryPanel: FC<Props> = ({
  page,
  limit,
  itemType,
  onPageChange,
  onRowsPerPageChange,
  canViewInventoryLogs,
  onViewLogs,
}) => {
  const hasFetchedRef = useRef(false);

  const {
    data: summaryData,
    pagination: summaryPagination,
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
  } = useExpandableDetailPanel<LocationInventorySummaryItemDetail>({
    fetchDetail: fetchLocationInventorySummaryDetail,
    detailData,
    detailError,
    detailLoading,
  });

  useEffect(() => {
    const fetch = () => {
      fetchLocationInventorySummary({
        page,
        limit,
        ...(itemType ? { batchType: itemType } : {}),
      });
    };

    // Fetch only once on mount if you want to avoid early triggering
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;

      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(fetch);
      } else {
        setTimeout(fetch, 100); // fallback
      }

      return;
    }

    // Subsequent fetches (pagination / itemType changes)
    const debounceId = setTimeout(fetch, 100);

    return () => clearTimeout(debounceId);
  }, [page, limit, itemType]);

  const handleRefresh = () => {
    fetchLocationInventorySummary({
      page,
      limit,
      ...(itemType ? { batchType: itemType } : {}),
    });
  };

  const handleDetailsRefresh = () => {
    if (!expandedRowId) return;
    fetchLocationInventorySummaryDetail({
      itemId: expandedRowId,
      page: detailPage,
      limit: detailLimit,
    });
  };

  if (summaryLoading) {
    return (
      <>
        {Array.from({ length: 5 }, (_, i) => (
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
        No location inventory data available.
      </CustomTypography>
    );
  }
  
  const isPageLoading =
    summaryLoading ||
    detailLoading ||
    !summaryPagination ||
    !detailsPagination;
  
  if (isPageLoading) {
    return <Loading message="Loading inventory summary..." />;
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
        <LocationInventoryFilterPanel
          initialFilters={{ batchType: 'product' }}
          visibleFields={['batchType', 'productName', 'materialName', 'sku']}
          onApply={(filters) =>
            fetchLocationInventorySummary({
              page: 1,
              limit,
              ...filters,
              ...(itemType ? { batchType: itemType } : {}),
            })
          }
          onReset={() => {
            fetchLocationInventorySummary({
              page: 1,
              limit,
              batchType: 'product',
            });
          }}
          showActionsWhenAll={true}
          requireBatchTypeForActions={true}
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
          onDetailPageChange={handleDetailPageChange}
          onDetailRowsPerPageChange={handleDetailRowsPerPageChange}
          onRefreshDetail={handleDetailsRefresh}
          canViewInventoryLogs={canViewInventoryLogs}
          onViewLogs={onViewLogs}
        />
      </Suspense>

      <CustomButton onClick={handleRefresh} sx={{ mt: 2 }}>
        Refresh Location Inventory Summary
      </CustomButton>
    </>
  );
};

export default memo(LocationInventorySummaryPanel);
