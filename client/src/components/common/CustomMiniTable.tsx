import type { FC, ReactNode } from 'react';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';
import NoDataFound from '@components/common/NoDataFound';

export interface MiniColumn<T> {
  id: keyof T | 'select';
  label: string;
  align?: 'left' | 'right' | 'center';
  format?: (value: any, row: T) => ReactNode;
  renderCell?: (row: T, rowIndex: number) => ReactNode;
}

interface MiniTableProps<T> {
  rowsPerPageId?: string;
  columns: MiniColumn<T>[];
  data: T[];
  emptyMessage?: string;
  dense?: boolean;
  page?: number;
  initialRowsPerPage?: number;
  totalRecords?: number;
  totalPages?: number;
  onPageChange?: (newPage: number) => void;
  onRowsPerPageChange?: (newLimit: number) => void;
}

const CustomMiniTable = <T extends Record<string, any>>({
                                                          rowsPerPageId,
                                                          columns,
                                                          data,
                                                          emptyMessage = 'No data found',
                                                          dense = true,
                                                          page,
                                                          initialRowsPerPage = 10,
                                                          totalRecords,
                                                          onPageChange,
                                                          onRowsPerPageChange,
                                                        }: MiniTableProps<T>): ReturnType<FC> => {
  if (!data || data.length === 0) {
    return <NoDataFound message={emptyMessage} />;
  }
  
  return (
    <TableContainer>
      <Table size={dense ? 'small' : 'medium'}>
        <TableHead>
          <TableRow>
            {columns.map((col) => (
              <TableCell key={String(col.id)} align={col.align || 'left'}>
                {col.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        
        <TableBody>
          {data.map((row, rowIndex) => (
            <TableRow key={rowIndex}>
              {columns.map((col) => (
                <TableCell key={String(col.id)} align={col.align || 'left'}>
                  {col.renderCell
                    ? col.renderCell(row, rowIndex)
                    : col.format
                      ? col.format(row[col.id], row)
                      : row[col.id] ?? '-'}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {typeof page === 'number' && typeof totalRecords === 'number' && (
        <TablePagination
          component="div"
          count={totalRecords}
          page={page}
          rowsPerPage={initialRowsPerPage}
          onPageChange={(_e, newPage) => onPageChange?.(newPage)}
          onRowsPerPageChange={(e) =>
            onRowsPerPageChange?.(parseInt(e.target.value, 10))
          }
          rowsPerPageOptions={[5, 10, 15, 20]}
          slotProps={{
            select: {
              inputProps: {
                name: 'rows-per-page',
                id: rowsPerPageId || 'rows-per-page-selector',
              },
            },
          }}
        />
      )}
    </TableContainer>
  );
};

export default CustomMiniTable;
