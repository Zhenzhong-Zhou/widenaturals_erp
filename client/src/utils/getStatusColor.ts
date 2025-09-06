type StatusColor = 'success' | 'error' | 'warning' | 'info' | 'default';

const statusMaps = {
  // todo: add more color
  order: {
    completed: 'success',
    pending: 'warning',
    cancelled: 'error',
    processing: 'info',
    failed: 'error',
    edited: 'info',
    confirmed: 'success',
  },
  payment: {
    paid: 'success',
    unpaid: 'error',
    pending: 'warning',
    failed: 'error',
    refunded: 'info',
  },
  item: {
    backordered: 'warning',
    shipped: 'info',
    delivered: 'success',
    cancelled: 'error',
  },
} as const;

type StatusType = keyof typeof statusMaps;

export const getStatusColor = (
  status?: string | null,
  type: StatusType = 'order'
): StatusColor => {
  if (!status) return 'default';
  
  const normalized = status.toLowerCase();
  const map = statusMaps[type];
  
  return (map as Record<string, StatusColor>)[normalized] ?? 'default';
};
