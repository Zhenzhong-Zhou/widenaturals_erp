import { type FC, useEffect, useState } from 'react';
import { useLocation } from 'react-router';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import CustomTypography from '@components/common/CustomTypography';
import CustomButton from '@components/common/CustomButton';
import useLocationInventoryKpiSummary from '@hooks/useLocationInventoryKpiSummary';
import KpiSummaryCards from '@features/locationInventory/components/KpiSummaryCards';

const InventoryOverviewHeaderSection: FC = () => {
  const location = useLocation();
  const isOverviewPage = location.pathname === '/inventory-overview';
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<
    'total' | 'product' | 'packaging_material'
  >('total');

  const { data, loading, error, fetchKpiSummary } =
    useLocationInventoryKpiSummary();

  useEffect(() => {
    fetchKpiSummary();
  }, []);

  const handleTypeChange = (_: any, newType: typeof selectedType) => {
    if (newType) setSelectedType(newType);
  };

  return (
    <Box>
      <Box>
        <CustomTypography variant="h5" sx={{ mb: 2 }}>
          Inventory KPI Summary
        </CustomTypography>
        <CustomTypography variant="body1" color="text.secondary">
          Track key inventory metrics and summaries.
        </CustomTypography>
      </Box>

      <Grid
        container
        spacing={2}
        alignItems="center"
        justifyContent="space-between"
      >
        <Grid size={{ xs: 12, md: 6 }}>
          <ToggleButtonGroup
            value={selectedType}
            exclusive
            onChange={handleTypeChange}
            size="small"
            color="primary"
            sx={{
              bgcolor: 'background.paper',
              borderRadius: 2,
              boxShadow: 1,
              height: 40,
            }}
          >
            <ToggleButton value="total">Total</ToggleButton>
            <ToggleButton value="product">Product</ToggleButton>
            <ToggleButton value="packaging_material">Packaging</ToggleButton>
          </ToggleButtonGroup>
        </Grid>

        <Grid size={{ xs: 12, md: 'auto' }}>
          <Grid
            container
            spacing={1}
            justifyContent={{ xs: 'flex-start', md: 'flex-end' }}
          >
            <Grid>
              <CustomButton
                variant="outlined"
                size="small"
                onClick={() => navigate('/reports/adjustments')}
              >
                Adjustment Report
              </CustomButton>
            </Grid>
            <Grid>
              <CustomButton
                variant="outlined"
                size="small"
                onClick={() => navigate('/reports/inventory_activities')}
              >
                Inventory Logs
              </CustomButton>
            </Grid>
            <Grid>
              <CustomButton
                variant="outlined"
                size="small"
                onClick={() => navigate('/reports/inventory_histories')}
              >
                Inventory History
              </CustomButton>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      <Box mt={4}>
        <KpiSummaryCards
          data={data}
          error={error}
          loading={loading}
          visibleTypes={[selectedType]}
          fetchKpiSummary={fetchKpiSummary}
        />
        {!isOverviewPage && (
          <CustomButton
            variant="outlined"
            size="small"
            onClick={() => navigate('/inventory-overview')}
          >
            View More
          </CustomButton>
        )}
      </Box>
    </Box>
  );
};

export default InventoryOverviewHeaderSection;
