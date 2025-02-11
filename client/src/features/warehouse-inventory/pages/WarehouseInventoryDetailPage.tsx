import { useParams } from 'react-router-dom';
import { Box, Paper } from '@mui/material';
import { CustomButton, ErrorDisplay, ErrorMessage, Loading, Typography } from '@components/index.ts';
import { useWarehouseInventoryDetails, useWarehouseProductSummary } from '../../../hooks';
import {
  WarehouseInventoryDetailExtended,
  WarehouseInventoryDetailTable,
  WarehouseProductSummaryCard,
} from '../index.ts';

const WarehouseInventoryDetailPage = () => {
  const { warehouseId } = useParams<{ warehouseId: string }>();
  
  if (!warehouseId) {
    return <ErrorDisplay><ErrorMessage message="Warehouse Inventory ID is required." /></ErrorDisplay>;
  }
  
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
  
  const transformedWarehouseInventoryDetails: WarehouseInventoryDetailExtended[] =
    warehouseInventoryDetails.map((detail) => ({
      ...detail,
      lotCreatedBy: detail.lotCreated.by,
      lotCreatedDate: detail.lotCreated.date,
      lotUpdatedBy: detail.lotUpdated.by,
      lotUpdatedDate: detail.lotUpdated.date,
    }));
  
  if (productSummaryLoading) return <Loading message={`Loading Warehouse Product Summary...`} />;
  if (productSummaryError) return <ErrorDisplay><ErrorMessage message={productSummaryError} /></ErrorDisplay>;
  if (!productSummary) return <Typography variant={'h4'}>No warehouse product found.</Typography>;
  
  if (warehouseInventoryDetailLoading) return <Loading message={`Loading Warehouse Inventory Details...`} />;
  if (warehouseInventoryDetailError) return <ErrorDisplay><ErrorMessage message={warehouseInventoryDetailError} /></ErrorDisplay>;
  if (!warehouseInventoryDetails) return <Typography variant={'h4'}>No warehouse inventory records found.</Typography>;
  
  // todo warehouse inventory id and some else
  const handleQuantityUpdate = async (lotId: string, newQuantity: number) => {
    try {
      // Call API or dispatch Redux action to update quantity
      console.log(`Updating lot ${lotId} with new quantity: ${newQuantity}`);
      
      // Refresh inventory details after update
      refreshWarehouseInventoryDetails();
    } catch (error) {
      console.error('Failed to update quantity:', error);
    }
  };
  
  return (
    <Box sx={{ padding: 3 }}>
      {/* Page Header */}
      <Paper sx={{ padding: 2, marginBottom: 3 }}>
        <Typography variant="h4">Warehouse Inventory Detail</Typography>
        <Typography variant="h6" color="textSecondary">
          Warehouse Name: {warehouseId}
        </Typography>
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
        <Typography variant="h5">Product Lots in Warehouse</Typography>
        
        <WarehouseInventoryDetailTable
          data={transformedWarehouseInventoryDetails}
          page={warehouseInventoryDetailPage - 1}
          rowsPerPage={warehouseInventoryDetailLimit}
          totalRecords={warehouseInventoryDetailPagination.totalRecords}
          totalPages={warehouseInventoryDetailPagination.totalPages}
          onPageChange={(newPage) => setWarehouseInventoryDetailPage(newPage + 1)}
          onRowsPerPageChange={(newLimit) => setWarehouseInventoryDetailLimit(newLimit)}
          onQuantityUpdate={handleQuantityUpdate}
        />
      </Paper>
      
      {/* Refresh Button */}
      <Box sx={{ textAlign: 'center', marginTop: 3 }}>
        <CustomButton onClick={refreshWarehouseInventoryDetails}>Refresh Inventory Details</CustomButton>
      </Box>
    </Box>
  );
};

export default WarehouseInventoryDetailPage;
