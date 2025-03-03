import { Box, Paper } from '@mui/material';
import { CustomButton, CustomCard, Typography } from '@components/index.ts';
import { formatDate } from '@utils/dateTimeUtils.ts';
import { WarehouseProductSummary } from '../state/warehouseInventoryTypes.ts';
import IconButton from '@mui/material/IconButton';
import { ArrowBack, ArrowForward } from '@mui/icons-material';

interface WarehouseProductSummaryProps {
  productsSummary: WarehouseProductSummary[];
  summaryPage: number;
  totalPages: number;
  setSummaryPage: (page: number) => void;
  refreshSummary: () => void;
}

const WarehouseProductSummaryCard = ({
  productsSummary,
  summaryPage,
  totalPages,
  setSummaryPage,
  refreshSummary,
}: WarehouseProductSummaryProps) => {
  return (
    <Box>
      {/* Page Header */}
      <Paper sx={{ padding: 2, marginBottom: 3 }}>
        <Typography variant="h4">Warehouse Product Summary</Typography>
      </Paper>

      {/* Summary Cards (Limited to 3 per Page) */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: 5,
        }}
      >
        {productsSummary.map((product) => (
          <CustomCard
            key={product.inventoryId}
            title={product.productName}
            subtitle={`Total Lots: ${product.totalLots}`}
            sx={{
              minWidth: 300,
              transition:
                'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
              '&:hover': {
                transform: 'scale(1.05)',
                boxShadow: 3,
              },
            }}
          >
            <Typography variant="body2">
              Reserved Stock: {product.totalReservedStock}
            </Typography>
            <Typography variant="body2">
              Available Stock: {product.totalAvailableStock}
            </Typography>
            <Typography variant="body2">
              Total Stock: {product.totalQtyStock}
            </Typography>
            <Typography variant="body2">
              Zero Stock Lots: {product.totalZeroStockLots}
            </Typography>
            <Typography variant="body2">
              Earliest Expiry:{' '}
              {product.earliestExpiry
                ? formatDate(product.earliestExpiry)
                : 'N/A'}
            </Typography>
            <Typography variant="body2">
              Latest Expiry:{' '}
              {product.latestExpiry ? formatDate(product.latestExpiry) : 'N/A'}
            </Typography>
          </CustomCard>
        ))}
      </Box>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 2,
            gap: 2,
          }}
        >
          <IconButton
            onClick={() =>
              setSummaryPage(summaryPage > 1 ? summaryPage - 1 : 1)
            }
            disabled={summaryPage === 1}
            color="primary"
          >
            <ArrowBack />
          </IconButton>
          <Typography
            variant="body2"
            sx={{ minWidth: 80, textAlign: 'center' }}
          >
            {`Page ${summaryPage} of ${totalPages}`}
          </Typography>
          <IconButton
            onClick={() =>
              setSummaryPage(
                summaryPage < totalPages ? summaryPage + 1 : totalPages
              )
            }
            disabled={summaryPage === totalPages}
            color="primary"
          >
            <ArrowForward />
          </IconButton>
        </Box>
      )}

      {/* Refresh Button */}
      <Box sx={{ display: 'flex', justifyContent: 'center', marginTop: 2 }}>
        <CustomButton onClick={refreshSummary}>Refresh Data</CustomButton>
      </Box>
    </Box>
  );
};

export default WarehouseProductSummaryCard;
