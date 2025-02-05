import { useState } from 'react';
import { useWarehouseProductSummary } from '../../../hooks';
import { Box, Paper, Typography, Button } from '@mui/material';
import { CustomCard } from '@components/index.ts';
import { formatDate } from '@utils/dateTimeUtils.ts';

interface WarehouseProductSummaryProps {
  warehouseId: string;
}

const WarehouseProductSummaryCard = ({ warehouseId }: WarehouseProductSummaryProps) => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  
  const {
    productSummary,
    pagination,
    loading,
    error,
    refresh,
  } = useWarehouseProductSummary(warehouseId, page, limit);
  
  return (
    <Box sx={{ padding: 3 }}>
      {/* Page Header */}
      <Paper sx={{ padding: 2, marginBottom: 3 }}>
        <Typography variant="h4">Warehouse Product Summary</Typography>
      </Paper>
      
      {/* Loading & Error Handling */}
      {loading && <Typography>Loading...</Typography>}
      {error && <Typography color="error">{error}</Typography>}
      {!loading && !error && productSummary.length === 0 && (
        <Typography>No product summary available for this warehouse.</Typography>
      )}
      
      {/* Summary Cards */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
        gap: 2
      }}>
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
      
      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', marginTop: 2, gap: 2 }}>
          <Button
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <Typography variant="body2">{`Page ${page} of ${pagination.totalPages}`}</Typography>
          <Button
            onClick={() => setPage((prev) => Math.min(prev + 1, pagination.totalPages))}
            disabled={page === pagination.totalPages}
          >
            Next
          </Button>
        </Box>
      )}
      
      {/* Refresh Button */}
      <Button onClick={refresh} sx={{ marginTop: 2 }}>
        Refresh Data
      </Button>
    </Box>
  );
};

export default WarehouseProductSummaryCard;
