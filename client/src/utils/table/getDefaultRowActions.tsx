import type { RefObject } from 'react';
import HistoryIcon from '@mui/icons-material/History';
import type { RowActionItem } from '@components/common/RowActionMenu';

/**
 * Returns the default row actions for an inventory summary row.
 */
export const getDefaultRowActions = <T,>(
  onViewLogs: (row: T) => void,
  focusRef?: RefObject<HTMLElement> // add optional ref
): RowActionItem<T>[] => [
  {
    label: 'View Activity Logs',
    onClick: onViewLogs,
    icon: (
      <HistoryIcon
        fontSize="small"
        style={{ marginRight: 2, verticalAlign: 'middle' }}
      />
    ),
    buttonRef: focusRef, // custom property you pass along
  },
];
