import {
  USER_TABLE_PAGE_SIZES,
  type UserTablePageSize,
} from '@features/user/config/userTableConfig';
import type { UserViewMode } from '@features/user/state';

/**
 * Resolve the initial rows-per-page limit for the User list.
 *
 * This function centralizes pagination policy by mapping a given
 * user view mode to a valid, predefined table page size. The
 * returned value is guaranteed to be one of the allowed options
 * defined in `USER_TABLE_PAGE_SIZES`.
 *
 * Policy:
 * - `card` view favors smaller page sizes for improved visual density
 * - table view defaults to a standard list-oriented page size
 *
 * @param viewMode - Current user view mode (e.g. `card`, `table`)
 * @returns A valid `UserTablePageSize` derived from `USER_TABLE_PAGE_SIZES`
 */
export const getInitialUserLimit = (
  viewMode: UserViewMode
): UserTablePageSize => {
  if (viewMode === 'card') {
    return USER_TABLE_PAGE_SIZES[0]; // 10
  }

  return USER_TABLE_PAGE_SIZES[1]; // 25
};
