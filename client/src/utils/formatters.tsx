import type { ReactNode } from 'react';
import { capitalize } from 'lodash';
import StatusChip from '@components/common/StatusChip';
import { getStatusColor } from './getStatusColor';

type StatusType = 'order' | 'payment' | 'item';

export const formatStatus = (
  status?: string | null,
  type: StatusType = 'order'
): ReactNode => {
  if (!status) return '—';
  
  const color = getStatusColor(status, type);
  const label = capitalize(status.toLowerCase());
  
  return <StatusChip label={label} color={color} />;
};

export const formatOrderStatus = (status?: string | null) =>
  formatStatus(status, 'order');

export const formatPaymentStatus = (status?: string | null) =>
  formatStatus(status, 'payment');

export const formatItemStatus = (status?: string | null) =>
  formatStatus(status, 'item');
