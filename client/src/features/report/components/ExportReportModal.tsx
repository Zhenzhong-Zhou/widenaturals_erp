import { useState } from 'react';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import CustomModal from '@components/common/CustomModal';
import CustomButton from '@components/common/CustomButton';
import { BaseReportParams } from '@features/report';

interface ExportReportModalProps<T extends BaseReportParams> {
  open: boolean;
  onClose: () => void;
  onExport: (params: Partial<T>) => void;
  filters: Partial<T>;
  setFilters: (
    filters: Partial<T> | ((prev: Partial<T>) => Partial<T>)
  ) => void;
  title?: string;
}

/**
 * Reusable Export Modal for exporting reports with different formats.
 */
const ExportReportModal = <T extends BaseReportParams>({
  open,
  onClose,
  onExport,
  filters,
  setFilters,
  title = 'Export Report',
}: ExportReportModalProps<T>) => {
  const [exportFormat, setExportFormat] = useState<
    BaseReportParams['exportFormat']
  >(
    filters.exportFormat ?? 'csv' // Ensure it starts with the correct format
  );

  const handleExport = () => {
    const { page, limit, totalRecords, totalPages, ...exportFilters } = filters;

    // Explicitly cast to Partial<T>
    const exportParams = {
      ...exportFilters,
      exportFormat: exportFormat ?? 'csv', // Ensure correct format is used
    } as Partial<T>; // Explicitly tell TypeScript this matches Partial<T>

    onExport(exportParams);
    onClose();
  };

  return (
    <CustomModal
      open={open}
      onClose={onClose}
      title={title}
      actions={
        <>
          <CustomButton onClick={onClose} variant="outlined">
            Cancel
          </CustomButton>
          <CustomButton
            onClick={handleExport}
            variant="contained"
            color="primary"
          >
            Export
          </CustomButton>
        </>
      }
    >
      <Select
        fullWidth
        value={exportFormat ?? 'csv'}
        onChange={(e: SelectChangeEvent) => {
          const selectedFormat = e.target
            .value as BaseReportParams['exportFormat'];

          setExportFormat(selectedFormat);

          setFilters((prev) => ({
            ...prev,
            exportFormat: selectedFormat,
          }));
        }}
      >
        <MenuItem value="csv">CSV</MenuItem>
        <MenuItem value="pdf">PDF</MenuItem>
        <MenuItem value="txt">TXT</MenuItem>
      </Select>
    </CustomModal>
  );
};

export default ExportReportModal;
