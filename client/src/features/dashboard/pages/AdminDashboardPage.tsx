import { type FC, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { DashboardPageProps } from '@features/dashboard';
import DashboardLayout from '@features/dashboard/components/DashboardLayout';
import CustomButton from '@components/common/CustomButton';
import useLocationInventoryKpiSummary from '@hooks/useLocationInventoryKpiSummary';
import KpiSummaryCards from '@features/locationInventory/components/KpiSummaryCards';
import Box from '@mui/material/Box';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import ToggleButton from '@mui/material/ToggleButton';
import Grid from '@mui/material/Grid';
import CustomTypography from '@components/common/CustomTypography';

const AdminDashboardPage: FC<DashboardPageProps> = ({ fullName }) => {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<'product' | 'packaging_material' | 'total'>('total');
  
  const {
    data,
    loading,
    error,
    fetchKpiSummary,
  } = useLocationInventoryKpiSummary();
  
  useEffect(() => {
    fetchKpiSummary();
  }, []);
  
  const handleTypeChange = (_: unknown, newType: typeof selectedType | null) => {
    if (newType) setSelectedType(newType);
  };
  
  return (
    <DashboardLayout fullName={fullName} showInventorySummary={true}>
      <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, py: 3 }}>
        <CustomTypography variant="h5" sx={{ mb: 2 }}>
          Inventory KPI Summary
        </CustomTypography>
        {/* Top Bar Toggle and Actions */}
        <Grid container spacing={2} alignItems="center" justifyContent="space-between">
          <Grid size={{xs: 12, md:6}}>
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
              }}
            >
              <ToggleButton value="total">Total</ToggleButton>
              <ToggleButton value="product">Product</ToggleButton>
              <ToggleButton value="packaging_material">Packaging</ToggleButton>
            </ToggleButtonGroup>
          </Grid>
          
          <Grid size={{xs: 12, md: 'auto'}}>
            <Grid container spacing={1} justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
              <Grid>
                <CustomButton variant="outlined" size="small" onClick={() => navigate('/reports/adjustments')}>
                  Adjustment Report
                </CustomButton>
              </Grid>
              <Grid>
                <CustomButton variant="outlined" size="small" onClick={() => navigate('/reports/inventory_activities')}>
                  Inventory Logs
                </CustomButton>
              </Grid>
              <Grid>
                <CustomButton variant="outlined" size="small" onClick={() => navigate('/reports/inventory_histories')}>
                  Inventory History
                </CustomButton>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
        
        {/* KPI Summary Cards */}
        <Box mt={4}>
          <KpiSummaryCards
            data={data}
            error={error}
            loading={loading}
            visibleTypes={[selectedType]}
            fetchKpiSummary={fetchKpiSummary}
          />
          <CustomButton variant="outlined" size="small" onClick={() => navigate('/inventory-overview')}>
            View More
          </CustomButton>
        </Box>
      </Box>
    </DashboardLayout>
  );
};

export default AdminDashboardPage;
