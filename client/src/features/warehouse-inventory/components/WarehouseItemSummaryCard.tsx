import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import { CustomButton, CustomCard, Typography } from '@components/index.ts';
import { formatDate } from '@utils/dateTimeUtils.ts';
import { WarehouseItemSummary } from '../state/warehouseInventoryTypes.ts';
import IconButton from '@mui/material/IconButton';
import { ArrowBack, ArrowForward } from '@mui/icons-material';
import { formatLabel } from '@utils/textUtils.ts';

interface WarehouseItemSummaryProps {
  itemsSummary: WarehouseItemSummary[];
  summaryPage: number;
  totalPages: number;
  setSummaryPage: (page: number) => void;
  refreshSummary: () => void;
}

const WarehouseItemSummaryCard = ({
                                    itemsSummary,
                                    summaryPage,
                                    totalPages,
                                    setSummaryPage,
                                    refreshSummary,
                                  }: WarehouseItemSummaryProps) => {
  return (
    <Box>
      {/* Page Header */}
      <Paper sx={{ padding: 2, marginBottom: 3 }}>
        <Typography variant="h4">Warehouse Item Summary</Typography>
      </Paper>
      
      {/* Summary Cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: 5,
        }}
      >
        {itemsSummary.map((item) => (
          <CustomCard
            key={item.inventoryId}
            title={item.itemName}
            subtitle={`Item Type: ${formatLabel(item.itemType)}`}
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
              Reserved Stock: {item.totalReservedStock}
            </Typography>
            <Typography variant="body2">
              Lot Reserved: {item.totalLotReservedStock || 0}
            </Typography>
            <Typography variant="body2">
              Available Stock: {item.totalAvailableStock}
            </Typography>
            <Typography variant="body2">
              Total Stock: {item.totalQtyStock}
            </Typography>
            <Typography variant="body2">
              Total Lots: {item.totalLots}
            </Typography>
            <Typography variant="body2">
              Zero Stock Lots: {item.totalZeroStockLots}
            </Typography>
            <Typography variant="body2">
              Earliest Expiry:{' '}
              {item.earliestExpiry ? formatDate(item.earliestExpiry) : 'N/A'}
            </Typography>
            <Typography variant="body2">
              Latest Expiry:{' '}
              {item.latestExpiry ? formatDate(item.latestExpiry) : 'N/A'}
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

export default WarehouseItemSummaryCard;
