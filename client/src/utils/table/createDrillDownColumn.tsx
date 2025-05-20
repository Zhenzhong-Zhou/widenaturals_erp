import { ExpandLess, ExpandMore } from '@mui/icons-material';
import { IconButton, Tooltip } from '@mui/material';
import type { Column } from '@components/common/CustomTable';

/**
 * Creates a reusable drill-down column with toggle support (Show More / Less).
 *
 * @template T - The row type.
 * @param onToggle - Called when the user toggles the expansion state.
 * @param isExpanded - A function to determine if a row is currently expanded.
 * @returns A column config for drill-down toggle behavior.
 */
export function createDrillDownColumn<T>(
  onToggle: (row: T) => void,
  isExpanded: (row: T) => boolean
): Column<T> {
  return {
    id: 'actions',
    label: '',
    align: 'right',
    renderCell: (row) => {
      const expanded = isExpanded(row);
      return (
        <Tooltip title={expanded ? 'Show Less' : 'Show More'}>
          <IconButton onClick={() => onToggle(row)}>
            {expanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Tooltip>
      );
    },
  };
}
