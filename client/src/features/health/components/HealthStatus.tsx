import type { FC } from 'react';
import Box from '@mui/material/Box';
import Badge from '@mui/material/Badge';
import Tooltip from '@mui/material/Tooltip';
import type { SxProps, Theme } from '@mui/system';
import CustomTypography from '@components/common/CustomTypography';
import { formatDateTime } from '@utils/dateTimeUtils';
import useHealthStatus from '@hooks/useHealthStatus';
import { formatLabel } from '@utils/textUtils';

export interface HealthStatusProps {
  getStatusColor: (
    status: string
  ) => 'success' | 'warning' | 'error' | 'info' | 'default';
  sx?: SxProps<Theme>; // Allow external style overrides
}

const HealthStatus: FC<HealthStatusProps> = ({ getStatusColor, sx }) => {
  // Use the health status hook
  const {
    healthStatus,
    loading,
    isHealthy,
    databaseStatus,
    poolStatus,
    timestamp,
    refreshHealthStatus,
    error,
  } = useHealthStatus();

  const badgeColor = getStatusColor(
    loading ? 'loading' : (healthStatus?.server?.toLowerCase() ?? 'unknown')
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
      {/* Health Indicator */}
      <Tooltip
        arrow
        enterDelay={150}
        title={
          <Box
            sx={{
              minWidth: 200,
              p: 1.5,
              borderRadius: 1,
              backgroundColor: 'background.paper',
              boxShadow: 3,
              lineHeight: 1.6,
              color: 'text.primary',
            }}
          >
            <CustomTypography variant="body2" sx={{ fontWeight: 600 }}>
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
              <Box component="span" sx={{ color: 'text.secondary' }}>
                {timestamp ? formatDateTime(timestamp) : 'N/A'}
              </Box>
            </CustomTypography>
            {error && (
              <CustomTypography variant="body2" color="error">
                Error: {error}
              </CustomTypography>
            )}
          </Box>
        }
      >
        <Badge
          color={badgeColor}
          variant="dot"
          overlap="circular"
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          sx={{
            '& .MuiBadge-badge': {
              width: 10,
              height: 10,
              borderRadius: '50%',
              top: 4,
              right: 4,
            },
          }}
        >
          <Box
            onClick={refreshHealthStatus}
            sx={{
              cursor: 'pointer',
              px: 1.5,
              py: 0.75,
              backgroundColor: 'background.default',
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 1,
              lineHeight: 1, // prevent line shift
              height: 32, // match badge height
            }}
          >
            <CustomTypography
              variant="caption"
              sx={{
                fontWeight: 600,
                fontSize: '0.875rem',
                fontFamily: "'Roboto', sans-serif",
                color: isHealthy ? 'primary.main' : 'error.main',
              }}
            >
              {isHealthy ? 'Healthy' : 'Unhealthy'}
            </CustomTypography>
          </Box>
        </Badge>
      </Tooltip>
    </Box>
  );
};

export default HealthStatus;
