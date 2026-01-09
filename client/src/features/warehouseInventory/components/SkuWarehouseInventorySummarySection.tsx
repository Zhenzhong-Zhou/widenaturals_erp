import { useState, useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import CustomTypography from '@components/common/CustomTypography';
import Loading from '@components/common/Loading';
import ErrorMessage from '@components/common/ErrorMessage';
import CustomCard from '@components/common/CustomCard';
import CustomPagination from '@components/common/CustomPagination';
import CustomButton from '@components/common/CustomButton';
import { formatLabel } from '@utils/textUtils';
import { formatDate } from '@utils/dateTimeUtils';
import useWarehouseInventoryItemSummary from '@hooks/useWarehouseInventoryItemSummary.ts';
import type { ProductWarehouseInventorySummary, WarehouseInventoryItemSummary } from '@features/warehouseInventory';

const SkuWarehouseInventorySummarySection = () => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const cardsPerPage = isSmallScreen ? 1 : 4;

  const [page, setPage] = useState(1);

  const { data, loading, error, fetchWarehouseInventorySummary } =
    useWarehouseInventoryItemSummary({ itemType: 'product' });
  
  const isProductInventory = (
    item: WarehouseInventoryItemSummary
  ): item is ProductWarehouseInventorySummary => {
    return 'skuId' in item;
  };
  
  const highlightedItems = useMemo(() => {
    return data
      .filter(isProductInventory)
      .filter(
        (item) =>
          ['none', 'low', 'critical'].includes(item.stockLevel) ||
          ['expired', 'warning', 'critical'].includes(item.expirySeverity) ||
          ['out_of_stock', 'unassigned', 'suspended'].includes(item.status)
      );
  }, [data]);

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * cardsPerPage;
    return highlightedItems.slice(start, start + cardsPerPage);
  }, [highlightedItems, page, cardsPerPage]);

  const totalPages = Math.ceil(highlightedItems.length / cardsPerPage);

  return (
    <Box sx={{ mt: 5 }}>
      <CustomTypography variant="h5" gutterBottom>
        Inventory Alerts
      </CustomTypography>

      {loading ? (
        <Loading
          size={32}
          variant="dotted"
          message="Loading inventory summary..."
        />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : paginatedItems.length === 0 ? (
        <CustomTypography>No critical inventory issues found.</CustomTypography>
      ) : (
        <>
          <Grid container spacing={2}>
            {paginatedItems
              .filter(isProductInventory)
              .map((item) => (
                <Grid key={item.itemId} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                  <CustomCard
                    title={item.productName}
                    subtitle={`Status: ${formatLabel(item.displayStatus)}`}
                    ariaLabel={`Inventory summary card for ${item.productName}`}
                    sx={{ height: '100%' }}
                  >
                    <CustomTypography>
                      Available: {item.availableQuantity}
                    </CustomTypography>
                    <CustomTypography>
                      Reserved: {item.reservedQuantity}
                    </CustomTypography>
                    <CustomTypography>
                      Total Lots: {item.totalLots}
                    </CustomTypography>
                    <CustomTypography>
                      Nearest Expiry:{' '}
                      {item.nearestExpiryDate
                        ? formatDate(item.nearestExpiryDate)
                        : 'N/A'}
                    </CustomTypography>
                    
                    {['none', 'low', 'critical'].includes(item.stockLevel) && (
                      <CustomTypography sx={{ color: 'warning.main' }}>
                        Stock Level: {formatLabel(item.stockLevel)}
                      </CustomTypography>
                    )}
                    
                    {['expired', 'warning', 'critical'].includes(item.expirySeverity) && (
                      <CustomTypography sx={{ color: 'error.main' }}>
                        Expiry Risk: {formatLabel(item.expirySeverity)}
                      </CustomTypography>
                    )}
                  </CustomCard>
                </Grid>
              ))}
          </Grid>

          <CustomPagination
            page={page}
            totalPages={totalPages}
            totalRecords={highlightedItems.length}
            onPageChange={(newPage) => setPage(newPage)}
            itemsPerPage={cardsPerPage}
          />
        </>
      )}

      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <CustomButton
          onClick={() =>
            fetchWarehouseInventorySummary({
              page: 1,
              limit: 50,
              itemType: 'product',
            })
          }
        >
          Refresh Summary
        </CustomButton>
        <CustomButton
          size="small"
          variant="outlined"
          onClick={() => (window.location.href = '/location-inventory')}
        >
          View Detail
        </CustomButton>
      </Box>
    </Box>
  );
};

export default SkuWarehouseInventorySummarySection;
