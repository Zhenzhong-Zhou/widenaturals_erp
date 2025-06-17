import { Fragment, type ReactNode, useState } from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import TableSortLabel from '@mui/material/TableSortLabel';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Collapse from '@mui/material/Collapse';
import NoDataFound from '@components/common/NoDataFound';
import { useThemeContext } from '@context/ThemeContext';
import Checkbox from '@mui/material/Checkbox';

export interface Column<T = any> {
  id: string;
  label: string;
  minWidth?: number;
  align?: 'left' | 'right' | 'center';
  sortable?: boolean;
  format?: (value: T[keyof T], row?: T) => ReactNode;
  renderCell?: (row: T, rowIndex?: number) => ReactNode;
}

interface CustomTableProps<T = any> {
  rowsPerPageId?: string;
  loading?: boolean;
  columns: Column<T>[];
  data: T[];
  rowsPerPageOptions?: number[];
  initialRowsPerPage?: number;
  totalPages?: number;
  totalRecords?: number;
  page: number;
  onPageChange: (newPage: number) => void;
  onRowsPerPageChange: (newRowsPerPage: number) => void;
  expandable?: boolean | ((row: T) => boolean);
  expandedContent?: (row: T) => ReactNode;
  expandedRowId?: string | number | null;
  getRowId?: (row: T) => string | number;
  emptyMessage?: string;
  getRowProps?: (
    row: T,
    index: number
  ) => {
    isGroupHeader?: boolean;
    colSpan?: number;
    sx?: object;
  };
  selectedRowIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
}

const CustomTable = <T extends Record<string, any>>({
  rowsPerPageId,
  loading,
  columns,
  data,
  rowsPerPageOptions = [5, 10, 25],
  initialRowsPerPage = 5,
  totalPages,
  totalRecords,
  page,
  onPageChange,
  onRowsPerPageChange,
  expandable = false,
  expandedContent,
  expandedRowId,
  getRowId,
  emptyMessage,
  getRowProps,
  selectedRowIds,
  onSelectionChange,
}: CustomTableProps<T>) => {
  const { theme } = useThemeContext();
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [orderBy, setOrderBy] = useState<string | undefined>(undefined);

  const handleSort = (columnId: string) => {
    const isAsc = orderBy === columnId && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(columnId);
  };

  const sortedData = orderBy
    ? [...data].sort((a, b) => {
        const aVal = a[orderBy as keyof typeof a];
        const bVal = b[orderBy as keyof typeof b];
        if (aVal === bVal) return 0;
        if (aVal == null) return 1;
        if (bVal == null) return -1;
        return order === 'asc'
          ? String(aVal).localeCompare(String(bVal))
          : String(bVal).localeCompare(String(aVal));
      })
    : data;

  // Use totalPages directly to ensure the page stays in range
  const safePage = Math.min(page, Math.max(0, (totalPages || 1) - 1));
  
  const totalColCount = columns.length + 2;
  
  return (
    <Paper
      sx={{
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        overflow: 'hidden',
      }}
    >
      <TableContainer
        sx={{
          minHeight: 320, // arbitrary fallback height
          transition: 'min-height 0.2s ease-in-out',
        }}
      >
        <Table aria-label="Custom data table">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={
                    selectedRowIds &&
                    selectedRowIds.length > 0 &&
                    selectedRowIds.length < data.filter((r) => !getRowProps?.(r, 0)?.isGroupHeader).length
                  }
                  checked={
                    selectedRowIds &&
                    selectedRowIds.length ===
                    data.filter((r) => !getRowProps?.(r, 0)?.isGroupHeader).length
                  }
                  onChange={(e) => {
                    const shouldSelectAll = e.target.checked;
                    const allIds = data
                      .filter((r, i) => !getRowProps?.(r, i)?.isGroupHeader)
                      .map((r) => getRowId?.(r) ?? r.id);
                    onSelectionChange?.(shouldSelectAll ? allIds : []);
                  }}
                />
              </TableCell>
              
              <TableCell
                align="center"
                sx={{
                  py: 1.25, // instead of default
                  px: 2,
                  fontWeight: 600,
                  backgroundColor: theme.palette.background.paper,
                  color: theme.palette.text.secondary,
                }}
              >
                #
              </TableCell>

              {columns.map((col) => (
                <TableCell
                  key={col.id}
                  align={col.align || 'left'}
                  sortDirection={orderBy === col.id ? order : false}
                  sx={{
                    py: 1.25, // instead of default
                    px: 2,
                    fontWeight: 700,
                    backgroundColor: theme.palette.background.paper,
                    color: theme.palette.text.secondary,
                    fontSize: '0.875rem',
                    letterSpacing: 0.5,
                    textTransform: 'uppercase',
                  }}
                >
                  {col.sortable ? (
                    <TableSortLabel
                      active={orderBy === col.id}
                      direction={orderBy === col.id ? order : 'asc'}
                      onClick={() => handleSort(col.id)}
                      sx={{ color: theme.palette.primary.main }}
                    >
                      {col.label}
                    </TableSortLabel>
                  ) : (
                    col.label
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              [...Array(initialRowsPerPage)].map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  <TableCell
                    colSpan={totalColCount}
                    sx={{ py: 1.25, px: 2 }}
                  >
                    <Skeleton
                      variant="rectangular"
                      height={48}
                      animation="wave"
                    />
                  </TableCell>
                </TableRow>
              ))
            ) : sortedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={totalColCount}
                  align="center"
                  sx={{ py: 3 }}
                >
                  <NoDataFound message={emptyMessage} />
                </TableCell>
              </TableRow>
            ) : (
              (() => {
                let visibleRowIndex = 0;
                return sortedData.map((row, rowIndex) => {
                  const rowId = getRowId
                    ? getRowId(row)
                    : (row.id ?? row.itemId ?? rowIndex);
                  const rowProps = getRowProps?.(row, rowIndex);

                  if (rowProps?.isGroupHeader) {
                    return (
                      <TableRow key={rowId}>
                        <TableCell
                          colSpan={rowProps.colSpan ?? totalColCount}
                          sx={{
                            py: 1.5,
                            px: 2,
                            fontWeight: 700,
                            backgroundColor: theme.palette.action.selected,
                            ...rowProps.sx,
                          }}
                        >
                          {row.name ?? row.label ?? 'Group'}
                        </TableCell>
                      </TableRow>
                    );
                  }

                  const displayRowNumber =
                    safePage * initialRowsPerPage + visibleRowIndex + 1;
                  visibleRowIndex++;

                  return (
                    <Fragment key={rowId}>
                      <TableRow
                        sx={{
                          '&:nth-of-type(odd)': {
                            backgroundColor: theme.palette.action.hover,
                          },
                        }}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={selectedRowIds?.includes(rowId)}
                            onChange={(e) => {
                              const isChecked = e.target.checked;
                              if (!onSelectionChange) return;
                              if (isChecked) {
                                onSelectionChange([...selectedRowIds ?? [], rowId]);
                              } else {
                                onSelectionChange((selectedRowIds ?? []).filter((id) => id !== rowId));
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell align="center" sx={{ py: 1.25, px: 2 }}>
                          {displayRowNumber}
                        </TableCell>
                        {columns.map((col) => (
                          <TableCell
                            key={col.id}
                            align={col.align || 'left'}
                            sx={{ py: 1.25, px: 2 }}
                          >
                            {col.renderCell
                              ? col.renderCell(row, rowIndex)
                              : col.format
                                ? col.format(row[col.id], row)
                                : (row[col.id] as ReactNode)}
                          </TableCell>
                        ))}
                      </TableRow>

                      {expandable && (
                        <TableRow>
                          <TableCell colSpan={totalColCount} sx={{ p: 0 }}>
                            <Collapse in={expandedRowId === rowId}>
                              {expandedContent?.(row)}
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                });
              })()
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={rowsPerPageOptions}
        component="div"
        count={totalRecords ?? data.length}
        rowsPerPage={initialRowsPerPage}
        page={safePage}
        onPageChange={(_, newPage) => onPageChange(newPage)}
        onRowsPerPageChange={(e) =>
          onRowsPerPageChange(parseInt(e.target.value, 10))
        }
        slotProps={{
          select: {
            inputProps: {
              name: 'rows-per-page',
              id: rowsPerPageId || 'rows-per-page-selector',
            },
          },
        }}
        sx={{
          backgroundColor: theme.palette.background.default,
          borderTop: `1px solid ${theme.palette.divider}`,
        }}
      />
    </Paper>
  );
};

export default CustomTable;
