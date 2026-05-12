import { type FC } from 'react';
import { Card, Grid, Stack } from '@mui/material';
import { CustomTypography } from '@components/index';

type WarehouseInventoryKpiRowProps = {
  warehouseQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
};

type KpiCardProps = {
  label: string;
  value: number;
  emphasis?: boolean;
};

const KpiCard: FC<KpiCardProps> = ({ label, value, emphasis }) => (
  <Card sx={{ p: 2.5, borderRadius: 2, height: '100%' }}>
    <Stack spacing={0.5}>
      <CustomTypography variant="caption" color="text.secondary">
        {label}
      </CustomTypography>
      <CustomTypography
        variant="h4"
        fontWeight={600}
        color={emphasis ? 'primary.main' : 'text.primary'}
      >
        {value.toLocaleString()}
      </CustomTypography>
    </Stack>
  </Card>
);

const WarehouseInventoryKpiRow: FC<WarehouseInventoryKpiRowProps> = ({
                                                                       warehouseQuantity,
                                                                       reservedQuantity,
                                                                       availableQuantity,
                                                                     }) => (
  <Grid container spacing={2}>
    <Grid size={{ xs: 12, sm: 4 }}>
      <KpiCard label="Warehouse" value={warehouseQuantity} />
    </Grid>
    <Grid size={{ xs: 12, sm: 4 }}>
      <KpiCard label="Reserved" value={reservedQuantity} />
    </Grid>
    <Grid size={{ xs: 12, sm: 4 }}>
      <KpiCard label="Available" value={availableQuantity} emphasis />
    </Grid>
  </Grid>
);

export default WarehouseInventoryKpiRow;
