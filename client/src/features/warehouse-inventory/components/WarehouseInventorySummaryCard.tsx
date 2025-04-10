import { FC } from 'react';
import { Link } from 'react-router-dom';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import { ArrowBack, ArrowForward, Refresh } from '@mui/icons-material';
import CustomButton from '@components/common/CustomButton';
import CustomCard from '@components/common/CustomCard';
import Typography from '@components/common/Typography';
import { formatLabel, formatCurrency } from '@utils/textUtils';
import { formatDateTime, formatToISODate } from '@utils/dateTimeUtils';
import { WarehouseInventorySummary } from '../state/warehouseInventoryTypes';

interface WarehouseInventorySummaryProps {
  inventoriesSummary: WarehouseInventorySummary[];
  summaryPage: number;
  totalPages: number;
  setSummaryPage: (page: number) => void;
  refreshSummary: () => void;
}

const WarehouseInventorySummaryCard: FC<WarehouseInventorySummaryProps> = ({
  inventoriesSummary,
  summaryPage,
  totalPages,
  setSummaryPage,
  refreshSummary,
}) => {
  return (
    <Box sx={{ position: 'relative', width: '100%', textAlign: 'center' }}>
      {/* Refresh Data Button */}
      <CustomButton
        variant="outlined"
        startIcon={<Refresh />}
        onClick={refreshSummary}
        sx={{ marginBottom: 2, alignSelf: 'center' }}
      >
        Refresh Data
      </CustomButton>

      {/* Summary Cards */}
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          padding: 1,
          justifyContent: 'center',
        }}
      >
        {inventoriesSummary.map((summary) => (
          <CustomCard
            key={summary.warehouseId}
            title={
              <Link
                to={`/warehouse_inventories/${summary.warehouseId}`}
                style={{
                  textDecoration: 'none',
                  color: '#1976d2',
                  fontWeight: 'bold',
                }}
              >
                {summary.warehouseName}
              </Link>
            }
            subtitle={`Status: ${formatLabel(summary.status)}`}
            sx={{
              minWidth: 200,
              flex: '0 0 auto',
              padding: 2,
              transition: 'transform 0.3s ease-in-out',
              '&:hover': { transform: 'scale(1.05)', boxShadow: 6 },
            }}
          >
            {/* Main content inside CustomCard */}
            <Box
              sx={{
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Typography variant="body2">
                Total Products: {summary.totalProducts}
              </Typography>
              <Typography variant="body2">
                Total Quantity: {summary.totalQuantity}
              </Typography>
              <Typography variant="body2">
                Total Lots: {summary.totalLots}
              </Typography>
              <Typography variant="body2">
                Total Reserved Stock: {summary.totalReservedStock}
              </Typography>
              <Typography variant="body2">
                Total Available Stock: {summary.totalAvailableStock}
              </Typography>
              <Typography variant="body2">
                Total Warehouse Fees:{' '}
                {formatCurrency(summary.totalWarehouseFees)}
              </Typography>
              <Typography variant="body2">
                Latest Inventory Update:{' '}
                {formatDateTime(summary.lastInventoryUpdate)}
              </Typography>
              <Typography variant="body2">
                Earliest Expiry: {formatToISODate(summary.earliestExpiry)}
              </Typography>
              <Typography variant="body2">
                Latest Expiry: {formatToISODate(summary.latestExpiry)}
              </Typography>
              <Typography variant="body2">
                Total Zero Stock Lots: {summary.totalZeroStockLots}
              </Typography>
            </Box>
          </CustomCard>
        ))}
      </Box>

      {/* Pagination Buttons */}
      {totalPages > 1 && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            marginTop: 2,
            gap: 1,
          }}
        >
          <IconButton
            onClick={() => setSummaryPage(summaryPage - 1)}
            disabled={summaryPage === 1}
          >
            <ArrowBack />
          </IconButton>
          <Typography variant="body2">{`Page ${summaryPage} of ${totalPages}`}</Typography>
          <IconButton
            onClick={() => setSummaryPage(summaryPage + 1)}
            disabled={summaryPage === totalPages}
          >
            <ArrowForward />
          </IconButton>
        </Box>
      )}
    </Box>
  );
};

export default WarehouseInventorySummaryCard;
