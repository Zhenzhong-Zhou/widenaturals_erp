import React from 'react';
import Dropdown from '@components/common/Dropdown.tsx';
import CustomDatePicker from '@components/common/CustomDatePicker.tsx';
import { AdjustmentReportParams } from '../state/reportTypes.ts';
import { formatDate } from '@utils/dateTimeUtils.ts';

interface AdjustmentReportFiltersProps {
  filters: any;
  setFilters: (filters: any) => void;
}

const AdjustmentReportFilters: React.FC<AdjustmentReportFiltersProps> = ({
  filters,
  setFilters,
}) => {
  const reportTypeOptions = [
    { value: null, label: 'Select A Type' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' },
  ];

  const handleReportTypeChange = (value: string | null) => {
    setFilters((prev: AdjustmentReportParams) => ({
      ...prev,
      reportType: value,
      startDate: value ? null : prev.startDate,
      endDate: value ? null : prev.endDate,
    }));
  };

  const handleStartDateChange = (date: Date | null) => {
    setFilters((prev: AdjustmentReportParams) => ({
      ...prev,
      displayStartDate: date, // Store raw date for UI
      startDate: date ? formatDate(date) : null, // Convert for backend
    }));
  };

  const handleEndDateChange = (date: Date | null) => {
    setFilters((prev: AdjustmentReportParams) => ({
      ...prev,
      displayEndDate: date, // Store raw date for UI
      endDate: date ? formatDate(date) : null, // Convert for backend
    }));
  };

  return (
    <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
      <Dropdown
        label="Report Type"
        options={reportTypeOptions}
        value={filters.reportType || ''}
        onChange={handleReportTypeChange}
      />
      <CustomDatePicker
        label="Start Date"
        value={
          filters.startDate ? new Date(`${filters.startDate}T00:00:00`) : null
        }
        onChange={handleStartDateChange}
        disabled={!!filters.reportType}
      />
      <CustomDatePicker
        label="End Date"
        value={filters.endDate ? new Date(`${filters.endDate}T00:00:00`) : null}
        onChange={handleEndDateChange}
        disabled={!!filters.reportType}
      />
    </div>
  );
};

export default AdjustmentReportFilters;
