import { type FC } from 'react';
import type { DashboardPageProps } from '@features/dashboard';
import DashboardLayout from '@features/dashboard/components/DashboardLayout';
import { useAppSelector } from '@store/storeHooks';
import { selectSelfUserFullName } from '@features/user';
import { useHasPermission } from '@features/authorize/hooks';
import CustomTypography from '@components/common/CustomTypography';
import InventoryOverviewHeaderSection from '@features/inventoryOverview/components/InventoryOverviewHeaderSection';
import SkuWarehouseInventorySummarySection
  from '@features/warehouseInventory/components/SkuWarehouseInventorySummarySection';

/**
 * AdminDashboardPage
 *
 * Dashboard implementation for administrative users.
 *
 * Responsibilities:
 * - Derive admin-specific visibility rules from permissions
 * - Compose high-level dashboard sections (overview, inventory, etc.)
 * - Provide semantic content to the shared DashboardLayout
 *
 * MUST NOT:
 * - Perform role resolution (handled by DashboardPage)
 * - Fetch permission or session data
 * - Contain layout or navigation logic
 *
 * Notes:
 * - All permission checks are localized to this page
 * - Layout remains purely presentational
 */
const AdminDashboardPage: FC<DashboardPageProps> = ( ) => {
  const fullName = useAppSelector(selectSelfUserFullName);
  const hasPermission = useHasPermission();
  
  const canShowInventoryOverview =
    hasPermission('inventory.overview.view') === true;
  
  const canShowWarehouseSummary =
    hasPermission('warehouse.inventory.view') === true;
  
  const headerContent = (
    <>
      <CustomTypography
        variant="h6"
        sx={{ fontWeight: 600 }}
        gutterBottom
      >
        Administrative Overview
      </CustomTypography>
    </>
  );
  
  return (
    <DashboardLayout
      fullName={fullName ?? undefined}
      header={headerContent}
    >
      {canShowInventoryOverview && <InventoryOverviewHeaderSection />}
      {canShowWarehouseSummary && <SkuWarehouseInventorySummarySection />}
    </DashboardLayout>
  );
};

export default AdminDashboardPage;
