import { type FC } from 'react';
import type { FlattenedBomReadinessMetadata } from '@features/bom/state';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import CustomTypography from '@components/common/CustomTypography';
import CustomButton from '@components/common/CustomButton';
import RefreshIcon from '@mui/icons-material/Refresh';
import { formatDateTime } from '@utils/dateTimeUtils';

interface BomReadinessSummaryProps {
  readinessLoading: boolean;
  refreshProductionReadiness: () => void;
  /** Flattened metadata summarizing BOM production readiness */
  flattenedMetadata: FlattenedBomReadinessMetadata | null;
}

/**
 * Displays a high-level production readiness summary for a BOM.
 *
 * Includes:
 *  - readiness state (ready / not ready)
 *  - production capacity (max units)
 *  - shortages / bottlenecks
 *  - overall stock health
 *  - last updated timestamp + manual refresh
 */
const BomReadinessSummarySection: FC<BomReadinessSummaryProps> = ({
                                                                    flattenedMetadata,
                                                                    readinessLoading,
                                                                    refreshProductionReadiness,
                                                                  }) => {
  if (!flattenedMetadata) {
    return (
      <Card variant="outlined" sx={{
        borderRadius: 3,
        p: 2,
        border: '1px dashed',
        borderColor: 'divider',
      }}
      >
        <CardContent
          sx={{
            textAlign: 'center',
            color: 'text.secondary',
            fontStyle: 'italic',
       
          }}
        >
          Production readiness data not available.
        </CardContent>
      </Card>
    );
  }
  
  const {
    readinessStatus,
    readinessMaxUnits,
    readinessShortageCount,
    readinessStockHealthSummary,
    readinessBottleneckPartNames,
    readinessBottleneckMaterialName,
    readinessBottleneckMaterialSnapshotName,
    readinessBottleneckCount,
    readinessGeneratedAt,
  } = flattenedMetadata;
  
  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 3,
        boxShadow: (theme) => theme.shadows[1],
        mb: 4,
      }}
    >
      <CardContent sx={{ p: 3 }}>
        {/* === Header Bar === */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <CustomTypography variant="h5" sx={{ fontWeight: 600 }}>
            Production Readiness
          </CustomTypography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {readinessGeneratedAt && (
              <CustomTypography
                variant="caption"
                sx={{ color: 'text.disabled', whiteSpace: 'nowrap' }}
              >
                Last updated: {formatDateTime(readinessGeneratedAt)}
              </CustomTypography>
            )}
            <CustomButton
              onClick={refreshProductionReadiness}
              loading={readinessLoading}
              variant="outlined"
              color="secondary"
              size="small"
              startIcon={
                <RefreshIcon
                  sx={{
                    animation: readinessLoading ? 'spin 1s linear infinite' : 'none',
                    '@keyframes spin': {
                      '0%': { transform: 'rotate(0deg)' },
                      '100%': { transform: 'rotate(360deg)' },
                    },
                  }}
                />
              }
            >
              Refresh
            </CustomButton>
          </Box>
        </Box>
        
        {/* === Summary Metrics === */}
        <Grid container spacing={1.5}>
          <Grid size={{ xs: "auto" }}>
            <Chip
              label={readinessStatus ? 'Ready for Production' : 'Not Ready'}
              color={readinessStatus ? 'success' : 'error'}
              variant="filled"
            />
          </Grid>
          <Grid size={{ xs: "auto" }}>
            <Chip
              label={`Max Producible: ${readinessMaxUnits ?? 0}`}
              color="info"
              variant="outlined"
            />
          </Grid>
          <Grid size={{ xs: "auto" }}>
            <Chip
              label={`Shortages: ${readinessShortageCount ?? 0}`}
              color={
                readinessShortageCount && readinessShortageCount > 0
                  ? 'error'
                  : 'success'
              }
              variant="outlined"
            />
          </Grid>
          {readinessStockHealthSummary && (
            <Grid size={{ xs: "auto" }}>
              <Chip
                label={`Stock Health — ${readinessStockHealthSummary}`}
                color="default"
                variant="outlined"
              />
            </Grid>
          )}
          {readinessBottleneckCount && (
            <Grid size={{ xs: "auto" }}>
              <Chip
                label={`Bottlenecks: ${readinessBottleneckCount}`}
                color="warning"
                variant="outlined"
              />
            </Grid>
          )}
        </Grid>
          
        {/* Divider for better visual grouping */}
        <Divider sx={{ my: 2.5 }} />
        
        {/* === Bottleneck Detail Section === */}
        {
          (readinessBottleneckPartNames ||
            readinessBottleneckMaterialName ||
            readinessBottleneckMaterialSnapshotName) && (
          <Box>
            <CustomTypography variant="subtitle2" sx={{ mb: 0.5 }}>
              Bottleneck Details
            </CustomTypography>
            <CustomTypography
              variant="body2"
              sx={{
                color: 'text.secondary',
                whiteSpace: 'pre-line',
              }}
            >
              {readinessBottleneckPartNames ??
                readinessBottleneckMaterialName ??
                readinessBottleneckMaterialSnapshotName ??
                '—'}
            </CustomTypography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default BomReadinessSummarySection;
