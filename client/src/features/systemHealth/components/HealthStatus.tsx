import { type FC, useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import type { SxProps, Theme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Badge from '@mui/material/Badge';
import Tooltip from '@mui/material/Tooltip';
import CustomTypography from '@components/common/CustomTypography';
import { HealthStatusChip } from '@features/systemHealth/components/index';
import { useSystemHealth } from '@hooks/index';
import { formatDateTime } from '@utils/dateTimeUtils';
import { formatLabel } from '@utils/textUtils';
import type { HealthStatus } from '@utils/getStatusColor';
import { getStatusColor } from '@utils/getStatusColor';
import { mapStatusColorToBadgeColor } from '@utils/statusColorAdapters';

interface HealthStatusProps {
  sx?: SxProps<Theme>;
}

/**
 * HealthStatus
 *
 * Displays a compact, interactive system health indicator with
 * detailed status information available via tooltip.
 *
 * Responsibilities:
 * - Reflect current server and dependent service health
 * - Allow manual refresh via click or keyboard
 * - Surface error state when present
 *
 * Accessibility:
 * - Clickable via mouse and keyboard (Enter / Space)
 *
 * Design notes:
 * - Consumes health data exclusively via `useSystemHealth`
 * - Treats health snapshot as read-only domain data
 */
const HealthStatus: FC<HealthStatusProps> = ({ sx }) => {
  const theme = useTheme();
  
  const {
    serverStatus,
    databaseStatus,
    poolStatus,
    timestamp,
    loading,
    error,
    refresh,
  } = useSystemHealth();
  
  /**
   * Normalized health status used for color + chip rendering.
   */
  const healthStatusKey: HealthStatus = useMemo(() => {
    if (loading) return 'loading';
    return (serverStatus as HealthStatus) ?? 'unknown';
  }, [loading, serverStatus]);
  
  const statusColor = useMemo(
    () => getStatusColor(healthStatusKey, 'health'),
    [healthStatusKey]
  );
  
  const tooltipContent = useMemo(
    () => (
      <Box
        sx={{
          minWidth: 220,
          p: 1.5,
          borderRadius: 1,
          backgroundColor:
            theme.palette.mode === 'dark'
              ? theme.palette.grey[800]
              : theme.palette.background.paper,
          boxShadow: theme.shadows[6],
          lineHeight: 1.6,
          color: 'text.primary',
        }}
      >
        <CustomTypography variant="body2" fontWeight={600}>
          Server: {formatLabel(serverStatus) || 'Unknown'}
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
    [theme, serverStatus, databaseStatus, poolStatus, timestamp, error]
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
            onClick={refresh}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                void refresh();
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
            <HealthStatusChip status={healthStatusKey} />
          </Box>
        </Badge>
      </Tooltip>
    </Box>
  );
};

export default HealthStatus;
