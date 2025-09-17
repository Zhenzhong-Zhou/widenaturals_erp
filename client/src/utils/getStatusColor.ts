import type { OverridableStringUnion } from '@mui/types';
import type { ChipPropsColorOverrides } from '@mui/material';

export type StatusColor = OverridableStringUnion<
  'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' | 'neutral',
  ChipPropsColorOverrides
>;

const orderStatusMap = {
  ORDER_PENDING: 'default',
  ORDER_EDITED: 'info',
  ORDER_AWAITING_REVIEW: 'secondary',
  ORDER_CONFIRMED: 'success',
  ORDER_ALLOCATING: 'info',
  ORDER_PARTIALLY_ALLOCATED: 'secondary',
  ORDER_ALLOCATED: 'success',
  ORDER_BACKORDERED: 'warning',
  ORDER_PROCESSING: 'info',
  ORDER_PARTIALLY_FULFILLED: 'secondary',
  ORDER_SHIPPED: 'primary',
  ORDER_OUT_FOR_DELIVERY: 'primary',
  ORDER_FULFILLED: 'success',
  ORDER_DELIVERED: 'success',
  ORDER_CANCELED: 'error',
  RETURN_REQUESTED: 'warning',
  RETURN_COMPLETED: 'success',
} as const;

const statusMaps = {
  order: orderStatusMap,
  payment: {
    PAID: 'success',
    PARTIALLY_PAID: 'secondary',
    OVERPAID: 'info',
    UNPAID: 'error',
    PENDING: 'warning',
    FAILED: 'error',
    REFUNDED: 'info',
    PARTIALLY_REFUNDED: 'secondary',
    VOIDED: 'error',
  },
  item: orderStatusMap,
  allocation: {
    // Raw codes
    ALLOC_PENDING: 'default',
    ALLOC_CONFIRMED: 'info',
    ALLOC_PARTIAL: 'secondary',
    ALLOC_COMPLETED: 'success',
    ALLOC_FULFILLING: 'warning',
    ALLOC_PARTIALLY_FULFILLED: 'secondary',
    ALLOC_FULFILLED: 'primary',
    ALLOC_CANCELLED: 'error',
    ALLOC_RETURNED: 'warning',
    
    // Summary labels from SQL
    'Pending Allocation': 'default',
    'Partially Allocated': 'secondary',
    'Allocation Confirmed': 'info',
    'Fully Allocated': 'primary',
    'Fulfilling': 'warning',
    'Partially Fulfilled': 'secondary',
    'Fulfilled': 'primary',
    'Allocation Returned': 'secondary',
    'Failed': 'error',
    'Unknown': 'default',
  },
  inventory: {
    in_stock: 'success',
    out_of_stock: 'warning',
    blocked: 'warning',
    unassigned: 'default',
    sold_out: 'error',
    reserved: 'secondary',
    quarantined: 'warning',
    damaged: 'error',
    expired: 'error',
    consumed: 'info',
    disposed: 'default',
    suspended: 'secondary',
    returned: 'info',
    returned_inspection: 'secondary',
  },
} as const;

type StatusType = keyof typeof statusMaps;

type AllocationSummary =
  | 'Pending Allocation'
  | 'Partially Allocated'
  | 'Allocation Confirmed'
  | 'Fully Allocated'
  | 'Fulfilling'
  | 'Partially Fulfilled'
  | 'Fulfilled'
  | 'Allocation Returned'
  | 'Failed'
  | 'Unknown';

/**
 * Derives a human-readable allocation summary from raw status codes.
 * Mirrors backend SQL CASE logic.
 */
export const getAllocationSummary = (codes: string[]): AllocationSummary => {
  if (!Array.isArray(codes) || codes.length === 0) return 'Unknown';
  
  if (codes.includes('ALLOC_FAILED')) return 'Failed';
  if (codes.includes('ALLOC_PARTIAL') || codes.includes('ALLOC_BACKORDERED'))
    return 'Partially Allocated';
  if (codes.includes('ALLOC_FULFILLING') && !codes.every(c => c === 'ALLOC_FULFILLED'))
    return 'Fulfilling';
  if (codes.every(c => c === 'ALLOC_PENDING')) return 'Pending Allocation';
  if (codes.every(c => c === 'ALLOC_CONFIRMED')) return 'Allocation Confirmed';
  if (codes.every(c => c === 'ALLOC_FULFILLED')) return 'Fulfilled';
  if (codes.every(c => c === 'ALLOC_RETURNED')) return 'Allocation Returned';
  
  return 'Unknown';
};

/**
 * Returns allocation summary + corresponding color.
 */
export const getAllocationDisplay = (
  codes: string[] | string
): { summary: string; color: StatusColor } => {
  const arr = Array.isArray(codes) ? codes : [codes];
  const summary = getAllocationSummary(arr);
  const color = statusMaps.allocation[summary] ?? 'default';
  return { summary, color };
};

export const getStatusColor = (
  status?: string | null,
  type: StatusType = 'order'
): StatusColor => {
  if (!status) return 'default';
  const normalized = (type === 'inventory') ? status : status.toUpperCase();
  const map = statusMaps[type];
  
  return (map as Record<string, StatusColor>)[normalized] ?? 'default';
};
