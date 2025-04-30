import type { FC, ReactNode } from 'react';
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
} from '@mui/material';
import NoDataFound from '@components/common/NoDataFound';

export interface MiniColumn<T> {
  id: keyof T | 'select';
  label: string;
  align?: 'left' | 'right' | 'center';
  format?: (value: any, row: T) => ReactNode;
  renderCell?: (row: T, rowIndex: number) => ReactNode;
}

interface MiniTableProps<T> {
  columns: MiniColumn<T>[];
  data: T[];
  emptyMessage?: string;
  dense?: boolean;
}

const CustomMiniTable = <T extends Record<string, any>>({
                                                    columns,
                                                    data,
                                                    emptyMessage = 'No data found',
                                                    dense = true,
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
    </TableContainer>
  );
};

export default CustomMiniTable;
