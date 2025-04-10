import { FC, ReactNode, useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';
import { Skeleton, useMediaQuery } from '@mui/material';
import Typography from '@components/common/Typography';
import Loading from '@components/common/Loading';
import ErrorMessage from '@components/common/ErrorMessage';
import CustomCard from '@components/common/CustomCard';
import CustomPagination from '@components/common/CustomPagination';
import CustomButton from '@components/common/CustomButton';
import useInventorySummary from '@hooks/useInventorySummary';
import { formatDate } from '@utils/dateTimeUtils';
import { useThemeContext } from '@context/ThemeContext';
import { formatLabel } from '@utils/textUtils';
import { InventorySummary } from '@features/inventory';

interface BaseDashboardLayoutProps {
  fullName?: string;
  children: ReactNode;
  showInventorySummary?: boolean;
}

const DashboardLayout: FC<BaseDashboardLayoutProps> = ({
                                                         fullName,
                                                         children,
                                                         showInventorySummary = false,
                                                       }) => {
  const { theme } = useThemeContext();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const cardsPerPage = isSmallScreen ? 1 : 4;
  
  const [page, setPage] = useState(1); // UI page for pagination (not server)
  const fetchLimit = 100;
  
  const {
    inventorySummaryData,
    inventorySummaryLoading,
    inventorySummaryError,
    fetchSummary,
    refreshSummary,
  } = useInventorySummary();
  
  useEffect(() => {
    if (showInventorySummary) {
      fetchSummary(1, fetchLimit);
    }
  }, [page, fetchLimit, showInventorySummary]);
  
  const highlightedItems = useMemo(() => {
    if (!inventorySummaryData) return [];
    return inventorySummaryData.filter(
      (item: InventorySummary) =>
        item.isLowStock ||
        item.isNearExpiry ||
        ['out_of_stock', 'unassigned', 'suspended'].includes(item.status)
    );
  }, [inventorySummaryData]);
  
  const totalPages = Math.ceil(highlightedItems.length / cardsPerPage);
  
  const paginatedItems = useMemo(() => {
    const start = (page - 1) * cardsPerPage;
    return highlightedItems.slice(start, start + cardsPerPage);
  }, [highlightedItems, page, cardsPerPage]);
  
  return (
    <Box sx={{ padding: 3 }}>
      {fullName ? (
        <Typography variant="h4" gutterBottom>
          Welcome, {fullName}!
        </Typography>
      ) : (
        <Skeleton variant="text" width={200} />
      )}
      
      {children}
      
      {showInventorySummary && (
        <Box sx={{ mt: 5 }}>
          <Typography variant="h5" gutterBottom>
            Inventory Alerts
          </Typography>
          
          {inventorySummaryLoading ? (
            <Loading message="Loading inventory summary..." />
          ) : inventorySummaryError ? (
            <ErrorMessage message={inventorySummaryError} />
          ) : paginatedItems.length === 0 ? (
            <Typography>No critical inventory issues found.</Typography>
          ) : (
            <>
              <Grid container spacing={2}>
                {paginatedItems.map((item: InventorySummary) => (
                  <Grid size={{ xs:12, sm:6, md:4, lg:3 }} key={item.productId}>
                    <CustomCard
                      title={item.itemName}
                      subtitle={`Status: ${formatLabel(item.status)}`}
                      ariaLabel={`Inventory summary card for ${item.itemName}`}
                      sx={{ height: '100%' }}
                    >
                      <Typography>Available: {item.availableQuantity}</Typography>
                      <Typography>Reserved: {item.reservedQuantity}</Typography>
                      <Typography>Total Lots: {item.totalLots}</Typography>
                      <Typography>
                        Nearest Expiry:{' '}
                        {item.nearestExpiryDate
                          ? formatDate(item.nearestExpiryDate)
                          : 'N/A'}
                      </Typography>
                      
                      {item.isLowStock && (
                        <Typography color="warning.main">
                          Low Stock ({formatLabel(item.stockLevel)})
                        </Typography>
                      )}
                      {item.isNearExpiry && (
                        <Typography color="error.main">Near Expiry</Typography>
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
            <CustomButton onClick={refreshSummary}>Refresh Summary</CustomButton>
            
            <CustomButton
              size="small"
              variant="outlined"
              onClick={() => window.location.href = `/inventories`}
            >
              View Detail
            </CustomButton>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default DashboardLayout;
