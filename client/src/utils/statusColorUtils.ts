import type { Theme } from '@mui/system';

/**
 * Returns the corresponding MUI color for a given order status code.
 *
 * This is useful for rendering status chips or labels with consistent
 * color coding based on business logic.
 *
 * Supported mappings:
 * - 'ORDER_CONFIRMED' → 'success'
 * - 'ORDER_PENDING' or 'ORDER_EDITED' → 'warning'
 * - 'ORDER_CANCELED' → 'error'
 * - any other or undefined → 'default'
 */
export const getStatusColor = (statusCode: string, theme: Theme) => {
  switch (statusCode) {
    case 'ORDER_PENDING':
    case 'ORDER_EDITED':
      return {
        backgroundColor: theme.palette.warning.main,
        color: theme.palette.text.primary,
      };
    case 'ORDER_CONFIRMED':
    case 'ORDER_ALLOCATED':
      return {
        backgroundColor: theme.palette.success.main,
        color: theme.palette.text.primary,
      };
    case 'ORDER_ALLOCATING':
      return {
        backgroundColor: theme.palette.info.main,
        color: theme.palette.common.white,
      };
    case 'ORDER_PARTIAL':
      return {
        backgroundColor: theme.palette.warning.light,
        color: theme.palette.text.primary,
      };
    case 'ORDER_CANCELED':
      return {
        backgroundColor: theme.palette.error.main,
        color: theme.palette.text.primary,
      };
    default:
      return {
        backgroundColor: theme.palette.grey[300],
        color: theme.palette.text,
      };
  }
};
