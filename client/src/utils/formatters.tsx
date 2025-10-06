import type { ReactNode } from 'react';
import StatusChip from '@components/common/StatusChip';
import { getAllocationDisplay, getStatusColor } from './getStatusColor';

type StatusType = 'order' | 'payment' | 'item' | 'allocation' | 'inventory' | 'shipment' | 'fulfillment';

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
  code?: string | string[] | null,
  type: StatusType = 'order',
  labelOverride?: string | null
): ReactNode => {
  if (!code || (Array.isArray(code) && code.length === 0)) return '—';
  
  if (type === 'allocation') {
    // handle string[] or string directly
    const { summary, color } = getAllocationDisplay(code);
    const label = labelOverride ?? summary;
    return <StatusChip label={label} color={color} />;
  }
  
  // --- non-allocation (order, item, payment, inventory, etc.)
  const singleCode = Array.isArray(code) ? code[0] : code; // fallback: use first element
  const color = getStatusColor(singleCode, type);
  const label = labelOverride ?? humanizeCode(singleCode ?? '', type);
  
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
  if (!code) return formatStatus(null, 'allocation', label);
  
  // If it's an array, pass the whole array
  const value = Array.isArray(code) ? code : code;
  
  return formatStatus(value, 'allocation', label);
};

export const formatInventoryStatus = (
  code?: string | null,
  label?: string | null
): ReactNode => formatStatus(code, 'inventory', label);

export const formatShipmentStatus = (code?: string | null, label?: string | null) =>
  formatStatus(code, 'shipment', label);

export const formatFulfillmentStatus = (code?: string | null, label?: string | null) =>
  formatStatus(code, 'fulfillment', label);
