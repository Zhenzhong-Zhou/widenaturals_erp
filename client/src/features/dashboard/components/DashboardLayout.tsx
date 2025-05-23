import { type FC, type ReactNode } from 'react';
import Box from '@mui/material/Box';
import { Skeleton } from '@mui/material';
import CustomTypography from '@components/common/CustomTypography';
import InventoryOverviewHeaderSection from '@features/inventoryOverview/components/InventoryOverviewHeaderSection';
import SkuWarehouseInventorySummarySection from '@features/warehouseInventory/components/SkuWarehouseInventorySummarySection';
import usePermissions from '@hooks/usePermissions';
import { hasWarehouseInventoryAccess } from '@features/warehouseInventory/utils/hasWarehouseInventoryAccess';
import { canViewInventoryOverview } from '@features/inventoryOverview/hasInventoryOverviewAccess';

interface BaseDashboardLayoutProps {
  fullName?: string;
  children: ReactNode;
  showInventorySummary?: boolean;
}

const DashboardLayout: FC<BaseDashboardLayoutProps> = ({
  fullName,
  children,
}) => {
  const { permissions } = usePermissions();
  
  const inventoryOverview = canViewInventoryOverview(permissions);
  const canView = hasWarehouseInventoryAccess(permissions);
  
  if (!canView) return null;
  
  return (
    <Box sx={{ padding: 3 }}>
      {fullName ? (
        <CustomTypography
          variant="body1"
          component="h1"
          sx={{
            fontSize: '1.125rem',
            fontWeight: 500,
            minHeight: '1.5rem',
            display: 'inline',
          }}
        >
          <Box component="span"> Welcome,&nbsp;</Box>
          <Box
            component="span"
            sx={{
              color: 'primary.main',
              fontWeight: 600,
              display: 'inline',
              animation: 'fadeIn 0.6s ease-in-out',
              '@keyframes fadeIn': {
                from: { opacity: 0 },
                to: { opacity: 1 },
              },
            }}
          >
            {fullName}
          </Box>
          <Box component="span">!</Box>
        </CustomTypography>
      ) : (
        <Skeleton variant="text" width={200} />
      )}

      {children}
      
      {inventoryOverview && <InventoryOverviewHeaderSection />}
      {canView && <SkuWarehouseInventorySummarySection />}
    </Box>
  );
};

export default DashboardLayout;
