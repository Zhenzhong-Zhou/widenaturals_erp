import { useMemo } from 'react';
import { flattenUserRecords } from '@features/user/utils/flattenUserRecords';
import type { UserCardView, UserListView } from '@features/user/state';

/**
 * React hook that converts raw user API records into a flattened,
 * UI-friendly structure.
 *
 * Responsibilities:
 * - Accepts user records in either `UserCardView` or `UserListView` shape
 * - Delegates normalization logic to `flattenUserRecords`
 * - Memoizes the transformation to prevent unnecessary recalculations
 *
 * Design notes:
 * - This hook performs **pure data transformation only**
 * - It contains no pagination, filtering, or view-specific logic
 * - The returned structure is suitable for tables, card grids,
 *   and export workflows
 *
 * Usage:
 * - Card view → input is `UserCardView[]`
 * - List view → input is `UserListView[]`
 *
 * @param users - Raw user records returned by the API
 * @returns A memoized array of flattened user records
 */
const useFlattenedUsers = (
  users: Array<UserCardView | UserListView>
) =>
  useMemo(() => flattenUserRecords(users), [users]);

export default useFlattenedUsers;
