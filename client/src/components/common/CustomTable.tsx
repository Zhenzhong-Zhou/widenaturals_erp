import { FC, ReactNode, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Paper,
} from '@mui/material';
import { useThemeContext } from '../../context';

interface Column<T = any> {
  id: Extract<keyof T, string>;
  label: string;
  minWidth?: number;
  align?: 'left' | 'right' | 'center';
  sortable?: boolean;
  format?: (
    value: T[Extract<keyof T, string>],
    row?: T
  ) => string | number | null | undefined;
  renderCell?: (row: T) => ReactNode;
}

interface CustomTableProps {
  columns: Column[];
  data: Record<string, any>[];
  rowsPerPageOptions?: number[];
  initialRowsPerPage?: number;
  totalPages?: number;
  totalRecords?: number;
  page: number;
  onPageChange: (newPage: number) => void;
  onRowsPerPageChange: (newRowsPerPage: number) => void;
}

const CustomTable: FC<CustomTableProps> = ({
  columns,
  data,
  rowsPerPageOptions = [5, 10, 25],
  initialRowsPerPage = 5,
  totalPages,
  totalRecords,
  page,
  onPageChange,
  onRowsPerPageChange,
}) => {
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [orderBy, setOrderBy] = useState<string | undefined>(undefined);

  const { theme } = useThemeContext();

  const handleSort = (columnId: string) => {
    const isAsc = orderBy === columnId && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(columnId);
  };

  const sortedData = [...data].sort((a, b) => {
    if (!orderBy) return 0;
    const aValue = a[orderBy];
    const bValue = b[orderBy];
    if (aValue < bValue) return order === 'asc' ? -1 : 1;
    if (aValue > bValue) return order === 'asc' ? 1 : -1;
    return 0;
  });

  // Use totalPages directly to ensure the page stays in range
  const safePage = Math.min(page, Math.max(0, (totalPages || 1) - 1));

  return (
    <Paper
      sx={{
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
      }}
    >
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={String(column.id)}
                  align={column.align || 'left'}
                  sortDirection={orderBy === column.id ? order : false}
                  sx={{
                    backgroundColor: theme.palette.background.default,
                    color: theme.palette.text.secondary,
                  }}
                >
                  {column.sortable ? (
                    <TableSortLabel
                      active={orderBy === column.id}
                      direction={orderBy === column.id ? order : 'asc'}
                      onClick={() => handleSort(column.id)}
                      sx={{
                        color: theme.palette.primary.main,
                        '&:hover': { color: theme.palette.primary.dark },
                      }}
                    >
                      {column.label}
                    </TableSortLabel>
                  ) : (
                    column.label
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedData.map((row, rowIndex) => (
              <TableRow
                key={rowIndex}
                sx={{
                  '&:nth-of-type(odd)': {
                    backgroundColor: theme.palette.action.hover,
                  },
                }}
              >
                {columns.map((column) => (
                  <TableCell
                    key={String(column.id)}
                    align={column.align || 'left'}
                  >
                    {column.renderCell
                      ? column.renderCell(row)
                      : column.format
                        ? column.format(row[column.id as keyof typeof row], row)
                        : row[column.id as keyof typeof row]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={rowsPerPageOptions}
        component="div"
        count={totalRecords || 0}
        rowsPerPage={initialRowsPerPage}
        page={safePage}
        onPageChange={(_, newPage) => onPageChange(newPage)}
        onRowsPerPageChange={(event) =>
          onRowsPerPageChange(parseInt(event.target.value, 10))
        }
        sx={{
          backgroundColor: theme.palette.background.default,
          color: theme.palette.text.primary,
        }}
      />
    </Paper>
  );
};

export default CustomTable;
