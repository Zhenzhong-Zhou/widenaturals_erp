import { FC } from 'react';
import { Link } from 'react-router-dom';
import Box from '@mui/material/Box';
import { WarehouseInventorySummary } from '../state/warehouseInventoryTypes.ts';
import { CustomCard, Typography } from '@components/index.ts';
import { capitalizeFirstLetter, formatCurrency } from '@utils/textUtils.ts';
import { formatDate } from '@utils/dateTimeUtils.ts';

interface WarehouseInventorySummaryProps {
  inventoriesSummary: WarehouseInventorySummary[];
}

const WarehouseInventorySummaryCard: FC<WarehouseInventorySummaryProps> = ({ inventoriesSummary }) => {
  return (
    <Box sx={{
      display: 'flex',
      overflowX: 'auto', // Horizontal scrolling
      gap: 2,
      padding: 1,
      scrollbarWidth: 'thin',
      '&::-webkit-scrollbar': { height: '6px' }, // Custom scrollbar
      '&::-webkit-scrollbar-thumb': { backgroundColor: '#ccc', borderRadius: '4px' },
    }}>
      {inventoriesSummary.map((summary) => (
        <CustomCard
          key={summary.warehouseId}
          title={
            <Link
              to={`/warehouses/${summary.warehouseId}`}
              style={{ textDecoration: 'none', color: '#1976d2', fontWeight: 'bold' }}
            >
              {summary.warehouseName}
            </Link>
          }
          subtitle={`Status: ${capitalizeFirstLetter(summary.status)}`}
          sx={{
            minWidth: 250, // Responsive size
            flex: '0 0 auto', // Prevent shrinking
            transition: 'transform 0.3s ease-in-out',
            '&:hover': { transform: 'scale(1.05)', boxShadow: 6 },
          }}
        >
          {/* Main content inside CustomCard */}
          <Box>
            <Typography>Total Products: {summary.totalProducts}</Typography>
            <Typography>Total Lots: {summary.totalLots}</Typography>
            <Typography>Total Reserved Stock: {summary.totalReservedStock}</Typography>
            <Typography>Total Available Stock: {summary.totalAvailableStock}</Typography>
            <Typography>Total Warehouse Fees: {formatCurrency(summary.totalWarehouseFees)}</Typography>
            <Typography>Latest Inventory Update: {formatDate(summary.lastInventoryUpdate)}</Typography>
            <Typography>Earliest Expiry: {formatDate(summary.earliestExpiry)}</Typography>
            <Typography>Latest Expiry: {formatDate(summary.latestExpiry)}</Typography>
          </Box>
        </CustomCard>
      ))}
    </Box>
  );
};

export default WarehouseInventorySummaryCard;
