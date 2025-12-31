import { type FC, useMemo } from 'react';
import Box from '@mui/material/Box';
import Badge from '@mui/material/Badge';
import Tooltip from '@mui/material/Tooltip';
import type { SxProps, Theme } from '@mui/material/styles';
import HealthStatusChip from './HealthStatusChip';
import CustomTypography from '@components/common/CustomTypography';
import useHealthStatus from '@hooks/useHealthStatus';
import { useThemeContext } from '@context/ThemeContext';
import { formatDateTime } from '@utils/dateTimeUtils';
import { formatLabel } from '@utils/textUtils';
import type { HealthStatus } from '@utils/getStatusColor';
import { getStatusColor } from '@utils/getStatusColor';
import { mapStatusColorToBadgeColor } from '@utils/statusColorAdapters';

interface HealthStatusProps {
  sx?: SxProps<Theme>;
}

const HealthStatus: FC<HealthStatusProps> = ({ sx }) => {
  const { theme } = useThemeContext();
  
  const {
    healthStatus,
    loading,
    databaseStatus,
    poolStatus,
    timestamp,
    refreshHealthStatus,
    error,
  } = useHealthStatus();
  
  const status: HealthStatus = useMemo(
    () =>
      loading
        ? 'loading'
        : (healthStatus?.server?.toLowerCase() as HealthStatus) ??
        'unknown',
    [loading, healthStatus]
  );
  
  const statusColor = useMemo(
    () => getStatusColor(status, 'health'),
    [status]
  );
  
  const tooltipContent = useMemo(
    () => (
      <Box
        sx={{
          minWidth: 220,
          p: 1.5,
          borderRadius: 1,
          backgroundColor: (theme) =>
            theme.palette.mode === 'dark'
              ? theme.palette.grey[800]
              : theme.palette.background.paper,
          boxShadow: (theme) => theme.shadows[6],
          lineHeight: 1.6,
          color: 'text.primary',
        }}
      >
        <CustomTypography variant="body2" fontWeight={600}>
          Server: {formatLabel(healthStatus?.server) || 'Unknown'}
        </CustomTypography>
        <CustomTypography variant="body2">
          Database: {formatLabel(databaseStatus) || 'Unknown'}
        </CustomTypography>
        <CustomTypography variant="body2">
          Pool: {formatLabel(poolStatus) || 'Unknown'}
        </CustomTypography>
        <CustomTypography variant="body2">
          Last Updated:{' '}
          <Box component="span" color="text.secondary">
            {timestamp ? formatDateTime(timestamp) : 'N/A'}
          </Box>
        </CustomTypography>
        {error && (
          <CustomTypography variant="body2" color="error">
            Error: {error}
          </CustomTypography>
        )}
      </Box>
    ),
    [healthStatus, databaseStatus, poolStatus, timestamp, error]
  );
  
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        minHeight: 32,
        ...sx,
      }}
    >
      <Tooltip arrow enterDelay={150} title={tooltipContent}>
        <Badge
          variant="dot"
          color={mapStatusColorToBadgeColor(statusColor)}
          overlap="circular"
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          sx={{
            '& .MuiBadge-badge': {
              width: 10,
              height: 10,
              borderRadius: '50%',
              top: 4,
              right: 4,
              boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
            },
          }}
        >
          <Box
            role="button"
            tabIndex={0}
            onClick={refreshHealthStatus}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                void refreshHealthStatus();
              }
            }}
            sx={{
              cursor: 'pointer',
              borderRadius: 2,
              height: 32,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <HealthStatusChip status={status} />
          </Box>
        </Badge>
      </Tooltip>
    </Box>
  );
};

export default HealthStatus;
