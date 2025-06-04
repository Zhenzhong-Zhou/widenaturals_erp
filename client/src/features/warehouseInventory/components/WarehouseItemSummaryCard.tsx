import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import IconButton from '@mui/material/IconButton';
import { ArrowBack, ArrowForward } from '@mui/icons-material';
import CustomTypography from '@components/common/CustomTypography';
import CustomCard from '@components/common/CustomCard';
import CustomButton from '@components/common/CustomButton';
import { formatDate } from '@utils/dateTimeUtils';
import { formatLabel } from '@utils/textUtils';
import type { WarehouseItemSummary } from '@features/warehouseInventory/state';

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
        <CustomTypography
          sx={{
            fontWeight: 600,
            lineHeight: 1.3,
            minHeight: '1.25rem',
          }}
        >
          Warehouse Item Summary
        </CustomTypography>
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
            <CustomTypography variant="body2">
              Reserved Stock: {item.totalReservedStock}
            </CustomTypography>
            <CustomTypography variant="body2">
              Lot Reserved: {item.totalLotReservedStock || 0}
            </CustomTypography>
            <CustomTypography variant="body2">
              Available Stock: {item.totalAvailableStock}
            </CustomTypography>
            <CustomTypography variant="body2">
              Total Stock: {item.totalQtyStock}
            </CustomTypography>
            <CustomTypography variant="body2">
              Total Lots: {item.totalLots}
            </CustomTypography>
            <CustomTypography variant="body2">
              Zero Stock Lots: {item.totalZeroStockLots}
            </CustomTypography>
            <CustomTypography variant="body2">
              Earliest Expiry:{' '}
              {item.earliestExpiry ? formatDate(item.earliestExpiry) : 'N/A'}
            </CustomTypography>
            <CustomTypography variant="body2">
              Latest Expiry:{' '}
              {item.latestExpiry ? formatDate(item.latestExpiry) : 'N/A'}
            </CustomTypography>
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
          <CustomTypography
            variant="body2"
            sx={{ minWidth: 80, textAlign: 'center' }}
          >
            {`Page ${summaryPage} of ${totalPages}`}
          </CustomTypography>
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
