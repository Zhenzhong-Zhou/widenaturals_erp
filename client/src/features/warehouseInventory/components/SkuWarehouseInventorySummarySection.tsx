import { useState, useMemo } from 'react';
import { Box, Grid, useMediaQuery } from '@mui/material';
import CustomTypography from '@components/common/CustomTypography';
import Loading from '@components/common/Loading';
import ErrorMessage from '@components/common/ErrorMessage';
import CustomCard from '@components/common/CustomCard';
import CustomPagination from '@components/common/CustomPagination';
import CustomButton from '@components/common/CustomButton';
import { formatLabel } from '@utils/textUtils';
import { formatDate } from '@utils/dateTimeUtils';
import { useThemeContext } from '@context/ThemeContext';
import useWarehouseInventoryItemSummary from '@hooks/useWarehouseInventoryItemSummary.ts';
import type { ProductWarehouseInventorySummary } from '../state/warehouseInventoryTypes';

const SkuWarehouseInventorySummarySection = () => {
  const { theme } = useThemeContext();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const cardsPerPage = isSmallScreen ? 1 : 4;

  const [page, setPage] = useState(1);

  const { data, loading, error, fetchWarehouseInventorySummary } =
    useWarehouseInventoryItemSummary({ itemType: 'product' });

  const highlightedItems = useMemo(() => {
    return data.filter(
      (item: ProductWarehouseInventorySummary) =>
        ['none', 'low', 'critical'].includes(item.stockLevel) || // highlights low stock
        ['expired', 'warning', 'critical'].includes(item.expirySeverity) || // highlights expiry risk
        ['out_of_stock', 'unassigned', 'suspended'].includes(item.status) // extra conditions
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
            {paginatedItems.map((item: ProductWarehouseInventorySummary) => (
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

                  {/* Stock-level feedback */}
                  {['none', 'low', 'critical'].includes(item.stockLevel) && (
                    <CustomTypography sx={{ color: 'warning.main' }}>
                      Stock Level: {formatLabel(item.stockLevel)}
                    </CustomTypography>
                  )}

                  {/* Expiry risk feedback */}
                  {['expired', 'warning', 'critical'].includes(
                    item.expirySeverity
                  ) && (
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
