import { type FC, type ReactNode } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { CustomTypography } from '@components/index';
import type { WarehouseSummaryAlerts } from '@features/warehouseInventory';

// ─── Sub-component ────────────────────────────────────────────────────────────

interface AlertCardProps {
  icon: ReactNode;
  label: string;
  count: number;
  color: string;
}

const AlertCard: FC<AlertCardProps> = ({ icon, label, count, color }) => (
  <Card
    variant="outlined"
    sx={{
      p: 2,
      display: 'flex',
      alignItems: 'center',
      gap: 1.5,
      borderColor: color,
      borderRadius: 2,
    }}
  >
    <Box sx={{ color }}>{icon}</Box>
    <Box>
      <CustomTypography variant="h6" fontWeight={700} sx={{ color }}>
        {count}
      </CustomTypography>
      <CustomTypography variant="body2" color="text.secondary">
        {label}
      </CustomTypography>
    </Box>
  </Card>
);

// ─── Main Component ───────────────────────────────────────────────────────────

interface WarehouseInventoryAlertSummaryProps {
  /**
   * Aggregate alert counts from the warehouse summary endpoint.
   * Pass null while the summary is loading or has not been fetched.
   */
  alerts: WarehouseSummaryAlerts | null;
}

/**
 * Summary cards showing warehouse-wide counts of low stock and expiring
 * inventory batches. Counts come from the warehouse summary endpoint and
 * reflect every batch in the warehouse, not just the current table page.
 *
 * Hides itself entirely when no alerts exist, so it is safe to always render.
 */
const WarehouseInventoryAlertSummary: FC<WarehouseInventoryAlertSummaryProps> = ({
                                                                                   alerts,
                                                                                 }) => {
  if (!alerts) return null;
  
  const { lowStock, expiringSoon, expired } = alerts;
  
  if (!lowStock && !expiringSoon && !expired) return null;
  
  return (
    <Box mb={3}>
      <Grid container spacing={2}>
        {lowStock > 0 && (
          <Grid size={{ xs: 12, sm: 4 }}>
            <AlertCard
              icon={<WarningAmberIcon />}
              label="Low Stock Batches"
              count={lowStock}
              color="warning.main"
            />
          </Grid>
        )}
        {expiringSoon > 0 && (
          <Grid size={{ xs: 12, sm: 4 }}>
            <AlertCard
              icon={<WarningAmberIcon />}
              label="Expiring Soon"
              count={expiringSoon}
              color="warning.main"
            />
          </Grid>
        )}
        {expired > 0 && (
          <Grid size={{ xs: 12, sm: 4 }}>
            <AlertCard
              icon={<ErrorOutlineIcon />}
              label="Expired Batches"
              count={expired}
              color="error.main"
            />
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default WarehouseInventoryAlertSummary;
