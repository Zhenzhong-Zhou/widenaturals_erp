import { useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import {
  CustomButton,
  ErrorDisplay,
  ErrorMessage,
  Loading,
  Typography,
} from '@components/index.ts';
import {
  useBulkInsertWarehouseInventory,
  useInsertedInventoryRecordsResponse,
  useLotAdjustmentQty,
  useWarehouseDetails,
  useWarehouseInventoryDetails,
  useWarehouseProductSummary,
} from '../../../hooks';
import {
  BulkInsertInventoryRequest,
  InventoryItem,
  WarehouseInventoryDetailExtended,
  WarehouseInventoryDetailHeader,
  WarehouseInventoryDetailTable,
  WarehouseProductSummaryCard,
} from '../index.ts';
import { useEffect, useState } from 'react';

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

  // Fetch product summary (overview of all products in warehouse)
  const {
    productSummary,
    productSummaryPagination,
    productSummaryLoading,
    productSummaryError,
    productSummaryPage,
    setProductSummaryPage,
    refreshProductSummary,
  } = useWarehouseProductSummary(warehouseId, 1, 5);

  // Fetch warehouse inventory details (product lots)
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

  const transformedWarehouseInventoryDetails: WarehouseInventoryDetailExtended[] =
    warehouseInventoryDetails.map((detail) => ({
      ...detail,
      lotCreatedBy: detail.lotCreated.by,
      lotCreatedDate: detail.lotCreated.date,
      lotUpdatedBy: detail.lotUpdated.by,
      lotUpdatedDate: detail.lotUpdated.date,
    }));

  if (loading) return <Loading message={'Loading warehouse details...'} />;
  if (error)
    return (
      <ErrorDisplay>
        <ErrorMessage message={error} />
      </ErrorDisplay>
    );

  if (productSummaryLoading)
    return <Loading message={`Loading Warehouse Product Summary...`} />;
  if (productSummaryError)
    return (
      <ErrorDisplay>
        <ErrorMessage message={productSummaryError} />
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
    return <Loading message={`Loading Available Product Information...`} />;
  }

  // Function to handle bulk insert submission
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

      {/* Product Summary Section */}
      {Array.isArray(productSummary) && productSummary.length > 0 ? (
        <WarehouseProductSummaryCard
          productsSummary={productSummary}
          summaryPage={productSummaryPage}
          totalPages={productSummaryPagination?.totalPages || 0}
          setSummaryPage={setProductSummaryPage}
          refreshSummary={refreshProductSummary}
        />
      ) : (
        <Typography variant="body1" sx={{ textAlign: 'center', padding: 2 }}>
          No warehouse product found.
        </Typography>
      )}

      {/* Inventory Details Section */}
      <Paper sx={{ padding: 2, marginTop: 3 }}>
        <WarehouseInventoryDetailTable
          data={transformedWarehouseInventoryDetails}
          page={warehouseInventoryDetailPage - 1}
          rowsPerPage={warehouseInventoryDetailLimit}
          totalRecords={warehouseInventoryDetailPagination.totalRecords}
          totalPages={warehouseInventoryDetailPagination.totalPages}
          onPageChange={(newPage) =>
            setWarehouseInventoryDetailPage(newPage + 1)
          }
          onRowsPerPageChange={(newLimit) =>
            setWarehouseInventoryDetailLimit(newLimit)
          }
          onSingleLotQuantityUpdate={handleSingleLotAdjustment}
          onBulkLotsQtyUpdate={handleBulkLotAdjustment}
          warehouseId={warehouseId}
          handleBulkInsertSubmit={handleBulkInsertSubmit}
          insertedDataResponse={insertedDataResponse}
          openDialog={openDialog}
          setOpenDialog={setOpenDialog}
        />
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
