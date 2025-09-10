import type { ReactNode } from 'react';
import StatusChip from '@components/common/StatusChip';
import { getStatusColor } from './getStatusColor';

type StatusType = 'order' | 'payment' | 'item' | 'allocation' | 'inventory';

const humanizeCode = (code: string, type: StatusType): string => {
  const cleaned = (type === 'order' || type === 'item')
    ? code.replace(/^ORDER_/, '')
    : code;
  
  return cleaned
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/(^|\s)\S/g, (s) => s.toUpperCase());
};

export const formatStatus = (
  code?: string | null,
  type: StatusType = 'order',
  labelOverride?: string | null
): ReactNode => {
  if (!code) return '—';
  
  const color = getStatusColor(code, type);
  const label = labelOverride ?? humanizeCode(code, type);
  
  return <StatusChip label={label} color={color} />;
};

export const formatOrderStatus = (code?: string | null, label?: string | null) =>
  formatStatus(code, 'order', label);

export const formatPaymentStatus = (code?: string | null, label?: string | null) =>
  formatStatus(code, 'payment', label);

export const formatItemStatus = (code?: string | null, label?: string | null) =>
  formatStatus(code, 'item', label);

export const formatAllocationStatus = (
  code?: string | string[] | null,
  label?: string | null
): ReactNode => {
  const singleCode = Array.isArray(code) ? code[0] ?? null : code;
  return formatStatus(singleCode, 'allocation', label);
};

export const formatInventoryStatus = (
  code?: string | null,
  label?: string | null
): ReactNode => formatStatus(code, 'inventory', label);

