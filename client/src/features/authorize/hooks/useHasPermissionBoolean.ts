import { useCallback } from 'react';
import { useHasPermission } from '@features/authorize/hooks/index';

/**
 * Boolean-safe wrapper around useHasPermission.
 *
 * Converts the `'pending'` permission state into `false`
 * so UI components can safely evaluate permissions
 * without handling the tri-state result.
 *
 * Intended for:
 * - Buttons
 * - Toolbars
 * - Conditional rendering
 *
 * Not intended for:
 * - Route guards
 * - Page-level access checks
 */
const useHasPermissionBoolean = () => {
  const hasPermission = useHasPermission();

  return useCallback(
    (required: string | readonly string[]) => {
      const result = hasPermission(required);
      return result === true;
    },
    [hasPermission]
  );
};

export default useHasPermissionBoolean;
