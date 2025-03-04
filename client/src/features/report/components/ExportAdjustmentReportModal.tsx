import { FC, useState } from 'react';
import { MenuItem, Select, SelectChangeEvent } from '@mui/material';
import { AdjustmentReportParams } from '../state/reportTypes.ts';
import { CustomButton, CustomModal } from '@components/index.ts';

interface ExportReportModalProps {
  open: boolean;
  onClose: () => void;
  onExport: (params: Partial<AdjustmentReportParams>) => void;
  filters: Partial<AdjustmentReportParams>;
}

/**
 * Modal for selecting export format and triggering report export.
 */
const ExportAdjustmentReportModal: FC<ExportReportModalProps> = ({ open, onClose, onExport, filters }) => {
  const [exportFormat, setExportFormat] = useState<AdjustmentReportParams['exportFormat']>('csv');
  
  const handleExport = () => {
    const { page, limit, totalRecords, totalPages, ...exportFilters } = filters;
    onExport({ ...exportFilters, exportFormat });
    onClose();
  };
  
  return (
    <CustomModal
      open={open}
      onClose={onClose}
      title="Export Report"
      actions={
        <>
          <CustomButton onClick={onClose} variant="outlined">
            Cancel
          </CustomButton>
          <CustomButton onClick={handleExport} variant="contained" color="primary">
            Export
          </CustomButton>
        </>
      }
    >
      <Select
        fullWidth
        value={exportFormat ?? 'csv'}
        onChange={(e: SelectChangeEvent) => setExportFormat(e.target.value as AdjustmentReportParams['exportFormat'])}
      >
        <MenuItem value="csv">CSV</MenuItem>
        <MenuItem value="pdf">PDF</MenuItem>
        <MenuItem value="txt">TXT</MenuItem>
      </Select>
    </CustomModal>
  );
};

export default ExportAdjustmentReportModal;
