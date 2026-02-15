import type { FC } from 'react';
import StatusChip from '@components/common/StatusChip';
import { getStatusColor, type HealthStatus } from '@utils/getStatusColor';

interface HealthStatusChipProps {
  /**
   * Normalized health status key.
   *
   * Expected values include:
   * - 'healthy'
   * - 'unhealthy'
   * - 'degraded'
   * - 'loading'
   * - 'unknown'
   *
   * This value is treated as read-only domain data.
   */
  status: HealthStatus;
}

/**
 * HealthStatusChip
 *
 * Presentational component that renders a color-coded status chip
 * representing the current system health state.
 *
 * Responsibilities:
 * - Map a normalized health status to a semantic color
 * - Display the status label consistently across the UI
 *
 * Design notes:
 * - Stateless and purely presentational
 * - Color resolution is delegated to `getStatusColor`
 * - Does not perform formatting, fetching, or side effects
 *
 * Intended usage:
 * - System health indicators
 * - Status toolbars or headers
 * - Read-only health summaries
 */
const HealthStatusChip: FC<HealthStatusChipProps> = ({ status }) => {
  const color = getStatusColor(status, 'health');

  return <StatusChip label={status} color={color} size="medium" />;
};

export default HealthStatusChip;
