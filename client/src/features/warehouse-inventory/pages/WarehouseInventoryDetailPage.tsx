import { useParams } from 'react-router-dom';
import { Box, Paper } from '@mui/material';
import {
  CustomButton,
  ErrorDisplay,
  ErrorMessage,
  Loading,
  Typography,
} from '@components/index.ts';
import {
  useBulkInsertWarehouseInventory,
  useLotAdjustmentQty, useWarehouseDetails,
  useWarehouseInventoryDetails,
  useWarehouseProductSummary,
} from '../../../hooks';
import {
  BulkInsertInventoryRequest, InventoryItem,
  WarehouseInventoryDetailExtended, WarehouseInventoryDetailHeader,
  WarehouseInventoryDetailTable,
  WarehouseProductSummaryCard,
} from '../index.ts';

const WarehouseInventoryDetailPage = () => {
  const { warehouseId } = useParams<{ warehouseId: string }>();

  if (!warehouseId) {
    return (
      <ErrorDisplay>
        <ErrorMessage message="Warehouse Inventory ID is required." />
      </ErrorDisplay>
    );
  }
  
  const { warehouseDetails, loading, error, refetch } = useWarehouseDetails(warehouseId);
  
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
  } = useWarehouseInventoryDetails(warehouseId, 1, 5);

  const { handleSingleLotAdjustment, handleBulkLotAdjustment } =
    useLotAdjustmentQty(refreshWarehouseInventoryDetails);
  
  const { isLoading, handleBulkInsert } = useBulkInsertWarehouseInventory();

  const transformedWarehouseInventoryDetails: WarehouseInventoryDetailExtended[] =
    warehouseInventoryDetails.map((detail) => ({
      ...detail,
      lotCreatedBy: detail.lotCreated.by,
      lotCreatedDate: detail.lotCreated.date,
      lotUpdatedBy: detail.lotUpdated.by,
      lotUpdatedDate: detail.lotUpdated.date,
    }));
  
  if (loading) return <Loading message={"Loading warehouse details..."}/>;
  if (error) return <ErrorDisplay><ErrorMessage message={error}/></ErrorDisplay>;
  
  if (productSummaryLoading)
    return <Loading message={`Loading Warehouse Product Summary...`} />;
  if (productSummaryError)
    return (
      <ErrorDisplay>
        <ErrorMessage message={productSummaryError} />
      </ErrorDisplay>
    );
  if (!productSummary)
    return <Typography variant={'h4'}>No warehouse product found.</Typography>;

  if (warehouseInventoryDetailLoading)
    return <Loading message={`Loading Warehouse Inventory Details...`} />;
  if (warehouseInventoryDetailError)
    return (
      <ErrorDisplay>
        <ErrorMessage message={warehouseInventoryDetailError} />
      </ErrorDisplay>
    );
  if (!warehouseInventoryDetails)
    return (
      <Typography variant={'h4'}>
        No warehouse inventory records found.
      </Typography>
    );
  
  if (isLoading) {
    return <Loading  message={`Loading Available Product Information...`} />;
  }
  
  // Function to handle bulk insert submission
  const handleBulkInsertSubmit = async (formData: Record<string, any>[]) => {
    try {
      const requestPayload: BulkInsertInventoryRequest = {
        inventoryData: formData.map((item) => ({
          type: item.type,
          warehouse_id: warehouseId,
          product_id: item.product_id,
          quantity: Number(item.quantity),
          lot_number: item.lot_number,
          expiry_date: item.expiry_date,
          manufacture_date: item.manufacture_date || undefined,
          identifier: item.identifier || undefined,
        })) as InventoryItem[],
      };
      
      await handleBulkInsert(requestPayload); // Ensure you have this function in `useBulkInsertWarehouseInventory`
      
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
        <WarehouseInventoryDetailHeader warehouseDetails={warehouseDetails} loading={loading} refetch={refetch} />
      </Paper>

      {/* Product Summary Section */}
      {productSummary.length > 0 && (
        <WarehouseProductSummaryCard
          productsSummary={productSummary}
          summaryPage={productSummaryPage}
          totalPages={productSummaryPagination.totalPages}
          setSummaryPage={setProductSummaryPage}
          refreshSummary={refreshProductSummary}
        />
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
