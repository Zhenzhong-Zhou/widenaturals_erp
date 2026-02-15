import type { FC } from 'react';
import type { DashboardPageProps } from '@features/dashboard';
import DashboardLayout from '@features/dashboard/components/DashboardLayout';
import CustomTypography from '@components/common/CustomTypography';
import { useAppSelector } from '@store/storeHooks';
import { selectSelfUserFullName } from '@features/user';
import { useHasPermission } from '@features/authorize/hooks';
import InventoryOverviewHeaderSection from '@features/inventoryOverview/components/InventoryOverviewHeaderSection';
import SkuWarehouseInventorySummarySection from '@features/warehouseInventory/components/SkuWarehouseInventorySummarySection';

const UserDashboardPage: FC<DashboardPageProps> = ({}) => {
  const fullName = useAppSelector(selectSelfUserFullName);
  const hasPermission = useHasPermission();

  const canShowInventoryOverview =
    hasPermission('inventory.overview.view') === true;

  const canShowWarehouseSummary =
    hasPermission('warehouse.inventory.view') === true;

  return (
    <DashboardLayout
      fullName={fullName ?? undefined}
      header={
        <>
          <CustomTypography variant="body1" gutterBottom>
            User Overview
          </CustomTypography>
        </>
      }
    >
      {canShowInventoryOverview && <InventoryOverviewHeaderSection />}
      {canShowWarehouseSummary && <SkuWarehouseInventorySummarySection />}
    </DashboardLayout>
  );
};

export default UserDashboardPage;
