import { startTransition } from 'react';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import type { Column } from '@components/common/CustomTable';

/**
 * Creates a reusable drill-down column with toggle support (Show More / Less).
 *
 * @template T - The row type.
 * @param onToggle - Called when the user toggles the expansion state.
 * @param isExpanded - A function to determine if a row is currently expanded.
 * @param extraHandlers - Optional interaction handlers like hover or focus.
 * @returns A column config for drill-down toggle behavior.
 */
export const createDrillDownColumn = <T,>(
  onToggle: (row: T) => void,
  isExpanded: (row: T) => boolean,
  extraHandlers?: {
    onMouseEnter?: (row: T) => void;
    onFocus?: (row: T) => void;
    onDoubleClick?: (row: T) => void;
  }
): Column<T> => {
  return {
    id: 'drilldown-toggle',
    label: '',
    align: 'right',
    renderCell: (row) => {
      const expanded = isExpanded(row);
      return (
        <Tooltip title={expanded ? 'Show Less' : 'Show More'}>
          <IconButton
            onClick={() => startTransition(() => onToggle(row))}
            onMouseEnter={() => extraHandlers?.onMouseEnter?.(row)}
            onFocus={() => extraHandlers?.onFocus?.(row)}
            onDoubleClick={() => extraHandlers?.onDoubleClick?.(row)}
          >
            {expanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Tooltip>
      );
    },
  };
};
