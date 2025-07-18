import { type FC, type RefObject } from 'react';
import Box from '@mui/material/Box';
import SidePanelDrawer from '@components/common/SidePanelDrawer';
import LogHeader from './LogHeader';
import InventoryLogMiniTable from './InventoryLogMiniTable';
import type { InventoryLogSource } from '@features/report/state';
import type { MergedInventoryActivityLogEntry } from '../utils/logUtils';
import ErrorDisplay from '@components/shared/ErrorDisplay.tsx';
import ErrorMessage from '@components/common/ErrorMessage.tsx';
import CustomButton from '@components/common/CustomButton.tsx';

interface SidePanelDrawerProps {
  open: boolean;
  onClose: () => void;
  row: InventoryLogSource;
  data: MergedInventoryActivityLogEntry[];
  loading: boolean;
  error: string;
  page: number;
  totalPages: number;
  totalRecords: number;
  rowsPerPage: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
  selectedRowIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  expandedRowId?: string | number | null;
  onExpandToggle?: (row: MergedInventoryActivityLogEntry) => void;
  isRowExpanded?: (row: MergedInventoryActivityLogEntry) => boolean;
  onRetry: () => void;
  returnFocusRef?: RefObject<HTMLElement | null>;
}

const InventoryLogDrawer: FC<SidePanelDrawerProps> = ({
  open,
  onClose,
  row,
  data,
  loading,
  error,
  page,
  totalPages,
  totalRecords,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  selectedRowIds,
  onSelectionChange,
  expandedRowId,
  onExpandToggle,
  isRowExpanded,
  onRetry,
  returnFocusRef,
}) => {
  if (!row) return null;

  return (
    <SidePanelDrawer
      open={open}
      title="Inventory Activity Logs"
      onClose={onClose}
      width={1000}
      returnFocusRef={returnFocusRef}
    >
      {row && (
        <Box>
          {data[0] && <LogHeader entry={data[0]} />}
          {error ? (
            <ErrorDisplay>
              <ErrorMessage message={error} />
              <CustomButton onClick={onRetry}>Retry</CustomButton>
            </ErrorDisplay>
          ) : (
            <InventoryLogMiniTable
              data={data}
              loading={loading}
              page={page - 1}
              totalPages={totalPages}
              totalRecords={totalRecords}
              rowsPerPage={rowsPerPage}
              onPageChange={(p) => onPageChange(p + 1)}
              onRowsPerPageChange={(limit) => {
                onRowsPerPageChange(limit);
                onPageChange(1);
              }}
              selectedRowIds={selectedRowIds}
              onSelectionChange={onSelectionChange}
              expandedRowId={expandedRowId}
              onExpandToggle={onExpandToggle}
              isRowExpanded={isRowExpanded}
            />
          )}
        </Box>
      )}
    </SidePanelDrawer>
  );
};

export default InventoryLogDrawer;
