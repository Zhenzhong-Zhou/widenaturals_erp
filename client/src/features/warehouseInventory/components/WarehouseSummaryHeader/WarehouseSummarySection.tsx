import { type FC } from 'react';
import Alert from '@mui/material/Alert';
import Skeleton from '@mui/material/Skeleton';
import { ErrorMessage } from '@components/index';
import {
  WarehouseInventoryAlertSummary,
  WarehouseSummaryHeader,
} from '@features/warehouseInventory/components/WarehouseSummaryHeader/index';
import type {
  WarehouseSummaryInfo,
  WarehouseSummaryTotals,
  WarehouseSummaryByBatchType,
  WarehouseSummaryByStatus,
  WarehouseSummaryAlerts,
} from '@features/warehouseInventory';

interface Props {
  warehouseInfo: WarehouseSummaryInfo | null | undefined;
  totals: WarehouseSummaryTotals | null | undefined;
  byBatchType: WarehouseSummaryByBatchType | null | undefined;
  byStatus: WarehouseSummaryByStatus[] | null | undefined;
  alerts: WarehouseSummaryAlerts | null | undefined;
  loading?: boolean;
  error?: string | null;
}

/**
 * Top-of-page summary section for the warehouse inventory detail view.
 *
 * Renders the archived banner, identity header (totals, batch type breakdown,
 * status chips), and the alert summary cards (low stock, expiring soon,
 * expired) as a single cohesive block. Owns its own loading skeleton and
 * error state so the parent page only needs to gate by permission.
 */
const WarehouseSummarySection: FC<Props> = ({
  warehouseInfo,
  totals,
  byBatchType,
  byStatus,
  alerts,
  loading = false,
  error = null,
}) => {
  if (error) {
    return <ErrorMessage message={error} showNavigation />;
  }

  if (loading) {
    return <Skeleton variant="rectangular" height={120} sx={{ mb: 3 }} />;
  }

  return (
    <>
      {warehouseInfo?.isArchived && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          This warehouse is archived. Inventory data is read-only.
        </Alert>
      )}

      <WarehouseSummaryHeader
        warehouseInfo={warehouseInfo}
        totals={totals}
        byBatchType={byBatchType}
        byStatus={byStatus}
      />

      <WarehouseInventoryAlertSummary alerts={alerts} />
    </>
  );
};

export default WarehouseSummarySection;
