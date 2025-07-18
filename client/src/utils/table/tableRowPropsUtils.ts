import type { Theme } from '@mui/material/styles';

/**
 * Returns row props for a grouped header row in a MUI table.
 *
 * This function is used to identify and style group header rows in a table,
 * typically used in grouped inventory or reporting tables. It sets the appropriate
 * `colSpan`, applies consistent header styling, and flags the row as a group header.
 *
 * @param columnsLength - The number of dynamic data columns in the table (excluding checkbox and index columns).
 * @returns A function that maps a row to its custom MUI row props.
 */
export const getGroupedRowProps = (columnsLength: number) => (row: any) => {
  if (row.isGroupHeader) {
    return {
      isGroupHeader: true,
      colSpan: columnsLength + 2, // +1 for checkbox, +1 for row index
      sx: {
        fontWeight: 700,
        fontSize: '0.95rem',
        backgroundColor: (theme: Theme) => theme.palette.action.selected,
      },
    };
  }

  return {};
};
