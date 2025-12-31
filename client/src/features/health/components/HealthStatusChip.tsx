import type { FC } from 'react';
import StatusChip from '@components/common/StatusChip';
import { getStatusColor, HealthStatus } from '@utils/getStatusColor';

interface HealthStatusChipProps {
  status: HealthStatus;
}

const HealthStatusChip: FC<HealthStatusChipProps> = ({ status }) => {
  const color = getStatusColor(status, 'health');
  
  return <StatusChip label={status} color={color} size={'medium'}/>;
};

export default HealthStatusChip;
