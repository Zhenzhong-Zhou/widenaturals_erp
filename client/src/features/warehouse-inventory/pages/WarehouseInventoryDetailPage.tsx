import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useWarehouseProductSummary } from '../../../hooks';
import { Box, Paper } from '@mui/material';
import { CustomCard, Loading, ErrorDisplay, ErrorMessage, Typography, CustomButton } from '@components/index.ts';
import { formatDate } from '@utils/dateTimeUtils.ts';
import useWarehouseInventoryDetails from '../../../hooks/useWarehouseInventoryDetails.ts';
import { WarehouseInventoryDetailTable } from '../index.ts';

const WarehouseInventoryDetailPage = () => {
  const { warehouseId } = useParams<{ warehouseId: string }>();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  
  if (!warehouseId) {
    return <ErrorDisplay><ErrorMessage message="Warehouse Inventory ID is required." /></ErrorDisplay>;
  }
  
  // Fetch product summary (overview of all products in warehouse)
  const {
    productSummary,
    pagination: productPagination,
    loading: productLoading,
    error: productError,
    refresh: refreshProductSummary
  } = useWarehouseProductSummary(warehouseId, page, limit);
  
  const {
    inventoryDetails,
    pagination: detailPagination,
    // loading: detailLoading,
    // error: detailError,
  } = useWarehouseInventoryDetails(warehouseId, page, limit);
  console.log(productSummary)
  return (
    <Box sx={{ padding: 3 }}>
      {/* Page Header */}
      <Paper sx={{ padding: 2, marginBottom: 3 }}>
        <Typography variant="h4">Warehouse Inventory Detail</Typography>
        <Typography variant="h6" color="textSecondary">
          Warehouse Name: {warehouseId}
        </Typography>
      </Paper>
      
      {/* Loading & Error Handling for Product Summary */}
      {productLoading && <Loading message="Loading product summary..." />}
      {productError && <ErrorDisplay><ErrorMessage message={productError} /></ErrorDisplay>}
      
      {/* Product Summary Cards */}
      {productSummary.length > 0 && (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 2 }}>
          {productSummary.map((product) => (
            <CustomCard
              key={product.productId}
              title={product.productName}
              subtitle={`Total Lots: ${product.totalLots}`}
              sx={{ minWidth: 250 }}
            >
              <Typography variant="body2">Reserved Stock: {product.totalReservedStock}</Typography>
              <Typography variant="body2">Available Stock: {product.totalAvailableStock}</Typography>
              <Typography variant="body2">Zero Stock Lots: {product.totalZeroStockLots}</Typography>
              <Typography variant="body2">Earliest Expiry: {formatDate(product.earliestExpiry)}</Typography>
              <Typography variant="body2">Latest Expiry: {formatDate(product.latestExpiry)}</Typography>
            </CustomCard>
          ))}
        </Box>
      )}
      
      {/* Refresh Button for Product Summary */}
      <CustomButton onClick={refreshProductSummary} sx={{ marginTop: 2 }}>Refresh Product Summary</CustomButton>
      
      {/* Product Lots Table */}
      <Paper sx={{ padding: 2, marginTop: 3 }}>
        <Typography variant="h5">Product Lots in Warehouse</Typography>
        
        <WarehouseInventoryDetailTable
          data={inventoryDetails}
          page={page - 1}
          rowsPerPage={limit}
          totalRecords={detailPagination.totalRecords}
          totalPages={detailPagination.totalPages}
          onPageChange={(newPage) => setPage(newPage + 1)}
          onRowsPerPageChange={(newLimit) => setLimit(newLimit)}
        />
      </Paper>
      
      {/* Refresh Button for Product Lots */}
      {/*<Button onClick={refreshInventoryLots} sx={{ marginTop: 2 }}>Refresh Inventory Lots</Button>*/}
    </Box>
  );
};

export default WarehouseInventoryDetailPage;
