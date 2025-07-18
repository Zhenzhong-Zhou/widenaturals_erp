import { type FC } from 'react';
import Grid from '@mui/material/Grid';
import CustomCard from '@components/common/CustomCard';
import Skeleton from '@mui/material/Skeleton';
import ErrorMessage from '@components/common/ErrorMessage';
import CustomTypography from '@components/common/CustomTypography';
import type { LocationInventoryKpiSummaryItem } from '@features/locationInventory/state';
import CustomButton from '@components/common/CustomButton';
import { formatLabel } from '@utils/textUtils';

export interface KpiSummaryCardsProps {
  data: LocationInventoryKpiSummaryItem[];
  loading: boolean;
  error: string | null;
  visibleTypes?: Array<'product' | 'packaging_material' | 'total'>;
  fetchKpiSummary?: () => void;
}

const KpiSummaryCards: FC<KpiSummaryCardsProps> = ({
  data,
  loading,
  error,
  visibleTypes,
  fetchKpiSummary,
}) => {
  const typesToShow = visibleTypes ?? [
    'product',
    'packaging_material',
    'total',
  ];
  const filtered = data.filter((item) => typesToShow.includes(item.batchType));

  if (loading) {
    return (
      <Grid container spacing={2}>
        {Array.from({ length: typesToShow.length }).map((_, i) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
            <Skeleton
              variant="rectangular"
              height={160}
              sx={{ borderRadius: 2 }}
            />
          </Grid>
        ))}
      </Grid>
    );
  }

  if (error) return <ErrorMessage message={error} />;
  if (!filtered.length)
    return <CustomTypography>No KPI data found.</CustomTypography>;

  return (
    <Grid container spacing={2}>
      {filtered.map((item, index) => {
        const subtitle = (
          <>
            <CustomTypography variant="body2">
              Total Products: {item.totalProducts}
            </CustomTypography>
            <CustomTypography variant="body2">
              Total Materials: {item.totalMaterials}
            </CustomTypography>
            <CustomTypography variant="body2">
              Total Quantity: {item.totalQuantity.toLocaleString()}
            </CustomTypography>
            <CustomTypography variant="body2">
              Reserved: {item.totalReserved.toLocaleString()}
            </CustomTypography>
            <CustomTypography variant="body2">
              Available: {item.totalAvailable.toLocaleString()}
            </CustomTypography>
            <CustomTypography variant="body2">
              Near Expiry: {item.nearExpiryInventoryRecords}
            </CustomTypography>
            <CustomTypography variant="body2">
              Expired: {item.expiredInventoryRecords}
            </CustomTypography>
            <CustomTypography variant="body2">
              Low Stock: {item.lowStockCount}
            </CustomTypography>
          </>
        );

        return (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
            <CustomCard
              title={`${formatLabel(item.batchType.replace('_', ' '))} Summary`}
              ariaLabel={`${item.batchType} KPI`}
            >
              {subtitle}
            </CustomCard>
          </Grid>
        );
      })}

      <Grid size={{ xs: 12 }}>
        <CustomButton onClick={fetchKpiSummary}>
          Refresh KPI Summary
        </CustomButton>
      </Grid>
    </Grid>
  );
};

export default KpiSummaryCards;
