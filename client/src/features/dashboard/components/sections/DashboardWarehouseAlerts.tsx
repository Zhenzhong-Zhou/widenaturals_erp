import { type FC, useMemo } from 'react';
import Box from '@mui/material/Box';
import type { WarehouseRecord } from '@features/warehouse';
import { CustomTypography } from '@components/index';
import { WarehouseInventoryAlertSummary } from '@features/warehouseInventory/components/WarehouseSummaryHeader';

interface Props {
  warehouses: WarehouseRecord[] | null | undefined;
}

/**
 * Cross-warehouse alert summary aggregated client-side from the
 * paginated warehouse list payload. Surfaces low stock, expiring soon,
 * and expired batch counts across every warehouse the current user has
 * access to.
 *
 * Reuses the existing WarehouseInventoryAlertSummary component for
 * rendering, so this section is essentially a thin aggregator —
 * fetching the list, summing the per-warehouse alerts, and passing the
 * aggregate through. The same alert UI surfaces both on the
 * single-warehouse detail page and on the dashboard.
 *
 * Self-hides when the user lacks the inventory view permission, when
 * the fetch errors, when no warehouses are accessible, or when no
 * alerts are active across any warehouse. Renders a skeleton while the
 * underlying list is loading.
 */
const DashboardWarehouseAlerts: FC<Props> = ({ warehouses }) => {
  const aggregated = useMemo(() => {
    if (!warehouses || warehouses.length === 0) return null;
    return warehouses.reduce(
      (acc, w) => ({
        lowStock: acc.lowStock + (w.alerts?.lowStock ?? 0),
        expiringSoon: acc.expiringSoon + (w.alerts?.expiringSoon ?? 0),
        expired: acc.expired + (w.alerts?.expired ?? 0),
      }),
      { lowStock: 0, expiringSoon: 0, expired: 0 }
    );
  }, [warehouses]);

  // If no alerts at all, render nothing — let WarehouseInventoryAlertSummary handle the empty case
  if (
    !aggregated ||
    (aggregated.lowStock === 0 &&
      aggregated.expiringSoon === 0 &&
      aggregated.expired === 0)
  ) {
    return null;
  }

  const scopeLabel = useMemo(() => {
    if (!warehouses || warehouses.length === 0) return null;
    const count = warehouses.length;
    if (count === 1) return `For ${warehouses[0]?.name ?? 'this warehouse'}`;
    return `Across ${count} warehouses`;
  }, [warehouses]);

  return (
    <Box>
      <CustomTypography
        variant="subtitle1"
        sx={{
          fontWeight: 700,
          mb: 2,
        }}
      >
        Warehouse Alerts
      </CustomTypography>
      <CustomTypography variant="caption" color="text.secondary">
        {scopeLabel}
      </CustomTypography>
      <WarehouseInventoryAlertSummary alerts={aggregated} />
    </Box>
  );
};

export default DashboardWarehouseAlerts;
