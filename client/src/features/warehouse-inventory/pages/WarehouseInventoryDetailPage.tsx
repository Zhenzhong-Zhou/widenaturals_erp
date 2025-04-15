import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Loading from '@components/common/Loading';
import WarehouseInventoryDetailHeader from '@features/warehouse-inventory/components/WarehouseInventoryDetailHeader';
import CustomTypography from '@components/common/CustomTypography';
import CustomButton from '@components/common/CustomButton';
import ErrorDisplay from '@components/shared/ErrorDisplay';
import ErrorMessage from '@components/common/ErrorMessage';
import useWarehouseDetails from '@hooks/useWarehouseDetails';
import type {
  BulkInsertInventoryRequest,
  InventoryItem,
  WarehouseInventoryDetail,
  WarehouseInventoryDetailExtended,
} from '@features/warehouse-inventory/state';
import useWarehouseItemSummary from '@hooks/useWarehouseItemSummary';
import useWarehouseInventoryDetails from '@hooks/useWarehouseInventoryDetails';
import useLotAdjustmentQty from '@hooks/useLotAdjustmentQty';
import useBulkInsertWarehouseInventory from '@hooks/useBulkInsertWarehouseInventory';
import useInsertedInventoryRecordsResponse from '@hooks/useInsertedInventoryRecordsResponse';
import Skeleton from '@mui/material/Skeleton';

const WarehouseItemSummaryCard = lazy(() =>
  import('@features/warehouse-inventory/components/WarehouseItemSummaryCard'));
const WarehouseInventoryDetailTable = lazy(() =>
  import('@features/warehouse-inventory/components/WarehouseInventoryDetailTable'));

const WarehouseInventoryDetailPage = () => {
  const { warehouseId } = useParams<{ warehouseId: string }>();
  const [openDialog, setOpenDialog] = useState(false);

  if (!warehouseId) {
    return (
      <ErrorDisplay>
        <ErrorMessage message="Warehouse Inventory ID is required." />
      </ErrorDisplay>
    );
  }

  const { warehouseDetails, loading, error, refetch } =
    useWarehouseDetails(warehouseId);

  // Fetch item summary (overview of all inventory items in warehouse)
  const {
    itemSummary,
    itemSummaryPagination,
    itemSummaryLoading,
    itemSummaryError,
    itemSummaryPage,
    setItemSummaryPage,
    refreshItemSummary,
  } = useWarehouseItemSummary(warehouseId, 1, 5);

  // Fetch warehouse inventory details (lot-level)
  const {
    warehouseInventoryDetails,
    warehouseInventoryDetailPagination,
    warehouseInventoryDetailLoading,
    warehouseInventoryDetailError,
    warehouseInventoryDetailPage,
    warehouseInventoryDetailLimit,
    setWarehouseInventoryDetailPage,
    setWarehouseInventoryDetailLimit,
    refreshWarehouseInventoryDetails,
  } = useWarehouseInventoryDetails(warehouseId, 1, 10);

  const { handleSingleLotAdjustment, handleBulkLotAdjustment } =
    useLotAdjustmentQty(refreshWarehouseInventoryDetails);

  const { isLoading, handleBulkInsert } = useBulkInsertWarehouseInventory();

  const { fetchInsertedInventoryRecords, data: insertedDataResponse } =
    useInsertedInventoryRecordsResponse();

  useEffect(() => {
    if (insertedDataResponse && insertedDataResponse.data.length > 0) {
      setOpenDialog(true);
    }
  }, [insertedDataResponse]);
  
  const transformedWarehouseInventoryDetails = useMemo<WarehouseInventoryDetailExtended[]>(() => {
    return warehouseInventoryDetails.map((detail: WarehouseInventoryDetail) => ({
      ...detail,
      lotCreatedBy: detail.lotCreated?.by ?? 'Unknown',
      lotCreatedDate: detail.lotCreated?.date ?? null,
      lotUpdatedBy: detail.lotUpdated?.by ?? 'Unknown',
      lotUpdatedDate: detail.lotUpdated?.date ?? null,
      indicators_isExpired: detail.indicators?.isExpired ?? false,
      indicators_isNearExpiry: detail.indicators?.isNearExpiry ?? false,
      indicators_isLowStock: detail.indicators?.isLowStock ?? false,
      indicators_stockLevel: detail.indicators?.stockLevel ?? 'none',
      indicators_expirySeverity: detail.indicators?.expirySeverity ?? 'unknown',
    }));
  }, [warehouseInventoryDetails]);
  
  const handlePageChange = useCallback(
    (newPage: number) => setWarehouseInventoryDetailPage(newPage + 1),
    []
  );
  
  const handleRowsPerPageChange = useCallback(
    (newLimit: number) => {
      setWarehouseInventoryDetailLimit(newLimit);
      setWarehouseInventoryDetailPage(1);
    },
    []
  );
  
  if (loading) return <Loading message={'Loading warehouse details...'} />;
  if (error)
    return (
      <ErrorDisplay>
        <ErrorMessage message={error} />
      </ErrorDisplay>
    );

  if (itemSummaryLoading)
    return <Loading message={`Loading Warehouse Item Summary...`} />;
  if (itemSummaryError)
    return (
      <ErrorDisplay>
        <ErrorMessage message={itemSummaryError} />
      </ErrorDisplay>
    );

  if (warehouseInventoryDetailLoading)
    return <Loading message={`Loading Warehouse Inventory Details...`} />;
  if (warehouseInventoryDetailError)
    return (
      <ErrorDisplay>
        <ErrorMessage message={warehouseInventoryDetailError} />
      </ErrorDisplay>
    );

  if (isLoading) {
    return <Loading message={`Loading Inventory Data...`} />;
  }

  // Handle bulk insert
  const handleBulkInsertSubmit = async (formData: Record<string, any>[]) => {
    try {
      // Remove objects that only have `warehouse_id` or `type` with no meaningful data
      const filteredData = formData.filter((item) => {
        // Ensure quantity is not 0
        // Remove if no meaningful data exists (i.e., only warehouse_id or type is present)
        return (
          (item.product_id && item.product_id.trim() !== '') ||
          (item.identifier && item.identifier.trim() !== '') ||
          (item.lot_number && item.lot_number.trim() !== '') ||
          (item.expiry_date && item.expiry_date.trim() !== '') ||
          (item.manufacture_date && item.manufacture_date.trim() !== '') ||
          (item.quantity && Number(item.quantity) > 0)
        );
      });

      // If all objects were removed (i.e., no valid data), stop the process
      if (filteredData.length === 0) {
        console.warn('No valid data to submit.');
        return;
      }

      const requestPayload: BulkInsertInventoryRequest = {
        inventoryData: filteredData.map((item) => ({
          type: item.type,
          warehouse_id: warehouseId, // Always included in valid objects
          product_id: item.product_id || undefined,
          quantity: Number(item.quantity),
          reserved_quantity: Number(item.reserved_quantity),
          lot_number: item.lot_number?.trim() || undefined,
          expiry_date: item.expiry_date?.trim() || undefined,
          manufacture_date: item.manufacture_date?.trim() || undefined,
          identifier: item.identifier?.trim() || undefined,
        })) as InventoryItem[],
      };

      const succeedResponse = await handleBulkInsert(requestPayload);

      // Fetch inserted inventory records based on inserted identifiers
      await fetchInsertedInventoryRecords({
        warehouseLotIds: succeedResponse.data.warehouseLotsInventoryRecords,
      });

      // Open the response dialog
      setOpenDialog(true);

      // Refresh warehouse inventory after submission
      refreshWarehouseInventoryDetails();
    } catch (error) {
      console.error('Bulk Insert Error:', error);
    }
  };

  return (
    <Box sx={{ padding: 3 }}>
      {/* Page Header */}
      <Paper sx={{ padding: 2, marginBottom: 3 }}>
        <WarehouseInventoryDetailHeader
          warehouseDetails={warehouseDetails}
          loading={loading}
          refetch={refetch}
        />
      </Paper>

      {/* Item Summary Section */}
      {Array.isArray(itemSummary) && itemSummary.length > 0 ? (
        <Suspense fallback={<Skeleton height={180} width="100%" />}>
          <WarehouseItemSummaryCard
            itemsSummary={itemSummary}
            summaryPage={itemSummaryPage}
            totalPages={itemSummaryPagination?.totalPages || 0}
            setSummaryPage={setItemSummaryPage}
            refreshSummary={refreshItemSummary}
          />
        </Suspense>
      ) : (
        <CustomTypography
          variant="body1"
          sx={{ textAlign: 'center', padding: 2 }}
        >
          No warehouse item found.
        </CustomTypography>
      )}

      {/* Inventory Details Section */}
      <Paper sx={{ padding: 2, marginTop: 3 }}>
        <Suspense fallback={<Skeleton height={400} />}>
          <WarehouseInventoryDetailTable
            data={transformedWarehouseInventoryDetails}
            page={warehouseInventoryDetailPage - 1}
            rowsPerPage={warehouseInventoryDetailLimit}
            totalRecords={warehouseInventoryDetailPagination.totalRecords}
            totalPages={warehouseInventoryDetailPagination.totalPages}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
            onSingleLotQuantityUpdate={handleSingleLotAdjustment}
            onBulkLotsQtyUpdate={handleBulkLotAdjustment}
            warehouseId={warehouseId}
            handleBulkInsertSubmit={handleBulkInsertSubmit}
            insertedDataResponse={insertedDataResponse}
            openDialog={openDialog}
            setOpenDialog={setOpenDialog}
          />
        </Suspense>
      </Paper>

      {/* Refresh Button */}
      <Box sx={{ textAlign: 'center', marginTop: 3 }}>
        <CustomButton onClick={refreshWarehouseInventoryDetails}>
          Refresh Inventory Details
        </CustomButton>
      </Box>
    </Box>
  );
};

export default WarehouseInventoryDetailPage;
